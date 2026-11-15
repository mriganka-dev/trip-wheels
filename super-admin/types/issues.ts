export interface AdminIssueItem {
  _id: string;
  type: string;
  status: "open" | "under_review" | "resolved" | "dismissed";
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  booking?: {
    _id: string;
    bookingCode?: string;
    status?: string;
  } | null;
  raisedBy?: {
    _id: string;
    fullName: string;
    email: string;
  } | null;
  raisedAgainst?: {
    _id: string;
    fullName: string;
    email: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface IssueListQuery {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
  severity?: string;
}
