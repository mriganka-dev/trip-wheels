import React from "react";

export function WhatToCarry() {
  return (
    <div className="rounded-lg border border-line bg-paper-card p-5">
      <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
        Pickup Requirements
      </span>
      <h3 className="mt-0.5 font-serif text-lg font-bold text-ink">
        What to Carry to Pickup
      </h3>
      <p className="mt-1 text-xs text-ink-muted">
        The vehicle cannot be handed over without in-person verification of your original documents.
      </p>

      <ul className="mt-4 space-y-2.5 text-sm text-ink" role="list">
        <li className="flex items-start gap-2.5">
          <svg
            className="h-5 w-5 shrink-0 text-brand mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <span className="font-medium">Original Government Photo ID</span>
            <p className="text-xs text-ink-muted">Aadhaar card, Passport, or Voter ID card.</p>
          </div>
        </li>

        <li className="flex items-start gap-2.5">
          <svg
            className="h-5 w-5 shrink-0 text-brand mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <span className="font-medium">Original Valid Driving License</span>
            <p className="text-xs text-ink-muted">Valid for the category of vehicle you have booked (bike or car).</p>
          </div>
        </li>
      </ul>

      <div className="mt-4 rounded-md border border-line bg-paper-light p-3 text-xs text-ink-muted">
        <strong className="font-semibold text-ink">Important: </strong>
        The owner can refuse handover without valid original documents. Digital photos or photocopies may not be accepted.
      </div>
    </div>
  );
}

