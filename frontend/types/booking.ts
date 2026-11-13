import type { BookingStatus } from "@/lib/constants";
import type { Vehicle } from "./vehicle";

export interface BookingStatusHistoryItem {
  status: BookingStatus;
  at: string;
  note?: string;
}

export interface BookingPricingSnapshot {
  perDay: number;
  perHour?: number;
  deposit?: number;
  estimatedTotal: number;
  note?: string;
}

export interface BookingPickupDetails {
  mode: "fixed" | "flexible";
  address?: string;
  landmark?: string;
  location?: {
    type?: "Point";
    coordinates?: [number, number];
  };
  approximateArea?: string;
  finalizedAt?: string;
  note?: string;
}

export interface BookingVehicleConfirmation {
  confirmedAt?: string;
  missedAt?: string;
  chassisNumber?: string;
  registrationNumber?: string;
  color?: string;
  notes?: string;
  dueAt?: string;
}

export interface BookingCancellation {
  cancelledAt?: string;
  cancelledBy?: string;
  reason?: string;
}

export interface BookingModificationRequest {
  _id: string;
  newStartAt: string;
  newEndAt: string;
  status: "pending" | "accepted" | "rejected";
  decidedAt?: string;
  createdAt: string;
}

export interface Booking {
  _id: string;
  bookingCode: string;
  status: BookingStatus;
  statusHistory: BookingStatusHistoryItem[];
  customer: {
    _id: string;
    fullName: string;
    phone?: string;
    email?: string;
  };
  publisher: {
    _id: string;
    fullName: string;
    phone?: string;
    email?: string;
  };
  vehicle: Vehicle;
  assignedVehicle?: Vehicle;
  startAt: string;
  endAt: string;
  durationHours: number;
  pricingSnapshot: BookingPricingSnapshot;
  customerNote?: string;
  responseDeadlineAt?: string;
  respondedAt?: string;
  rejectionReason?: string;
  confirmedAt?: string;
  pickup: BookingPickupDetails;
  vehicleConfirmation?: BookingVehicleConfirmation;
  cancellation?: BookingCancellation;
  hasOpenIssue?: boolean;
  isOverdue?: boolean;
  modificationRequests?: BookingModificationRequest[];
  createdAt: string;
  updatedAt?: string;
}

export interface CreateBookingPayload {
  vehicleId: string;
  startAt: string;
  endAt: string;
  customerNote?: string;
}

export interface MyBookingsResponse {
  items: Booking[];
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

