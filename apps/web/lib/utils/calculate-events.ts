/**
 * Calculate the number of events based on:
 * - Number of clicks (1 click = 1 event)
 * - Number of leads (1 lead = 1 event)
 * - Sales amount (10$ = 1 event, so salesAmount / 10)
 * 
 * @param clicks - Number of clicks
 * @param leads - Number of leads
 * @param salesAmount - Total sales amount in cents (e.g., 1000 cents = $10 = 1 event)
 * @returns Total number of events
 */
export function calculateEvents(
  clicks: number,
  leads: number,
  salesAmount: number
): number {
  // Sales amount is in cents, so divide by 1000 to get events (10$ = 1000 cents = 1 event)
  const salesEvents = Math.floor(salesAmount / 1000);
  
  return clicks + leads + salesEvents;
}

