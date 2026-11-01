import { describe, expect, it } from "vitest";
import { expenseActionLabel } from "./expense-label";

describe("expenseActionLabel", () => {
  it("keeps repeated descriptionless expense actions distinguishable", () => {
    const expense = {
      description: null,
      expenseDate: "2026-07-11",
      amount: 12.5,
      categoryName: null,
    };

    const first = expenseActionLabel("Edit", 0, expense);
    const second = expenseActionLabel("Edit", 1, expense);

    expect(first).toBe("Edit entry 1: Uncategorized, 2026-07-11, $12.50");
    expect(second).toBe("Edit entry 2: Uncategorized, 2026-07-11, $12.50");
    expect(first).not.toBe(second);
  });
});
