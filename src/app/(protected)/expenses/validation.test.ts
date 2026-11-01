import { describe, it, expect } from "vitest";
import { parseExpense } from "./validation";

const valid = {
  amount: "42.50",
  expense_date: "2026-07-01",
  description: "weekly shop",
  category_id: "cat-1",
};

describe("parseExpense", () => {
  it("accepts a fully-specified expense", () => {
    expect(parseExpense(valid)).toEqual({
      success: true,
      data: {
        amount: 42.5,
        expense_date: "2026-07-01",
        description: "weekly shop",
        category_id: "cat-1",
      },
    });
  });

  it("requires an amount", () => {
    expect(parseExpense({ ...valid, amount: "" })).toEqual({
      success: false,
      error: "Amount is required.",
    });
  });

  it("rejects a non-numeric amount", () => {
    expect(parseExpense({ ...valid, amount: "abc" })).toEqual({
      success: false,
      error: "Enter a valid amount.",
    });
  });

  it("rejects a negative amount", () => {
    expect(parseExpense({ ...valid, amount: "-5" })).toEqual({
      success: false,
      error: "Amount must be zero or greater.",
    });
  });

  it("accepts a zero amount", () => {
    const result = parseExpense({ ...valid, amount: "0" });
    expect(result.success).toBe(true);
  });

  it("requires a date", () => {
    expect(parseExpense({ ...valid, expense_date: "" })).toEqual({
      success: false,
      error: "Date is required.",
    });
  });

  it("rejects an invalid date", () => {
    expect(parseExpense({ ...valid, expense_date: "not-a-date" })).toEqual({
      success: false,
      error: "Enter a valid date.",
    });
  });

  it("treats an empty category as uncategorized (null)", () => {
    const result = parseExpense({ ...valid, category_id: "" });
    expect(result).toMatchObject({
      success: true,
      data: { category_id: null },
    });
  });

  it("treats an empty description as null and trims a present one", () => {
    expect(parseExpense({ ...valid, description: "   " })).toMatchObject({
      success: true,
      data: { description: null },
    });
    expect(parseExpense({ ...valid, description: "  lunch " })).toMatchObject({
      success: true,
      data: { description: "lunch" },
    });
  });
});
