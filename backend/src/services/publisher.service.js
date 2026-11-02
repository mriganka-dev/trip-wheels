import {
  DOCUMENT_STATUS,
  DOCUMENT_TYPES,
  NOTIFICATION_EVENTS,
  ROLES,
  VERIFICATION_STATUS,
} from "../constants.js";
import { PublisherProfile } from "../models/publisherProfile.model.js";
import { User } from "../models/user.model.js";
import { VerificationDocument } from "../models/verificationDocument.model.js";
import { ApiError } from "../utils/ApiError.js";
import {
  deleteFromCloudinary,
  generateSignedCloudinaryUrl,
  uploadOnCloudinary,
  uploadPrivateOnCloudinary,
} from "../utils/cloudinary.js";
import { formatPaginatedResponse, getPagination } from "../utils/pagination.js";
import { notify, notifyAdmins } from "./notification.service.js";

const signDocument = (doc) => {
  const docObj = doc.toObject ? doc.toObject() : { ...doc };
  if (docObj.file?.publicId) {
    docObj.file.url = generateSignedCloudinaryUrl(docObj.file.publicId, 300);
  }
  return docObj;
};

export const getOrCreateProfile = async (user) => {
  if (![ROLES.AGENT, ROLES.INDIVIDUAL].includes(user.role)) {
    throw new ApiError(
      403,
      "Only agents and individuals have publisher profiles"
    );
  }

  let profile = await PublisherProfile.findOne({ user: user._id });
  if (!profile) {
    profile = await PublisherProfile.create({
      user: user._id,
      publisherType: user.role,
    });
  }

  return profile;
};

export const upsertProfile = async (user, profileData) => {
  const profile = await getOrCreateProfile(user);

  if (user.role === ROLES.AGENT) {
    if (profileData.businessName !== undefined) {
      profile.businessName = profileData.businessName.trim();
    }
    if (profileData.businessAddress !== undefined) {
      profile.businessAddress = profileData.businessAddress.trim();
    }
    if (profileData.gstNumber !== undefined) {
      profile.gstNumber = profileData.gstNumber.trim();
    }
    if (profileData.destination !== undefined) {
      profile.destination = profileData.destination.trim();
    }

    if (profileData.agentPickup) {
      profile.agentPickup = {
        address:
          profileData.agentPickup.address || profile.agentPickup?.address || "",
        landmark:
          profileData.agentPickup.landmark ||
          profile.agentPickup?.landmark ||
          "",
        location: {
          type: "Point",
          coordinates: profileData.agentPickup.location?.coordinates ||
            profile.agentPickup?.location?.coordinates || [0, 0],
        },
      };
    }
  } else if (user.role === ROLES.INDIVIDUAL) {
    if (profileData.destination !== undefined) {
      profile.destination = profileData.destination.trim();
    }

    if (profileData.individualArea) {
      profile.individualArea = {
        city:
          profileData.individualArea.city?.trim() ||
          profile.individualArea?.city ||
          "",
        area:
          profileData.individualArea.area?.trim() ||
          profile.individualArea?.area ||
          "",
        approxLocation: profileData.individualArea.approxLocation
          ? {
              type: "Point",
              coordinates:
                profileData.individualArea.approxLocation.coordinates,
            }
          : profile.individualArea?.approxLocation,
      };
    }
  }

  await profile.save();
  return profile;
};

export const getOwnProfile = async (userId) => {
  const profile = await PublisherProfile.findOne({ user: userId });
  if (!profile) {
    throw new ApiError(404, "Publisher profile not found");
  }

  const rawDocs = await VerificationDocument.find({ publisher: userId });
  const signedDocs = rawDocs.map(signDocument);

  const profileObj = profile.toObject();
  profileObj.documents = signedDocs;

  return profileObj;
};

export const uploadKycDocument = async (
  userId,
  filePath,
  { type, documentNumber }
) => {
  const uploadResult = await uploadPrivateOnCloudinary(
    filePath,
    "trip_wheels/kyc"
  );

  if (!uploadResult) {
    throw new ApiError(500, "Failed to upload KYC document");
  }

  const cleanNum = documentNumber ? documentNumber.replace(/\s+/g, "") : "";
  const last4 = cleanNum.slice(-4) || "0000";
  const masked = `•••• ${last4}`;

  const document = await VerificationDocument.create({
    publisher: userId,
    type,
    documentNumberMasked: masked,
    file: {
      url: uploadResult.url,
      publicId: uploadResult.publicId,
    },
    status: DOCUMENT_STATUS.PENDING,
  });

  return signDocument(document);
};

export const getOwnDocuments = async (userId) => {
  const docs = await VerificationDocument.find({ publisher: userId });
  return docs.map(signDocument);
};

export const deleteKycDocument = async (userId, documentId) => {
  const doc = await VerificationDocument.findOne({
    _id: documentId,
    publisher: userId,
  });

  if (!doc) {
    throw new ApiError(404, "Document not found");
  }

  if (doc.status === DOCUMENT_STATUS.APPROVED) {
    throw new ApiError(400, "Approved documents cannot be deleted");
  }

  const profile = await PublisherProfile.findOne({ user: userId });
  if (profile && profile.verificationStatus === VERIFICATION_STATUS.PENDING) {
    throw new ApiError(
      400,
      "Cannot delete documents while verification is pending review"
    );
  }

  if (doc.file?.publicId) {
    try {
      await deleteFromCloudinary(doc.file.publicId);
    } catch (err) {
      console.error("Failed to delete file from Cloudinary:", err.message);
    }
  }

  await VerificationDocument.findByIdAndDelete(documentId);
  return true;
};

export const uploadSelfie = async (user, filePath) => {
  if (user.role !== ROLES.INDIVIDUAL) {
    throw new ApiError(
      403,
      "Selfie with ID is only applicable for individual publishers"
    );
  }

  const profile = await getOrCreateProfile(user);

  const uploadResult = await uploadOnCloudinary(
    filePath,
    "trip_wheels/selfies"
  );

  if (!uploadResult) {
    throw new ApiError(500, "Failed to upload selfie image");
  }

  if (profile.selfieWithId?.publicId) {
    try {
      await deleteFromCloudinary(profile.selfieWithId.publicId);
    } catch (err) {
      console.error("Failed to remove old selfie:", err.message);
    }
  }

  profile.selfieWithId = {
    url: uploadResult.url,
    publicId: uploadResult.publicId,
  };

  await profile.save();
  return profile;
};

export const submitVerification = async (user) => {
  if (!user.isEmailVerified) {
    throw new ApiError(
      400,
      "Email must be verified before submitting verification"
    );
  }

  const profile = await PublisherProfile.findOne({ user: user._id });
  if (!profile) {
    throw new ApiError(
      404,
      "Publisher profile not found. Please complete profile details."
    );
  }

  const documents = await VerificationDocument.find({
    publisher: user._id,
    status: { $ne: DOCUMENT_STATUS.REJECTED },
  });

  const docTypes = documents.map((d) => d.type);

  if (user.role === ROLES.AGENT) {
    if (!profile.businessName || !profile.businessAddress) {
      throw new ApiError(
        400,
        "Agent profile requires business name and business address"
      );
    }

    const coords = profile.agentPickup?.location?.coordinates;
    const hasValidCoords =
      Array.isArray(coords) &&
      coords.length === 2 &&
      !(coords[0] === 0 && coords[1] === 0);

    if (!hasValidCoords) {
      throw new ApiError(
        400,
        "Agent pickup location must contain valid non-zero coordinates [longitude, latitude]"
      );
    }

    const hasOwnerId =
      docTypes.includes(DOCUMENT_TYPES.AADHAR) ||
      docTypes.includes(DOCUMENT_TYPES.PAN);

    if (!hasOwnerId) {
      throw new ApiError(
        400,
        "Agent requires owner ID document (Aadhar or PAN)"
      );
    }

    const hasBusinessDoc =
      docTypes.includes(DOCUMENT_TYPES.GST_CERTIFICATE) ||
      docTypes.includes(DOCUMENT_TYPES.BUSINESS_REGISTRATION) ||
      (profile.businessName && profile.businessAddress);

    if (!hasBusinessDoc) {
      throw new ApiError(
        400,
        "Agent requires business registration or GST certificate"
      );
    }
  } else if (user.role === ROLES.INDIVIDUAL) {
    if (!profile.individualArea?.city || !profile.individualArea?.area) {
      throw new ApiError(400, "Individual profile requires city and area");
    }

    const hasPersonalId =
      docTypes.includes(DOCUMENT_TYPES.AADHAR) ||
      docTypes.includes(DOCUMENT_TYPES.DRIVING_LICENSE);

    if (!hasPersonalId) {
      throw new ApiError(
        400,
        "Individual requires personal ID (Aadhar or Driving License)"
      );
    }
  }

  profile.verificationStatus = VERIFICATION_STATUS.PENDING;
  profile.submittedAt = new Date();
  profile.rejectionReason = "";
  await profile.save();

  await notifyAdmins("verification.submitted", {
    publisherId: profile._id,
    userId: user._id,
  });

  return profile;
};

// --- Admin Services ---

export const getVerificationQueue = async (query = {}) => {
  const { page, limit, skip } = getPagination(query);

  const filter = {};
  if (query.status) {
    filter.verificationStatus = query.status;
  }
  if (query.type) {
    filter.publisherType = query.type;
  }

  const [items, totalItems] = await Promise.all([
    PublisherProfile.find(filter)
      .populate(
        "user",
        "fullName email phone phoneConfirmedByAdmin accountStatus"
      )
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(limit),
    PublisherProfile.countDocuments(filter),
  ]);

  return formatPaginatedResponse({
    items,
    totalItems,
    page,
    limit,
  });
};

export const getVerificationDetail = async (publisherId) => {
  const profile = await PublisherProfile.findById(publisherId).populate(
    "user",
    "fullName email phone phoneConfirmedByAdmin phoneConfirmedAt phoneConfirmedBy accountStatus isEmailVerified createdAt"
  );

  if (!profile) {
    throw new ApiError(404, "Publisher profile not found");
  }

  const documents = await VerificationDocument.find({
    publisher: profile.user._id,
  });

  const profileObj = profile.toObject();
  profileObj.documents = documents.map(signDocument);

  return profileObj;
};

export const recordVerificationCall = async (
  publisherId,
  adminId,
  { notes = "" }
) => {
  const profile = await PublisherProfile.findById(publisherId);
  if (!profile) {
    throw new ApiError(404, "Publisher profile not found");
  }

  profile.verificationCall = {
    done: true,
    doneAt: new Date(),
    doneBy: adminId,
    notes,
  };

  await profile.save();
  return profile;
};

export const reviewDocument = async (
  docId,
  adminId,
  { status, remarks = "" }
) => {
  const document = await VerificationDocument.findById(docId);
  if (!document) {
    throw new ApiError(404, "Document not found");
  }

  document.status = status;
  document.remarks = remarks;
  document.reviewedBy = adminId;
  document.reviewedAt = new Date();
  await document.save();

  return signDocument(document);
};

export const approveVerification = async (publisherId, adminId) => {
  const profile = await PublisherProfile.findById(publisherId);
  if (!profile) {
    throw new ApiError(404, "Publisher profile not found");
  }

  const user = await User.findById(profile.user);
  if (!user) {
    throw new ApiError(404, "Associated user not found");
  }

  const missingRequirements = [];

  if (!user.phoneConfirmedByAdmin) {
    missingRequirements.push(
      "Publisher phone number has not been confirmed by an Admin"
    );
  }

  if (!profile.verificationCall?.done) {
    missingRequirements.push(
      "Mandatory verification call has not been completed"
    );
  }

  const docs = await VerificationDocument.find({ publisher: user._id });
  const approvedDocTypes = docs
    .filter((d) => d.status === DOCUMENT_STATUS.APPROVED)
    .map((d) => d.type);

  if (profile.publisherType === ROLES.AGENT) {
    const hasOwnerId =
      approvedDocTypes.includes(DOCUMENT_TYPES.AADHAR) ||
      approvedDocTypes.includes(DOCUMENT_TYPES.PAN);
    if (!hasOwnerId) {
      missingRequirements.push("Owner ID (Aadhar or PAN) must be approved");
    }

    const hasBizDoc =
      approvedDocTypes.includes(DOCUMENT_TYPES.GST_CERTIFICATE) ||
      approvedDocTypes.includes(DOCUMENT_TYPES.BUSINESS_REGISTRATION) ||
      (profile.businessName && profile.businessAddress);
    if (!hasBizDoc) {
      missingRequirements.push("Business document must be approved");
    }
  } else if (profile.publisherType === ROLES.INDIVIDUAL) {
    const hasPersonalId =
      approvedDocTypes.includes(DOCUMENT_TYPES.AADHAR) ||
      approvedDocTypes.includes(DOCUMENT_TYPES.DRIVING_LICENSE);
    if (!hasPersonalId) {
      missingRequirements.push(
        "Personal ID (Aadhar or Driving License) must be approved"
      );
    }
  }

  const pendingDocs = docs.filter((d) => d.status === DOCUMENT_STATUS.PENDING);
  if (pendingDocs.length > 0) {
    missingRequirements.push(
      "All submitted KYC documents must be reviewed first"
    );
  }

  if (missingRequirements.length > 0) {
    throw new ApiError(
      400,
      `Cannot approve verification: ${missingRequirements.join("; ")}`
    );
  }

  profile.verificationStatus = VERIFICATION_STATUS.APPROVED;
  profile.verifiedAt = new Date();
  profile.verifiedBy = adminId;
  profile.rejectionReason = "";
  await profile.save();

  await notify(NOTIFICATION_EVENTS.VERIFICATION_APPROVED, {
    userId: user._id,
    profileId: profile._id,
  });

  return profile;
};

export const rejectVerification = async (publisherId, adminId, { reason }) => {
  if (!reason || reason.trim() === "") {
    throw new ApiError(400, "Rejection reason is required");
  }

  const profile = await PublisherProfile.findById(publisherId);
  if (!profile) {
    throw new ApiError(404, "Publisher profile not found");
  }

  profile.verificationStatus = VERIFICATION_STATUS.REJECTED;
  profile.rejectionReason = reason.trim();
  await profile.save();

  await notify(NOTIFICATION_EVENTS.VERIFICATION_REJECTED, {
    userId: profile.user,
    reason: reason.trim(),
  });

  return profile;
};

export const requestReverification = async (
  publisherId,
  adminId,
  { reason }
) => {
  if (!reason || reason.trim() === "") {
    throw new ApiError(400, "Reason for reverification is required");
  }

  const profile = await PublisherProfile.findById(publisherId);
  if (!profile) {
    throw new ApiError(404, "Publisher profile not found");
  }

  profile.verificationStatus = VERIFICATION_STATUS.REVERIFICATION_REQUIRED;
  profile.rejectionReason = reason.trim();
  await profile.save();

  await notify(NOTIFICATION_EVENTS.VERIFICATION_REVERIFICATION_REQUIRED, {
    userId: profile.user,
    reason: reason.trim(),
  });

  return profile;
};

export const confirmUserPhone = async (userId, adminId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  user.phoneConfirmedByAdmin = true;
  user.phoneConfirmedAt = new Date();
  user.phoneConfirmedBy = adminId;
  await user.save();

  return user;
};

export const suspendUser = async (userId, reason) => {
  if (!reason || reason.trim() === "") {
    throw new ApiError(400, "Suspension reason is required");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  user.accountStatus = "suspended";
  user.suspendedReason = reason.trim();
  user.suspendedAt = new Date();
  user.refreshToken = undefined;
  await user.save();

  await PublisherProfile.findOneAndUpdate(
    { user: userId },
    { $set: { verificationStatus: VERIFICATION_STATUS.SUSPENDED } }
  );

  await notify(NOTIFICATION_EVENTS.ACCOUNT_SUSPENDED, {
    userId,
    reason: reason.trim(),
  });

  return user;
};

export const unsuspendUser = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  user.accountStatus = "active";
  user.suspendedReason = "";
  user.suspendedAt = null;
  await user.save();

  const profile = await PublisherProfile.findOne({ user: userId });
  if (profile && profile.verificationStatus === VERIFICATION_STATUS.SUSPENDED) {
    profile.verificationStatus = profile.verifiedAt
      ? VERIFICATION_STATUS.APPROVED
      : VERIFICATION_STATUS.PENDING;
    await profile.save();
  }

  return user;
};
