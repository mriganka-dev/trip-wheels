export interface BookingCustomer {
  _id: string;
  fullName: string;
  phone?: string;
  email?: string;
  reliability?: {
    score?: number;
    completedTrips?: number;
  };
}

export interface BookingVehicleSummary {
  _id: string;
  brand: string;
  model: string;
  type: string;
  color?: string;
  chassisNumber?: string;
  registrationNumber?: string;
  pricing?: {
    perDay?: number;
    perHour?: number | null;
  };
  pickup?: {
    mode?: string;
    address?: string;
    landmark?: string;
    location?: {
      coordinates: [number, number];
    };
    approximateArea?: string;
  };
}

export interface BookingPickup {
  mode?: "fixed" | "flexible";
  address?: string;
  landmark?: string;
  location?: {
    type?: "Point";
    coordinates?: [number, number];
  };
  finalizedAt?: string | null;
  note?: string;
}

export interface BookingVehicleConfirmation {
  dueAt?: string | null;
  confirmedAt?: string | null;
  confirmedBy?: string | null;
  chassisNumber?: string;
  registrationNumber?: string;
  color?: string;
  notes?: string;
  missedAt?: string | null;
  swappedFromVehicle?: string | BookingVehicleSummary | null;
}

export interface BookingModificationRequest {
  _id: string;
  requestedBy: string;
  newStartAt: string;
  newEndAt: string;
  status: "pending" | "accepted" | "rejected";
  decidedAt?: string | null;
  createdAt: string;
}

export interface BookingHandover {
  customerIdVerified?: boolean;
  licenseVerified?: boolean;
  verifiedAt?: string | null;
  pickedUpAt?: string | null;
  markedBy?: string | null;
  declined?: {
    at?: string | null;
    reason?: string;
    note?: string;
  };
}

export interface BookingStatusHistoryItem {
  status: string;
  at: string;
  by?: string | null;
  note?: string;
}

export interface BookingUnavailability {
  reportedAt?: string | null;
  reason?: string;
  note?: string;
  hoursBeforePickup?: number | null;
  lateDisclosure?: boolean;
}

export interface BookingCompletion {
  completedAt?: string | null;
  completedBy?: "customer" | "publisher" | "system" | null;
  autoCompleted?: boolean;
}

export interface Booking {
  _id: string;
  bookingCode: string;
  status: string;
  startAt: string;
  endAt: string;
  durationHours?: number;
  responseDeadlineAt?: string;
  respondedAt?: string | null;
  confirmedAt?: string | null;
  customer?: BookingCustomer;
  publisher?: {
    _id: string;
    fullName?: string;
    phone?: string;
    email?: string;
  };
  vehicle: BookingVehicleSummary;
  assignedVehicle?: BookingVehicleSummary;
  pickup?: BookingPickup;
  pricingSnapshot?: {
    perDay?: number;
    perHour?: number;
    deposit?: number;
    estimatedTotal?: number;
    note?: string;
  };
  customerNote?: string;
  rejectionReason?: string;
  vehicleConfirmation?: BookingVehicleConfirmation;
  prePickupConfirmedAt?: string | null;
  handover?: BookingHandover;
  isOverdue?: boolean;
  hasOpenIssue?: boolean;
  modificationRequests?: BookingModificationRequest[];
  statusHistory?: BookingStatusHistoryItem[];
  unavailability?: BookingUnavailability;
  completion?: BookingCompletion;
  cancellation?: {
    by?: string | null;
    at?: string | null;
    reason?: string;
    withinFreeWindow?: boolean;
  };
  createdAt: string;
  updatedAt?: string;
}

export interface PaginatedBookingsResponse {
  items: Booking[];
  totalItems: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AcceptBookingPayload {
  chassisNumber?: string;
  registrationNumber?: string;
  color?: string;
  notes?: string;
}

export interface RejectBookingPayload {
  reason?: string;
}

export interface FinalizePickupPointPayload {
  address: string;
  landmark?: string;
  coordinates: [number, number];
  note?: string;
}

export interface ConfirmVehiclePayload {
  chassisNumber: string;
  registrationNumber: string;
  color?: string;
  notes?: string;
  assignedVehicleId?: string;
}

export interface ReportVehicleUnavailablePayload {
  reason: "rented_elsewhere" | "damaged" | "in_service" | "maintenance" | "other";
  note?: string;
}

export interface ConfirmPickupReadyPayload {
  note?: string;
}

export interface HandoverPayload {
  customerIdVerified: true;
  licenseVerified: true;
}

export interface DeclineHandoverPayload {
  reason: "invalid_id" | "invalid_license" | "name_mismatch" | "other";
  note?: string;
}

export interface CancelBookingPayload {
  reason: string;
}

export interface CompleteBookingPayload {
  note?: string;
}
