import { test, expect } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * FR5 — Data isolation, proven at the database layer.
 *
 * Two real users are created against the live Supabase project. Each gets its
 * own authenticated client. The test asserts that Row-Level Security prevents
 * one user from reading, updating, or deleting the other's categories and
 * expenses — i.e. isolation is enforced by the database, not just by app-level
 * query filters. It also confirms a user CAN access their own rows.
 *
 * Runs in the E2E stage because that is where the Supabase env/secrets are
 * available (the unit stage has none).
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function freshClient(): SupabaseClient {
  // Isolated storage per client so the two sessions never share cookies.
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function signUpUser(): Promise<{ client: SupabaseClient; id: string }> {
  const client = freshClient();
  const email = `iso+${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
  const { data, error } = await client.auth.signUp({
    email,
    password: "test-password-123",
  });
  expect(error, `signUp failed: ${error?.message}`).toBeNull();
  const id = data.user?.id;
  expect(id, "sign-up did not return a user id").toBeTruthy();
  return { client, id: id! };
}

test("RLS isolates categories and expenses between users", async () => {
  const userA = await signUpUser();
  const userB = await signUpUser();

  // User A owns a category and an expense in it.
  const { data: catA, error: catErr } = await userA.client
    .from("categories")
    .insert({ name: "Groceries" })
    .select()
    .single();
  expect(catErr, `A insert category failed: ${catErr?.message}`).toBeNull();
  expect(catA.user_id).toBe(userA.id);

  const { data: expA, error: expErr } = await userA.client
    .from("expenses")
    .insert({
      amount: 42.5,
      expense_date: "2026-07-01",
      description: "weekly shop",
      category_id: catA.id,
    })
    .select()
    .single();
  expect(expErr, `A insert expense failed: ${expErr?.message}`).toBeNull();
  expect(expA.user_id).toBe(userA.id);

  // User A can read their own rows.
  const ownCats = await userA.client.from("categories").select("*");
  expect(ownCats.data?.map((c) => c.id)).toContain(catA.id);
  const ownExps = await userA.client.from("expenses").select("*");
  expect(ownExps.data?.map((e) => e.id)).toContain(expA.id);

  // User B cannot SEE user A's rows (RLS filters them out entirely).
  const bSeesCats = await userB.client.from("categories").select("*");
  expect(bSeesCats.error).toBeNull();
  expect(bSeesCats.data?.map((c) => c.id)).not.toContain(catA.id);

  const bSeesExps = await userB.client.from("expenses").select("*");
  expect(bSeesExps.error).toBeNull();
  expect(bSeesExps.data?.map((e) => e.id)).not.toContain(expA.id);

  // User B cannot UPDATE user A's row (RLS matches zero rows -> no change).
  await userB.client
    .from("expenses")
    .update({ amount: 9999 })
    .eq("id", expA.id);
  const stillA = await userA.client
    .from("expenses")
    .select("amount")
    .eq("id", expA.id)
    .single();
  expect(Number(stillA.data?.amount)).toBe(42.5);

  // User B cannot DELETE user A's row.
  await userB.client.from("expenses").delete().eq("id", expA.id);
  const stillExists = await userA.client
    .from("expenses")
    .select("id")
    .eq("id", expA.id)
    .single();
  expect(stillExists.data?.id).toBe(expA.id);

  // Cleanup A's own rows (best effort; users themselves are left in the test project).
  await userA.client.from("expenses").delete().eq("id", expA.id);
  await userA.client.from("categories").delete().eq("id", catA.id);
});
