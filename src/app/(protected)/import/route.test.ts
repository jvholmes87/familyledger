import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import { createClient } from "@/lib/supabase/server";
import { POST } from "./route";

const validCsv =
  "\uFEFFRecord Type,Record ID,Name / Description,Amount,Date,End Date,Frequency,Interval,Days of Month,Category,Category ID,Created At\r\n" +
  "Expense Category,category-1,Groceries,,,,,,,,,2026-01-01T00:00:00Z\r\n" +
  "Expense,expense-1,Weekly shop,42.50,2026-07-01,,,,,Groceries,category-1,2026-07-01T00:00:00Z\r\n";

function requestFor(content = validCsv, name = "spendwise.csv") {
  const form = new FormData();
  form.set("file", new File([content], name, { type: "text/csv" }));
  return { formData: async () => form } as Request;
}

describe("POST /import", () => {
  beforeEach(() => vi.clearAllMocks());

  it("authenticates, validates the whole CSV, and invokes one atomic import RPC", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: {
        expenses: 1,
        income_sources: 0,
        expense_categories: 1,
        income_categories: 0,
      },
      error: null,
    });
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi
          .fn()
          .mockResolvedValue({ data: { user: { id: "user-1" } } }),
      },
      rpc,
    } as never);

    const response = await POST(requestFor());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      expenses: 1,
      incomeSources: 0,
      expenseCategories: 1,
      incomeCategories: 0,
    });
    expect(rpc).toHaveBeenCalledOnce();
    expect(rpc).toHaveBeenCalledWith("import_spendwise_data", {
      p_import: expect.objectContaining({
        expenses: [expect.objectContaining({ externalId: "expense-1" })],
        expenseCategories: [
          expect.objectContaining({
            externalId: "category-1",
            name: "Groceries",
          }),
        ],
      }),
    });
  });

  it("rejects unauthenticated requests before parsing or writing", async () => {
    const rpc = vi.fn();
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
      rpc,
    } as never);

    const response = await POST(requestFor("not csv"));

    expect(response.status).toBe(401);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("returns a safe validation error without writing any rows", async () => {
    const rpc = vi.fn();
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi
          .fn()
          .mockResolvedValue({ data: { user: { id: "user-1" } } }),
      },
      rpc,
    } as never);

    const response = await POST(requestFor(`${validCsv}"unterminated`));

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({
      error: expect.stringMatching(/malformed/i),
    });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("does not expose database internals when the atomic RPC fails", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "sensitive database detail" },
    });
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi
          .fn()
          .mockResolvedValue({ data: { user: { id: "user-1" } } }),
      },
      rpc,
    } as never);

    const response = await POST(requestFor());

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Unable to import data",
    });
  });
});
