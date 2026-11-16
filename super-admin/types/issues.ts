export type IssueStatus = "open" | "under_review" | "resolved" | "dismissed";
export type IssueSeverity = "low" | "medium" | "high" | "critical";
export type IssueResolutionOutcome = "upheld" | "partially_upheld" | "dismissed";

export interface IssueEvidence {
  url: string;
  publicId: string;
}

export interface IssueTimelineEntry {
  at: string;
  by: {
    _id: string;
    fullName?: string;
    role?: string;
  } | string;
  note: string;
}

export interface IssueResolution {
  outcome: IssueResolutionOutcome | null;
  adminNote?: string;
  penaltyApplied?: boolean;
  resolvedBy?: {
    _id: string;
    fullName?: string;
  } | string | null;
  resolvedAt?: string | null;
}

export interface IssueUserSummary {
  _id: string;
  fullName: string;
  phone?: string;
  email: string;
  role?: string;
  reliability?: {
    score?: number;
    cancellations?: number;
    noShows?: number;
    issuesUpheld?: number;
    completedBookings?: number;
    requestsReceived?: number;
    accepted?: number;
    rejected?: number;
    expired?: number;
    completed?: number;
    cancelledAfterConfirm?: number;
    lateDisclosures?: number;
    undisclosedUnavailability?: number;
    missedConfirmations?: number;
  };
}

export interface IssueDetail {
  _id: string;
  type: string;
  status: IssueStatus;
  severity: IssueSeverity;
  description: string;
  evidence: IssueEvidence[];
  raisedBy: IssueUserSummary;
  raisedAgainst: IssueUserSummary;
  booking: {
    _id: string;
    bookingCode: string;
    status: string;
    startAt: string;
    endAt: string;
    durationHours?: number;
    vehicle?: {
      _id: string;
      brand?: string;
      model?: string;
      type?: string;
      registrationNumber?: string;
      chassisNumber?: string;
    } | null;
    assignedVehicle?: {
      _id: string;
      brand?: string;
      model?: string;
      type?: string;
      registrationNumber?: string;
      chassisNumber?: string;
    } | null;
    vehicleConfirmation?: {
      dueAt?: string | null;
      confirmedAt?: string | null;
      confirmedBy?: string | null;
      registrationNumber?: string;
      chassisNumber?: string;
      missedAt?: string | null;
    } | null;
    handover?: {
      customerIdVerified?: boolean;
      licenseVerified?: boolean;
      verifiedAt?: string | null;
      pickedUpAt?: string | null;
      declined?: {
        at?: string | null;
        reason?: string;
        note?: string;
      } | null;
    } | null;
    unavailability?: {
      reportedAt?: string | null;
      reason?: string;
      note?: string;
      lateDisclosure?: boolean;
    } | null;
    hasOpenIssue?: boolean;
  };
  response?: {
    text: string;
    at: string | null;
  };
  resolution?: IssueResolution;
  timeline: IssueTimelineEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface AdminIssueItem {
  _id: string;
  type: string;
  status: IssueStatus;
  severity: IssueSeverity;
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
  from?: string;
  to?: string;
  search?: string;
}

export interface ResolveAdminIssuePayload {
  outcome: IssueResolutionOutcome;
  adminNote?: string;
  penaltyApplied?: boolean;
  suspendPublisher?: boolean;
  suspendVehicle?: boolean;
  suspendCustomer?: boolean;
  status?: IssueStatus;
}
