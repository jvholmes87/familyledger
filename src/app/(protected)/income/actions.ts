"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { parseIncomeSeries, type IncomeSeriesInput } from "./validation";

export type IncomeState = { error: string } | undefined;

function readIncomeSeries(formData: FormData): IncomeSeriesInput {
  return {
    name: String(formData.get("name") ?? ""),
    amount: String(formData.get("amount") ?? ""),
    category_id: String(formData.get("category_id") ?? ""),
    frequency: String(formData.get("frequency") ?? ""),
    interval: String(formData.get("interval") ?? "1"),
    days_of_month: String(formData.get("days_of_month") ?? ""),
    start_date: String(formData.get("start_date") ?? ""),
    end_date: String(formData.get("end_date") ?? ""),
  };
}

export async function createIncomeSeries(
  _prevState: IncomeState,
  formData: FormData,
): Promise<IncomeState> {
  const parsed = parseIncomeSeries(readIncomeSeries(formData));
  if (!parsed.success) return { error: parsed.error };

  const supabase = await createClient();
  const { error } = await supabase.from("income_series").insert(parsed.data);
  if (error) return { error: error.message };

  revalidatePath("/income");
  return undefined;
}

export async function updateIncomeSeries(
  _prevState: IncomeState,
  formData: FormData,
): Promise<IncomeState> {
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing income id." };

  const parsed = parseIncomeSeries(readIncomeSeries(formData));
  if (!parsed.success) return { error: parsed.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("income_series")
    .update(parsed.data)
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/income");
  redirect("/income");
}

export async function deleteIncomeSeries(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("income_series").delete().eq("id", id);
  revalidatePath("/income");
}
