import { describe, it, expect } from "vitest";
import { resolveAuthRedirect } from "./route-guard";

describe("resolveAuthRedirect", () => {
  it("redirects unauthenticated users away from protected routes", () => {
    expect(
      resolveAuthRedirect({ pathname: "/dashboard", isAuthenticated: false }),
    ).toBe("/login");
  });

  it("protects nested routes under a protected prefix", () => {
    expect(
      resolveAuthRedirect({
        pathname: "/dashboard/settings",
        isAuthenticated: false,
      }),
    ).toBe("/login");
  });

  it("sends authenticated users away from the login page", () => {
    expect(
      resolveAuthRedirect({ pathname: "/login", isAuthenticated: true }),
    ).toBe("/dashboard");
  });

  it("allows authenticated users on protected routes", () => {
    expect(
      resolveAuthRedirect({ pathname: "/dashboard", isAuthenticated: true }),
    ).toBeNull();
  });

  it("allows unauthenticated users on the login page", () => {
    expect(
      resolveAuthRedirect({ pathname: "/login", isAuthenticated: false }),
    ).toBeNull();
  });

  it("leaves public routes alone", () => {
    expect(
      resolveAuthRedirect({ pathname: "/", isAuthenticated: false }),
    ).toBeNull();
    expect(
      resolveAuthRedirect({ pathname: "/", isAuthenticated: true }),
    ).toBeNull();
  });
});
