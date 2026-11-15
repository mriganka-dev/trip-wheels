export interface NotificationItem {
  _id: string;
  event: string;
  title: string;
  body: string;
  data?: {
    bookingId?: string;
    bookingCode?: string;
    vehicleId?: string;
    issueId?: string;
    [key: string]: unknown;
  };
  readAt?: string | null;
  createdAt: string;
}

export interface NotificationsResponse {
  items: NotificationItem[];
  totalItems: number;
  unreadCount: number;
  page: number;
  limit: number;
  totalPages: number;
}
