"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { parseCategoryName } from "./validation";

export type CategoryState = { error: string } | undefined;

/** Fetch the signed-in user's category names, used for duplicate detection. */
async function existingNames(
  supabase: Awaited<ReturnType<typeof createClient>>,
  excludeId?: string,
): Promise<string[]> {
  let query = supabase.from("categories").select("id, name");
  if (excludeId) query = query.neq("id", excludeId);
  const { data } = await query;
  return (data ?? []).map((c) => c.name);
}

export async function createCategory(
  _prevState: CategoryState,
  formData: FormData,
): Promise<CategoryState> {
  const supabase = await createClient();
  const parsed = parseCategoryName(
    String(formData.get("name") ?? ""),
    await existingNames(supabase),
  );
  if (!parsed.success) return { error: parsed.error };

  const { error } = await supabase
    .from("categories")
    .insert({ name: parsed.data.name });
  if (error) return { error: error.message };

  revalidatePath("/categories");
  return undefined;
}

export async function renameCategory(
  _prevState: CategoryState,
  formData: FormData,
): Promise<CategoryState> {
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing category id." };

  const supabase = await createClient();
  const parsed = parseCategoryName(
    String(formData.get("name") ?? ""),
    await existingNames(supabase, id),
  );
  if (!parsed.success) return { error: parsed.error };

  const { error } = await supabase
    .from("categories")
    .update({ name: parsed.data.name })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/categories");
  return undefined;
}

export async function deleteCategory(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  // Expenses in this category fall back to Uncategorized via ON DELETE SET NULL.
  await supabase.from("categories").delete().eq("id", id);
  revalidatePath("/categories");
}

// Income categories -------------------------------------------------------
// Managed on the same page as expense categories, so they live here too.

/** Fetch the signed-in user's income category names, for duplicate detection. */
async function existingIncomeNames(
  supabase: Awaited<ReturnType<typeof createClient>>,
  excludeId?: string,
): Promise<string[]> {
  let query = supabase.from("income_categories").select("id, name");
  if (excludeId) query = query.neq("id", excludeId);
  const { data } = await query;
  return (data ?? []).map((c) => c.name);
}

/** Revalidate every surface that renders income categories. */
function revalidateIncomeCategories() {
  revalidatePath("/categories");
  revalidatePath("/income");
}

export async function createIncomeCategory(
  _prevState: CategoryState,
  formData: FormData,
): Promise<CategoryState> {
  const supabase = await createClient();
  const parsed = parseCategoryName(
    String(formData.get("name") ?? ""),
    await existingIncomeNames(supabase),
  );
  if (!parsed.success) return { error: parsed.error };

  const { error } = await supabase
    .from("income_categories")
    .insert({ name: parsed.data.name });
  if (error) return { error: error.message };

  revalidateIncomeCategories();
  return undefined;
}

export async function renameIncomeCategory(
  _prevState: CategoryState,
  formData: FormData,
): Promise<CategoryState> {
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing category id." };

  const supabase = await createClient();
  const parsed = parseCategoryName(
    String(formData.get("name") ?? ""),
    await existingIncomeNames(supabase, id),
  );
  if (!parsed.success) return { error: parsed.error };

  const { error } = await supabase
    .from("income_categories")
    .update({ name: parsed.data.name })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidateIncomeCategories();
  return undefined;
}

export async function deleteIncomeCategory(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  // Income series in this category fall back to Uncategorized via ON DELETE SET NULL.
  await supabase.from("income_categories").delete().eq("id", id);
  revalidateIncomeCategories();
}
