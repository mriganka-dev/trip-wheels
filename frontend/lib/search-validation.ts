import { parseISO } from "date-fns";
import { MIN_BOOKING_LEAD_HOURS } from "@/lib/constants";
import { isPickupLeadTimeValid } from "@/lib/format";

export interface SearchInputValues {
  destination?: string;
  from?: string;
  to?: string;
}

export interface SearchValidationResult {
  isValid: boolean;
  error: string | null;
}

export function validateSearchInputs(inputs: SearchInputValues): SearchValidationResult {
  const { destination, from, to } = inputs;

  if (!destination || destination.trim() === "") {
    return { isValid: false, error: "Please select a destination." };
  }

  if (!from || !to) {
    return { isValid: false, error: "Please select both pickup and return dates." };
  }

  if (!isPickupLeadTimeValid(from, MIN_BOOKING_LEAD_HOURS)) {
    return {
      isValid: false,
      error: `Pickup time must be at least ${MIN_BOOKING_LEAD_HOURS} hours from right now.`,
    };
  }

  try {
    const fromDate = parseISO(from);
    const toDate = parseISO(to);

    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      return { isValid: false, error: "Please enter valid dates." };
    }

    if (toDate <= fromDate) {
      return { isValid: false, error: "Return time must be after pickup time." };
    }
  } catch {
    return { isValid: false, error: "Please enter valid dates." };
  }

  return { isValid: true, error: null };
}

