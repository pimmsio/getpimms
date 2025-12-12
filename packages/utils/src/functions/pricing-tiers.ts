export type EventsLimit = 5000 | 20000 | 40000 | 100000;

/**
 * Calculate total events from usage fields
 * Formula: clicks + leads + (sales amount / $10)
 */
export function calculateEvents(clicksUsage: number, leadsUsage: number, salesUsage: number): number {
  return clicksUsage + leadsUsage + Math.floor(salesUsage / 1000); // $10 = 1000 cents = 1 event
}

/**
 * Get pricing for a specific event limit and period
 */
export function getPricingForEvents(events: EventsLimit, period: 'monthly' | 'yearly' | 'lifetime'): number {
  const pricing = {
    5000: { monthly: 9, yearly: 99, lifetime: 99 },
    20000: { monthly: 19, yearly: 199, lifetime: 299 },
    40000: { monthly: 29, yearly: 290, lifetime: 399 },
    100000: { monthly: 49, yearly: 490, lifetime: 699 },
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
  };
  
  return retentionMap[events];
}

/**
 * Get lookup key for Stripe pricing
 */
export function getLookupKey(eventsLimit: EventsLimit, period: 'monthly' | 'yearly' | 'lifetime'): string {
  const tierName = eventsLimit === 5000 ? '5k' : 
                   eventsLimit === 20000 ? '20k' :
                   eventsLimit === 40000 ? '40k' : '100k';
  
  return `pro_${tierName}_${period}`;
}

/**
 * Get Stripe price IDs
 */
export function getFakePriceId(eventsLimit: EventsLimit, period: 'monthly' | 'yearly' | 'lifetime'): string {
  const priceIds = {
    5000: {
      monthly: 'price_1SPrifBN5sOoOmBUe12XYlCp',
      yearly: 'price_1SPrifBN5sOoOmBUAyqMM3BX', 
      lifetime: 'price_1SPrifBN5sOoOmBUAyqMM3BX',
    },
    20000: {
      monthly: 'price_1SQBUZBN5sOoOmBUUzY9qNlH',
      yearly: 'price_1SQBUZBN5sOoOmBUiGCbdk9m',
      lifetime: 'price_1SQBUZBN5sOoOmBUufgtJv7g',
    },
    40000: {
      monthly: 'price_1SQBYHBN5sOoOmBUxCM8iTy8',
      yearly: 'price_1SQBYHBN5sOoOmBU7UH01NM8',
      lifetime: 'price_1SQBYHBN5sOoOmBUs2reZG2N',
    },
    100000: {
      monthly: 'price_fake_pro_100k_monthly_placeholder',
      yearly: 'price_fake_pro_100k_yearly_placeholder',
      lifetime: 'price_fake_pro_100k_lifetime_placeholder',
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
  return null;
}
