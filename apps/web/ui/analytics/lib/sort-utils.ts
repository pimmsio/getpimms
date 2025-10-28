/**
 * Shared sorting utilities for analytics data
 */

export type SelectedTab = "clicks" | "leads" | "sales";

export interface AnalyticsMetric {
  clicks?: number;
  leads?: number;
  sales?: number;
  saleAmount?: number;
}

/**
 * Get the numeric value for a given metric from an analytics data item
 */
export function getMetricValue(
  item: AnalyticsMetric,
  selectedTab: SelectedTab,
): number {
  if (selectedTab === "sales") {
    return item.saleAmount || 0;
  } else if (selectedTab === "leads") {
    return item.leads || 0;
  }
  return item.clicks || 0;
}

/**
 * Sort analytics data by the selected metric in descending order
 * Used in devices.tsx and locations.tsx
 */
export function sortByMetric<T extends AnalyticsMetric>(
  data: T[],
  selectedTab: SelectedTab,
): T[] {
  return [...data].sort((a, b) => {
    const aValue = getMetricValue(a, selectedTab);
    const bValue = getMetricValue(b, selectedTab);
    return bValue - aValue;
  });
}

/**
 * Generic sorting function for analytics data
 */
export function sortAnalyticsData<T extends Record<string, any>>(
  data: T[],
  sortBy: keyof T,
  sortOrder: "asc" | "desc" = "desc",
): T[] {
  return [...data].sort((a, b) => {
    const aValue = a[sortBy];
    const bValue = b[sortBy];

    if (typeof aValue === "number" && typeof bValue === "number") {
      return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
    }

    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortOrder === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    return 0;
  });
}

