import { AnalyticsGroupByOptions } from "../types";

/**
 * Get filters to exclude based on groupBy to avoid conflicting filter + groupBy combinations
 * 
 * When fetching analytics grouped by a dimension, we should exclude filters for that same dimension
 * to avoid returning no/minimal data. The results will be filtered client-side if needed.
 */
export function getFiltersToExclude(groupBy: string): string[] {
  const excludeMap: Record<string, string[]> = {
    'url': ['url'],
    'utm_source': ['utm_source'],
    'utm_medium': ['utm_medium'],
    'utm_campaign': ['utm_campaign'],
    'utm_term': ['utm_term'],
    'utm_content': ['utm_content'],
    'referers': ['referer', 'refererUrl', 'channel'],
    'referer_urls': ['referer', 'refererUrl', 'channel'],
    'channels': ['referer', 'refererUrl', 'channel'],
    'countries': ['country', 'continent', 'region', 'city'],
    'cities': ['city'],
    'regions': ['region'],
    'continents': ['continent'],
    'devices': ['device'],
    'browsers': ['browser'],
    'os': ['os'],
    'triggers': ['trigger', 'qr'],
    // 'top_urls': ['url'], // Don't exclude - let URL filter work normally
    'utm_sources': ['utm_source'],
    'utm_mediums': ['utm_medium'],
    'utm_campaigns': ['utm_campaign'],
    'utm_terms': ['utm_term'],
    'utm_contents': ['utm_content'],
  };
  
  return excludeMap[groupBy] || [];
}

/**
 * Remove specified filters from query string
 */
export function removeFiltersFromQueryString(
  queryString: string,
  filtersToRemove: string[]
): string {
  const params = new URLSearchParams(queryString);
  filtersToRemove.forEach(filter => params.delete(filter));
  return params.toString();
}

