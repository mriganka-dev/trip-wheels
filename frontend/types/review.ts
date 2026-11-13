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

