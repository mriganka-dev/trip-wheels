import { env } from "@/lib/env";
import type { ApiErrorPayload, ApiResponse } from "@/types/api";
import { ApiError } from "./client";

interface ServerFetchOptions extends RequestInit {
  revalidate?: number | false;
  tags?: string[];
}

export async function serverFetch<T>(
  endpoint: string,
  options: ServerFetchOptions = {}
): Promise<T> {
  const normalizedPath = endpoint.startsWith("/api/v1")
    ? endpoint
    : `/api/v1${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const base = env.backendUrl.replace(/\/+$/, "");
  const url = `${base}${normalizedPath}`;

  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const nextOptions: { revalidate?: number | false; tags?: string[] } = {};
  if (typeof options.revalidate !== "undefined") {
    nextOptions.revalidate = options.revalidate;
  }
  if (options.tags) {
    nextOptions.tags = options.tags;
  }

  const response = await fetch(url, {
    ...options,
    headers,
    next: Object.keys(nextOptions).length > 0 ? nextOptions : undefined,
  });

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
      (response.statusText ? response.statusText : `Server request failed with status ${response.status}`);
    throw new ApiError(response.status, message, errorBody?.errors);
  }

  const successBody = body as ApiResponse<T> | null;
  if (successBody && typeof successBody === "object" && "data" in successBody) {
    return successBody.data;
  }

  return body as T;
}

