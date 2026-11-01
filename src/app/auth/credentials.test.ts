import { describe, it, expect } from "vitest";
import { parseCredentials } from "./credentials";

function form(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

describe("parseCredentials", () => {
  it("accepts a valid email and password", () => {
    const result = parseCredentials(
      form({ email: "user@example.com", password: "secret123" }),
    );
    expect(result).toEqual({
      success: true,
      data: { email: "user@example.com", password: "secret123" },
    });
  });

  it("rejects a missing email", () => {
    const result = parseCredentials(form({ password: "secret123" }));
    expect(result.success).toBe(false);
  });

  it("rejects an email without @", () => {
    const result = parseCredentials(
      form({ email: "not-an-email", password: "secret123" }),
    );
    expect(result.success).toBe(false);
  });

  it("rejects a password shorter than 6 characters", () => {
    const result = parseCredentials(
      form({ email: "user@example.com", password: "short" }),
    );
    expect(result.success).toBe(false);
  });

  it("trims surrounding whitespace from the email", () => {
    const result = parseCredentials(
      form({ email: "  user@example.com  ", password: "secret123" }),
    );
    expect(result).toEqual({
      success: true,
      data: { email: "user@example.com", password: "secret123" },
    });
  });
});
