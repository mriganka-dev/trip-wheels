export const queryKeys = {
  auth: {
    me: ["auth", "me"] as const,
  },
  dashboard: {
    overview: ["dashboard", "overview"] as const,
  },
  tasks: {
    all: ["tasks"] as const,
    list: (params?: Record<string, unknown>) => ["tasks", "list", params] as const,
  },
  verifications: {
    all: ["verifications"] as const,
    list: (params?: Record<string, unknown>) => ["verifications", "list", params] as const,
    detail: (id: string) => ["verifications", "detail", id] as const,
  },
  vehicles: {
    all: ["vehicles"] as const,
    list: (params?: Record<string, unknown>) => ["vehicles", "list", params] as const,
    detail: (id: string) => ["vehicles", "detail", id] as const,
  },
  destinations: {
    all: ["destinations"] as const,
    list: (params?: Record<string, unknown>) => ["destinations", "list", params] as const,
  },
  bookings: {
    all: ["bookings"] as const,
    list: (params?: Record<string, unknown>) => ["bookings", "list", params] as const,
    detail: (id: string) => ["bookings", "detail", id] as const,
  },
  issues: {
    all: ["issues"] as const,
    list: (params?: Record<string, unknown>) => ["issues", "list", params] as const,
    detail: (id: string) => ["issues", "detail", id] as const,
  },
  users: {
    all: ["users"] as const,
    list: (params?: Record<string, unknown>) => ["users", "list", params] as const,
    detail: (id: string) => ["users", "detail", id] as const,
  },
  watchlists: {
    misclassification: ["watchlists", "misclassification"] as const,
    insuranceExpiry: ["watchlists", "insuranceExpiry"] as const,
  },
  settings: {
    all: ["settings"] as const,
  },
  audit: {
    all: ["audit"] as const,
    list: (params?: Record<string, unknown>) => ["audit", "list", params] as const,
  },
  analytics: {
    overview: (params?: Record<string, unknown>) => ["analytics", "overview", params] as const,
    destinations: ["analytics", "destinations"] as const,
  },
  notifications: {
    all: ["notifications"] as const,
    list: ["notifications", "list"] as const,
  },
};
