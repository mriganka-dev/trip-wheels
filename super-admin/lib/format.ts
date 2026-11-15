import { formatDistanceToNowStrict } from "date-fns";

export function formatDateTime(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return "";
  const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return "";

  const datePart = d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const timePart = d
    .toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
    .toLowerCase();

  return `${datePart}, ${timePart}`;
}

export function formatDateOnly(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return "";
  const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return "";

  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatWaitingFor(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return "";
  const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return "";

  return formatDistanceToNowStrict(d);
}

export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return "";
  const cleaned = phone.replace(/[^\d+]/g, "");

  // Format Indian standard mobile: +91 98765 43210
  if (cleaned.startsWith("+91") && cleaned.length === 13) {
    const part1 = cleaned.slice(3, 8);
    const part2 = cleaned.slice(8);
    return `+91 ${part1} ${part2}`;
  }

  if (cleaned.length === 10 && /^\d+$/.test(cleaned)) {
    const part1 = cleaned.slice(0, 5);
    const part2 = cleaned.slice(5);
    return `+91 ${part1} ${part2}`;
  }

  return cleaned;
}

export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return "₹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPercentage(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return "0%";
  const rounded = Number(value.toFixed(1));
  return `${rounded}%`;
}

export function toIsoUtc(date: Date): string {
  return date.toISOString();
}
