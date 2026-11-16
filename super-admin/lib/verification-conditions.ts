export interface VerificationConditionsProfile {
  publisherType?: string;
  user?: {
    phoneConfirmedByAdmin?: boolean;
    isPhoneConfirmed?: boolean;
  };
  verificationCall?: {
    done?: boolean;
    status?: string;
  };
  documents?: Array<{
    type: string;
    status: string;
  }>;
  businessName?: string;
  businessAddress?: string;
}

export function computeVerificationApprovalConditions(
  profile?: VerificationConditionsProfile | null
) {
  if (!profile) {
    return {
      phoneConfirmed: false,
      callDone: false,
      requiredDocsApproved: false,
      allDocsReviewed: false,
      allMet: false,
    };
  }

  const phoneConfirmed = Boolean(
    profile.user?.phoneConfirmedByAdmin ?? profile.user?.isPhoneConfirmed
  );
  const callDone = Boolean(
    profile.verificationCall?.done ??
      profile.verificationCall?.status === "completed"
  );

  const docs = profile.documents || [];
  const approvedTypes = docs
    .filter((d) => d.status === "approved")
    .map((d) => d.type);

  let requiredDocsApproved = false;
  if (profile.publisherType === "agent") {
    const hasOwnerId =
      approvedTypes.includes("aadhar") || approvedTypes.includes("pan");
    const hasBizDoc =
      approvedTypes.includes("gst_certificate") ||
      approvedTypes.includes("business_registration") ||
      Boolean(profile.businessName && profile.businessAddress);
    requiredDocsApproved = Boolean(hasOwnerId && hasBizDoc);
  } else {
    const hasPersonalId =
      approvedTypes.includes("aadhar") || approvedTypes.includes("driving_license");
    requiredDocsApproved = Boolean(hasPersonalId);
  }

  const allDocsReviewed =
    docs.length > 0 && docs.every((d) => d.status !== "pending");

  const allMet =
    phoneConfirmed && callDone && requiredDocsApproved && allDocsReviewed;

  return {
    phoneConfirmed,
    callDone,
    requiredDocsApproved,
    allDocsReviewed,
    allMet,
  };
}
