import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { OAuthErrorMessage } from "@/components/auth/oauth-error-message";
import {
  OAUTH_CUSTOMER_ERROR_MESSAGES,
  DEFAULT_OAUTH_CUSTOMER_ERROR,
} from "@/lib/constants";

const mockReplace = vi.fn();
let mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
  usePathname: () => "/login",
  useSearchParams: () => mockSearchParams,
}));

describe("OAuthErrorMessage component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams();
  });

  it("renders nothing when no error query param is present", () => {
    render(<OAuthErrorMessage />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("renders google_cancelled message and clears parameter from URL", () => {
    mockSearchParams = new URLSearchParams("error=google_cancelled&next=%2Fprofile");
    render(<OAuthErrorMessage />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      OAUTH_CUSTOMER_ERROR_MESSAGES.google_cancelled
    );
    expect(mockReplace).toHaveBeenCalledWith("/login?next=%2Fprofile", {
      scroll: false,
    });
  });

  it("renders google_failed message and clears parameter from URL", () => {
    mockSearchParams = new URLSearchParams("error=google_failed");
    render(<OAuthErrorMessage />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      OAUTH_CUSTOMER_ERROR_MESSAGES.google_failed
    );
    expect(mockReplace).toHaveBeenCalledWith("/login", {
      scroll: false,
    });
  });

  it("renders google_email_unverified message", () => {
    mockSearchParams = new URLSearchParams("error=google_email_unverified");
    render(<OAuthErrorMessage />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      OAUTH_CUSTOMER_ERROR_MESSAGES.google_email_unverified
    );
  });

  it("renders account_suspended message", () => {
    mockSearchParams = new URLSearchParams("error=account_suspended");
    render(<OAuthErrorMessage />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      OAUTH_CUSTOMER_ERROR_MESSAGES.account_suspended
    );
  });

  it("renders wrong_app message", () => {
    mockSearchParams = new URLSearchParams("error=wrong_app");
    render(<OAuthErrorMessage />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      OAUTH_CUSTOMER_ERROR_MESSAGES.wrong_app
    );
  });

  it("renders google_unavailable message", () => {
    mockSearchParams = new URLSearchParams("error=google_unavailable");
    render(<OAuthErrorMessage />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      OAUTH_CUSTOMER_ERROR_MESSAGES.google_unavailable
    );
  });

  it("falls back to default google_failed message for unknown error code", () => {
    mockSearchParams = new URLSearchParams("error=unknown_error_code");
    render(<OAuthErrorMessage />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      DEFAULT_OAUTH_CUSTOMER_ERROR
    );
  });
});
