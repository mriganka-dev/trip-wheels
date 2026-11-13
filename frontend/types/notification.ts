export interface AppNotification {
  _id: string;
  user: string;
  event: string;
  title: string;
  body: string;
  data?: {
    link?: string;
    bookingId?: string;
    issueId?: string;
    [key: string]: unknown;
  };
  readAt?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface NotificationsResponse {
  items: AppNotification[];
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  unreadCount: number;
}

