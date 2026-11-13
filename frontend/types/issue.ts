export type IssueType =
  | "vehicle_mismatch"
  | "chassis_mismatch"
  | "registration_mismatch"
  | "vehicle_damage_undisclosed"
  | "not_as_promised"
  | "vehicle_unavailable_at_pickup"
  | "customer_no_show"
  | "customer_damage"
  | "late_return"
  | "misconduct"
  | "other";

export type IssueStatus = "open" | "under_review" | "resolved" | "dismissed";
export type IssueSeverity = "low" | "medium" | "high" | "critical";

export interface IssueEvidence {
  url: string;
  publicId?: string;
}

export interface IssueTimelineItem {
  at: string;
  by: {
    _id: string;
    fullName: string;
  };
  note: string;
}

export interface IssueResolution {
  outcome?: string | null;
  adminNote?: string;
  penaltyApplied?: boolean;
  resolvedBy?: {
    _id: string;
    fullName: string;
  };
  resolvedAt?: string | null;
}

export interface Issue {
  _id: string;
  booking: {
    _id: string;
    bookingCode: string;
    status: string;
    startAt: string;
    endAt: string;
    vehicle?: {
      brand?: string;
      model?: string;
      year?: number;
    };
    assignedVehicle?: {
      brand?: string;
      model?: string;
      year?: number;
    };
  };
  raisedBy: {
    _id: string;
    fullName: string;
    phone?: string;
    email?: string;
  };
  raisedAgainst: {
    _id: string;
    fullName: string;
    phone?: string;
    email?: string;
  };
  type: IssueType;
  description: string;
  severity: IssueSeverity;
  evidence: IssueEvidence[];
  status: IssueStatus;
  response?: {
    text?: string;
    at?: string | null;
  };
  resolution?: IssueResolution;
  timeline: IssueTimelineItem[];
  createdAt: string;
  updatedAt?: string;
}

export interface IssuesListResponse {
  items: Issue[];
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

