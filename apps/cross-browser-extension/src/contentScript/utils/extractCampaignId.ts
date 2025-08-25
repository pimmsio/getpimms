import { v5 as uuidv5 } from "uuid";
import type { EmailMarketingDomainConfig } from "../../types";

// Namespace UUID for PIMMS campaign IDs - generated once for consistency
const PIMMS_CAMPAIGN_NAMESPACE = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";

/**
 * Extracts campaign/broadcast ID from the current URL using domain configuration regex
 * @param domainConfig - The domain configuration containing campaignIdRegex
 * @param userEmail - Optional user email to create unique identifier (for domains with simple IDs)
 * @param url - The URL to extract from (defaults to window.location.href)
 * @returns The extracted campaign ID or null if not found
 */
export function extractCampaignId(
  domainConfig: EmailMarketingDomainConfig | undefined,
  userEmail: string,
  url: string = window.location.href,
): string | null {
  if (!domainConfig?.campaignIdRegex) {
    return null;
  }

  try {
    let rawCampaignId: string | null = null;
    
    // Try each regex pattern until we find a match
    for (const pattern of domainConfig.campaignIdRegex) {
      const match = new RegExp(pattern, "i").exec(url);
      if (match?.[1]) {
        rawCampaignId = match[1];
        break;
      }
    }

    if (!rawCampaignId) {
      console.log("[PIMMS] no campaign id found in url", url, "with patterns", domainConfig.campaignIdRegex);
      return null;
    }

    const combinedInput = `${userEmail}:${rawCampaignId}`;
    return uuidv5(combinedInput, PIMMS_CAMPAIGN_NAMESPACE);
  } catch {
    return null;
  }
}
