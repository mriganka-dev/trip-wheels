import type { Destination } from "./destination";

export interface VehicleImage {
  url: string;
  isPrimary?: boolean;
  publicId?: string;
}

export interface VehiclePricing {
  perDay: number;
  perHour?: number;
  deposit?: number;
}

export interface VehiclePickup {
  mode: "fixed" | "flexible";
  address?: string;
  landmark?: string;
  approximateArea?: string;
}

export interface VehiclePublisher {
  _id?: string;
  fullName: string;
}

export interface PublisherProfileSummary {
  publisherType: "agent" | "individual";
  reliability?: {
    score: number;
  };
  agentPickup?: {
    address?: string;
    landmark?: string;
  };
  individualArea?: {
    city?: string;
    area?: string;
  };
}

export interface Vehicle {
  _id: string;
  brand: string;
  model: string;
  year: number;
  type: "bike" | "car";
  transmission: "manual" | "automatic";
  fuelType: "petrol" | "diesel" | "electric" | "cng";
  seats?: number;
  engineCapacity?: number;
  color?: string;
  minRentalHours?: number;
  freeCancellationHours?: number;
  cancellationPolicy?: {
    freeCancellationHoursBeforePickup?: number;
  };
  cancellationWindowHours?: number;
  images: VehicleImage[];
  pricing: VehiclePricing;
  pickup: VehiclePickup;
  publisher: VehiclePublisher;
  publisherProfile?: PublisherProfileSummary;
  destination: Destination | { _id: string; name: string; slug: string; state?: string };
  ratingAvg?: number;
  ratingCount?: number;
  tripsCompleted?: number;
  estimatedTotal?: number;
}

export interface SearchVehiclesParams {
  destination: string;
  from: string;
  to: string;
  type?: string;
  minPrice?: number;
  maxPrice?: number;
  transmission?: string;
  fuelType?: string;
  ownerType?: string;
  nearLandmark?: string;
  maxDistanceKm?: number;
  sort?: "price_asc" | "price_desc" | "rating" | "distance" | "reliability";
  page?: number;
  limit?: number;
}

export interface SearchSuggestions {
  nearbyDestinations?: Array<{ _id: string; name: string; slug: string }>;
  joytrips?: {
    url: string;
  };
}

export interface SearchVehiclesData {
  items: Vehicle[];
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  suggestions?: SearchSuggestions;
}

