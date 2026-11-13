import { describe, it, expect } from "vitest";
import { addHours, format } from "date-fns";
import { validateSearchInputs } from "@/lib/search-validation";

describe("Search form validation", () => {
  const getFutureDateString = (hoursFromNow: number) => {
    return format(addHours(new Date(), hoursFromNow), "yyyy-MM-dd'T'HH:mm");
  };

  it("fails when destination is missing or empty", () => {
    const pickup = getFutureDateString(24);
    const dropoff = getFutureDateString(72);

    const resultEmpty = validateSearchInputs({
      destination: "",
      from: pickup,
      to: dropoff,
    });
    expect(resultEmpty.isValid).toBe(false);
    expect(resultEmpty.error).toBe("Please select a destination.");

    const resultMissing = validateSearchInputs({
      from: pickup,
      to: dropoff,
    });
    expect(resultMissing.isValid).toBe(false);
    expect(resultMissing.error).toBe("Please select a destination.");
  });

  it("fails when dates are missing", () => {
    const pickup = getFutureDateString(24);

    const resultNoTo = validateSearchInputs({
      destination: "guwahati",
      from: pickup,
      to: "",
    });
    expect(resultNoTo.isValid).toBe(false);
    expect(resultNoTo.error).toBe("Please select both pickup and return dates.");

    const resultNoFrom = validateSearchInputs({
      destination: "guwahati",
      from: "",
      to: pickup,
    });
    expect(resultNoFrom.isValid).toBe(false);
    expect(resultNoFrom.error).toBe("Please select both pickup and return dates.");
  });

  it("fails when pickup lead time is under 3 hours", () => {
    const pickupTooSoon = getFutureDateString(1);
    const dropoff = getFutureDateString(48);

    const result = validateSearchInputs({
      destination: "guwahati",
      from: pickupTooSoon,
      to: dropoff,
    });
    expect(result.isValid).toBe(false);
    expect(result.error).toContain("Pickup time must be at least 3 hours");
  });

  it("fails when return date is before or equal to pickup date", () => {
    const pickup = getFutureDateString(24);
    const dropoffBefore = getFutureDateString(12);

    const resultBefore = validateSearchInputs({
      destination: "guwahati",
      from: pickup,
      to: dropoffBefore,
    });
    expect(resultBefore.isValid).toBe(false);
    expect(resultBefore.error).toBe("Return time must be after pickup time.");

    const resultSame = validateSearchInputs({
      destination: "guwahati",
      from: pickup,
      to: pickup,
    });
    expect(resultSame.isValid).toBe(false);
    expect(resultSame.error).toBe("Return time must be after pickup time.");
  });

  it("fails when dates are malformed strings", () => {
    const result = validateSearchInputs({
      destination: "guwahati",
      from: "invalid-date",
      to: "also-invalid",
    });
    expect(result.isValid).toBe(false);
    expect(result.error).toBe("Pickup time must be at least 3 hours from right now.");
  });

  it("succeeds when all parameters are valid", () => {
    const pickup = getFutureDateString(24);
    const dropoff = getFutureDateString(72);

    const result = validateSearchInputs({
      destination: "shillong",
      from: pickup,
      to: dropoff,
    });
    expect(result.isValid).toBe(true);
    expect(result.error).toBeNull();
  });
});

