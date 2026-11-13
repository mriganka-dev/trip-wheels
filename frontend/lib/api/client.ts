import type { ApiErrorPayload, ApiFieldError, ApiResponse } from "@/types/api";

export class ApiError extends Error {
  statusCode: number;
  errors?: ApiFieldError[];

  constructor(statusCode: number, message: string, errors?: ApiFieldError[]) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

let refreshPromise: Promise<boolean> | null = null;

async function attemptTokenRefresh(): Promise<boolean> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const response = await fetch("/api/v1/auth/refresh-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      return response.ok;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const normalizedPath = endpoint.startsWith("/api/v1")
    ? endpoint
    : `/api/v1${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;

  const headers = new Headers(options.headers);
  if (!isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const fetchOptions: RequestInit = {
    ...options,
    headers,
    credentials: "include",
  };

  let response = await fetch(normalizedPath, fetchOptions);

  const isAuthEndpoint =
    normalizedPath.includes("/auth/refresh-token") ||
    normalizedPath.includes("/auth/login") ||
    normalizedPath.includes("/auth/register");

  if (response.status === 401 && !isAuthEndpoint) {
    const refreshed = await attemptTokenRefresh();
    if (refreshed) {
      response = await fetch(normalizedPath, fetchOptions);
    } else {
      if (typeof window !== "undefined") {
        const currentPath = window.location.pathname;
        if (!currentPath.startsWith("/login")) {
          // eslint-disable-next-line @next/next/no-location-assign-relative-destination
          window.location.href = `/login?next=${encodeURIComponent(currentPath)}`;
        }
      }
    }
  }

  let body: unknown = null;
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    try {
      body = await response.json();
    } catch {
      body = null;
    }
  }

  if (!response.ok) {
    const errorBody = body as ApiErrorPayload | null;
    const message =
      errorBody?.message ||
      (response.statusText ? response.statusText : `Request failed with status ${response.status}`);
    throw new ApiError(response.status, message, errorBody?.errors);
  }

  const successBody = body as ApiResponse<T> | null;
  if (successBody && typeof successBody === "object" && "data" in successBody) {
    return successBody.data;
  }

  return body as T;
}
