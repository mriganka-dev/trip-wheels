import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

describe("ConfirmDialog", () => {
  it("renders title, description and audit notice line", () => {
    render(
      <ConfirmDialog
        open={true}
        onOpenChange={vi.fn()}
        title="Suspend publisher account"
        description="Are you sure you want to suspend this account?"
        onConfirm={vi.fn()}
      />
    );

    expect(screen.getByText("Suspend publisher account")).toBeInTheDocument();
    expect(
      screen.getByText("Are you sure you want to suspend this account?")
    ).toBeInTheDocument();
    expect(
      screen.getByText("This action is recorded in the audit log.")
    ).toBeInTheDocument();
  });

  it("requires note when requireNote is true and blocks confirmation if empty", () => {
    const handleConfirm = vi.fn();
    render(
      <ConfirmDialog
        open={true}
        onOpenChange={vi.fn()}
        title="Reject vehicle"
        description="Reject this vehicle from the platform."
        requireNote={true}
        actionLabel="Confirm rejection"
        onConfirm={handleConfirm}
      />
    );

    const confirmBtn = screen.getByRole("button", { name: "Confirm rejection" });
    fireEvent.click(confirmBtn);

    expect(
      screen.getByText("A written note is required for this action")
    ).toBeInTheDocument();
    expect(handleConfirm).not.toHaveBeenCalled();
  });

  it("submits the entered note when confirmed", () => {
    const handleConfirm = vi.fn();
    render(
      <ConfirmDialog
        open={true}
        onOpenChange={vi.fn()}
        title="Reject vehicle"
        description="Reject this vehicle from the platform."
        requireNote={true}
        actionLabel="Confirm rejection"
        onConfirm={handleConfirm}
      />
    );

    const textarea = screen.getByPlaceholderText("Enter reason for this action");
    act(() => {
      fireEvent.change(textarea, { target: { value: "Insurance document expired" } });
    });

    const confirmBtn = screen.getByRole("button", { name: "Confirm rejection" });
    act(() => {
      fireEvent.click(confirmBtn);
    });

    expect(handleConfirm).toHaveBeenCalledWith("Insurance document expired");
  });
});
