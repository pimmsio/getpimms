import z from "@/lib/zod";
import { clickEventResponseSchema } from "@/lib/zod/schemas/clicks";
import { customerActivityEventSchema } from "@/lib/zod/schemas/customer-activity";

type ClickEvent = z.infer<typeof clickEventResponseSchema>;
type ActivityEvent = z.infer<typeof customerActivityEventSchema>;

// Properly typed event types
type LeadEvent = Extract<ActivityEvent, { event: "lead" }>;
type SaleEvent = Extract<ActivityEvent, { event: "sale" }>;
type ClickEventFromActivity = Extract<ActivityEvent, { event: "click" }>;

export type HotWindow = {
  start: string;
  end: string;
  score: number;
  reasons: string[];
};

export type HotSummary = {
  score: number; // 0-100
  tier: 0 | 1 | 2 | 3; // 0=cold, 1=warm, 2=hot, 3=very hot
  hotWindows: HotWindow[];
};

/**
 * LEAD SCORING ALGORITHM - ULTRA-OPTIMIZED VERSION
 * 
 * ALGORITHM STRUCTURE (4 Components):
 * 1. Click Engagement: 6 points per click (no daily cap, no same-link bonus)
 * 2. Velocity Bursts: +2 points per click that has another click within 1 hour
 * 3. Activity Streaks: 5 points per active day (any day with clicks or events)
 * 4. Conversion Events: 12 points each for leads and sales (equal weight)
 * 
 * UNIVERSAL TIME DECAY SYSTEM:
 * - 0-14 days: No decay (decay factor = 1)
 * - 15+ days: Linear decay (decay factor = 1 + (days_ago - 14) / 7)
 * - Maximum decay: 4x (after 35+ days)
 * - All components use the same decay logic
 */

export interface ScoringConfig {
  clickWeights: {
    clickPerUnit: number; // 6 points per click
    velocityBonusPerClick: number; // 2 points per click within 1 hour of another
  };
  streakWeights: {
    pointsPerActiveDay: number; // 5 points per active day
  };
  conversionWeights: {
    lead: number; // 12 points per lead
    sale: number; // 12 points per sale
  };
  decayConfig: {
    noDecayDays: number; // 14 days
    decayRate: number; // 7 days per decay unit
    maxDecayFactor: number; // 4x maximum
  };
}

const DEFAULT_CONFIG: ScoringConfig = {
  clickWeights: { clickPerUnit: 6, velocityBonusPerClick: 2 },
  streakWeights: { pointsPerActiveDay: 5 },
  conversionWeights: { lead: 12, sale: 12 },
  decayConfig: { noDecayDays: 14, decayRate: 7, maxDecayFactor: 4 },
};

export { DEFAULT_CONFIG as DEFAULT_SCORING_CONFIG };

// Ultra-fast decay calculation with pre-computed constants
const MS_PER_DAY = 1000 * 60 * 60 * 24;
const ONE_HOUR_MS = 60 * 60 * 1000;

function getDecayFactor(timestamp: number, config: ScoringConfig): number {
  const ageDays = (Date.now() - timestamp) / MS_PER_DAY;
  if (ageDays <= config.decayConfig.noDecayDays) return 1;
  const decayFactor = 1 + (ageDays - config.decayConfig.noDecayDays) / config.decayConfig.decayRate;
  return Math.min(decayFactor, config.decayConfig.maxDecayFactor);
}

function getTier(score: number): 0 | 1 | 2 | 3 {
  return score >= 75 ? 3 : score >= 50 ? 2 : score >= 25 ? 1 : 0;
}

// Helper function to safely extract timestamp from events
function getEventTimestamp(event: ActivityEvent): number {
  return new Date(event.timestamp).getTime();
}

// Helper function to check if event is a conversion event
function isConversionEvent(event: ActivityEvent): event is LeadEvent | SaleEvent {
  return event.event === "lead" || event.event === "sale";
}

// Helper function to get day key from timestamp
function getDayKey(timestamp: number): string {
  return new Date(timestamp).toISOString().slice(0, 10);
}

function computeLeadScoreInternal({
  clicks,
  events,
  config = DEFAULT_CONFIG,
}: {
  clicks: ClickEvent[];
  events: ActivityEvent[];
  config?: ScoringConfig;
}): {
  score: number;
  tier: 0 | 1 | 2 | 3;
  hotWindows: HotWindow[];
  breakdown: {
    clickScore: number;
    streakScore: number;
    velocityScore: number;
    conversionScore: number;
    proximityScore: number;
  };
} {
  // Ultra-fast preprocessing: single pass through all data
  const clickTimestamps: number[] = [];
  const eventData: { timestamp: number; type: "lead" | "sale" }[] = [];
  const activeDays = new Set<string>();
  
  // Process clicks and mark active days in one pass
  for (const click of clicks) {
    const timestamp = new Date(click.timestamp).getTime();
    clickTimestamps.push(timestamp);
    activeDays.add(getDayKey(timestamp));
  }
  
  // Process events and mark active days in one pass
  for (const event of events) {
    const timestamp = getEventTimestamp(event);
    
    if (isConversionEvent(event)) {
      eventData.push({ timestamp, type: event.event });
      activeDays.add(getDayKey(timestamp));
    }
  }
  
  // Sort click timestamps once
  clickTimestamps.sort((a, b) => a - b);

  // 1. CLICK ENGAGEMENT SCORING: 6 points per click
  let clickScore = 0;
  for (const timestamp of clickTimestamps) {
    clickScore += config.clickWeights.clickPerUnit / getDecayFactor(timestamp, config);
  }

  // 2. VELOCITY BURST SCORING: +2 points per click within 1 hour of another
  let velocityScore = 0;
  for (let i = 0; i < clickTimestamps.length; i++) {
    const currentTime = clickTimestamps[i];
    
    // Check if there's another click within 1 hour (optimized with early break)
    for (let j = i + 1; j < clickTimestamps.length; j++) {
      if (clickTimestamps[j] - currentTime > ONE_HOUR_MS) break; // Early exit
      if (clickTimestamps[j] - currentTime <= ONE_HOUR_MS) {
        velocityScore += config.clickWeights.velocityBonusPerClick / getDecayFactor(currentTime, config);
        break; // Found one, that's enough
      }
    }
  }

  // 3. ACTIVITY STREAK SCORING: 5 points per active day
  let streakScore = 0;
  for (const dayKey of activeDays) {
    const dayTimestamp = new Date(`${dayKey}T00:00:00Z`).getTime();
    streakScore += config.streakWeights.pointsPerActiveDay / getDecayFactor(dayTimestamp, config);
  }

  // 4. CONVERSION EVENT SCORING: 12 points each for leads and sales
  let conversionScore = 0;
  for (const { timestamp, type } of eventData) {
    const decayFactor = getDecayFactor(timestamp, config);
    if (type === "lead") {
      conversionScore += config.conversionWeights.lead / decayFactor;
    } else if (type === "sale") {
      conversionScore += config.conversionWeights.sale / decayFactor;
    }
  }

  // Calculate final score
  const totalScore = clickScore + velocityScore + streakScore + conversionScore;
  const normalizedScore = Math.max(0, Math.min(100, Math.round(totalScore)));

  return {
    score: normalizedScore,
    tier: getTier(normalizedScore),
    hotWindows: [],
    breakdown: {
      clickScore: Math.round(clickScore),
      velocityScore: Math.round(velocityScore),
      streakScore: Math.round(streakScore),
      conversionScore: Math.round(conversionScore),
      proximityScore: 0,
    },
  };
}

export function computeLeadScore({
  clicks,
  events,
  config = DEFAULT_CONFIG,
}: {
  clicks: ClickEvent[];
  events: ActivityEvent[];
  config?: ScoringConfig;
}): number {
  return computeLeadScoreInternal({ clicks, events, config }).score;
}

export function getLeadScoreDetails({
  clicks,
  events,
  config = DEFAULT_CONFIG,
}: {
  clicks: ClickEvent[];
  events: ActivityEvent[];
  config?: ScoringConfig;
}): HotSummary {
  const result = computeLeadScoreInternal({ clicks, events, config });
  return {
    score: result.score,
    tier: result.tier,
    hotWindows: result.hotWindows,
  };
}