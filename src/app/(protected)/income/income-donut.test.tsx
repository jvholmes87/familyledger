import { describe, it, expect } from "vitest";
import { render, screen, within, fireEvent } from "@testing-library/react";
import { IncomeDonut } from "./income-donut";

const slices = [
  { name: "VA Disability", total: 3000 },
  { name: "Wages", total: 1000 },
];

describe("IncomeDonut", () => {
  it("renders each source with its share and amount", () => {
    render(<IncomeDonut slices={slices} />);
    const wages = screen.getByRole("listitem", { name: /wages/i });
    expect(within(wages).getByText("$1,000.00")).toBeInTheDocument();
    expect(within(wages).getByText("25%")).toBeInTheDocument();

    const va = screen.getByRole("listitem", { name: /va disability/i });
    expect(within(va).getByText("75%")).toBeInTheDocument();
  });

  it("shows an empty state when there is no income", () => {
    render(<IncomeDonut slices={[]} />);
    expect(screen.getByText(/no income/i)).toBeInTheDocument();
  });

  it("shows the total in the center by default and the slice value on hover", () => {
    render(<IncomeDonut slices={slices} />);
    const center = screen.getByTestId("donut-center");
    // Default: total of both slices.
    expect(center).toHaveTextContent("$4,000.00");

    // Hovering a legend row surfaces that slice's value.
    fireEvent.mouseEnter(screen.getByRole("listitem", { name: /wages/i }));
    expect(center).toHaveTextContent("$1,000.00");

    fireEvent.mouseLeave(screen.getByRole("listitem", { name: /wages/i }));
    expect(center).toHaveTextContent("$4,000.00");
  });
});
