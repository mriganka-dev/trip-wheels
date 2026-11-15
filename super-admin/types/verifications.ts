export interface VerificationQueueItem {
  _id: string;
  user: {
    _id: string;
    fullName: string;
    email: string;
    phone: string;
    phoneConfirmedByAdmin?: boolean;
    accountStatus?: string;
  };
  publisherType: "agent" | "individual";
  businessName?: string;
  destination?: string | { _id: string; name: string };
  individualArea?: {
    city?: string;
    area?: string;
  };
  verificationStatus: string;
  submittedAt?: string;
  createdAt: string;
  documents?: {
    _id: string;
    type: string;
    status: string;
  }[];
  verificationCall?: {
    done?: boolean;
    callCompleted?: boolean;
    notes?: string;
    completedAt?: string;
  };
}

export interface VerificationListQuery {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
  destination?: string;
  search?: string;
}

export interface VerificationDocumentItem {
  _id: string;
  type: string;
  documentNumberMasked: string;
  file: {
    url: string;
    publicId: string;
  };
  status: "pending" | "approved" | "rejected";
  remarks?: string;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  uploadedAt?: string;
}

export interface PublisherFlagItem {
  _id?: string;
  type: string;
  note?: string;
  createdAt: string;
  resolved?: boolean;
  resolvedAt?: string | null;
}

export interface PublisherReliability {
  score: number;
  requestsReceived: number;
  accepted: number;
  rejected: number;
  expired: number;
  completed: number;
  cancelledAfterConfirm: number;
  noShows: number;
  issuesUpheld: number;
  lateDisclosures: number;
  undisclosedUnavailability: number;
  missedConfirmations: number;
  avgResponseMinutes?: number;
}

export interface VerificationDetail {
  _id: string;
  user: {
    _id: string;
    fullName: string;
    email: string;
    isEmailVerified: boolean;
    phone: string;
    phoneConfirmedByAdmin?: boolean;
    phoneConfirmedAt?: string;
    phoneConfirmedBy?: string;
    accountStatus: string;
    createdAt: string;
  };
  publisherType: "agent" | "individual";
  businessName?: string;
  businessAddress?: string;
  gstNumber?: string;
  destination?: string | { _id: string; name: string };
  agentPickup?: {
    address?: string;
    landmark?: string;
    location?: {
      type: string;
      coordinates: [number, number];
    };
  };
  individualArea?: {
    city?: string;
    area?: string;
    approxLocation?: {
      type: string;
      coordinates: [number, number];
    };
  };
  verificationStatus: string;
  rejectionReason?: string;
  submittedAt?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  verificationCall?: {
    done: boolean;
    doneAt?: string;
    doneBy?: string;
    notes?: string;
  };
  selfieWithId?: {
    url: string;
    publicId: string;
  };
  flags?: PublisherFlagItem[];
  reliability?: PublisherReliability;
  documents: VerificationDocumentItem[];
}

export interface RecordVerificationCallPayload {
  notes?: string;
}

export interface ReviewDocumentPayload {
  status: "approved" | "rejected";
  remarks?: string;
}

export interface RejectionPayload {
  reason: string;
}

export interface SuspendUserPayload {
  reason: string;
}
