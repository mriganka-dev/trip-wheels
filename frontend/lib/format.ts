import { addDays, addHours, format, formatDistanceStrict, parseISO, setHours, setMinutes } from "date-fns";

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDateTime(dateInput: string | Date): string {
  const date = typeof dateInput === "string" ? parseISO(dateInput) : dateInput;
  return format(date, "d MMM yyyy, h:mm a");
}

export function formatDate(dateInput: string | Date): string {
  const date = typeof dateInput === "string" ? parseISO(dateInput) : dateInput;
  return format(date, "d MMM yyyy");
}

export function formatTime(dateInput: string | Date): string {
  const date = typeof dateInput === "string" ? parseISO(dateInput) : dateInput;
  return format(date, "h:mm a");
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  if (cleaned.length === 12 && cleaned.startsWith("91")) {
    return `+91 ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`;
  }
  return phone;
}

export function getTelLink(phone: string): string {
  const cleaned = phone.replace(/[^\d+]/g, "");
  return `tel:${cleaned.startsWith("+") ? cleaned : `+91${cleaned}`}`;
}

export function formatDurationHours(hours: number): string {
  if (hours < 24) {
    return `${hours} hr${hours === 1 ? "" : "s"}`;
  }
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  if (remainingHours === 0) {
    return `${days} day${days === 1 ? "" : "s"}`;
  }
  return `${days} day${days === 1 ? "" : "s"} ${remainingHours} hr${remainingHours === 1 ? "" : "s"}`;
}

export function formatDurationBetween(start: string | Date, end: string | Date): string {
  const startDate = typeof start === "string" ? parseISO(start) : start;
  const endDate = typeof end === "string" ? parseISO(end) : end;
  return formatDistanceStrict(startDate, endDate);
}

export function toDateTimeLocalString(date: Date): string {
  return format(date, "yyyy-MM-dd'T'HH:mm");
}

export function getDefaultBookingDates(): { from: string; to: string } {
  const now = new Date();
  const tomorrow = addDays(now, 1);
  const startDate = setMinutes(setHours(tomorrow, 9), 0);
  const endDate = setMinutes(setHours(addDays(startDate, 2), 19), 0);

  return {
    from: toDateTimeLocalString(startDate),
    to: toDateTimeLocalString(endDate),
  };
}

export function getComingWeekendDates(): { from: string; to: string } {
  const now = new Date();
  const currentDay = now.getDay();
  // Target upcoming Saturday (day 6)
  const daysUntilSaturday = (6 - currentDay + 7) % 7 || 7;
  const saturday = setMinutes(setHours(addDays(now, daysUntilSaturday), 9), 0);
  const sundayEvening = setMinutes(setHours(addDays(saturday, 1), 20), 0);

  return {
    from: toDateTimeLocalString(saturday),
    to: toDateTimeLocalString(sundayEvening),
  };
}

export function isPickupLeadTimeValid(pickupString: string, minHours: number = 3): boolean {
  try {
    const pickup = parseISO(pickupString);
    const minTime = addHours(new Date(), minHours);
    return pickup >= minTime;
  } catch {
    return false;
  }
}
