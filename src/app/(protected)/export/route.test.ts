import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import { createClient } from "@/lib/supabase/server";
import { GET } from "./route";

const tableRows = {
  expenses: [
    {
      id: "expense-1",
      amount: 42.5,
      expense_date: "2026-07-01",
      description: "weekly shop",
      category_id: "expense-category-1",
      created_at: "2026-07-01T12:00:00Z",
      categories: { name: "Groceries" },
    },
  ],
  income_series: [],
  categories: [
    {
      id: "expense-category-1",
      name: "Groceries",
      created_at: "2026-01-01T12:00:00Z",
    },
  ],
  income_categories: [],
};

function authenticatedClient() {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "user-1" } },
      }),
    },
    from: vi.fn((table: keyof typeof tableRows) => {
      const builder = {
        order: vi.fn(() => builder),
        range: vi.fn().mockResolvedValue({
          data: tableRows[table],
          error: null,
        }),
      };
      return { select: vi.fn(() => builder) };
    }),
  };
}

describe("GET /export", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns one downloadable CSV containing all authenticated user data", async () => {
    const supabase = authenticatedClient();
    vi.mocked(createClient).mockResolvedValue(supabase as never);

    const response = await GET();
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe(
      "text/csv; charset=utf-8",
    );
    expect(response.headers.get("content-disposition")).toMatch(
      /^attachment; filename="spendwise-data-\d{4}-\d{2}-\d{2}\.csv"$/,
    );
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(body).toContain("Expense,expense-1,weekly shop,42.5,2026-07-01");
    expect(body).toContain("Expense Category,expense-category-1,Groceries");
    expect(supabase.from).toHaveBeenCalledWith("expenses");
    expect(supabase.from).toHaveBeenCalledWith("income_series");
    expect(supabase.from).toHaveBeenCalledWith("categories");
    expect(supabase.from).toHaveBeenCalledWith("income_categories");
  });

  it("rejects unauthenticated export requests", async () => {
    const from = vi.fn();
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      },
      from,
    } as never);

    const response = await GET();

    expect(response.status).toBe(401);
    expect(from).not.toHaveBeenCalled();
  });
});
