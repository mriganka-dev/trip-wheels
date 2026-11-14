export const queryKeys = {
  auth: {
    me: ["auth", "me"] as const,
  },
  publisher: {
    profile: ["publisher", "profile"] as const,
    documents: ["publisher", "documents"] as const,
  },
  vehicles: {
    mine: (params?: Record<string, unknown>) => ["vehicles", "mine", params] as const,
    detail: (id: string) => ["vehicles", "detail", id] as const,
    unavailability: (id: string) => ["vehicles", "unavailability", id] as const,
  },
  bookings: {
    received: (params?: Record<string, unknown>) => ["bookings", "received", params] as const,
    detail: (id: string) => ["bookings", "detail", id] as const,
  },
  issues: {
    mine: (params?: Record<string, unknown>) => ["issues", "mine", params] as const,
    detail: (id: string) => ["issues", "detail", id] as const,
  },
  notifications: {
    list: ["notifications", "list"] as const,
  },
};
