/**
 * Channel analytics utilities for pie charts and other visualizations
 */

import { getProviderIconUrl, getProviderDomain, findProviderByDisplayName } from "./providers";

export type ChannelAnalyticsConfig = {
  minPercentageForLabel: number;
  maxTopSources: number;
};

export const DEFAULT_CHANNEL_CONFIG: ChannelAnalyticsConfig = {
  minPercentageForLabel: 5, // Only show labels for segments >= 5%
  maxTopSources: 3, // Show max 3 top sources per channel
};

/**
 * Get referrer provider icon URL (generated from domain)
 * @param referrer - The referrer display name
 * @returns The favicon URL to use
 */
export function getReferrerProviderIconUrl(referrer: string): string {
  return getProviderIconUrl(referrer);
}

/**
 * Extract domain from referrer for favicon/icon purposes
 * @param referrer - The referrer display name
 * @returns The domain to use for favicon
 */
export function getReferrerDomainForIcon(referrer: string): string {
  return getProviderDomain(referrer);
}

/**
 * Check if a segment should show labels based on percentage threshold
 * @param value - The segment value
 * @param total - The total of all segments
 * @param minPercentage - Minimum percentage threshold (default: 5%)
 * @returns True if labels should be shown
 */
export function shouldShowSegmentLabel(
  value: number, 
  total: number, 
  minPercentage: number = DEFAULT_CHANNEL_CONFIG.minPercentageForLabel
): boolean {
  if (total === 0) return false;
  return ((value / total) * 100) >= minPercentage;
}

/**
 * Get top referrer groups for a specific channel
 * @param channelType - The channel type to filter by
 * @param groupedReferrerData - The grouped referrer data
 * @param destinationUrlsData - The destination URLs data (for direct traffic)
 * @param maxSources - Maximum number of sources to return
 * @returns Array of top referrer group names
 */
export function getTopReferrerGroupsForChannel(
  channelType: string,
  groupedReferrerData: any[] = [],
  destinationUrlsData: any[] = [],
  maxSources: number = DEFAULT_CHANNEL_CONFIG.maxTopSources
): string[] {
  // For direct traffic, we want to show the top destination domains
  if (channelType === "direct") {
    const topDirectDomains = destinationUrlsData
      .sort((a, b) => (b.clicks || 0) - (a.clicks || 0))
      .slice(0, maxSources)
      .map((item) => {
        const url = item.url || "";
        try {
          const domain = new URL(
            url.startsWith("http") ? url : `https://${url}`,
          ).hostname;
          return domain.replace(/^www\./, "");
        } catch {
          return url.replace(/^https?:\/\/(www\.)?/, "").split("/")[0];
        }
      })
      .filter((domain) => domain && domain.length > 0);

    return topDirectDomains.length > 0 ? topDirectDomains : ["(direct)"];
  }

  // For other channels, filter by channel type
  const { getReferrerChannel } = require("./group-channels");
  
  const referrerGroupsInChannel = groupedReferrerData
    .filter((item) => {
      const referrerGroupName = item.referer || item.referers || "";
      const channelForGroup = getReferrerChannel(referrerGroupName);
      return channelForGroup === channelType;
    })
    .sort((a, b) => (b.clicks || 0) - (a.clicks || 0))
    .slice(0, maxSources)
    .map((item) => item.referer || item.referers || "");

  return referrerGroupsInChannel;
}

/**
 * Calculate percentage for a segment
 * @param value - The segment value
 * @param total - The total of all segments
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted percentage string
 */
export function calculateSegmentPercentage(
  value: number, 
  total: number, 
  decimals: number = 1
): string {
  if (total === 0) return "0%";
  return `${((value / total) * 100).toFixed(decimals)}%`;
}

/**
 * Format segment value for display
 * @param value - The segment value
 * @param total - The total of all segments
 * @param showCount - Whether to show the count
 * @param isSmallScreen - Whether this is a small screen
 * @returns Formatted display string
 */
export function formatSegmentDisplay(
  value: number,
  total: number,
  showCount: boolean = true,
  isSmallScreen: boolean = false
): string {
  const percentage = calculateSegmentPercentage(value, total, isSmallScreen ? 0 : 1);
  
  if (!showCount || isSmallScreen) {
    return percentage;
  }
  
  return `${value.toLocaleString()} (${percentage})`;
}

/**
 * Get responsive configuration based on screen width
 * @param width - Screen width in pixels
 * @returns Configuration object for responsive behavior
 */
export function getResponsiveConfig(width: number) {
  const isVerySmall = width < 400;
  const isSmallScreen = width < 600;
  const isMediumScreen = width < 900;

  return {
    isVerySmall,
    isSmallScreen,
    isMediumScreen,
    fontSize: {
      label: isVerySmall ? 11 : isSmallScreen ? 13 : 14,
      percentage: isVerySmall ? 10 : isSmallScreen ? 11 : 12,
    },
    margins: {
      horizontal: isVerySmall ? 100 : isSmallScreen ? 130 : isMediumScreen ? 150 : 160,
      vertical: isVerySmall ? 80 : isSmallScreen ? 100 : isMediumScreen ? 130 : 160,
    },
    labelDistance: isVerySmall ? 30 : isSmallScreen ? 35 : isMediumScreen ? 45 : 50,
    maxChannelNameLength: isVerySmall ? 10 : isSmallScreen ? 16 : Infinity,
  };
}
