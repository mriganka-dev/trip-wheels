export const queryKeys = {
  auth: {
    me: ["auth", "me"] as const,
  },
  destinations: {
    all: ["destinations"] as const,
  },
  vehicles: {
    search: (params: Record<string, unknown>) => ["vehicles", "search", params] as const,
    detail: (id: string) => ["vehicles", "detail", id] as const,
    availability: (id: string, from?: string, to?: string) =>
      ["vehicles", "availability", id, { from, to }] as const,
    reviews: (id: string, page?: number) => ["vehicles", "reviews", id, { page }] as const,
  },
  bookings: {
    mine: (params?: Record<string, unknown>) => ["bookings", "mine", params] as const,
    detail: (id: string) => ["bookings", "detail", id] as const,
    backups: (id: string) => ["bookings", "backups", id] as const,
  },
  issues: {
    mine: (params?: Record<string, unknown>) => ["issues", "mine", params] as const,
    detail: (id: string) => ["issues", "detail", id] as const,
  },
  notifications: {
    all: (params?: Record<string, unknown>) => ["notifications", params] as const,
    vapidKey: ["notifications", "vapid-key"] as const,
  },
};

