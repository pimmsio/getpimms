/**
 * Provider system for referrer analytics and channel mapping
 */

export type Provider = {
  /** Display name shown in UI */
  displayName: string;
  /** All domains/patterns that match this provider */
  domains: (string | RegExp)[];
  /** Primary domain for favicon generation */
  primaryDomain: string;
  /** Channel this provider belongs to */
  channel: 'organic_search' | 'organic_social' | 'direct' | 'referral' | 'email' | 'ai' | 'funnel' | 'development';
  /** Legacy icon identifier */
  icon: string;
};

/**
 * Master provider registry - single source of truth
 */
export const PROVIDERS: Record<string, Provider> = {
  // Search Engines
  Google: {
    displayName: 'Google',
    domains: ['google.com', 'google.fr', 'google.co.uk', 'google.de', 'google.it', 'google.es', 'google.ca', 'google.com.au'],
    primaryDomain: 'google.com',
    channel: 'organic_search',
    icon: 'google'
  },
  Bing: {
    displayName: 'Bing',
    domains: [/^bing\.(com|ms)$/],
    primaryDomain: 'bing.com',
    channel: 'organic_search',
    icon: 'bing'
  },
  Yahoo: {
    displayName: 'Yahoo',
    domains: [/^yahoo\.(com|fr|co\.uk|de|it|es)$/],
    primaryDomain: 'yahoo.com',
    channel: 'organic_search',
    icon: 'yahoo'
  },
  DuckDuckGo: {
    displayName: 'DuckDuckGo',
    domains: ['duckduckgo.com'],
    primaryDomain: 'duckduckgo.com',
    channel: 'organic_search',
    icon: 'duckduckgo'
  },
  Yandex: {
    displayName: 'Yandex',
    domains: [/^yandex\.(com|ru|fr|de|tr|ua)$/],
    primaryDomain: 'yandex.com',
    channel: 'organic_search',
    icon: 'yandex'
  },
  Baidu: {
    displayName: 'Baidu',
    domains: [/^(m\.)?baidu\.com$/],
    primaryDomain: 'baidu.com',
    channel: 'organic_search',
    icon: 'baidu'
  },

  // Social Media
  LinkedIn: {
    displayName: 'LinkedIn',
    domains: ['linkedin.com', 'com.linkedin.android', 'lnkd.in'],
    primaryDomain: 'linkedin.com',
    channel: 'organic_social',
    icon: 'linkedin'
  },
  Facebook: {
    displayName: 'Facebook',
    domains: ['facebook.com', 'fb.com', 'm.facebook.com', 'l.facebook.com', 'lm.facebook.com'],
    primaryDomain: 'facebook.com',
    channel: 'organic_social',
    icon: 'facebook'
  },
  Twitter: {
    displayName: 'X.com',
    domains: ['twitter.com', 't.co', 'x.com', 'com.twitter.android'],
    primaryDomain: 'x.com',
    channel: 'organic_social',
    icon: 'twitter'
  },
  Instagram: {
    displayName: 'Instagram',
    domains: ['instagram.com', 'instagr.am'],
    primaryDomain: 'instagram.com',
    channel: 'organic_social',
    icon: 'instagram'
  },
  YouTube: {
    displayName: 'YouTube',
    domains: ['youtube.com', 'youtu.be', 'm.youtube.com'],
    primaryDomain: 'youtube.com',
    channel: 'organic_social',
    icon: 'youtube'
  },
  Reddit: {
    displayName: 'Reddit',
    domains: ['reddit.com', 'old.reddit.com', 'm.reddit.com', 'www.reddit.com', 'com.reddit.frontpage'],
    primaryDomain: 'reddit.com',
    channel: 'organic_social',
    icon: 'reddit'
  },
  TikTok: {
    displayName: 'TikTok',
    domains: [/^(vm\.|vt\.)?tiktok\.com$/],
    primaryDomain: 'tiktok.com',
    channel: 'organic_social',
    icon: 'tiktok'
  },
  WhatsApp: {
    displayName: 'WhatsApp',
    domains: [/^(api\.)?whatsapp\.com$/, 'wa.me'],
    primaryDomain: 'whatsapp.com',
    channel: 'organic_social',
    icon: 'whatsapp'
  },
  Telegram: {
    displayName: 'Telegram',
    domains: [/^(telegram\.(org|me)|t\.me)$/],
    primaryDomain: 'telegram.org',
    channel: 'organic_social',
    icon: 'telegram'
  },
  Mastodon: {
    displayName: 'Mastodon',
    domains: [/^[a-z0-9.-]+\.social$/, 'mastodon.social', 'mas.to'],
    primaryDomain: 'mastodon.social',
    channel: 'organic_social',
    icon: 'mastodon'
  },
  Threads: {
    displayName: 'Threads',
    domains: [/^l\.threads\.com$/],
    primaryDomain: 'threads.net',
    channel: 'organic_social',
    icon: 'threads'
  },
  Bluesky: {
    displayName: 'Bluesky',
    domains: [/^(go\.)?bsky\.app$/],
    primaryDomain: 'bsky.app',
    channel: 'organic_social',
    icon: 'bluesky'
  },

  // Email & Marketing
  Gmail: {
    displayName: 'Gmail',
    domains: ['gmail.com', 'mail.google.com', 'm.gmail.com', 'com.google.android.gm'],
    primaryDomain: 'mail.google.com',
    channel: 'email',
    icon: 'gmail'
  },
  Outlook: {
    displayName: 'Outlook',
    domains: ['outlook.live.com'],
    primaryDomain: 'outlook.com',
    channel: 'email',
    icon: 'outlook'
  },
  Brevo: {
    displayName: 'Brevo',
    domains: [
      'brevo.com',
      /-brevo\.net$/,
      /^[a-z0-9]+\.r\.[a-z]+\.d\.sendib[mt][0-9]+\.com$/  // SendinBlue patterns
    ],
    primaryDomain: 'www.brevo.com',
    channel: 'email',
    icon: 'brevo'
  },
  Lemlist: {
    displayName: 'Lemlist',
    domains: ['lemlist.com'],
    primaryDomain: 'lemlist.com',
    channel: 'email',
    icon: 'lemlist'
  },
  Orange: {
    displayName: 'Orange',
    domains: ['orange.fr'],
    primaryDomain: 'orange.fr',
    channel: 'email',
    icon: 'orange'
  },
  Infomaniak: {
    displayName: 'Infomaniak',
    domains: ['infomaniak.com'],
    primaryDomain: 'infomaniak.com',
    channel: 'email',
    icon: 'infomaniak'
  },
  Systemeio: {
    displayName: 'Systeme.io',
    domains: ['systeme.io'],
    primaryDomain: 'systeme.io',
    channel: 'email',
    icon: 'systemeio'
  },
  MailinBlack: {
    displayName: 'MailinBlack',
    domains: ['mailinblack.com'],
    primaryDomain: 'mailinblack.com',
    channel: 'email',
    icon: 'mailinblack'
  },
  LaPoste: {
    displayName: 'La Poste',
    domains: ['laposte.net'],
    primaryDomain: 'laposte.net',
    channel: 'email',
    icon: 'laposte'
  },
  Mailchimp: {
    displayName: 'Mailchimp',
    domains: ['mailchimp.com'],
    primaryDomain: 'mailchimp.com',
    channel: 'email',
    icon: 'mailchimp'
  },

  // Development & Tools
  GitHub: {
    displayName: 'GitHub',
    domains: ['github.com', 'gist.github.com'],
    primaryDomain: 'github.com',
    channel: 'referral',
    icon: 'github'
  },
  Vercel: {
    displayName: 'Vercel',
    domains: ['vercel.com'],
    primaryDomain: 'vercel.com',
    channel: 'development',
    icon: 'vercel'
  },
  Notion: {
    displayName: 'Notion',
    domains: ['notion.so'],
    primaryDomain: 'notion.so',
    channel: 'referral',
    icon: 'notion'
  },
  Slack: {
    displayName: 'Slack',
    domains: [/^(app\.)?slack\.com$/],
    primaryDomain: 'slack.com',
    channel: 'referral',
    icon: 'slack'
  },
  Discord: {
    displayName: 'Discord',
    domains: ['discord.com', 'discord.gg', 'discordapp.com'],
    primaryDomain: 'discord.com',
    channel: 'referral',
    icon: 'discord'
  },
  HubSpot: {
    displayName: 'HubSpot',
    domains: [
      'hubspot.com',
      /^[0-9]+\.hubspotpreview-[a-z0-9]+\.com$/
    ],
    primaryDomain: 'hubspot.com',
    channel: 'referral',
    icon: 'hubspot'
  },

  // AI & Chat
  ChatGPT: {
    displayName: 'ChatGPT',
    domains: ['chatgpt.com'],
    primaryDomain: 'chatgpt.com',
    channel: 'ai',
    icon: 'chatgpt'
  },

  // Business Tools
  Clay: {
    displayName: 'Clay',
    domains: ['clay.com'],
    primaryDomain: 'clay.com',
    channel: 'referral',
    icon: 'clay'
  },
  Gamma: {
    displayName: 'Gamma',
    domains: ['gamma.app'],
    primaryDomain: 'gamma.app',
    channel: 'referral',
    icon: 'gamma'
  },
  Canva: {
    displayName: 'Canva',
    domains: ['canva.com'],
    primaryDomain: 'canva.com',
    channel: 'referral',
    icon: 'canva'
  },
  Tally: {
    displayName: 'Tally',
    domains: ['tally.so'],
    primaryDomain: 'tally.so',
    channel: 'referral',
    icon: 'tally'
  },
  Framer: {
    displayName: 'Framer',
    domains: [
      'framer.com',
      /\.framer\.website$/,
      /\.framer\.app$/,
      /\.framercanvas\.com$/
    ],
    primaryDomain: 'framer.com',
    channel: 'referral',
    icon: 'framer'
  },

  // Content Platforms
  Medium: {
    displayName: 'Medium',
    domains: ['medium.com'],
    primaryDomain: 'medium.com',
    channel: 'referral',
    icon: 'medium'
  },
  Substack: {
    displayName: 'Substack',
    domains: [
      'substack.com',
      /\.substack\.com$/
    ],
    primaryDomain: 'substack.com',
    channel: 'referral',
    icon: 'substack'
  },
  Quora: {
    displayName: 'Quora',
    domains: ['quora.com'],
    primaryDomain: 'quora.com',
    channel: 'referral',
    icon: 'quora'
  },

  // E-commerce & Business
  Amazon: {
    displayName: 'Amazon',
    domains: ['amazon.com'],
    primaryDomain: 'amazon.com',
    channel: 'referral',
    icon: 'amazon'
  },
  Upwork: {
    displayName: 'Upwork',
    domains: ['upwork.com'],
    primaryDomain: 'upwork.com',
    channel: 'referral',
    icon: 'upwork'
  },
  Malt: {
    displayName: 'Malt',
    domains: ['malt.fr'],
    primaryDomain: 'malt.fr',
    channel: 'referral',
    icon: 'malt'
  },

  // Link Services
  Linktree: {
    displayName: 'Linktree',
    domains: ['linktr.ee'],
    primaryDomain: 'linktr.ee',
    channel: 'referral',
    icon: 'linktree'
  },

  // Other Tools
  StreamYard: {
    displayName: 'StreamYard',
    domains: ['streamyard.com'],
    primaryDomain: 'streamyard.com',
    channel: 'referral',
    icon: 'streamyard'
  },
  MicrosoftTeams: {
    displayName: 'Microsoft Teams',
    domains: ['teams.microsoft.com'],
    primaryDomain: 'teams.microsoft.com',
    channel: 'referral',
    icon: 'microsoftteams'
  },
  TrendMicro: {
    displayName: 'Trend Micro',
    domains: ['trendmicro.com'],
    primaryDomain: 'trendmicro.com',
    channel: 'referral',
    icon: 'trendmicro'
  },
  Flipboard: {
    displayName: 'Flipboard',
    domains: ['flipboard.com'],
    primaryDomain: 'flipboard.com',
    channel: 'referral',
    icon: 'flipboard'
  },
  LastFM: {
    displayName: 'Last.fm',
    domains: ['last.fm'],
    primaryDomain: 'last.fm',
    channel: 'referral',
    icon: 'lastfm'
  },

  // Internal/Own Domains  
  PIMMS: {
    displayName: 'PIMMS',
    domains: [
      'pim.ms',
      'fcksub.com',
      /^(app\.)?pim(ms)?\.io$/
    ],
    primaryDomain: 'pim.ms',
    channel: 'referral',
    icon: 'pimms'
  },

  // Development/Testing
  Development: {
    displayName: 'Development',
    domains: ['localhost', '127.0.0.1', '0.0.0.0'],
    primaryDomain: 'localhost',
    channel: 'development',
    icon: 'development'
  },

};

// Helper to test if a referrer matches a pattern
function matchesPattern(referrer: string, pattern: string | RegExp): boolean {
  const cleanReferrer = referrer.replace(/^www\./, '').toLowerCase();
  
  if (pattern instanceof RegExp) {
    return pattern.test(cleanReferrer) || pattern.test(referrer);
  }
  
  const cleanPattern = pattern.replace(/^www\./, '').toLowerCase();
  return cleanReferrer === cleanPattern || 
         cleanReferrer.endsWith('.' + cleanPattern) ||
         cleanReferrer.endsWith(cleanPattern);
}

/**
 * Find provider by referrer URL/domain
 */
export function findProviderByReferrer(referrer: string): Provider | null {
  if (!referrer || referrer === "(direct)") return null;
  
  for (const provider of Object.values(PROVIDERS)) {
    for (const pattern of provider.domains) {
      if (matchesPattern(referrer, pattern)) {
        return provider;
      }
    }
  }
  return null;
}

/**
 * Find provider by display name
 */
export function findProviderByDisplayName(displayName: string): Provider | null {
  return Object.values(PROVIDERS).find(p => p.displayName === displayName) || null;
}

/**
 * Get provider display name for referrer
 */
export function getProviderDisplayName(referrer: string): string {
  if (referrer === "(direct)") return "(direct)";
  
  const provider = findProviderByReferrer(referrer);
  return provider ? provider.displayName : referrer;
}

/**
 * Get provider channel for referrer
 */
export function getProviderChannel(referrer: string): string {
  if (referrer === "(direct)") return "direct";
  
  const provider = findProviderByReferrer(referrer) || findProviderByDisplayName(referrer);
  return provider ? provider.channel : 'referral';
}

/**
 * Get provider primary domain for referrer
 */
export function getProviderDomain(referrer: string): string {
  if (referrer === "(direct)") return "direct";
  
  const provider = findProviderByReferrer(referrer) || findProviderByDisplayName(referrer);
  if (provider) {
    return provider.primaryDomain;
  }
  
  // Fallback: extract domain from referrer
  if (referrer.includes(".") && !referrer.includes(" ")) {
    return referrer.replace(/^www\./, "").toLowerCase();
  }
  
  return referrer.toLowerCase().replace(/\s+/g, "");
}

/**
 * Get provider icon URL (favicon)
 */
export function getProviderIconUrl(referrer: string): string {
  const domain = getProviderDomain(referrer);
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
}

/**
 * Get all providers for a specific channel
 */
export function getProvidersForChannel(channel: string): Provider[] {
  return Object.values(PROVIDERS).filter(p => p.channel === channel);
}

/**
 * Group analytics data by providers (legacy name for compatibility)
 */
export function groupReferrerAnalytics<T extends Record<string, any>>(data: T[]): T[] {
  const grouped = new Map<string, T>();
  
  data.forEach(item => {
    const referrerValue = item.referer_url_processed || item.referer_url || item.referer || item.referers || '';
    const providerName = getProviderDisplayName(referrerValue);
    
    if (grouped.has(providerName)) {
      const existing = grouped.get(providerName)!;
      grouped.set(providerName, {
        ...existing,
        referer: providerName,
        referers: providerName,
        // Sum numeric fields
        clicks: (existing.clicks || 0) + (item.clicks || 0),
        leads: (existing.leads || 0) + (item.leads || 0),
        sales: (existing.sales || 0) + (item.sales || 0),
        saleAmount: (existing.saleAmount || 0) + (item.saleAmount || 0),
        count: (existing.count || 0) + (item.count || 0),
      });
    } else {
      grouped.set(providerName, {
        ...item,
        referer: providerName,
        referers: providerName,
      });
    }
  });
  
  return Array.from(grouped.values()).sort((a, b) => (b.count || 0) - (a.count || 0));
}

/**
 * Group analytics data by providers
 */
export function groupByProviders<T extends Record<string, any>>(data: T[]): (T & { provider: string })[] {
  const grouped = new Map<string, T & { provider: string }>();
  
  data.forEach(item => {
    const referrerValue = item.referer_url_processed || item.referer_url || item.referer || item.referers || '';
    const providerName = getProviderDisplayName(referrerValue);
    
    if (grouped.has(providerName)) {
      const existing = grouped.get(providerName)!;
      grouped.set(providerName, {
        ...existing,
        // Sum numeric fields
        clicks: (existing.clicks || 0) + (item.clicks || 0),
        leads: (existing.leads || 0) + (item.leads || 0),
        sales: (existing.sales || 0) + (item.sales || 0),
        saleAmount: (existing.saleAmount || 0) + (item.saleAmount || 0),
        count: (existing.count || 0) + (item.count || 0),
      });
    } else {
      grouped.set(providerName, {
        ...item,
        provider: providerName,
        referer: providerName,
        referers: providerName,
      });
    }
  });
  
  return Array.from(grouped.values()).sort((a, b) => (b.count || 0) - (a.count || 0));
}

// Legacy compatibility functions
export const getReferrerDisplayName = getProviderDisplayName;

export function isGroupedReferrer(name: string): boolean {
  return findProviderByDisplayName(name) !== null;
}

export function getDomainsForReferrerGroup(groupDisplayName: string): string[] {
  const provider = findProviderByDisplayName(groupDisplayName);
  if (!provider) return [];
  
  return provider.domains
    .filter((d): d is string => typeof d === 'string')
    .slice();
}

export function getBestDomainForLogo(referrer: string): string {
  return getProviderDomain(referrer);
}

/**
 * Get group display name from a list of domains
 * If all domains belong to the same provider, return the provider's display name
 * Otherwise return null
 */
export function getGroupDisplayNameFromDomains(domains: string[]): string | null {
  if (!domains || domains.length === 0) return null;
  
  // Find the provider for the first domain
  const firstProvider = findProviderByReferrer(domains[0]);
  if (!firstProvider) return null;
  
  // Check if all domains belong to the same provider
  for (const domain of domains) {
    const provider = findProviderByReferrer(domain);
    if (!provider || provider.displayName !== firstProvider.displayName) {
      return null;
    }
  }
  
  return firstProvider.displayName;
}
