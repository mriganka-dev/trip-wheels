export const APP_NAME = "Trip Wheels";

export const MIN_BOOKING_LEAD_HOURS = 3;

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

export type StatusTone = "neutral" | "positive" | "negative";

export interface StatusMeta {
  label: string;
  tone: StatusTone;
}

export const BOOKING_STATUS_CONFIG: Record<BookingStatus, StatusMeta> = {
  requested: {
    label: "Waiting for the owner",
    tone: "neutral",
  },
  confirmed: {
    label: "Confirmed",
    tone: "positive",
  },
  rejected: {
    label: "Not accepted",
    tone: "negative",
  },
  expired: {
    label: "No response from the owner",
    tone: "negative",
  },
  cancelled_by_customer: {
    label: "Cancelled by you",
    tone: "neutral",
  },
  cancelled_by_publisher: {
    label: "Cancelled by the owner",
    tone: "negative",
  },
  vehicle_unavailable: {
    label: "Vehicle not available",
    tone: "negative",
  },
  handover_declined: {
    label: "Handover declined",
    tone: "negative",
  },
  no_show: {
    label: "Marked as no show",
    tone: "negative",
  },
  ongoing: {
    label: "On trip",
    tone: "positive",
  },
  completed: {
    label: "Completed",
    tone: "neutral",
  },
};

export const VEHICLE_TYPE_LABELS = {
  bike: "Bike",
  car: "Car",
} as const;

export const FUEL_TYPE_LABELS = {
  petrol: "Petrol",
  diesel: "Diesel",
  electric: "Electric",
  cng: "CNG",
} as const;

export const TRANSMISSION_LABELS = {
  manual: "Manual",
  automatic: "Automatic",
} as const;

