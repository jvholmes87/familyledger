"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createExpense, updateExpense, type ExpenseState } from "./actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

export type Category = { id: string; name: string };

export type ExpenseFormValue = {
  id: string;
  amount: number;
  expense_date: string;
  description: string | null;
  category_id: string | null;
};

export function ExpenseForm({
  categories,
  expense,
}: {
  categories: Category[];
  expense?: ExpenseFormValue;
}) {
  const isEdit = Boolean(expense);
  const [state, formAction, pending] = useActionState<ExpenseState, FormData>(
    isEdit ? updateExpense : createExpense,
    undefined,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {expense ? <input type="hidden" name="id" value={expense.id} /> : null}

      <fieldset>
        <legend className="sr-only">Expense details</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              min="0"
              inputMode="decimal"
              placeholder="0.00"
              defaultValue={expense ? String(expense.amount) : ""}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="expense_date">Date</Label>
            <Input
              id="expense_date"
              name="expense_date"
              type="date"
              defaultValue={expense?.expense_date ?? ""}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="category_id">Category</Label>
            <Select
              id="category_id"
              name="category_id"
              defaultValue={expense?.category_id ?? ""}
            >
              <option value="">Uncategorized</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              name="description"
              placeholder="e.g. Lunch with the team"
              defaultValue={expense?.description ?? ""}
            />
          </div>
        </div>
      </fieldset>

      {state?.error ? (
        <p
          role="alert"
          className="border-negative/20 bg-negative/6 text-negative rounded-lg border px-3.5 py-3 text-sm"
        >
          {state.error}
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending} className="min-h-11">
          {isEdit ? "Save changes" : "Add expense"}
        </Button>
        {isEdit ? (
          <Link
            href="/expenses"
            className={buttonVariants({
              variant: "ghost",
              size: "sm",
              className: "min-h-11",
            })}
          >
            Cancel
          </Link>
        ) : null}
      </div>
    </form>
  );
}
