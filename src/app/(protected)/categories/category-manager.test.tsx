import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// Stub the server actions so the server-only module isn't pulled into jsdom.
vi.mock("./actions", () => ({
  createCategory: vi.fn(),
  renameCategory: vi.fn(),
  deleteCategory: vi.fn(),
}));

import { CategoryManager } from "./category-manager";

describe("CategoryManager", () => {
  it("shows an empty state when there are no categories", () => {
    render(<CategoryManager categories={[]} />);
    expect(screen.getByText(/no categories yet/i)).toBeInTheDocument();
  });

  it("renders a create form with a labeled input and add button", () => {
    render(<CategoryManager categories={[]} />);
    expect(screen.getByLabelText(/category name/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /add category/i }),
    ).toBeInTheDocument();
  });

  it("lists each existing category by name", () => {
    render(
      <CategoryManager
        categories={[
          { id: "1", name: "Groceries" },
          { id: "2", name: "Rent" },
        ]}
      />,
    );
    expect(screen.getByDisplayValue("Groceries")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Rent")).toBeInTheDocument();
  });

  it("names row actions for the category they affect", () => {
    render(<CategoryManager categories={[{ id: "1", name: "Groceries" }]} />);
    expect(
      screen.getByRole("button", { name: "Rename Groceries" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Delete Groceries" }),
    ).toBeInTheDocument();
  });
});
