"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { parseExpense, type ExpenseInput } from "./validation";

export type ExpenseState = { error: string } | undefined;

function readExpense(formData: FormData): ExpenseInput {
  return {
    amount: String(formData.get("amount") ?? ""),
    expense_date: String(formData.get("expense_date") ?? ""),
    description: String(formData.get("description") ?? ""),
    category_id: String(formData.get("category_id") ?? ""),
  };
}

export async function createExpense(
  _prevState: ExpenseState,
  formData: FormData,
): Promise<ExpenseState> {
  const parsed = parseExpense(readExpense(formData));
  if (!parsed.success) return { error: parsed.error };

  const supabase = await createClient();
  const { error } = await supabase.from("expenses").insert(parsed.data);
  if (error) return { error: error.message };

  revalidatePath("/expenses");
  return undefined;
}

export async function updateExpense(
  _prevState: ExpenseState,
  formData: FormData,
): Promise<ExpenseState> {
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing expense id." };

  const parsed = parseExpense(readExpense(formData));
  if (!parsed.success) return { error: parsed.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("expenses")
    .update(parsed.data)
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/expenses");
  redirect("/expenses");
}

export async function deleteExpense(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("expenses").delete().eq("id", id);
  revalidatePath("/expenses");
}
