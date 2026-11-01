import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { IncomeMix } from "./income-mix";

const records = [
  {
    amount: 5000,
    frequency: "every_n_months" as const,
    interval: 1,
    days_of_month: [],
    start_date: "2026-01-01",
    end_date: null,
    category_name: "Salary",
  },
  {
    amount: 1200,
    frequency: "one_time" as const,
    interval: 1,
    days_of_month: [],
    start_date: "2026-03-10",
    end_date: null,
    category_name: "Bonus",
  },
];

describe("IncomeMix", () => {
  it("defaults to this month's mix", () => {
    render(
      <IncomeMix records={records} today="2026-07-15" earliest="2026-01-01" />,
    );
    // July has the monthly salary only; the March one-time bonus is excluded.
    const salary = screen.getByRole("listitem", { name: /salary/i });
    expect(within(salary).getByText("$5,000.00")).toBeInTheDocument();
    expect(within(salary).getByText("100%")).toBeInTheDocument();
    expect(screen.queryByRole("listitem", { name: /bonus/i })).toBeNull();
  });

  it("recomputes the mix when the period changes to all time", async () => {
    const user = userEvent.setup();
    render(
      <IncomeMix records={records} today="2026-07-15" earliest="2026-01-01" />,
    );

    await user.selectOptions(
      screen.getByLabelText(/income mix period/i),
      "all_time",
    );

    // Jan–Jul salary (7 × 5000 = 35,000) plus the March bonus now appear.
    const salary = screen.getByRole("listitem", { name: /salary/i });
    expect(within(salary).getByText("$35,000.00")).toBeInTheDocument();
    const bonus = screen.getByRole("listitem", { name: /bonus/i });
    expect(within(bonus).getByText("$1,200.00")).toBeInTheDocument();
  });

  it("reveals custom date inputs for a custom range", async () => {
    const user = userEvent.setup();
    render(<IncomeMix records={records} today="2026-07-15" />);
    await user.selectOptions(
      screen.getByLabelText(/income mix period/i),
      "custom",
    );
    expect(screen.getByLabelText(/from/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/to/i)).toBeInTheDocument();
  });
});
