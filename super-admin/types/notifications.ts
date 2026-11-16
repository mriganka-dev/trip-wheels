export interface NotificationItem {
  _id: string;
  user: string;
  title: string;
  body: string;
  event: string;
  data?: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationListResponse {
  items: NotificationItem[];
  totalItems: number;
  totalPages: number;
  page: number;
  limit: number;
  unreadCount?: number;
}
