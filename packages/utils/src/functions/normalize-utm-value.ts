export interface UtmConventionOptions {
  /** Character to replace spaces with. Defaults to "-". */
  spaceChar?: string;
  /** Comma-separated prohibited characters to strip. */
  prohibitedChars?: string;
  /** Force value to lowercase. Defaults to true. */
  forceLowercase?: boolean;
}

/**
 * Normalize UTM parameter values using workspace convention rules.
 * When no options are provided, falls back to sensible defaults
 * (lowercase, hyphens for spaces, alphanumeric only).
 */
export function normalizeUtmValue(
  value: string | null | undefined,
  options?: UtmConventionOptions,
): string {
  if (!value) return "";

  const spaceChar = options?.spaceChar ?? "-";
  const forceLowercase = options?.forceLowercase ?? true;
  const prohibitedChars = options?.prohibitedChars ?? "";

  let result = value.trim();

  if (forceLowercase) {
    result = result.toLowerCase();
  }

  // Replace whitespace with the configured space character
  result = result.replace(/\s+/g, spaceChar);

  // Strip prohibited characters (comma-separated list from settings)
  if (prohibitedChars) {
    const chars = prohibitedChars
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);
    for (const ch of chars) {
      result = result.split(ch).join("");
    }
  }

  // Collapse repeated space-char sequences and trim edges
  if (spaceChar) {
    const escaped = spaceChar.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    result = result.replace(new RegExp(`${escaped}+`, "g"), spaceChar);
    result = result.replace(
      new RegExp(`^${escaped}+|${escaped}+$`, "g"),
      "",
    );
  }

  return result;
}

