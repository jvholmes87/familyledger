import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("./actions", () => ({
  createIncomeSeries: vi.fn(),
  updateIncomeSeries: vi.fn(),
}));

import { IncomeForm } from "./income-form";

const categories = [
  { id: "c1", name: "VA Disability" },
  { id: "c2", name: "Wages" },
];

describe("IncomeForm", () => {
  it("renders the core fields in create mode", () => {
    render(<IncomeForm categories={categories} today="2026-07-01" />);
    const details = screen.getByRole("group", { name: /income details/i });
    expect(within(details).getByLabelText(/name/i)).toBeInTheDocument();
    expect(within(details).getByLabelText(/amount/i)).toBeInTheDocument();
    expect(within(details).getByLabelText(/category/i)).toBeInTheDocument();
    expect(within(details).getByLabelText(/frequency/i)).toBeInTheDocument();
    expect(within(details).getByLabelText(/start date/i)).toBeInTheDocument();
    expect(within(details).getByLabelText(/end date/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /add income/i }),
    ).toBeInTheDocument();
  });

  it("lists all eleven frequency presets", () => {
    render(<IncomeForm categories={categories} today="2026-07-01" />);
    for (const label of [
      "One-time payment",
      "Every week",
      "Every month",
      "Every year",
      "Twice a month",
      "Every quarter",
      "Every X days",
      "Every X weeks",
      "Every X months",
      "Every X years",
      "Multiple fixed dates",
    ]) {
      expect(screen.getByRole("option", { name: label })).toBeInTheDocument();
    }
  });

  it("reveals the interval input for an every-X preset", async () => {
    const user = userEvent.setup();
    render(<IncomeForm categories={categories} today="2026-07-01" />);
    expect(screen.queryByLabelText(/every how many/i)).not.toBeInTheDocument();
    await user.selectOptions(
      screen.getByLabelText(/frequency/i),
      "every_x_weeks",
    );
    expect(screen.getByLabelText(/every how many/i)).toBeInTheDocument();
  });

  it("reveals a day picker including 'Last' for twice a month", async () => {
    const user = userEvent.setup();
    render(<IncomeForm categories={categories} today="2026-07-01" />);
    await user.selectOptions(
      screen.getByLabelText(/frequency/i),
      "twice_a_month",
    );
    expect(
      screen.getByRole("button", { name: "Last", pressed: false }),
    ).toBeInTheDocument();
  });

  it("prefills and previews an existing twice-a-month series", () => {
    render(
      <IncomeForm
        categories={categories}
        today="2026-07-01"
        series={{
          id: "s1",
          name: "Paycheck",
          amount: 6672.65,
          category_id: "c2",
          frequency: "days_of_month",
          interval_count: 1,
          days_of_month: [15, 0],
          start_date: "2026-07-15",
          end_date: null,
        }}
      />,
    );
    expect(screen.getByLabelText(/name/i)).toHaveValue("Paycheck");
    expect(screen.getByLabelText(/amount/i)).toHaveValue(6672.65);
    expect(screen.getByLabelText(/frequency/i)).toHaveValue("twice_a_month");
    expect(
      screen.getByRole("button", { name: /save changes/i }),
    ).toBeInTheDocument();

    // Live preview mirrors the Simplifi screenshot.
    const preview = screen.getByRole("region", { name: /preview/i });
    expect(within(preview).getByText(/15th and last/i)).toBeInTheDocument();
    expect(within(preview).getByText("Jul 15, 2026")).toBeInTheDocument();
    expect(within(preview).getByText("Jul 31, 2026")).toBeInTheDocument();
  });
});
