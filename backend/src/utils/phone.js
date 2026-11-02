import { ApiError } from "./ApiError.js";

export const normalizePhone = (input) => {
  if (!input || typeof input !== "string") {
    throw new ApiError(400, "Phone number is required");
  }

  const digits = input.replace(/\D/g, "");

  if (digits.length === 10) {
    return `91${digits}`;
  }

  if (digits.length === 11 && digits.startsWith("0")) {
    return `91${digits.slice(1)}`;
  }

  if (digits.length === 12 && digits.startsWith("91")) {
    return digits;
  }

  if (digits.length >= 10 && digits.length <= 15) {
    return digits;
  }

  throw new ApiError(
    400,
    "Invalid phone number. Provide a 10-digit mobile number or full country code."
  );
};
