export interface AdminVehicleItem {
  _id: string;
  name?: string;
  brand: string;
  model: string;
  variant?: string;
  year?: number;
  type: "bike" | "car";
  status: string;
  images?: { url: string; publicId: string }[];
  publisher?: {
    _id: string;
    fullName: string;
    email?: string;
    phone?: string;
    role?: "agent" | "individual";
    accountStatus?: string;
  };
  destination?: {
    _id: string;
    name: string;
    slug?: string;
    state?: string;
  };
  pricing?: {
    perDay: number;
    perHour?: number | null;
    deposit?: number;
    currency?: string;
  };
  registrationNumber?: string;
  chassisNumber?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VehicleListQuery {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
  destination?: string;
  publisher?: string;
  search?: string;
}

export interface VehicleDetail {
  _id: string;
  brand: string;
  model: string;
  variant?: string;
  year: number;
  color?: string;
  type: "bike" | "car";
  transmission: "manual" | "automatic";
  fuelType: "petrol" | "diesel" | "electric" | "hybrid" | string;
  seats?: number | null;
  engineCc?: number | null;
  mileage?: string;
  status: string;
  images: {
    url: string;
    publicId: string;
    _id?: string;
  }[];
  pricing: {
    perDay: number;
    perHour?: number | null;
    deposit?: number;
    currency?: string;
  };
  minRentalHours: number;
  cancellationPolicy?: {
    freeCancellationHoursBeforePickup: number;
    notes?: string;
  };
  pickup: {
    mode: "fixed_counter" | "flexible_area" | string;
    address?: string;
    landmark?: string;
    location?: {
      type: string;
      coordinates: [number, number];
    };
    approximateArea?: string;
  };
  chassisNumber?: string;
  registrationNumber?: string;
  rc?: {
    file?: {
      url: string;
      publicId: string;
    };
    ownerName?: string;
    registrationNumber?: string;
  };
  insurance?: {
    file?: {
      url: string;
      publicId: string;
    };
    policyNumber?: string;
    validUntil?: string;
  };
  noc?: {
    file?: {
      url: string;
      publicId: string;
    };
  };
  rejectionReason?: string;
  publisher?: {
    _id: string;
    fullName: string;
    email?: string;
    phone?: string;
    role?: "agent" | "individual";
    accountStatus?: string;
    createdAt?: string;
  };
  publisherProfile?: {
    _id: string;
    publisherType: "agent" | "individual";
    verificationStatus: string;
    reliability?: {
      score: number;
      requestsReceived: number;
      accepted: number;
      completed: number;
      noShows: number;
      issuesUpheld: number;
    };
    flags?: {
      type: string;
      note?: string;
      createdAt: string;
      resolved?: boolean;
    }[];
  };
  destination?: {
    _id: string;
    name: string;
    slug: string;
    state?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface RejectVehiclePayload {
  reason: string;
}

export interface SuspendVehiclePayload {
  reason: string;
}
