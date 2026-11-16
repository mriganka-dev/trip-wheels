import { describe, expect, it, vi, beforeEach } from "vitest";
import { apiClient, ApiError } from "@/lib/api/client";

describe("apiClient and token refresh behavior", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("successfully parses json response and unwraps data property", async () => {
    const mockData = { id: "123", name: "Test User" };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({ statusCode: 200, data: mockData, message: "OK" }),
    });

    const result = await apiClient<typeof mockData>("/admin/users/123");
    expect(result).toEqual(mockData);
  });

  it("attempts token refresh on 401 response and retries request on success", async () => {
    let callCount = 0;
    const finalData = { status: "active" };

    global.fetch = vi.fn().mockImplementation((url: string) => {
      callCount++;
      // Initial request receives 401
      if (callCount === 1) {
        return Promise.resolve({
          ok: false,
          status: 401,
          headers: new Headers({ "content-type": "application/json" }),
          json: async () => ({ message: "Unauthorized" }),
        });
      }
      // Refresh token request succeeds
      if (url.includes("/auth/refresh-token")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          headers: new Headers({ "content-type": "application/json" }),
          json: async () => ({ success: true }),
        });
      }
      // Retried request succeeds
      return Promise.resolve({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ statusCode: 200, data: finalData }),
      });
    });

    const result = await apiClient("/admin/settings");
    expect(result).toEqual(finalData);
    expect(callCount).toBe(3);
  });

  it("throws ApiError when server returns an error response", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      statusText: "Bad Request",
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({ statusCode: 400, message: "Invalid parameters" }),
    });

    await expect(apiClient("/admin/invalid")).rejects.toThrow(ApiError);
  });
});
