import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ApiError, apiClient } from "@/lib/api/client";

describe("apiClient and ApiError", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("creates ApiError instances with statusCode and field errors", () => {
    const error = new ApiError(400, "Validation failed", [
      { field: "email", message: "Invalid email address" },
    ]);
    expect(error.name).toBe("ApiError");
    expect(error.statusCode).toBe(400);
    expect(error.message).toBe("Validation failed");
    expect(error.errors).toHaveLength(1);
    expect(error.errors?.[0].field).toBe("email");
  });

  it("successfully parses 200 API response data", async () => {
    const mockData = { id: "123", name: "Guwahati" };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({
        statusCode: 200,
        data: mockData,
        message: "Success",
        success: true,
      }),
    });

    const result = await apiClient<{ id: string; name: string }>("/destinations");
    expect(result).toEqual(mockData);
  });

  it("throws typed ApiError on 404 response", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({
        statusCode: 404,
        message: "Vehicle not found",
        errors: [],
        success: false,
      }),
    });

    await expect(apiClient("/vehicles/unknown")).rejects.toThrow(ApiError);
  });
});

