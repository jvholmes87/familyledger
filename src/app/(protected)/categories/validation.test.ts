import { describe, it, expect } from "vitest";
import { parseCategoryName } from "./validation";

describe("parseCategoryName", () => {
  it("rejects an empty name", () => {
    const result = parseCategoryName("");
    expect(result).toEqual({
      success: false,
      error: "Category name is required.",
    });
  });

  it("rejects a whitespace-only name", () => {
    const result = parseCategoryName("   ");
    expect(result.success).toBe(false);
  });

  it("trims surrounding whitespace on a valid name", () => {
    const result = parseCategoryName("  Groceries  ");
    expect(result).toEqual({ success: true, data: { name: "Groceries" } });
  });

  it("rejects a name longer than 60 characters", () => {
    const result = parseCategoryName("x".repeat(61));
    expect(result).toEqual({
      success: false,
      error: "Category name must be 60 characters or fewer.",
    });
  });

  it("accepts a name of exactly 60 characters", () => {
    const name = "x".repeat(60);
    expect(parseCategoryName(name)).toEqual({ success: true, data: { name } });
  });

  it("rejects a duplicate name (case-insensitive)", () => {
    const result = parseCategoryName("groceries", ["Groceries", "Rent"]);
    expect(result).toEqual({
      success: false,
      error: "A category with that name already exists.",
    });
  });

  it("ignores whitespace differences when detecting duplicates", () => {
    const result = parseCategoryName("  Rent ", ["Rent"]);
    expect(result.success).toBe(false);
  });

  it("accepts a unique name alongside existing ones", () => {
    const result = parseCategoryName("Utilities", ["Groceries", "Rent"]);
    expect(result).toEqual({ success: true, data: { name: "Utilities" } });
  });
});
