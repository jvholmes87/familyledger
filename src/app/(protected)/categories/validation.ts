export type CategoryParseResult =
  | { success: true; data: { name: string } }
  | { success: false; error: string };

const MAX_NAME_LENGTH = 60;

/**
 * Validate and normalize a category name. Pure and framework-free so it can be
 * unit-tested and reused by the create/rename server actions. Duplicate
 * detection is case- and whitespace-insensitive against the caller's existing
 * names.
 */
export function parseCategoryName(
  raw: string,
  existingNames: string[] = [],
): CategoryParseResult {
  const name = raw.trim();

  if (!name) {
    return { success: false, error: "Category name is required." };
  }
  if (name.length > MAX_NAME_LENGTH) {
    return {
      success: false,
      error: `Category name must be ${MAX_NAME_LENGTH} characters or fewer.`,
    };
  }

  const normalized = name.toLowerCase();
  const clash = existingNames.some(
    (n) => n.trim().toLowerCase() === normalized,
  );
  if (clash) {
    return {
      success: false,
      error: "A category with that name already exists.",
    };
  }

  return { success: true, data: { name } };
}
