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

export interface Booking {
  _id: string;
  bookingCode: string;
  status: string;
  startAt: string;
  endAt: string;
  responseDeadlineAt?: string;
  customer?: BookingCustomer;
  publisher?: {
    _id: string;
    fullName?: string;
    phone?: string;
  };
  vehicle: BookingVehicleSummary;
  assignedVehicle?: BookingVehicleSummary;
  customerNote?: string;
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
