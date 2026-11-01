import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BalancePanel } from "./balance-panel";

const income = [
  {
    amount: 5000,
    frequency: "every_n_months" as const,
    interval: 1,
    days_of_month: [],
    start_date: "2026-01-01",
    end_date: null,
    category_name: "Wages",
  },
];

const expenses = [
  { amount: 1000, expense_date: "2026-07-05" },
  { amount: 2000, expense_date: "2026-07-20" },
  { amount: 500, expense_date: "2026-01-10" },
];

function renderPanel() {
  render(
    <BalancePanel
      today="2026-07-15"
      earliest="2026-01-01"
      income={income}
      expenses={expenses}
    />,
  );
}

describe("BalancePanel", () => {
  it("shows this month's income, expenses, and a surplus (over) by default", () => {
    renderPanel();
    const region = screen.getByRole("region", {
      name: /income vs\.? expenses/i,
    });
    expect(within(region).getByText("$5,000.00")).toBeInTheDocument(); // income
    expect(within(region).getByText("$3,000.00")).toBeInTheDocument(); // expenses
    expect(within(region).getByText("+$2,000.00")).toBeInTheDocument(); // net
    expect(
      within(region).getByText("Over", { exact: false }),
    ).toBeInTheDocument();
  });

  it("recomputes when the period changes to all time", async () => {
    const user = userEvent.setup();
    renderPanel();
    await user.selectOptions(screen.getByLabelText(/period/i), "all_time");
    const region = screen.getByRole("region", {
      name: /income vs\.? expenses/i,
    });
    // Jan–Jul = 7 monthly paychecks.
    expect(within(region).getByText("$35,000.00")).toBeInTheDocument();
  });

  it("reveals custom date inputs when the custom range is chosen", async () => {
    const user = userEvent.setup();
    renderPanel();
    await user.selectOptions(screen.getByLabelText(/period/i), "custom");
    expect(screen.getByLabelText(/from/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/to/i)).toBeInTheDocument();
  });

  it("flags a shortfall (under) when expenses exceed income", () => {
    render(
      <BalancePanel
        today="2026-07-15"
        income={[]}
        expenses={[{ amount: 900, expense_date: "2026-07-05" }]}
      />,
    );
    const region = screen.getByRole("region", {
      name: /income vs\.? expenses/i,
    });
    expect(
      within(region).getByText("Under", { exact: false }),
    ).toBeInTheDocument();
    expect(within(region).getByText("-$900.00")).toBeInTheDocument();
  });
});
