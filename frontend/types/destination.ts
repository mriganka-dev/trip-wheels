export interface Landmark {
  _id: string;
  name: string;
  type: "railway_station" | "airport" | "bus_stand" | "other";
  location: {
    type: "Point";
    coordinates: [number, number];
  };
}

export interface Destination {
  _id: string;
  name: string;
  slug: string;
  state: string;
  country: string;
  isActive: boolean;
  landmarks: Landmark[];
  nearbyDestinations?: Array<{ _id: string; name: string; slug: string }>;
  createdAt?: string;
  updatedAt?: string;
}

