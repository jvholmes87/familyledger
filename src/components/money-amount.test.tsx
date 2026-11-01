import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MoneyAmount } from "./money-amount";

describe("MoneyAmount", () => {
  it("formats a positive value as USD currency", () => {
    render(<MoneyAmount value={1240.18} />);
    expect(screen.getByText("$1,240.18")).toBeInTheDocument();
  });

  it("formats a negative value with a minus sign", () => {
    render(<MoneyAmount value={-50} />);
    expect(screen.getByText("-$50.00")).toBeInTheDocument();
  });

  it("always uses tabular numerals so columns align", () => {
    render(<MoneyAmount value={42} />);
    expect(screen.getByText("$42.00")).toHaveClass("tabular-nums");
  });

  it("shows a leading + and positive color when showSign and value is positive", () => {
    render(<MoneyAmount value={50} showSign />);
    const el = screen.getByText("+$50.00");
    expect(el).toHaveClass("text-positive");
  });

  it("shows negative color when showSign and value is negative", () => {
    render(<MoneyAmount value={-50} showSign />);
    const el = screen.getByText("-$50.00");
    expect(el).toHaveClass("text-negative");
  });

  it("does not apply a sign color when showSign is not set", () => {
    render(<MoneyAmount value={-50} />);
    const el = screen.getByText("-$50.00");
    expect(el).not.toHaveClass("text-negative");
    expect(el).not.toHaveClass("text-positive");
  });
});
