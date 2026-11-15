export interface AdminVehicleItem {
  _id: string;
  name?: string;
  brand: string;
  model: string;
  type: "bike" | "car";
  status: string;
  publisher?: string | { _id: string; fullName: string };
  destination?: { _id: string; name: string; slug?: string };
  pricing?: {
    perDay: number;
    perHour?: number;
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
}
