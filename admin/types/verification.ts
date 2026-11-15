export type DocumentType =
  | "aadhar"
  | "pan"
  | "driving_license"
  | "passport"
  | "voter_id"
  | "gst_certificate"
  | "business_registration"
  | "other";

export type DocumentStatus = "pending" | "approved" | "rejected";

export interface VerificationDocument {
  _id: string;
  publisher: string;
  type: DocumentType;
  documentNumberMasked: string;
  file: {
    url: string;
    publicId: string;
  };
  status: DocumentStatus;
  remarks?: string;
  uploadedAt: string;
  reviewedAt?: string;
}

export interface UpdateProfilePayload {
  businessName?: string;
  businessAddress?: string;
  gstNumber?: string;
  destination?: string;
  agentPickup?: {
    address?: string;
    landmark?: string;
    location?: {
      type: "Point";
      coordinates: [number, number]; // [lng, lat]
    };
  };
  individualArea?: {
    city?: string;
    area?: string;
    approxLocation?: {
      type: "Point";
      coordinates?: [number, number]; // [lng, lat]
    };
  };
}
