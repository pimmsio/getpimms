/**
 * Normalize UTM parameter values according to best practices:
 * - Force lowercase
 * - Replace spaces and underscores with hyphens
 * - Remove special characters (keep only alphanumeric and hyphens)
 * - Trim whitespace
 */
export function normalizeUtmValue(value: string | null | undefined): string {
  if (!value) return "";

  return (
    value
      .trim()
      // Convert to lowercase
      .toLowerCase()
      // Replace spaces and underscores with hyphens
      .replace(/[\s_]+/g, "-")
      // Remove special characters (keep only alphanumeric, hyphens, and dots)
      .replace(/[^a-z0-9.-]/g, "")
      // Remove multiple consecutive hyphens
      .replace(/-+/g, "-")
      // Remove leading/trailing hyphens
      .replace(/^-+|-+$/g, "")
  );
}

