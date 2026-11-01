import { describe, it, expect } from "vitest";
import { isInaccessible } from "@testing-library/dom";
import { render, screen, within } from "@testing-library/react";
import { DashboardView } from "./dashboard-view";
import type { DashboardSummary } from "./summary";

const summary: DashboardSummary = {
  monthTotal: 52,
  previousMonthTotal: 100,
  monthOverMonthDelta: -48,
  byCategory: [
    { name: "Rent", total: 30 },
    { name: "Groceries", total: 15 },
    { name: "Uncategorized", total: 7 },
  ],
  trend: [
    { month: "2026-05", total: 40 },
    { month: "2026-06", total: 100 },
    { month: "2026-07", total: 52 },
  ],
};

const recent = [
  {
    id: "1",
    description: "weekly shop",
    expense_date: "2026-07-02",
    amount: 10,
    category_name: "Groceries",
  },
];

describe("DashboardView", () => {
  it("shows the current month total as currency", () => {
    render(
      <DashboardView summary={summary} categoryCount={3} recent={recent} />,
    );
    const card = screen.getByRole("group", { name: /this month/i });
    expect(within(card).getByText("$52.00")).toBeInTheDocument();
  });

  it("shows the category count", () => {
    render(
      <DashboardView summary={summary} categoryCount={3} recent={recent} />,
    );
    const card = screen.getByRole("group", { name: /categories/i });
    expect(within(card).getByText("3")).toBeInTheDocument();
  });

  it("shows the month-over-month delta with a sign", () => {
    render(
      <DashboardView summary={summary} categoryCount={3} recent={recent} />,
    );
    const card = screen.getByRole("group", { name: /vs\.? last month/i });
    expect(within(card).getByText("-$48.00")).toBeInTheDocument();
  });

  it("breaks spending down by category", () => {
    render(
      <DashboardView summary={summary} categoryCount={3} recent={recent} />,
    );
    const heading = screen.getByRole("heading", { name: "By category" });
    const card = heading.closest('[data-slot="card"]');
    expect(card).not.toBeNull();
    expect(within(card as HTMLElement).getByText("Rent")).toBeInTheDocument();
    expect(within(card as HTMLElement).getByText("$30.00")).toBeInTheDocument();
    expect(
      within(card as HTMLElement).getByText("Groceries"),
    ).toBeInTheDocument();
  });

  it("lists recent activity", () => {
    render(
      <DashboardView summary={summary} categoryCount={3} recent={recent} />,
    );
    expect(screen.getByText("weekly shop")).toBeInTheDocument();
  });

  it.each(["Spending over time", "By category", "Recent activity"])(
    "uses a level-two heading for %s",
    (name) => {
      render(
        <DashboardView summary={summary} categoryCount={3} recent={recent} />,
      );

      expect(
        screen.getByRole("heading", { level: 2, name }),
      ).toBeInTheDocument();
    },
  );

  it("exposes each trend month and total to screen readers", () => {
    render(
      <DashboardView summary={summary} categoryCount={3} recent={recent} />,
    );

    const expectedTrend = [
      { month: "May 2026", total: "$40.00" },
      { month: "June 2026", total: "$100.00" },
      { month: "July 2026", total: "$52.00" },
    ];

    for (const { month, total } of expectedTrend) {
      const accessibleEntry = Array.from(
        document.querySelectorAll<HTMLElement>(
          "tr, li, p, [role='row'], [role='listitem']",
        ),
      ).find(
        (element) =>
          !isInaccessible(element) &&
          element.textContent?.includes(month) &&
          element.textContent.includes(total),
      );

      expect(
        accessibleEntry,
        `Expected an accessible trend entry containing ${month} and ${total}`,
      ).toBeDefined();
    }
  });

  it("renders a labeled y-axis with currency tick values", () => {
    render(
      <DashboardView summary={summary} categoryCount={3} recent={recent} />,
    );
    // max total is 100 -> axis ticks at 100/75/50/25/0.
    expect(screen.getByText("$100", { exact: true })).toBeInTheDocument();
    expect(screen.getByText("$50", { exact: true })).toBeInTheDocument();
  });

  it("exposes each month's total as a hover tooltip on its bar", () => {
    render(
      <DashboardView summary={summary} categoryCount={3} recent={recent} />,
    );
    expect(screen.getByTitle("July 2026: $52.00")).toBeInTheDocument();
    expect(screen.getByTitle("June 2026: $100.00")).toBeInTheDocument();
    expect(screen.getByTitle("May 2026: $40.00")).toBeInTheDocument();
  });

  it("shows empty states when there is no data", () => {
    const empty: DashboardSummary = {
      monthTotal: 0,
      previousMonthTotal: 0,
      monthOverMonthDelta: 0,
      byCategory: [],
      trend: [{ month: "2026-07", total: 0 }],
    };
    render(<DashboardView summary={empty} categoryCount={0} recent={[]} />);
    const card = screen.getByRole("group", { name: /this month/i });
    expect(within(card).getByText("$0.00")).toBeInTheDocument();
    expect(screen.getByText(/no expenses yet/i)).toBeInTheDocument();
  });
});
