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
  search?: string;
}
