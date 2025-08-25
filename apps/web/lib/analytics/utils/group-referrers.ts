/**
 * Utility functions for grouping referrer domains into logical groups
 */

// Define types to allow both string and RegExp domain patterns
type ReferrerGroup = {
  domains: (string | RegExp)[];
  displayName: string;
  icon: string;
};

// Define referrer domain groups
export const REFERRER_GROUPS: Record<string, ReferrerGroup> = {
  LinkedIn: {
    domains: ['linkedin.com', 'com.linkedin.android', 'lnkd.in'],
    displayName: 'LinkedIn',
    icon: 'linkedin'
  },
  Facebook: {
    domains: ['facebook.com', 'fb.com', 'm.facebook.com', 'l.facebook.com', 'lm.facebook.com'],
    displayName: 'Facebook',
    icon: 'facebook'
  },
  Twitter: {
    domains: ['twitter.com', 't.co', 'x.com'],
    displayName: 'X.com',
    icon: 'twitter'
  },
  Instagram: {
    domains: ['instagram.com', 'instagr.am'],
    displayName: 'Instagram',
    icon: 'instagram'
  },
  YouTube: {
    domains: ['youtube.com', 'youtu.be', 'm.youtube.com'],
    displayName: 'YouTube',
    icon: 'youtube'
  },
  Reddit: {
    domains: ['reddit.com', 'old.reddit.com', 'm.reddit.com', 'www.reddit.com'],
    displayName: 'Reddit',
    icon: 'reddit'
  },
  GitHub: {
    domains: ['github.com', 'gist.github.com'],
    displayName: 'GitHub',
    icon: 'github'
  },
  Discord: {
    domains: ['discord.com', 'discord.gg', 'discordapp.com'],
    displayName: 'Discord',
    icon: 'discord'
  },
  Slack: {
    domains: ['slack.com', 'app.slack.com'],
    displayName: 'Slack',
    icon: 'slack'
  },
  WhatsApp: {
    domains: ['whatsapp.com', 'api.whatsapp.com', 'wa.me'],
    displayName: 'WhatsApp',
    icon: 'whatsapp'
  },
  Telegram: {
    domains: ['telegram.org', 'telegram.me', 't.me'],
    displayName: 'Telegram',
    icon: 'telegram'
  },
  TikTok: {
    domains: ['tiktok.com', 'vm.tiktok.com', 'vt.tiktok.com'],
    displayName: 'TikTok',
    icon: 'tiktok'
  },
  Mastodon: {
    domains: ['mastodon.social', 'mastodon.online', 'mstdn.social'],
    displayName: 'Mastodon',
    icon: 'mastodon'
  },
  Gmail: {
    domains: ['mail.google.com', 'com.google.android.gm'],
    displayName: 'Gmail',
    icon: 'gmail'
  },
  Brevo: {
    // should match hosts ending with -brevo.net (e.g., dau94.r.sp1-brevo.net)
    domains: ['brevo.com', /-brevo\.net$/],
    displayName: 'Brevo',
    icon: 'brevo'
  },
};

// Extract a normalized hostname from a referrer (URL or domain-like string)
function extractHostname(referrer: string): string {
  const referrerString = (referrer || '').trim().toLowerCase();
  let hostname = referrerString.replace(/^www\./, '');
  try {
    const url = new URL(referrerString.includes('://') ? referrerString : `https://${referrerString}`);
    hostname = (url.hostname || hostname).replace(/^www\./, '').toLowerCase();
  } catch {
    // Not a URL; keep hostname derived from input
  }
  return hostname;
}

// Helper to test if a referrer (URL or domain) matches a pattern.
// Behavior:
// - If pattern is a RegExp (or a string wrapped with /.../), test against the FULL referrer string
//   and also against the hostname as a fallback.
// - If pattern is a plain string domain, match by exact domain or subdomain suffix against hostname.
function matchesReferrerPattern(referrer: string, pattern: string | RegExp): boolean {
  const referrerString = (referrer || '').trim().toLowerCase();
  const hostname = extractHostname(referrerString);

  // If pattern is a RegExp, test against full referrer first, then hostname
  if (pattern instanceof RegExp) {
    return pattern.test(referrerString) || pattern.test(hostname);
  }

  // Regex support for string patterns wrapped with slashes: "/.../"
  const isRegex = pattern.length >= 2 && pattern.startsWith('/') && pattern.endsWith('/');
  if (isRegex) {
    try {
      const source = pattern.slice(1, -1);
      const re = new RegExp(source);
      return re.test(referrerString) || re.test(hostname);
    } catch {
      // Fallback to non-regex match if invalid regex string
    }
  }

  // Plain string domain matching on hostname
  const cleanPattern = pattern.replace(/^www\./, '').toLowerCase();
  return (
    hostname === cleanPattern ||
    hostname.endsWith('.' + cleanPattern) ||
    hostname.endsWith(cleanPattern)
  );
}

function findGroupNameForReferrer(referrer: string): keyof typeof REFERRER_GROUPS | undefined {
  const ref = (referrer || "").replace(/^www\./, "");
  for (const [groupName, group] of Object.entries(REFERRER_GROUPS)) {
    for (const pattern of group.domains) {
      if (matchesReferrerPattern(ref, pattern)) {
        return groupName as keyof typeof REFERRER_GROUPS;
      }
    }
  }
  return undefined;
}

/**
 * Get the group name for a given referrer domain
 */
export function getReferrerGroup(referrer: string): string {
  // Check if this referrer (URL or domain) belongs to any group
  const groupName = findGroupNameForReferrer(referrer);
  
  if (groupName) {
    return REFERRER_GROUPS[groupName].displayName;
  }
  
  // If no group found, return the original domain
  return referrer;
}

/**
 * Get the display name for a referrer (either grouped or original domain)
 */
export function getReferrerDisplayName(referrer: string): string {
  if (referrer === "(direct)") {
    return "(direct)";
  }
  
  return getReferrerGroup(referrer);
}

/**
 * Group analytics data by referrer groups
 */
export function groupReferrerAnalytics<T extends Record<string, any>>(
  data: T[]
): T[] {
  const groupedData = new Map<string, T>();
  
  data.forEach(item => {
    // Prefer URL fields when available, then fall back to domain fields
    const referrerValue =
      item.referer_url_processed ||
      item.referer_url ||
      item.referer ||
      item.referers ||
      '';
    const groupName = getReferrerDisplayName(referrerValue);
    
    if (groupedData.has(groupName)) {
      // Merge data for the same group
      const existing = groupedData.get(groupName)!;
      groupedData.set(groupName, {
        ...existing,
        referer: groupName,
        referers: groupName, // Support both field names
        // Sum numeric fields
        clicks: (existing.clicks || 0) + (item.clicks || 0),
        leads: (existing.leads || 0) + (item.leads || 0),
        sales: (existing.sales || 0) + (item.sales || 0),
        saleAmount: (existing.saleAmount || 0) + (item.saleAmount || 0),
        count: (existing.count || 0) + (item.count || 0),
      });
    } else {
      // First item for this group
      groupedData.set(groupName, {
        ...item,
        referer: groupName,
        referers: groupName, // Support both field names
      });
    }
  });
  
  return Array.from(groupedData.values());
}

/**
 * Check if a referrer should be grouped
 */
export function shouldGroupReferrer(referrer: string): boolean {
  return findGroupNameForReferrer(referrer) !== undefined;
}

/**
 * Get all domains that belong to a given referrer group
 */
export function getDomainsForReferrerGroup(groupDisplayName: string): string[] {
  const group = Object.values(REFERRER_GROUPS).find(g => g.displayName === groupDisplayName);
  return group
    ? (group.domains.filter((d): d is string => typeof d === "string").slice())
    : [];
}

/**
 * Check if a string is a grouped referrer display name
 */
export function isGroupedReferrer(name: string): boolean {
  return Object.values(REFERRER_GROUPS).some(group => group.displayName === name);
}

/**
 * Get the best domain to use for logo/favicon for a given referrer
 * If it's a grouped referrer, return the primary domain, otherwise return the original
 */
export function getBestDomainForLogo(referrer: string): string {
  // Check if this is a grouped referrer display name
  if (isGroupedReferrer(referrer)) {
    const group = Object.values(REFERRER_GROUPS).find(g => g.displayName === referrer);
    if (group) {
      // Return the first string domain for the logo
      const primary = group.domains.find((d): d is string => typeof d === "string");
      if (primary) return primary;
    }
  }
  
  // If it's not a group or group not found, return the original referrer
  return referrer;
}

/**
 * Get referrer group display name from a list of domains
 * Used to determine what to show in filter UI when we have comma-separated domains
 */
export function getGroupDisplayNameFromDomains(domains: string[]): string | null {
  // Remove www. prefix and sort for comparison
  const cleanDomains = domains.map(d => d.replace(/^www\./, '')).sort();
  
  // Find a group that matches these exact domains
  for (const [, group] of Object.entries(REFERRER_GROUPS)) {
    const groupDomains = group.domains
      .filter((d): d is string => typeof d === 'string')
      .slice()
      .sort();
    
    // Check if the domains match exactly (all domains from the group are present)
    const isExactMatch = cleanDomains.length === groupDomains.length &&
      cleanDomains.every(domain => (groupDomains as string[]).includes(domain));
    
    // Also check if it's a subset that makes sense (contains key domains)
    const containsKeyDomains = cleanDomains.some(domain => (groupDomains as string[]).includes(domain));
    
    if (isExactMatch || (containsKeyDomains && cleanDomains.length <= 3)) {
      return group.displayName;
    }
  }
  
  return null;
}
