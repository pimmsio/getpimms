import { INTERVAL_DATA } from "@/lib/analytics/constants";

/**
 * Normalizes a URL to its base URL by stripping query parameters, hash, and trailing slash.
 * This matches how URLs are stored in the `baseUrl` field in the database.
 *
 * @param url - The URL to normalize
 * @returns The normalized base URL
 */
export function normalizeUrlToBaseUrl(url: string): string {
  return url.split("?")[0].split("#")[0].replace(/\/$/, "");
}

/**
 * Normalizes multiple comma-separated URLs to their base URLs.
 *
 * @param urls - Comma-separated string of URLs
 * @returns Array of normalized base URLs
 */
export function normalizeUrlsToBaseUrls(urls: string): string[] {
  return urls
    .split(",")
    .filter(Boolean)
    .map((u) => normalizeUrlToBaseUrl(u));
}

/**
 * Builds a Prisma filter for a UTM parameter that supports multiple comma-separated values.
 * Uses OR logic for multiple values, exact match for single value.
 *
 * @param utmValue - The UTM parameter value (can be comma-separated)
 * @returns Prisma filter object
 */
export function buildUtmFilter(utmValue: string): string | { in: string[] } {
  return utmValue.includes(",")
    ? { in: utmValue.split(",").filter(Boolean) }
    : utmValue;
}

/**
 * Builds a Prisma filter for URL filtering using normalized baseUrl.
 * Supports multiple comma-separated URLs with OR logic.
 *
 * @param url - The URL filter value (can be comma-separated)
 * @returns Prisma filter object for baseUrl field
 */
export function buildUrlFilter(url: string): string | { in: string[] } {
  return url.includes(",")
    ? { in: normalizeUrlsToBaseUrls(url) }
    : normalizeUrlToBaseUrl(url);
}

/**
 * Calculates date range from interval or explicit start/end dates.
 * Only returns a range if both start and end are provided, or if an interval is provided.
 *
 * @param interval - Optional interval key (e.g., "7d", "30d")
 * @param start - Optional explicit start date
 * @param end - Optional explicit end date
 * @returns Object with startDate and endDate, or undefined if neither is provided
 */
export function calculateDateRange(
  interval?: string,
  start?: Date,
  end?: Date,
): { startDate: Date; endDate: Date } | undefined {
  if (interval && INTERVAL_DATA[interval]) {
    return {
      startDate: INTERVAL_DATA[interval].startDate,
      endDate: new Date(),
    };
  } else if (start || end) {
    // Only return if at least one date is provided (original behavior)
    // The caller checks for both startDate and endDate before using
    return {
      startDate: start!,
      endDate: end!,
    };
  }
  return undefined;
}

