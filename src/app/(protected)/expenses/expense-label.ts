type ExpenseLabelDetails = {
  description: string | null;
  expenseDate: string;
  amount: number;
  categoryName: string | null;
};

export function expenseActionLabel(
  action: "Edit" | "Delete",
  index: number,
  details: ExpenseLabelDetails,
): string {
  const descriptor =
    details.description?.trim() || details.categoryName || "Uncategorized";
  const amount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(details.amount);

  return `${action} entry ${index + 1}: ${descriptor}, ${details.expenseDate}, ${amount}`;
}
