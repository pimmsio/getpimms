/**
 * Calculate customer hotness based on total clicks and last event
 * Algorithm: volume × recency multiplier
 */
export function calculateCustomerHotness(
  totalClicks: number,
  lastEventAt: Date | string | null
): 1 | 2 | 3 | 0 {
  if (totalClicks === 0) return 0;

  const lastEvent = lastEventAt ? new Date(lastEventAt) : null;
  if (!lastEvent) return 0;

  const now = new Date();
  const hoursAgo = (now.getTime() - lastEvent.getTime()) / (1000 * 60 * 60);
  const daysAgo = hoursAgo / 24;

  // Base score from click volume (1-3)
  let volumeScore = 0;
  if (totalClicks >= 10) volumeScore = 3;      // 10+ clicks = très engagé
  else if (totalClicks >= 5) volumeScore = 2;  // 5+ clicks = engagé
  else if (totalClicks >= 2) volumeScore = 1;  // 2+ clicks = intéressé

  // Recency multiplier (0.1 to 2.0)
  let recencyMultiplier = 0.1; // Very old activity
  
  if (daysAgo <= 1) recencyMultiplier = 2.0;      // Last day = MULTIPLY by 2!
  else if (daysAgo <= 3) recencyMultiplier = 1.5; // Last 3 days = good multiplier
  else if (daysAgo <= 7) recencyMultiplier = 1.2; // Last week = slight boost
  else if (daysAgo <= 30) recencyMultiplier = 0.8; // Last month = slight penalty
  else if (daysAgo <= 90) recencyMultiplier = 0.3; // Last 3 months = big penalty

  // Final hotness = volume × recency
  const finalScore = volumeScore * recencyMultiplier;

  // Convert to flame count (0-3)
  if (finalScore >= 4) return 3;      // Ultra hot 🔥🔥🔥
  else if (finalScore >= 2.5) return 2; // Hot 🔥🔥
  else if (finalScore >= 1) return 1;   // Warm 🔥
  else return 0;                        // Cold ❄️
}

/**
 * Examples:
 * - 6 clicks, 1 day ago: 2 × 2.0 = 4.0 → 3 flames 🔥🔥🔥
 * - 24 clicks, 3 months ago: 3 × 0.3 = 0.9 → 0 flames ❄️
 * - 3 clicks, 1 day ago: 1 × 2.0 = 2.0 → 1 flame 🔥
 */
