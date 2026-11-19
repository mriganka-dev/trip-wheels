import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { GoogleButton } from "@/components/auth/google-button";

describe("GoogleButton component", () => {
  it("renders a plain anchor tag for login mode", () => {
    render(<GoogleButton mode="login" />);
    const link = screen.getByRole("link", { name: /continue with google/i });
    expect(link).toBeInTheDocument();
    expect(link.tagName.toLowerCase()).toBe("a");
    expect(link).toHaveAttribute(
      "href",
      "/api/v1/auth/google?app=customer&mode=login"
    );
  });

  it("renders a plain anchor tag for register mode", () => {
    render(<GoogleButton mode="register" />);
    const link = screen.getByRole("link", { name: /continue with google/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute(
      "href",
      "/api/v1/auth/google?app=customer&mode=register"
    );
  });

  it("attaches safe next redirect path", () => {
    render(<GoogleButton mode="login" next="/book/v123" />);
    const link = screen.getByRole("link", { name: /continue with google/i });
    expect(link).toHaveAttribute(
      "href",
      "/api/v1/auth/google?app=customer&mode=login&next=%2Fbook%2Fv123"
    );
  });

  it("sanitizes unsafe external next redirect path", () => {
    render(<GoogleButton mode="login" next="https://evil.com" />);
    const link = screen.getByRole("link", { name: /continue with google/i });
    expect(link).toHaveAttribute(
      "href",
      "/api/v1/auth/google?app=customer&mode=login&next=%2F"
    );
  });

  it("renders disabled state with aria-disabled", () => {
    render(<GoogleButton mode="register" disabled />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    const disabledElement = screen
      .getByText(/continue with google/i)
      .closest("[aria-disabled='true']");
    expect(disabledElement).toBeInTheDocument();
  });

  it("falls back to text only if the logo image fails to load", () => {
    const { container } = render(<GoogleButton mode="login" />);
    const img = container.querySelector("img");
    expect(img).toBeInTheDocument();

    if (img) {
      fireEvent.error(img);
    }
    expect(container.querySelector("img")).not.toBeInTheDocument();
    expect(screen.getByText("Continue with Google")).toBeInTheDocument();
  });
});
