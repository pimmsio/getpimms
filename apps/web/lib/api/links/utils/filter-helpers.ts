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
 * Always uses the `in` operator format for consistent multi-select behavior.
 *
 * @param utmValue - The UTM parameter value (can be comma-separated)
 * @returns Prisma filter object with `in` operator
 */
export function buildUtmFilter(utmValue: string): { in: string[] } {
  const values = utmValue.includes(",")
    ? utmValue.split(",").filter(Boolean)
    : [utmValue];
  return { in: values };
}

/**
 * Builds a Prisma filter for a UTM parameter that checks both the database field AND the destination URL.
 * This allows filtering by UTM values that exist in URLs even if they're not saved in the database field.
 *
 * @param utmField - The UTM field name (e.g., 'utm_content', 'utm_source')
 * @param utmValue - The UTM parameter value (can be comma-separated)
 * @returns Prisma filter object with OR condition checking both field and URL
 */
export function buildUtmFilterWithUrl(
  utmField: "utm_source" | "utm_medium" | "utm_campaign" | "utm_term" | "utm_content",
  utmValue: string,
): {
  OR: Array<any>;
} {
  const values = utmValue.includes(",")
    ? utmValue.split(",").filter(Boolean)
    : [utmValue];

  // Build the database field check object with the specific field
  const dbFieldCheck: any = {
    [utmField]: { in: values },
  };

  return {
    OR: [
      // Check database field
      dbFieldCheck,
      // Check URL - match URLs containing utm_field=value
      // This will match: ?utm_field=value, &utm_field=value, etc.
      ...values.map((value) => ({
        url: {
          // Use contains to match URLs with the UTM parameter
          // MySQL will use LIKE '%utm_field=value%' internally
          contains: `${utmField}=${value}`,
        },
      })),
    ],
  };
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

