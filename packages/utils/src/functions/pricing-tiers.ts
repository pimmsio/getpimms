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
