"use client";

import { useState, type FormEvent } from "react";
import { Download, Upload } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";

type ImportSummary = {
  expenses: number;
  incomeSources: number;
  expenseCategories: number;
  incomeCategories: number;
};

function countLabel(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function DataSection() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<
    "idle" | "importing" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  async function importCsv(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file || status === "importing") return;

    setStatus("importing");
    setMessage("");
    const form = new FormData();
    form.set("file", file);

    try {
      const response = await fetch("/import", { method: "POST", body: form });
      const result = (await response.json()) as
        | ImportSummary
        | { error?: string };
      if (!response.ok) {
        throw new Error(
          "error" in result && result.error
            ? result.error
            : "Unable to import data. Please try again.",
        );
      }
      const summary = result as ImportSummary;
      setMessage(
        `Imported ${countLabel(summary.expenses, "expense")}, ${countLabel(summary.incomeSources, "income source")}, ${countLabel(summary.expenseCategories, "expense category", "expense categories")}, and ${countLabel(summary.incomeCategories, "income category", "income categories")}.`,
      );
      setStatus("success");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to import data. Please try again.",
      );
      setStatus("error");
    }
  }

  return (
    <section
      aria-labelledby="data-heading"
      className="border-border bg-card shadow-ledger overflow-hidden rounded-2xl border"
    >
      <div className="border-border bg-paper-deep/45 border-b px-5 py-5 sm:px-6">
        <p className="font-data text-primary text-[0.625rem] font-semibold tracking-[0.14em] uppercase">
          Records / 01
        </p>
        <h2
          id="data-heading"
          className="font-heading mt-2 text-2xl leading-none font-semibold tracking-[-0.04em]"
        >
          Data
        </h2>
      </div>
      <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="max-w-xl">
          <h3 className="text-sm font-semibold">Export your records</h3>
          <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
            Download a copy of your SpendWise data as a CSV file for your
            records.
          </p>
        </div>
        <a
          href="/export"
          download
          className={buttonVariants({
            variant: "outline",
            className: "min-h-11 shrink-0",
          })}
        >
          <Download aria-hidden="true" />
          Export CSV
        </a>
      </div>
      <form
        onSubmit={importCsv}
        className="border-border flex flex-col gap-5 border-t p-5 sm:p-6"
      >
        <div className="max-w-2xl">
          <h3 className="text-sm font-semibold">Import SpendWise records</h3>
          <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
            Import a SpendWise CSV export up to 5 MiB. Import adds records to
            your account; it does not replace existing data or support arbitrary
            bank CSV files.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="flex min-w-0 flex-1 flex-col gap-2 text-sm font-medium">
            SpendWise CSV file
            <input
              type="file"
              accept=".csv,text/csv"
              disabled={status === "importing"}
              onChange={(event) => {
                setFile(event.target.files?.[0] ?? null);
                setStatus("idle");
                setMessage("");
              }}
              className="border-border bg-background file:bg-paper-deep file:text-foreground focus-visible:border-ring focus-visible:ring-ring min-h-11 rounded-lg border text-sm file:mr-3 file:min-h-10 file:border-0 file:px-3 file:text-sm file:font-semibold focus-visible:ring-3 focus-visible:outline-none"
            />
          </label>
          <Button
            type="submit"
            className="min-h-11"
            disabled={!file || status === "importing"}
          >
            <Upload aria-hidden="true" />
            {status === "importing" ? "Importing…" : "Import CSV"}
          </Button>
        </div>
        {message ? (
          <p
            role={status === "error" ? "alert" : "status"}
            aria-label={
              status === "error" ? "Import failed" : "Import complete"
            }
            className={
              status === "error"
                ? "text-destructive text-sm"
                : "text-primary text-sm font-medium"
            }
          >
            {message}
          </p>
        ) : null}
      </form>
    </section>
  );
}
