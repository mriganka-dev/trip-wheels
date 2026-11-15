export interface ReviewVehicleSummary {
  _id: string;
  brand: string;
  model: string;
  type: string;
}

export interface ReviewUserSummary {
  _id: string;
  fullName: string;
}

export interface Review {
  _id: string;
  booking: string | { _id: string; bookingCode: string };
  direction: "customer_to_publisher" | "publisher_to_customer";
  reviewer: ReviewUserSummary;
  reviewee: ReviewUserSummary;
  vehicle?: ReviewVehicleSummary;
  rating: number;
  comment: string;
  tags?: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface PaginatedReviewsResponse {
  items: Review[];
  totalItems: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateReviewPayload {
  rating: number;
  comment?: string;
}
