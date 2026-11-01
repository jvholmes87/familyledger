export type ExpenseInput = {
  amount: string;
  expense_date: string;
  description: string;
  category_id: string;
};

export type ExpenseData = {
  amount: number;
  expense_date: string;
  description: string | null;
  category_id: string | null;
};

export type ExpenseParseResult =
  | { success: true; data: ExpenseData }
  | { success: false; error: string };

/**
 * Validate and normalize raw expense form values. Pure and framework-free so
 * it can be unit-tested and reused by the create/update server actions.
 */
export function parseExpense(input: ExpenseInput): ExpenseParseResult {
  const amountRaw = input.amount.trim();
  if (!amountRaw) {
    return { success: false, error: "Amount is required." };
  }
  const amount = Number(amountRaw);
  if (!Number.isFinite(amount)) {
    return { success: false, error: "Enter a valid amount." };
  }
  if (amount < 0) {
    return { success: false, error: "Amount must be zero or greater." };
  }

  const dateRaw = input.expense_date.trim();
  if (!dateRaw) {
    return { success: false, error: "Date is required." };
  }
  // Expect an ISO calendar date (yyyy-mm-dd) that is a real day.
  const isIsoDate = /^\d{4}-\d{2}-\d{2}$/.test(dateRaw);
  const parsed = new Date(dateRaw);
  if (!isIsoDate || Number.isNaN(parsed.getTime())) {
    return { success: false, error: "Enter a valid date." };
  }

  const description = input.description.trim();

  return {
    success: true,
    data: {
      amount,
      expense_date: dateRaw,
      description: description ? description : null,
      category_id: input.category_id ? input.category_id : null,
    },
  };
}
