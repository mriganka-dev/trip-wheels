export interface DestinationLandmark {
  _id?: string;
  name: string;
  type: "railway_station" | "airport" | "bus_stand" | "other";
  location: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
  };
}

export interface DestinationItem {
  _id: string;
  name: string;
  slug: string;
  state: string;
  country?: string;
  location: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
  };
  isActive: boolean;
  landmarks?: DestinationLandmark[];
  nearbyDestinations?: (string | { _id: string; name: string; slug?: string })[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateDestinationPayload {
  name: string;
  slug: string;
  state: string;
  country?: string;
  location: {
    type: "Point";
    coordinates: [number, number];
  };
  isActive?: boolean;
  landmarks?: DestinationLandmark[];
  nearbyDestinations?: string[];
}

export interface UpdateDestinationPayload {
  name?: string;
  state?: string;
  country?: string;
  location?: {
    type: "Point";
    coordinates: [number, number];
  };
  isActive?: boolean;
  landmarks?: DestinationLandmark[];
  nearbyDestinations?: string[];
}

export interface DestinationListQuery {
  page?: number;
  limit?: number;
  isActive?: boolean | string;
}
