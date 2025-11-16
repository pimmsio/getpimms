import { type EventsLimit } from "./pricing-tiers";

/**
 * Detect current tier based on workspace eventsLimit
 */
export function detectCurrentTier(eventsLimit: number): {
  tier: EventsLimit;
  isCurrentTier: (checkTier: EventsLimit) => boolean;
} {
  // Find the matching tier
  const tier = eventsLimit <= 5000 ? 5000 :
               eventsLimit <= 20000 ? 20000 :
               eventsLimit <= 40000 ? 40000 : 100000;

  return {
    tier: tier as EventsLimit,
    isCurrentTier: (checkTier: EventsLimit) => checkTier === tier,
  };
}

/**
 * Check if user is on a specific tier
 */
export function isCurrentTier(userEventsLimit: number, checkTier: EventsLimit): boolean {
  const { isCurrentTier } = detectCurrentTier(userEventsLimit);
  return isCurrentTier(checkTier);
}
