import React from "react";
import type { Booking } from "@/types/booking";
import { formatTime } from "@/lib/format";

interface StatusTrackerProps {
  booking: Booking;
}

interface StepItem {
  id: number;
  label: string;
  state: "completed" | "current" | "upcoming";
}

function getStepStates(booking: Booking): StepItem[] {
  const { status, vehicleConfirmation } = booking;
  const isVehicleConfirmed = Boolean(vehicleConfirmation?.confirmedAt);

  const steps: StepItem[] = [
    { id: 1, label: "Requested", state: "upcoming" },
    { id: 2, label: "Confirmed", state: "upcoming" },
    { id: 3, label: "Vehicle details shared", state: "upcoming" },
    { id: 4, label: "Picked up", state: "upcoming" },
    { id: 5, label: "Completed", state: "upcoming" },
  ];

  if (status === "requested") {
    steps[0].state = "current";
    return steps;
  }

  if (status === "confirmed") {
    steps[0].state = "completed";
    steps[1].state = "completed";
    if (isVehicleConfirmed) {
      steps[2].state = "completed";
      steps[3].state = "current";
    } else {
      steps[2].state = "current";
    }
    return steps;
  }

  if (status === "ongoing") {
    steps[0].state = "completed";
    steps[1].state = "completed";
    steps[2].state = "completed";
    steps[3].state = "completed";
    steps[4].state = "current";
    return steps;
  }

  if (status === "completed") {
    steps[0].state = "completed";
    steps[1].state = "completed";
    steps[2].state = "completed";
    steps[3].state = "completed";
    steps[4].state = "completed";
    return steps;
  }

  // Failed / Cancelled statuses
  // Mark steps reached before cancellation
  if (status === "cancelled_by_customer" || status === "cancelled_by_publisher") {
    // If cancelled before confirmed
    if (!booking.confirmedAt) {
      steps[0].state = "current";
    } else {
      steps[0].state = "completed";
      steps[1].state = "completed";
      if (isVehicleConfirmed) {
        steps[2].state = "completed";
      }
    }
    return steps;
  }

  if (status === "rejected" || status === "expired") {
    steps[0].state = "current";
    return steps;
  }

  if (status === "vehicle_unavailable") {
    steps[0].state = "completed";
    steps[1].state = "completed";
    return steps;
  }

  if (status === "handover_declined" || status === "no_show") {
    steps[0].state = "completed";
    steps[1].state = "completed";
    if (isVehicleConfirmed) {
      steps[2].state = "completed";
    }
    return steps;
  }

  return steps;
}

function getWhatHappensNext(booking: Booking): string {
  const { status, responseDeadlineAt, vehicleConfirmation } = booking;

  switch (status) {
    case "requested":
      if (responseDeadlineAt) {
        return `The owner has until ${formatTime(responseDeadlineAt)} to review and accept your request. We will notify you once they reply.`;
      }
      return "The owner is reviewing your request. We will notify you once they reply.";

    case "confirmed":
      if (vehicleConfirmation?.confirmedAt) {
        return "Your vehicle details have been shared. Inspect the vehicle at pickup and verify the registration and chassis number before starting your trip.";
      }
      return "The owner confirms the exact vehicle about 24 hours before pickup. We will notify you once details are shared.";

    case "ongoing":
      return "Your trip is currently active. Please return the vehicle at the agreed time and mark the trip as completed.";

    case "completed":
      return "Trip completed. You can leave a review of your experience with the owner and vehicle.";

    case "cancelled_by_customer":
      return "This booking was cancelled by you.";

    case "cancelled_by_publisher":
      return "This booking was cancelled by the owner. You can review similar available vehicles below.";

    case "rejected":
      return "This booking request was declined by the owner. Please browse alternative vehicles below.";

    case "expired":
      return "This booking request expired without a response from the owner. You can send a new request to another vehicle.";

    case "vehicle_unavailable":
      return "The owner reported that this vehicle cannot be provided. You can choose from similar alternative options below.";

    case "handover_declined":
      return "Handover was declined by the owner because valid ID or driving license could not be verified.";

    case "no_show":
      return "This booking was marked as a no-show because the pickup time passed without collection.";

    default:
      return "Please follow the instructions on this page for your booking.";
  }
}

export function BookingStatusTracker({ booking }: StatusTrackerProps) {
  const steps = getStepStates(booking);
  const whatHappensNext = getWhatHappensNext(booking);

  return (
    <div className="rounded-lg border border-line bg-paper-card p-5">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
        Trip Progress
      </h2>

      {/* Progress steps */}
      <ol className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5" role="list">
        {steps.map((step) => {
          const isCompleted = step.state === "completed";
          const isCurrent = step.state === "current";

          return (
            <li
              key={step.id}
              className={`flex flex-col gap-1.5 border-l-2 pl-3 sm:border-l-0 sm:border-t-2 sm:pl-0 sm:pt-3 ${
                isCompleted
                  ? "border-brand text-ink"
                  : isCurrent
                  ? "border-brand text-brand font-medium"
                  : "border-line text-ink-muted"
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs">
                {isCompleted ? (
                  <svg
                    className="h-4 w-4 shrink-0 text-brand"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <span
                    className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] ${
                      isCurrent
                        ? "bg-brand text-white"
                        : "bg-paper-light border border-line text-ink-muted"
                    }`}
                  >
                    {step.id}
                  </span>
                )}
                <span className="font-semibold text-[11px] uppercase tracking-wide">
                  Step {step.id}
                </span>
              </div>
              <span className="text-xs leading-snug">
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>

      {/* What happens next banner */}
      <div className="mt-5 rounded-md bg-paper-light border border-line p-3.5">
        <div className="flex items-start gap-2.5">
          <svg
            className="h-5 w-5 shrink-0 text-brand mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
              What happens next
            </p>
            <p className="mt-0.5 text-sm text-ink leading-relaxed">
              {whatHappensNext}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

