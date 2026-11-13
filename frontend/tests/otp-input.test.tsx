import React, { useState } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { OtpInput } from "@/components/ui/otp-input";

function ControlledOtpWrapper({
  initialValue = "",
  hasError = false,
  disabled = false,
  onChange = () => {},
}: {
  initialValue?: string;
  hasError?: boolean;
  disabled?: boolean;
  onChange?: (val: string) => void;
}) {
  const [val, setVal] = useState(initialValue);
  return (
    <OtpInput
      value={val}
      onChange={(newVal) => {
        setVal(newVal);
        onChange(newVal);
      }}
      hasError={hasError}
      disabled={disabled}
    />
  );
}

describe("OtpInput component", () => {
  it("renders 6 digit input boxes", () => {
    render(<ControlledOtpWrapper />);
    const inputs = screen.getAllByRole("textbox");
    expect(inputs).toHaveLength(6);
    expect(inputs[0]).toHaveAttribute("aria-label", "Digit 1 of 6");
    expect(inputs[5]).toHaveAttribute("aria-label", "Digit 6 of 6");
  });

  it("populates inputs with the initial value", () => {
    render(<ControlledOtpWrapper initialValue="123456" />);
    const inputs = screen.getAllByRole("textbox") as HTMLInputElement[];
    expect(inputs[0].value).toBe("1");
    expect(inputs[1].value).toBe("2");
    expect(inputs[2].value).toBe("3");
    expect(inputs[3].value).toBe("4");
    expect(inputs[4].value).toBe("5");
    expect(inputs[5].value).toBe("6");
  });

  it("handles typing digits and advances value", () => {
    const handleChange = vi.fn();
    render(<ControlledOtpWrapper onChange={handleChange} />);
    const inputs = screen.getAllByRole("textbox");

    fireEvent.change(inputs[0], { target: { value: "9" } });
    expect(handleChange).toHaveBeenCalledWith("9");
  });

  it("ignores non-digit characters", () => {
    const handleChange = vi.fn();
    render(<ControlledOtpWrapper onChange={handleChange} />);
    const inputs = screen.getAllByRole("textbox");

    fireEvent.change(inputs[0], { target: { value: "a" } });
    expect(handleChange).not.toHaveBeenCalled();
  });

  it("handles paste of 6 digits", () => {
    const handleChange = vi.fn();
    render(<ControlledOtpWrapper onChange={handleChange} />);
    const inputs = screen.getAllByRole("textbox");

    fireEvent.paste(inputs[0], {
      clipboardData: {
        getData: () => "456789",
      },
    });

    expect(handleChange).toHaveBeenCalledWith("456789");
  });

  it("disables all inputs when disabled is true", () => {
    render(<ControlledOtpWrapper disabled={true} />);
    const inputs = screen.getAllByRole("textbox");
    inputs.forEach((input) => {
      expect(input).toBeDisabled();
    });
  });

  it("handles backspace to clear digits", () => {
    const handleChange = vi.fn();
    render(<ControlledOtpWrapper initialValue="12" onChange={handleChange} />);
    const inputs = screen.getAllByRole("textbox");

    fireEvent.keyDown(inputs[1], { key: "Backspace" });
    expect(handleChange).toHaveBeenCalledWith("1");
  });
});

