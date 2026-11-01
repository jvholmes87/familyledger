import { describe, expect, it } from "vitest";
import { getPreviewBarWidth } from "./ledger-preview";

describe("getPreviewBarWidth", () => {
  it("normalizes every category against the largest sample amount", () => {
    const amounts = [1420, 684.2, 319.8];
    const max = Math.max(...amounts);

    expect(amounts.map((amount) => getPreviewBarWidth(amount, max))).toEqual([
      100, 48, 23,
    ]);
  });
});
