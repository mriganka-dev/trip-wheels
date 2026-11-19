import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { GoogleButton } from "@/components/auth/google-button";

describe("GoogleButton component (admin)", () => {
  it("renders a plain anchor tag for login mode with app=agent", () => {
    render(<GoogleButton mode="login" />);
    const link = screen.getByRole("link", { name: /continue with google/i });
    expect(link).toBeInTheDocument();
    expect(link.tagName.toLowerCase()).toBe("a");
    expect(link).toHaveAttribute(
      "href",
      "/api/v1/auth/google?app=agent&mode=login"
    );
  });

  it("renders a plain anchor tag for register mode with type=agent", () => {
    render(<GoogleButton mode="register" type="agent" />);
    const link = screen.getByRole("link", { name: /continue with google/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute(
      "href",
      "/api/v1/auth/google?app=agent&mode=register&type=agent"
    );
  });

  it("renders a plain anchor tag for register mode with type=individual", () => {
    render(<GoogleButton mode="register" type="individual" />);
    const link = screen.getByRole("link", { name: /continue with google/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute(
      "href",
      "/api/v1/auth/google?app=agent&mode=register&type=individual"
    );
  });

  it("attaches safe next redirect path", () => {
    render(<GoogleButton mode="login" next="/verification" />);
    const link = screen.getByRole("link", { name: /continue with google/i });
    expect(link).toHaveAttribute(
      "href",
      "/api/v1/auth/google?app=agent&mode=login&next=%2Fverification"
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
