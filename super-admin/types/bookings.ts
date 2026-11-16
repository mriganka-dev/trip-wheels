export type BookingStatus =
  | "requested"
  | "confirmed"
  | "rejected"
  | "expired"
  | "cancelled_by_customer"
  | "cancelled_by_publisher"
  | "vehicle_unavailable"
  | "handover_declined"
  | "no_show"
  | "ongoing"
  | "completed";

export interface BookingCustomer {
  _id: string;
  fullName: string;
  phone?: string;
  email?: string;
  reliability?: {
    score?: number;
    completedTrips?: number;
    noShows?: number;
    cancellations?: number;
  };
}

export interface BookingPublisher {
  _id: string;
  fullName: string;
  phone?: string;
  email?: string;
  role?: "agent" | "individual";
  publisherType?: "agent" | "individual";
  reliability?: {
    score?: number;
  };
}

export interface BookingVehicleSummary {
  _id: string;
  brand: string;
  model: string;
  variant?: string;
  year?: number;
  type?: "bike" | "car";
  registrationNumber?: string;
  chassisNumber?: string;
  destination?: string | { _id: string; name: string; slug?: string };
}

export interface BookingStatusHistoryItem {
  status: BookingStatus | string;
  at: string;
  by?: string | { _id: string; fullName: string };
  note?: string;
}

export interface BookingModificationRequest {
  _id: string;
  requestedBy: string | { _id: string; fullName: string };
  newStartAt: string;
  newEndAt: string;
  status: "pending" | "accepted" | "rejected";
  decidedAt?: string | null;
  createdAt: string;
}

export interface BookingDetail {
  _id: string;
  bookingCode: string;
  status: BookingStatus;
  startAt: string;
  endAt: string;
  durationHours: number;
  customerNote?: string;
  rejectionReason?: string;
  confirmedAt?: string | null;
  customerPickedUpAt?: string | null;
  prePickupConfirmedAt?: string | null;
  isOverdue?: boolean;
  hasOpenIssue?: boolean;
  customer?: BookingCustomer;
  publisher?: BookingPublisher;
  vehicle?: BookingVehicleSummary;
  assignedVehicle?: BookingVehicleSummary;
  pricingSnapshot?: {
    perDay: number;
    perHour: number;
    deposit: number;
    estimatedTotal: number;
    note?: string;
  };
  pickup?: {
    mode: "fixed" | "flexible" | string;
    address?: string;
    landmark?: string;
    location?: {
      type: string;
      coordinates: [number, number];
    };
    finalizedAt?: string | null;
    note?: string;
  };
  vehicleConfirmation?: {
    dueAt?: string | null;
    confirmedAt?: string | null;
    confirmedBy?: string | { _id: string; fullName: string };
    chassisNumber?: string;
    registrationNumber?: string;
    color?: string;
    notes?: string;
    swappedFromVehicle?: string | BookingVehicleSummary;
    missedAt?: string | null;
  };
  handover?: {
    customerIdVerified?: boolean;
    licenseVerified?: boolean;
    verifiedAt?: string | null;
    pickedUpAt?: string | null;
    markedBy?: string | { _id: string; fullName: string };
    declined?: {
      at?: string | null;
      reason?: string;
      note?: string;
    };
  };
  cancellation?: {
    by?: string | { _id: string; fullName: string };
    at?: string | null;
    reason?: string;
    withinFreeWindow?: boolean;
  };
  unavailability?: {
    reportedAt?: string | null;
    reason?: string;
    note?: string;
    hoursBeforePickup?: number | null;
    lateDisclosure?: boolean;
  };
  completion?: {
    completedAt?: string | null;
    completedBy?: string | null;
    autoCompleted?: boolean;
  };
  modificationRequests?: BookingModificationRequest[];
  statusHistory?: BookingStatusHistoryItem[];
  createdAt: string;
  updatedAt: string;
}

export interface BookingListQuery {
  page?: number;
  limit?: number;
  status?: string;
  destinationId?: string;
  publisherId?: string;
  from?: string;
  to?: string;
  search?: string;
  needsAttention?: boolean;
}

export interface OverrideBookingStatusPayload {
  status: string;
  note: string;
}
