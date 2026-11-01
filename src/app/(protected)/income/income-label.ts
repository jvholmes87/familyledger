type IncomeLabelDetails = {
  name: string;
  amount: number;
  frequencyLabel: string;
};

export function incomeActionLabel(
  action: "Edit" | "Delete",
  index: number,
  details: IncomeLabelDetails,
): string {
  const amount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(details.amount);

  return `${action} income ${index + 1}: ${details.name}, ${amount}, ${details.frequencyLabel}`;
}
