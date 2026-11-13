"use client";

import React, { useRef, useEffect } from "react";
import clsx from "clsx";

export interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  hasError?: boolean;
  disabled?: boolean;
}

export function OtpInput({
  value,
  onChange,
  hasError = false,
  disabled = false,
}: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const digits = Array.from({ length: 6 }, (_, i) => value[i] || "");

  useEffect(() => {
    if (!disabled && inputRefs.current[0]) {
      inputRefs.current[0]?.focus();
    }
  }, [disabled]);

  const handleChange = (index: number, char: string) => {
    const cleanChar = char.replace(/\D/g, "");
    if (!cleanChar) {
      return;
    }

    const newDigits = [...digits];
    newDigits[index] = cleanChar[cleanChar.length - 1];
    const newValue = newDigits.join("");
    onChange(newValue);

    if (index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const newDigits = [...digits];
      if (newDigits[index]) {
        newDigits[index] = "";
        onChange(newDigits.join(""));
      } else if (index > 0) {
        newDigits[index - 1] = "";
        onChange(newDigits.join(""));
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pastedData) return;

    onChange(pastedData);
    const nextFocusIndex = Math.min(pastedData.length, 5);
    inputRefs.current[nextFocusIndex]?.focus();
  };

  return (
    <div className="flex items-center justify-between gap-2 max-w-xs mx-auto">
      {Array.from({ length: 6 }, (_, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          pattern="\d*"
          maxLength={1}
          disabled={disabled}
          value={digits[index]}
          aria-label={`Digit ${index + 1} of 6`}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          className={clsx(
            "h-12 w-10 sm:w-11 text-center font-display text-lg font-bold rounded-md border bg-(--surface) text-(--ink)",
            "transition-colors focus-visible:outline-2 focus-visible:outline-(--brand) focus-visible:outline-offset-1",
            "disabled:cursor-not-allowed disabled:bg-(--paper) disabled:opacity-60",
            hasError ? "border-(--negative)" : "border-(--line)"
          )}
        />
      ))}
    </div>
  );
}
