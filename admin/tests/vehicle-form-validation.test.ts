import { describe, it, expect } from "vitest";
import { z } from "zod";

const basicsSchema = z.object({
  destination: z.string().min(1, "Please select a destination"),
  type: z.enum(["bike", "car"], {
    message: "Vehicle type is required",
  }),
  brand: z.string().trim().min(1, "Brand is required"),
  model: z.string().trim().min(1, "Model is required"),
  variant: z.string().trim().optional(),
  year: z
    .number()
    .int()
    .min(1990, "Year must be 1990 or later")
    .max(new Date().getFullYear() + 1, "Year cannot be in the future"),
  color: z.string().trim().optional(),
  transmission: z.enum(["manual", "automatic"]),
  fuelType: z.enum(["petrol", "diesel", "electric", "cng"]),
  seats: z.number().int().min(1).max(12).optional().nullable(),
  engineCc: z.number().int().min(50).max(5000).optional().nullable(),
});

const pricingSchema = z.object({
  perDay: z.number().min(1, "Per-day price must be at least 1"),
  perHour: z.number().min(0).optional().nullable(),
  deposit: z.number().min(0),
  minRentalHours: z.number().int().min(1),
  freeCancellationHoursBeforePickup: z.number().int().min(0),
  cancellationNotes: z.string().trim().optional(),
});

describe("Vehicle form validation schemas", () => {
  it("validates valid vehicle basics payload successfully", () => {
    const validBasics = {
      destination: "dest-guwahati",
      type: "bike" as const,
      brand: "Royal Enfield",
      model: "Hunter 350",
      year: 2023,
      transmission: "manual" as const,
      fuelType: "petrol" as const,
      engineCc: 349,
    };

    const result = basicsSchema.safeParse(validBasics);
    expect(result.success).toBe(true);
  });

  it("fails basics validation when brand, model, or destination is missing", () => {
    const invalidBasics = {
      destination: "",
      type: "bike",
      brand: "   ",
      model: "",
      year: 2023,
      transmission: "manual",
      fuelType: "petrol",
    };

    const result = basicsSchema.safeParse(invalidBasics);
    expect(result.success).toBe(false);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      expect(fieldErrors.destination).toBeDefined();
      expect(fieldErrors.brand).toBeDefined();
      expect(fieldErrors.model).toBeDefined();
    }
  });

  it("rejects vehicle manufacturing year earlier than 1990 or in future", () => {
    const tooOld = {
      destination: "dest-1",
      type: "car",
      brand: "Maruti",
      model: "800",
      year: 1985,
      transmission: "manual",
      fuelType: "petrol",
    };
    expect(basicsSchema.safeParse(tooOld).success).toBe(false);

    const futureYear = {
      ...tooOld,
      year: new Date().getFullYear() + 5,
    };
    expect(basicsSchema.safeParse(futureYear).success).toBe(false);
  });

  it("validates pricing schema properly", () => {
    const validPricing = {
      perDay: 1200,
      deposit: 2000,
      minRentalHours: 24,
      freeCancellationHoursBeforePickup: 24,
    };
    expect(pricingSchema.safeParse(validPricing).success).toBe(true);

    const zeroPrice = {
      ...validPricing,
      perDay: 0,
    };
    expect(pricingSchema.safeParse(zeroPrice).success).toBe(false);

    const negativeDeposit = {
      ...validPricing,
      deposit: -100,
    };
    expect(pricingSchema.safeParse(negativeDeposit).success).toBe(false);
  });
});
