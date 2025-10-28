/**
 * Specialized hooks for accessing AnalyticsContext
 * Better tree-shaking and more explicit dependencies than raw useContext
 */

import { useContext } from "react";
import { AnalyticsContext } from "../analytics-provider";
import type { EventType } from "@/lib/analytics/types";

/**
 * Hook to access analytics API paths and query string
 * Use this when you only need to make API calls
 */
export function useAnalyticsApi() {
  const { baseApiPath, eventsApiPath, queryString } =
    useContext(AnalyticsContext);
  return { baseApiPath, eventsApiPath, queryString };
}

/**
 * Hook to access analytics state (selected tab, interval, dates)
 * Use this for displaying/filtering based on current analytics view
 */
export function useAnalyticsState() {
  const { selectedTab, interval, start, end, view, saleUnit } =
    useContext(AnalyticsContext);
  return { selectedTab, interval, start, end, view, saleUnit };
}

/**
 * Hook to access workspace and permission information
 * Use this for access control and upgrade prompts
 */
export function useAnalyticsWorkspace() {
  const { workspace, adminPage, partnerPage, requiresUpgrade } =
    useContext(AnalyticsContext);
  return { workspace, adminPage, partnerPage, requiresUpgrade };
}

/**
 * Hook to access filter context (domain, key, url, tags)
 * Use this when you need to know what's currently being filtered
 */
export function useAnalyticsFilters() {
  const { domain, key, url, tagIds } = useContext(AnalyticsContext);
  return { domain, key, url, tagIds };
}

/**
 * Hook to access dashboard props
 * Use this in dashboard-specific components
 */
export function useAnalyticsDashboard() {
  const { dashboardProps, basePath, showConversions } =
    useContext(AnalyticsContext);
  return { dashboardProps, basePath, showConversions };
}

/**
 * Hook to get the full analytics context
 * Use sparingly - prefer the specialized hooks above
 */
export function useAnalyticsContext() {
  return useContext(AnalyticsContext);
}

