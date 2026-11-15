export type IssueStatus = "open" | "under_review" | "resolved" | "dismissed";
export type IssueSeverity = "low" | "medium" | "high";

export interface IssueTimelineEntry {
  status: string;
  at: string;
  by?: string | { _id?: string; fullName?: string; role?: string } | null;
  note?: string;
}

export interface IssueEvidence {
  url: string;
  publicId?: string;
}

export interface IssueResolution {
  outcome?: string;
  adminNote?: string;
  penaltyApplied?: boolean;
  resolvedAt?: string;
  resolvedBy?: string | { _id?: string; fullName?: string };
}

export interface Issue {
  _id: string;
  booking: {
    _id: string;
    bookingCode: string;
    startAt?: string;
    endAt?: string;
    vehicle?: {
      brand?: string;
      model?: string;
      type?: string;
    };
  };
  raisedBy: {
    _id: string;
    fullName: string;
    role: string;
  };
  against: {
    _id: string;
    fullName: string;
    role: string;
  };
  type: string;
  severity: IssueSeverity;
  description: string;
  evidence?: IssueEvidence[];
  status: IssueStatus;
  timeline: IssueTimelineEntry[];
  resolution?: IssueResolution;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedIssuesResponse {
  items: Issue[];
  totalItems: number;
  page: number;
  limit: number;
  totalPages: number;
}
