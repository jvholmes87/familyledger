import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/app/auth/actions", () => ({ signOut: vi.fn() }));

import { AppHeader } from "./app-header";

describe("AppHeader", () => {
  it("links the wordmark to the dashboard", () => {
    render(<AppHeader email="user@example.com" />);
    expect(screen.getByRole("link", { name: "SpendWise" })).toHaveAttribute(
      "href",
      "/dashboard",
    );
  });

  it("provides a named primary navigation landmark with all app links", () => {
    render(<AppHeader email="user@example.com" />);

    const navigation = screen.getByRole("navigation", {
      name: "Primary navigation",
    });

    expect(
      within(navigation).getByRole("link", { name: "Dashboard" }),
    ).toHaveAttribute("href", "/dashboard");
    expect(
      within(navigation).getByRole("link", { name: "Income" }),
    ).toHaveAttribute("href", "/income");
    expect(
      within(navigation).getByRole("link", { name: "Expenses" }),
    ).toHaveAttribute("href", "/expenses");
    expect(
      within(navigation).getByRole("link", { name: "Categories" }),
    ).toHaveAttribute("href", "/categories");
  });

  it("opens account actions from the signed-in identity", async () => {
    const user = userEvent.setup();
    render(<AppHeader email="user@example.com" />);

    expect(
      screen.queryByRole("link", { name: /export csv/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /sign out/i }),
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Account menu for user@example.com" }),
    );

    expect(
      await screen.findByRole("menuitem", { name: "Settings" }),
    ).toHaveAttribute("href", "/settings");
    expect(
      screen.getByRole("menuitem", { name: "Sign out" }),
    ).toBeInTheDocument();
  });

  it("opens account actions when the desktop identity is hovered", async () => {
    const user = userEvent.setup();
    render(<AppHeader email="user@example.com" />);

    await user.hover(
      screen.getByRole("button", { name: "Account menu for user@example.com" }),
    );

    expect(
      await screen.findByRole("menuitem", { name: "Settings" }),
    ).toBeVisible();
  });

  it("uses a borderless hamburger affordance on mobile", () => {
    render(<AppHeader email="user@example.com" />);

    const trigger = screen.getByRole("button", {
      name: "Account menu for user@example.com",
    });

    expect(trigger.querySelector(".lucide-menu")).toBeInTheDocument();
    expect(trigger).not.toHaveClass("border-l");
  });

  it("does not lock document scrolling while account actions are open", async () => {
    const user = userEvent.setup();
    render(<AppHeader email="user@example.com" />);

    await user.click(
      screen.getByRole("button", { name: "Account menu for user@example.com" }),
    );
    await screen.findByRole("menuitem", { name: "Settings" });

    expect(document.body.style.overflow).not.toBe("hidden");
  });

  it("marks Settings as the active account destination", async () => {
    const user = userEvent.setup();
    render(<AppHeader email="user@example.com" active="settings" />);

    await user.click(
      screen.getByRole("button", { name: "Account menu for user@example.com" }),
    );

    expect(
      await screen.findByRole("menuitem", { name: "Settings" }),
    ).toHaveAttribute("aria-current", "page");
  });
});
