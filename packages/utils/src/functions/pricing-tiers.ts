export type EventsLimit = 5000 | 20000 | 40000 | 100000 | 200000;

/**
 * Calculate total events from usage fields
 * Formula: clicks + leads + (sales amount / $10)
 */
export function calculateEvents(usage: number, leadsUsage: number, salesUsage: number): number {
  return usage + leadsUsage + Math.floor(salesUsage / 1000); // $10 = 1000 cents = 1 event
}

/**
 * Get pricing for a specific event limit and period
 */
export function getPricingForEvents(events: EventsLimit, period: 'monthly' | 'yearly' | 'lifetime'): number {
  const pricing = {
    5000: { monthly: 9, yearly: 90, lifetime: 99 },
    20000: { monthly: 19, yearly: 190, lifetime: 199 },
    40000: { monthly: 29, yearly: 290, lifetime: 299 },
    100000: { monthly: 49, yearly: 490, lifetime: 499 },
    200000: { monthly: 69, yearly: 690, lifetime: 699 },
  };
  
  return pricing[events][period];
}

/**
 * Get links limit for a specific event limit
 */
export function getLinksForEvents(events: EventsLimit): number {
  const linksMap = {
    5000: 100,
    20000: 200,
    40000: 400,
    100000: 1000,
    200000: 2000,
  };
  
  return linksMap[events];
}

/**
 * Get domains limit for a specific event limit
 */
export function getDomainsForEvents(events: EventsLimit): number | typeof Infinity {
  const domainsMap = {
    5000: 3,
    20000: 6,
    40000: Infinity,
    100000: Infinity,
    200000: Infinity,
  };
  
  return domainsMap[events];
}

/**
 * Get retention period for a specific event limit
 */
export function getRetentionForEvents(events: EventsLimit): string {
  const retentionMap = {
    5000: '6-month',
    20000: '1-year',
    40000: '1-year',
    100000: '1-year',
    200000: '1-year',
  };
  
  return retentionMap[events];
}

/**
 * Get lookup key for Stripe pricing
 */
export function getLookupKey(eventsLimit: EventsLimit, period: 'monthly' | 'yearly' | 'lifetime'): string {
  const tierName = eventsLimit === 5000 ? '5k' : 
                   eventsLimit === 20000 ? '20k' :
                   eventsLimit === 40000 ? '40k' :
                   eventsLimit === 100000 ? '100k' : '200k';
  
  return `pro_${tierName}_${period}`;
}

/**
 * Get fake Stripe price IDs (to be replaced with real ones)
 */
export function getFakePriceId(eventsLimit: EventsLimit, period: 'monthly' | 'yearly' | 'lifetime'): string {
  const priceIds = {
    5000: {
      monthly: 'price_fake_pro_5k_monthly_123',
      yearly: 'price_fake_pro_5k_yearly_456', 
      lifetime: 'price_fake_pro_5k_lifetime_789',
    },
    20000: {
      monthly: 'price_fake_pro_20k_monthly_abc',
      yearly: 'price_fake_pro_20k_yearly_def',
      lifetime: 'price_fake_pro_20k_lifetime_ghi',
    },
    40000: {
      monthly: 'price_fake_pro_40k_monthly_jkl',
      yearly: 'price_fake_pro_40k_yearly_mno',
      lifetime: 'price_fake_pro_40k_lifetime_pqr',
    },
    100000: {
      monthly: 'price_fake_pro_100k_monthly_stu',
      yearly: 'price_fake_pro_100k_yearly_vwx',
      lifetime: 'price_fake_pro_100k_lifetime_yz1',
    },
    200000: {
      monthly: 'price_fake_pro_200k_monthly_234',
      yearly: 'price_fake_pro_200k_yearly_567',
      lifetime: 'price_fake_pro_200k_lifetime_890',
    },
  };
  
  return priceIds[eventsLimit][period];
}

/**
 * Get events limit from lookup key (for current plan detection)
 */
export function getEventsLimitFromLookupKey(lookupKey: string): EventsLimit | null {
  if (lookupKey.includes('5k')) return 5000;
  if (lookupKey.includes('20k')) return 20000;
  if (lookupKey.includes('40k')) return 40000;
  if (lookupKey.includes('100k')) return 100000;
  if (lookupKey.includes('200k')) return 200000;
  return null;
}
