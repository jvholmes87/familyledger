"use client";

import { useActionState } from "react";
import {
  createCategory,
  renameCategory,
  deleteCategory,
  type CategoryState,
} from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type Category = { id: string; name: string };

function CategoryRow({
  category,
  index,
}: {
  category: Category;
  index: number;
}) {
  const [state, formAction, pending] = useActionState<CategoryState, FormData>(
    renameCategory,
    undefined,
  );

  return (
    <li className="border-border group flex gap-3 border-b py-4 last:border-b-0 sm:gap-4">
      <span
        aria-hidden="true"
        className="border-border text-muted-foreground group-hover:border-primary/30 group-hover:text-primary mt-1 grid size-8 shrink-0 place-items-center rounded-full border font-mono text-[0.5625rem] transition-colors"
      >
        {String(index + 1).padStart(2, "0")}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 flex-col gap-2 md:flex-row md:items-start">
          <form
            action={formAction}
            className="grid min-w-0 flex-1 gap-2 sm:grid-cols-[minmax(0,1fr)_auto]"
          >
            <input type="hidden" name="id" value={category.id} />
            <Label htmlFor={`name-${category.id}`} className="sr-only">
              Category name
            </Label>
            <Input
              id={`name-${category.id}`}
              name="name"
              defaultValue={category.name}
              aria-label={`Rename ${category.name}`}
              className="min-w-0"
            />
            <Button
              type="submit"
              variant="outline"
              size="sm"
              disabled={pending}
              className="h-11"
            >
              <span aria-hidden="true">Rename</span>
              <span className="sr-only">Rename {category.name}</span>
            </Button>
          </form>
          <form action={deleteCategory}>
            <input type="hidden" name="id" value={category.id} />
            <Button
              type="submit"
              variant="destructive"
              size="sm"
              className="h-11 w-full md:w-auto"
            >
              <span aria-hidden="true">Delete</span>
              <span className="sr-only">Delete {category.name}</span>
            </Button>
          </form>
        </div>
        {state?.error ? (
          <p
            role="alert"
            className="border-negative/20 bg-negative/6 text-negative mt-2 rounded-lg border px-3.5 py-3 text-sm"
          >
            {state.error}
          </p>
        ) : null}
      </div>
    </li>
  );
}

export function CategoryManager({ categories }: { categories: Category[] }) {
  const [state, formAction, pending] = useActionState<CategoryState, FormData>(
    createCategory,
    undefined,
  );

  return (
    <div className="flex flex-col gap-7">
      <form action={formAction} className="flex flex-col gap-2.5">
        <Label htmlFor="new-category">Category name</Label>
        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
          <Input
            id="new-category"
            name="name"
            placeholder="e.g. Groceries"
            autoComplete="off"
            className="flex-1"
            required
          />
          <Button type="submit" disabled={pending} className="h-11">
            Add category
          </Button>
        </div>
        {state?.error ? (
          <p
            role="alert"
            className="border-negative/20 bg-negative/6 text-negative rounded-lg border px-3.5 py-3 text-sm"
          >
            {state.error}
          </p>
        ) : null}
      </form>

      {categories.length === 0 ? (
        <div className="border-border bg-paper-deep/35 rounded-xl border border-dashed px-5 py-10 text-center">
          <span
            aria-hidden="true"
            className="border-border text-muted-foreground mx-auto grid size-10 place-items-center rounded-full border font-mono text-[0.625rem]"
          >
            00
          </span>
          <p className="mt-4 text-sm font-semibold">No categories yet.</p>
          <p className="text-muted-foreground mt-1 text-xs">
            Create one to organize your spending.
          </p>
        </div>
      ) : (
        <ul className="border-border flex flex-col border-t">
          {categories.map((category, index) => (
            // Key on name too so a renamed row remounts with a fresh
            // uncontrolled input rather than keeping a stale default value.
            <CategoryRow
              key={`${category.id}-${category.name}`}
              category={category}
              index={index}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
