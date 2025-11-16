/**
 * Utilities for handling empty states in analytics components
 */

/**
 * Check if data is empty or loading
 */
export function hasNoData(
  data: any[] | null | undefined,
  isLoading: boolean,
): boolean {
  if (isLoading) return false;
  return !data || data.length === 0;
}

/**
 * Check if any of multiple data sources have data
 */
export function hasAnyData(
  ...dataSources: Array<any[] | null | undefined>
): boolean {
  return dataSources.some((data) => data && data.length > 0);
}

/**
 * Get the reason why data is empty
 */
export function getEmptyStateReason(
  data: any[] | null | undefined,
  resource?: string,
): "loading" | "no_data" | "no_access" | "error" {
  if (data === null) return "loading";
  if (data === undefined) return "error";
  if (!resource) return "no_data";
  return "no_access";
}

/**
 * Check if data is still loading
 */
export function isDataLoading(
  ...dataSources: Array<any | null | undefined>
): boolean {
  return dataSources.some((data) => data === null || data === undefined);
}

