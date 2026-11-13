import { describe, it, expect } from "vitest";
import type { SearchVehiclesParams } from "@/types/vehicle";

function buildSearchQueryString(params: SearchVehiclesParams): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value));
    }
  }
  return query.toString();
}

describe("Search parameter parsing and building", () => {
  it("builds query string correctly with required parameters", () => {
    const params: SearchVehiclesParams = {
      destination: "guwahati",
      from: "2026-11-20T09:00",
      to: "2026-11-22T19:00",
    };
    const query = buildSearchQueryString(params);
    expect(query).toContain("destination=guwahati");
    expect(query).toContain("from=2026-11-20T09%3A00");
    expect(query).toContain("to=2026-11-22T19%3A00");
  });

  it("omits empty or undefined filter values from query string", () => {
    const params: SearchVehiclesParams = {
      destination: "shillong",
      from: "2026-11-20T09:00",
      to: "2026-11-22T19:00",
      type: "",
      transmission: undefined,
      minPrice: undefined,
    };
    const query = buildSearchQueryString(params);
    expect(query).not.toContain("type=");
    expect(query).not.toContain("transmission=");
    expect(query).not.toContain("minPrice=");
  });

  it("handles optional filter fields properly", () => {
    const params: SearchVehiclesParams = {
      destination: "tawang",
      from: "2026-11-20T09:00",
      to: "2026-11-22T19:00",
      type: "bike",
      fuelType: "petrol",
      sort: "price_asc",
      page: 2,
    };
    const query = buildSearchQueryString(params);
    expect(query).toContain("type=bike");
    expect(query).toContain("fuelType=petrol");
    expect(query).toContain("sort=price_asc");
    expect(query).toContain("page=2");
  });
});

