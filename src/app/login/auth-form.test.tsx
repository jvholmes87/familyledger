import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Stub the server actions so the server-only module isn't pulled into jsdom.
vi.mock("@/app/auth/actions", () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
}));

import { AuthForm } from "./auth-form";

describe("AuthForm", () => {
  it("defaults to sign-in mode", () => {
    render(<AuthForm />);
    expect(screen.getByRole("tab", { name: "Sign in" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
  });

  it("renders email and password fields", () => {
    render(<AuthForm />);
    const email = screen.getByLabelText("Email");
    const password = screen.getByLabelText("Password");
    expect(email).toHaveAttribute("type", "email");
    expect(email).toBeRequired();
    expect(password).toHaveAttribute("type", "password");
    expect(password).toBeRequired();
  });

  it("switches to sign-up mode when the Sign up tab is clicked", async () => {
    const user = userEvent.setup();
    render(<AuthForm />);

    await user.click(screen.getByRole("tab", { name: "Sign up" }));

    expect(screen.getByRole("tab", { name: "Sign up" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(
      screen.getByRole("button", { name: "Create account" }),
    ).toBeInTheDocument();
  });

  it("moves focus and selection between modes with arrow keys", async () => {
    const user = userEvent.setup();
    render(<AuthForm />);

    const signInTab = screen.getByRole("tab", { name: "Sign in" });
    const signUpTab = screen.getByRole("tab", { name: "Sign up" });

    signInTab.focus();
    await user.keyboard("{ArrowRight}");

    expect(signUpTab).toHaveFocus();
    expect(signUpTab).toHaveAttribute("aria-selected", "true");
    expect(signInTab).toHaveAttribute("aria-selected", "false");

    await user.keyboard("{ArrowLeft}");

    expect(signInTab).toHaveFocus();
    expect(signInTab).toHaveAttribute("aria-selected", "true");
    expect(signUpTab).toHaveAttribute("aria-selected", "false");
  });

  it("wraps arrow-key navigation at either end of the tab list", async () => {
    const user = userEvent.setup();
    render(<AuthForm />);

    const signInTab = screen.getByRole("tab", { name: "Sign in" });
    const signUpTab = screen.getByRole("tab", { name: "Sign up" });

    await user.click(signUpTab);
    await user.keyboard("{ArrowRight}");

    expect(signInTab).toHaveFocus();
    expect(signInTab).toHaveAttribute("aria-selected", "true");

    await user.keyboard("{ArrowLeft}");

    expect(signUpTab).toHaveFocus();
    expect(signUpTab).toHaveAttribute("aria-selected", "true");
  });
});
