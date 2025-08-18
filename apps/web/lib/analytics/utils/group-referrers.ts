/**
 * Utility functions for grouping referrer domains into logical groups
 */

// Define referrer domain groups
export const REFERRER_GROUPS = {
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
    displayName: 'Twitter/X',
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
  }
} as const;

// Create a reverse lookup map for efficient domain-to-group mapping
const domainToGroupMap = new Map<string, keyof typeof REFERRER_GROUPS>();

// Initialize the reverse lookup map
Object.entries(REFERRER_GROUPS).forEach(([groupName, group]) => {
  group.domains.forEach(domain => {
    domainToGroupMap.set(domain, groupName as keyof typeof REFERRER_GROUPS);
  });
});

/**
 * Get the group name for a given referrer domain
 */
export function getReferrerGroup(domain: string): string {
  // Remove www. prefix if present
  const cleanDomain = domain.replace(/^www\./, '');
  
  // Check if this domain belongs to any group
  const groupName = domainToGroupMap.get(cleanDomain);
  
  if (groupName) {
    return REFERRER_GROUPS[groupName].displayName;
  }
  
  // If no group found, return the original domain
  return domain;
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
    // Try to find the referrer field (could be 'referer' or 'referers')
    const referrerValue = item.referer || item.referers || '';
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
export function shouldGroupReferrer(domain: string): boolean {
  const cleanDomain = domain.replace(/^www\./, '');
  return domainToGroupMap.has(cleanDomain);
}

/**
 * Get all domains that belong to a given referrer group
 */
export function getDomainsForReferrerGroup(groupDisplayName: string): string[] {
  const group = Object.values(REFERRER_GROUPS).find(g => g.displayName === groupDisplayName);
  return group ? [...group.domains] : [];
}

/**
 * Check if a string is a grouped referrer display name
 */
export function isGroupedReferrer(name: string): boolean {
  return Object.values(REFERRER_GROUPS).some(group => group.displayName === name);
}

/**
 * Get referrer group display name from a list of domains
 * Used to determine what to show in filter UI when we have comma-separated domains
 */
export function getGroupDisplayNameFromDomains(domains: string[]): string | null {
  // Remove www. prefix and sort for comparison
  const cleanDomains = domains.map(d => d.replace(/^www\./, '')).sort();
  
  // Find a group that matches these exact domains
  for (const [groupName, group] of Object.entries(REFERRER_GROUPS)) {
    const groupDomains = [...group.domains].sort();
    
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
