export interface ReviewUser {
  _id: string;
  fullName: string;
  avatar?: {
    url: string;
  };
}

export interface Review {
  _id: string;
  booking: string;
  direction: "customer_to_publisher" | "publisher_to_customer";
  reviewer: ReviewUser | string;
  reviewee: ReviewUser | string;
  vehicle?: string;
  rating: number;
  comment?: string;
  tags?: string[];
  isHidden?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateReviewPayload {
  rating: number;
  comment?: string;
  tags?: string[];
}

export interface ReviewItem {
  _id: string;
  rating: number;
  comment?: string;
  tags?: string[];
  reviewer?: {
    _id?: string;
    fullName: string;
  };
  createdAt: string;
}

export interface VehicleReviewsData {
  items: ReviewItem[];
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

