import { differenceInMinutes, differenceInSeconds, format, formatDistanceStrict, parseISO } from "date-fns";

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

export function formatCountdown(deadlineInput: string | Date): string {
  const deadline = typeof deadlineInput === "string" ? parseISO(deadlineInput) : deadlineInput;
  const now = new Date();
  const totalSeconds = differenceInSeconds(deadline, now);

  if (totalSeconds <= 0) {
    return "Time is up";
  }

  const totalMinutes = differenceInMinutes(deadline, now);
  if (totalMinutes < 60) {
    const mins = Math.max(1, totalMinutes);
    return `${mins} min left`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const remainingMins = totalMinutes % 60;

  if (remainingMins === 0) {
    return `${hours} h left`;
  }

  return `${hours} h ${remainingMins} min left`;
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

export function toIsoUtc(localDateInput: string | Date): string {
  const date = typeof localDateInput === "string" ? new Date(localDateInput) : localDateInput;
  return date.toISOString();
}

export function toDateTimeLocalString(date: Date): string {
  return format(date, "yyyy-MM-dd'T'HH:mm");
}
