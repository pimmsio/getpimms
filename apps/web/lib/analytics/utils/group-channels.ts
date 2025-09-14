// Define channel types
export type ChannelType = 
  | "organic_search"
  | "organic_social" 
  | "direct"
  | "referral"
  | "email"
  | "ai"
  | "funnel"
  | "development";

// Define channel configuration
export type ChannelConfig = {
  displayName: string;
  icon: string;
  color: string;
  description: string;
};

export const CHANNEL_CONFIGS: Record<ChannelType, ChannelConfig> = {
  organic_search: {
    displayName: "Organic Search",
    icon: "search",
    color: "#3970ff", // brand-primary-500
    description: "Search engines (Google, Bing, etc.)"
  },
  organic_social: {
    displayName: "Organic Social", 
    icon: "users",
    color: "#60a5fa", // brand-primary-400
    description: "Social media platforms"
  },
  direct: {
    displayName: "Direct",
    icon: "link",
    color: "#6b7280", // neutral gray
    description: "Direct traffic and bookmarks"
  },
  referral: {
    displayName: "Referral",
    icon: "external-link",
    color: "#2563eb", // brand-primary-600
    description: "Other websites and platforms"
  },
  email: {
    displayName: "Email",
    icon: "mail",
    color: "#1d4ed8", // brand-primary-700
    description: "Email marketing and newsletters"
  },
  ai: {
    displayName: "AI",
    icon: "sparkles",
    color: "#1e40af", // brand-primary-800
    description: "AI platforms and chatbots"
  },
  funnel: {
    displayName: "Funnel",
    icon: "funnel",
    color: "#1e3a8a", // brand-primary-900
    description: "Sales funnels and payment systems"
  },
  development: {
    displayName: "Development",
    icon: "code",
    color: "#93c5fd", // brand-primary-300 (lighter for development)
    description: "Development and testing environments"
  }
};

// Map referrer groups to channels
export const REFERRER_TO_CHANNEL_MAPPING: Record<string, ChannelType> = {
  // Search Engines
  "Google": "organic_search",
  "Bing": "organic_search", 
  "Baidu": "organic_search",
  "DuckDuckGo": "organic_search",
  "Yahoo": "organic_search",
  "Yandex": "organic_search",
  
  // Social Media
  "LinkedIn": "organic_social",
  "Twitter": "organic_social", // X.com
  "X.com": "organic_social",
  "Facebook": "organic_social",
  "Instagram": "organic_social",
  "Reddit": "organic_social",
  "YouTube": "organic_social",
  "TikTok": "organic_social",
  "Mastodon": "organic_social",
  "Threads": "organic_social",
  "Bluesky": "organic_social",
  
  // AI Platforms
  "ChatGPT": "ai",
  
  // Email & Marketing
  "Gmail": "email",
  "Brevo": "email",
  "Lemlist": "email",
  "Infomaniak": "email",
  "Mailchimp": "email",
  "MailinBlack": "email",
  "La Poste": "email",
  "Orange": "email",
  "Outlook": "email",
  "Systeme.io": "email",
  
  // Development
  "Development": "development",
  
  // Business/Collaboration Tools
  "Microsoft Teams": "referral",
  "Slack": "referral",
  "GitHub": "referral",
  "Discord": "referral",
  "HubSpot": "referral",
  "Notion": "referral",
  "Clay": "referral",
  "Gamma": "referral",
  "Canva": "referral",
  "Tally": "referral",
  
  // Content Platforms
  "Flipboard": "referral",
  "Substack": "referral",
  "Medium": "referral",
  "Quora": "referral",
  "Last.fm": "referral",
  
  // E-commerce
  "Amazon": "referral",
  
  // Link Services
  "Linktree": "referral",
  
  // Hosting/Dev Platforms
  "Vercel": "development",
  "Framer": "referral",
  "StreamYard": "referral",
  
  // Internal/Own Domains
  "PIMMS": "referral", // Could be considered internal traffic
  
  // Messaging Apps
  "WhatsApp": "organic_social",
  "Telegram": "organic_social",
  
  // Security/Filtering
  "Trend Micro": "referral",
  
  // Freelance/Job Platforms
  "Upwork": "referral",
  "Malt": "referral",
};

/**
 * Get the channel for a given referrer display name
 */
export function getReferrerChannel(referrerDisplayName: string): ChannelType {
  // Handle special cases first
  if (referrerDisplayName === "(direct)") {
    return "direct";
  }
  
  // Check if this referrer has a specific channel mapping
  const mappedChannel = REFERRER_TO_CHANNEL_MAPPING[referrerDisplayName];
  if (mappedChannel) {
    return mappedChannel;
  }
  
  // Default to referral for unmapped referrers
  return "referral";
}

/**
 * Group analytics data by marketing channels
 */
export function groupChannelAnalytics<T extends Record<string, any>>(
  data: T[]
): (T & { channel: string; channelType: ChannelType })[] {
  const groupedData = new Map<ChannelType, T & { channel: string; channelType: ChannelType }>();
  
  data.forEach(item => {
    // Get the referrer value from various possible field names
    const referrerValue =
      item.referer_url_processed ||
      item.referer_url ||
      item.referer ||
      item.referers ||
      '';
    
    const channelType = getReferrerChannel(referrerValue);
    const channelConfig = CHANNEL_CONFIGS[channelType];
    
    if (groupedData.has(channelType)) {
      // Merge data for the same channel
      const existing = groupedData.get(channelType)!;
      groupedData.set(channelType, {
        ...existing,
        // Sum numeric fields
        clicks: (existing.clicks || 0) + (item.clicks || 0),
        leads: (existing.leads || 0) + (item.leads || 0),
        sales: (existing.sales || 0) + (item.sales || 0),
        saleAmount: (existing.saleAmount || 0) + (item.saleAmount || 0),
        count: (existing.count || 0) + (item.count || 0),
      });
    } else {
      // First item for this channel
      groupedData.set(channelType, {
        ...item,
        channel: channelConfig.displayName,
        channelType,
        referer: channelConfig.displayName,
        referers: channelConfig.displayName,
      });
    }
  });
  
  return Array.from(groupedData.values()).sort((a, b) => (b.count || 0) - (a.count || 0));
}

/**
 * Get channel display name for a given channel type
 */
export function getChannelDisplayName(channelType: ChannelType): string {
  return CHANNEL_CONFIGS[channelType].displayName;
}

/**
 * Get channel icon for a given channel type
 */
export function getChannelIcon(channelType: ChannelType): string {
  return CHANNEL_CONFIGS[channelType].icon;
}

/**
 * Get channel color for a given channel type
 */
export function getChannelColor(channelType: ChannelType): string {
  return CHANNEL_CONFIGS[channelType].color;
}

/**
 * Check if a referrer belongs to a specific channel
 */
export function isReferrerInChannel(referrerDisplayName: string, channelType: ChannelType): boolean {
  return getReferrerChannel(referrerDisplayName) === channelType;
}

/**
 * Get all referrer groups that belong to a specific channel
 */
export function getReferrerGroupsForChannel(channelType: ChannelType): string[] {
  return Object.entries(REFERRER_TO_CHANNEL_MAPPING)
    .filter(([, channel]) => channel === channelType)
    .map(([referrer]) => referrer);
}
