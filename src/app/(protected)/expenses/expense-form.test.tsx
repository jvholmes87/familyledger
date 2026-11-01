import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";

vi.mock("./actions", () => ({
  createExpense: vi.fn(),
  updateExpense: vi.fn(),
}));

import { ExpenseForm } from "./expense-form";

const categories = [
  { id: "c1", name: "Groceries" },
  { id: "c2", name: "Rent" },
];

describe("ExpenseForm", () => {
  it("renders amount, date, category, and description fields", () => {
    render(<ExpenseForm categories={categories} />);

    const details = screen.getByRole("group", { name: "Expense details" });

    expect(within(details).getByLabelText(/amount/i)).toBeInTheDocument();
    expect(within(details).getByLabelText(/date/i)).toBeInTheDocument();
    expect(within(details).getByLabelText(/category/i)).toBeInTheDocument();
    expect(within(details).getByLabelText(/description/i)).toBeInTheDocument();
  });

  it("lists each category as an option plus Uncategorized", () => {
    render(<ExpenseForm categories={categories} />);
    expect(
      screen.getByRole("option", { name: /uncategorized/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Groceries" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Rent" })).toBeInTheDocument();
  });

  it("shows an Add button in create mode", () => {
    render(<ExpenseForm categories={categories} />);
    expect(
      screen.getByRole("button", { name: /add expense/i }),
    ).toBeInTheDocument();
  });

  it("prefills values and shows Save in edit mode", () => {
    render(
      <ExpenseForm
        categories={categories}
        expense={{
          id: "e1",
          amount: 12.34,
          expense_date: "2026-07-04",
          description: "lunch",
          category_id: "c1",
        }}
      />,
    );
    expect(screen.getByLabelText(/amount/i)).toHaveValue(12.34);
    expect(screen.getByLabelText(/date/i)).toHaveValue("2026-07-04");
    expect(screen.getByLabelText(/description/i)).toHaveValue("lunch");
    expect(
      screen.getByRole("button", { name: /save changes/i }),
    ).toBeInTheDocument();
  });
});
