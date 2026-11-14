export type VehicleType = "bike" | "car";
export type TransmissionType = "manual" | "automatic";
export type FuelType = "petrol" | "diesel" | "electric" | "cng";

export type VehicleStatus =
  | "draft"
  | "pending_review"
  | "active"
  | "paused"
  | "suspended"
  | "rejected";

export type PickupMode = "fixed" | "flexible";

export interface VehicleImage {
  _id?: string;
  url: string;
  publicId: string;
}

export interface VehiclePricing {
  perDay: number;
  perHour?: number | null;
  deposit?: number;
  currency?: string;
}

export interface VehicleCancellationPolicy {
  freeCancellationHoursBeforePickup: number;
  notes?: string;
}

export interface VehiclePickup {
  mode: PickupMode;
  address?: string;
  landmark?: string;
  location?: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
  };
  approximateArea?: string;
}

export interface VehicleDocumentFile {
  url: string;
  publicId: string;
}

export interface VehicleRC {
  file?: VehicleDocumentFile;
  ownerName?: string;
  registrationNumber?: string;
}

export interface VehicleInsurance {
  file?: VehicleDocumentFile;
  policyNumber?: string;
  expiresAt?: string | null;
}

export interface VehicleNOC {
  file?: VehicleDocumentFile;
}

export interface Vehicle {
  _id: string;
  publisher: string | { _id: string; fullName: string };
  publisherProfile: string;
  destination:
    | string
    | {
        _id: string;
        name: string;
        slug: string;
        state?: string;
      };
  type: VehicleType;
  brand: string;
  model: string;
  variant?: string;
  year: number;
  color?: string;
  transmission: TransmissionType;
  fuelType: FuelType;
  seats?: number | null;
  engineCc?: number | null;
  mileage?: string;
  images: VehicleImage[];
  pricing: VehiclePricing;
  minRentalHours: number;
  documentsRequiredAtPickup?: string[];
  cancellationPolicy?: VehicleCancellationPolicy;
  pickup: VehiclePickup;
  chassisNumber?: string;
  registrationNumber?: string;
  rc?: VehicleRC;
  insurance?: VehicleInsurance;
  noc?: VehicleNOC;
  status: VehicleStatus;
  rejectionReason?: string;
  isDeleted?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVehiclePayload {
  destination: string;
  type: VehicleType;
  brand: string;
  model: string;
  variant?: string;
  year: number;
  color?: string;
  transmission: TransmissionType;
  fuelType: FuelType;
  seats?: number | null;
  engineCc?: number | null;
  mileage?: string;
  pricing: {
    perDay: number;
    perHour?: number | null;
    deposit?: number;
  };
  minRentalHours?: number;
  cancellationPolicy?: {
    freeCancellationHoursBeforePickup?: number;
    notes?: string;
  };
}

export interface UpdateVehiclePayload {
  type?: VehicleType;
  brand?: string;
  model?: string;
  variant?: string;
  year?: number;
  color?: string;
  transmission?: TransmissionType;
  fuelType?: FuelType;
  seats?: number | null;
  engineCc?: number | null;
  mileage?: string;
  pricing?: {
    perDay?: number;
    perHour?: number | null;
    deposit?: number;
  };
  minRentalHours?: number;
  cancellationPolicy?: {
    freeCancellationHoursBeforePickup?: number;
    notes?: string;
  };
}

export interface UploadVehicleDocumentsPayload {
  chassisNumber: string;
  registrationNumber: string;
  rcOwnerName: string;
  insurancePolicyNumber: string;
  insuranceExpiresAt: string;
  rc?: File;
  insurance?: File;
  noc?: File;
}

export interface PaginatedVehiclesResponse {
  items: Vehicle[];
  totalItems: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface InsuranceStatusInfo {
  status: "valid" | "expiring_soon" | "expired";
  daysRemaining?: number;
  message?: string;
  tone?: "neutral" | "warning" | "negative";
}

export function checkVehicleInsurance(expiresAt?: string | null): InsuranceStatusInfo {
  if (!expiresAt) {
    return { status: "valid" };
  }

  const expiryDate = new Date(expiresAt);
  if (isNaN(expiryDate.getTime())) {
    return { status: "valid" };
  }

  const now = new Date();
  const diffMs = expiryDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    return {
      status: "expired",
      daysRemaining: 0,
      message: "Insurance expired. Upload a new insurance document to make it live again.",
      tone: "negative",
    };
  }

  if (diffDays <= 7) {
    return {
      status: "expiring_soon",
      daysRemaining: diffDays,
      message: `Insurance expires in ${diffDays} day${diffDays === 1 ? "" : "s"}.`,
      tone: "negative",
    };
  }

  if (diffDays <= 30) {
    return {
      status: "expiring_soon",
      daysRemaining: diffDays,
      message: `Insurance expires in ${diffDays} days.`,
      tone: "warning",
    };
  }

  return { status: "valid" };
}
