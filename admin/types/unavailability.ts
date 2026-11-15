export type UnavailabilityReason =
  | "rented_elsewhere"
  | "maintenance"
  | "damaged"
  | "in_service"
  | "personal_use"
  | "other";

export interface VehicleUnavailability {
  _id: string;
  vehicle: string;
  from: string;
  to: string;
  reason: UnavailabilityReason;
  createdBy: string;
  booking?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateUnavailabilityPayload {
  from: string;
  to: string;
  reason: UnavailabilityReason;
}
