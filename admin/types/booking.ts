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

export interface BookingVehicleConfirmation {
  dueAt?: string | null;
  confirmedAt?: string | null;
  confirmedBy?: string | null;
  chassisNumber?: string;
  registrationNumber?: string;
  color?: string;
  notes?: string;
  missedAt?: string | null;
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
  declined?: {
    at?: string | null;
    reason?: string;
    note?: string;
  };
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
  customer?: BookingCustomer;
  publisher?: {
    _id: string;
    fullName?: string;
    phone?: string;
  };
  vehicle: BookingVehicleSummary;
  assignedVehicle?: BookingVehicleSummary;
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
