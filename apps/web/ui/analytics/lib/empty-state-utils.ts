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
 * Determine if demo data should be shown
 * Demo data is shown when:
 * - No real data exists
 * - User doesn't have required plan/resource
 */
export function shouldShowDemo(
  data: any[] | null | undefined,
  resource?: string,
  workspace?: { plan?: string },
): boolean {
  // If we have real data, never show demo
  if (data && data.length > 0) return false;

  // If resource is restricted and user doesn't have it, show demo
  if (resource && workspace && !hasResource(resource, workspace)) {
    return true;
  }

  return false;
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
 * Check if workspace has access to a specific resource
 */
function hasResource(resource: string, workspace: { plan?: string }): boolean {
  // This is a placeholder - actual logic would depend on your plan structure
  const planHierarchy: Record<string, string[]> = {
    free: ["basic"],
    pro: ["basic", "advanced"],
    enterprise: ["basic", "advanced", "premium"],
  };

  const plan = workspace.plan || "free";
  return planHierarchy[plan]?.includes(resource) || false;
}

/**
 * Check if data is still loading
 */
export function isDataLoading(
  ...dataSources: Array<any | null | undefined>
): boolean {
  return dataSources.some((data) => data === null || data === undefined);
}

