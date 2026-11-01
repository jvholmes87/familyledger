import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DataSection } from "./data-section";

describe("DataSection", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("offers authenticated CSV export with explanatory copy", () => {
    render(<DataSection />);

    expect(screen.getByRole("heading", { name: "Data" })).toBeInTheDocument();
    expect(
      screen.getByText(/download a copy of your SpendWise data/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Export CSV" })).toHaveAttribute(
      "href",
      "/export",
    );
  });

  it("imports one SpendWise CSV additively and reports all success counts", async () => {
    const user = userEvent.setup();
    let finishRequest: ((response: Response) => void) | undefined;
    const fetch = vi.fn(
      () =>
        new Promise<Response>((resolve) => {
          finishRequest = resolve;
        }),
    );
    vi.stubGlobal("fetch", fetch);
    render(<DataSection />);

    expect(
      screen.getByText(/adds records.*does not replace/i),
    ).toBeInTheDocument();
    const file = new File(["csv"], "spendwise.csv", { type: "text/csv" });
    await user.upload(screen.getByLabelText("SpendWise CSV file"), file);
    await user.click(screen.getByRole("button", { name: "Import CSV" }));

    expect(screen.getByRole("button", { name: "Importing…" })).toBeDisabled();
    const [, options] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    const body = options.body;
    expect(fetch).toHaveBeenCalledWith("/import", {
      method: "POST",
      body: expect.any(FormData),
    });
    expect(body).toBeInstanceOf(FormData);
    expect((body as FormData).get("file")).toBe(file);

    finishRequest?.(
      Response.json({
        expenses: 1,
        incomeSources: 2,
        expenseCategories: 3,
        incomeCategories: 4,
      }),
    );

    expect(
      await screen.findByText(
        "Imported 1 expense, 2 income sources, 3 expense categories, and 4 income categories.",
      ),
    ).toBeInTheDocument();
  });

  it("shows a safe server validation error", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          Response.json(
            { error: "CSV header does not match the SpendWise export schema" },
            { status: 422 },
          ),
        ),
    );
    render(<DataSection />);

    await user.upload(
      screen.getByLabelText("SpendWise CSV file"),
      new File(["bad"], "bad.csv", { type: "text/csv" }),
    );
    await user.click(screen.getByRole("button", { name: "Import CSV" }));

    expect(
      await screen.findByRole("alert", { name: "Import failed" }),
    ).toHaveTextContent("CSV header does not match");
  });
});
