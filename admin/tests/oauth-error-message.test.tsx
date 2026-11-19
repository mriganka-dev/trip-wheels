import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { OAuthErrorMessage } from "@/components/auth/oauth-error-message";
import {
  OAUTH_AGENT_ERROR_MESSAGES,
  DEFAULT_OAUTH_AGENT_ERROR,
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

describe("OAuthErrorMessage component (admin)", () => {
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
    mockSearchParams = new URLSearchParams("error=google_cancelled&next=%2Fverification");
    render(<OAuthErrorMessage />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      OAUTH_AGENT_ERROR_MESSAGES.google_cancelled
    );
    expect(mockReplace).toHaveBeenCalledWith("/login?next=%2Fverification", {
      scroll: false,
    });
  });

  it("renders no_account message", () => {
    mockSearchParams = new URLSearchParams("error=no_account");
    render(<OAuthErrorMessage />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      OAUTH_AGENT_ERROR_MESSAGES.no_account
    );
  });

  it("renders wrong_app message for agent dashboard", () => {
    mockSearchParams = new URLSearchParams("error=wrong_app");
    render(<OAuthErrorMessage />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      OAUTH_AGENT_ERROR_MESSAGES.wrong_app
    );
  });

  it("renders account_suspended message", () => {
    mockSearchParams = new URLSearchParams("error=account_suspended");
    render(<OAuthErrorMessage />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      OAUTH_AGENT_ERROR_MESSAGES.account_suspended
    );
  });

  it("renders google_email_unverified message", () => {
    mockSearchParams = new URLSearchParams("error=google_email_unverified");
    render(<OAuthErrorMessage />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      OAUTH_AGENT_ERROR_MESSAGES.google_email_unverified
    );
  });

  it("renders google_unavailable message", () => {
    mockSearchParams = new URLSearchParams("error=google_unavailable");
    render(<OAuthErrorMessage />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      OAUTH_AGENT_ERROR_MESSAGES.google_unavailable
    );
  });

  it("falls back to default google_failed message for unknown error code", () => {
    mockSearchParams = new URLSearchParams("error=unknown_error_code");
    render(<OAuthErrorMessage />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      DEFAULT_OAUTH_AGENT_ERROR
    );
  });
});
