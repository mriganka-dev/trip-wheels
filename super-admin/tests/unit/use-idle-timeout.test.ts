import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useIdleTimeout } from "@/hooks/use-idle-timeout";
import { IDLE_TIMEOUT_MINUTES } from "@/lib/constants";

describe("useIdleTimeout hook", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("opens warning dialog after warning timeout threshold", () => {
    const onSignOut = vi.fn();
    const { result } = renderHook(() =>
      useIdleTimeout({ onSignOut, isPaused: false })
    );

    expect(result.current.isWarningOpen).toBe(false);

    // Fast-forward to warning threshold: (30 - 1) * 60 * 1000 ms
    act(() => {
      vi.advanceTimersByTime((IDLE_TIMEOUT_MINUTES - 1) * 60 * 1000);
    });

    expect(result.current.isWarningOpen).toBe(true);
    expect(onSignOut).not.toHaveBeenCalled();
  });

  it("triggers sign-out after warning countdown elapses without action", () => {
    const onSignOut = vi.fn();
    const { result } = renderHook(() =>
      useIdleTimeout({ onSignOut, isPaused: false })
    );

    // Fast-forward to warning threshold
    act(() => {
      vi.advanceTimersByTime((IDLE_TIMEOUT_MINUTES - 1) * 60 * 1000);
    });

    expect(result.current.isWarningOpen).toBe(true);

    // Advance additional 60 seconds of warning dialog
    act(() => {
      vi.advanceTimersByTime(60 * 1000);
    });

    expect(onSignOut).toHaveBeenCalled();
  });

  it("resets timeout and closes warning dialog when staySignedIn is invoked", () => {
    const onSignOut = vi.fn();
    const { result } = renderHook(() =>
      useIdleTimeout({ onSignOut, isPaused: false })
    );

    act(() => {
      vi.advanceTimersByTime((IDLE_TIMEOUT_MINUTES - 1) * 60 * 1000);
    });

    expect(result.current.isWarningOpen).toBe(true);

    act(() => {
      result.current.staySignedIn();
    });

    expect(result.current.isWarningOpen).toBe(false);

    // Advance 30 seconds: should not sign out because timer was reset
    act(() => {
      vi.advanceTimersByTime(30 * 1000);
    });

    expect(onSignOut).not.toHaveBeenCalled();
  });

  it("does not start timers when paused", () => {
    const onSignOut = vi.fn();
    const { result } = renderHook(() =>
      useIdleTimeout({ onSignOut, isPaused: true })
    );

    act(() => {
      vi.advanceTimersByTime(IDLE_TIMEOUT_MINUTES * 60 * 1000);
    });

    expect(result.current.isWarningOpen).toBe(false);
    expect(onSignOut).not.toHaveBeenCalled();
  });
});
