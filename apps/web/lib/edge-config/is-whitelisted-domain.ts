import { get } from "@vercel/edge-config";

/**
 * Check if a domain is in the whitelist (for allowing redirects on free plan)
 * This includes well-known short link services like wa.me, youtu.be, bit.ly, etc.
 */
export const isWhitelistedDomain = async (
  domain: string,
): Promise<boolean> => {
  if (!domain) {
    return false;
  }

  try {
    const whitelistedDomains = await get<string[]>("whitelistedDomains");
    
    if (!whitelistedDomains || whitelistedDomains.length === 0) {
      return false;
    }

    return whitelistedDomains.includes(domain);
  } catch (e) {
    console.error("Error checking whitelisted domain", e);
    return false;
  }
};

