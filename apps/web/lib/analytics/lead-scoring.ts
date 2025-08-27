import z from "@/lib/zod";
import { clickEventResponseSchema } from "@/lib/zod/schemas/clicks";
import { customerActivityEventSchema } from "@/lib/zod/schemas/customer-activity";

type ClickEvent = z.infer<typeof clickEventResponseSchema>;
type ActivityEvent = z.infer<typeof customerActivityEventSchema>;

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

// Configurable scoring weights - can be overridden per workspace/use case
export interface ScoringConfig {
  clickWeights: {
    clickPerUnit: number;
    dailyClickCap: number;
    velocityBurstBonus: number;
    rapidFireBonus: number; // NEW: 5+ clicks in 2h
    marathonSessionBonus: number; // NEW: 10+ clicks in 1 day
  };

  streakWeights: {
    streak3DaysBonus: number;
    streak5DaysBonus: number;
    streak7DaysBonus: number; // NEW: 7+ active days
    flexStreakActivePerDay: number;
    flexStreakLengthPerDay: number;
    flexStreakGapPenalty: number;
    flexStreakAltPatternBonus: number;
    flexStreakMaxBonus: number;
    consistencyBonus: number; // NEW: consistent daily activity
  };

  conversionWeights: {
    lead: number;
    sale: number;
    leadProximityBonus: number; // NEW: multiple leads close together
    saleRecencyBonus: number; // NEW: sale in last 7 days
  };

  decayRates: {
    clickDecayDays: number;
    leadDecayDays: number;
    saleDecayDays: number;
  };
}

const DEFAULT_CONFIG: ScoringConfig = {
  clickWeights: {
    clickPerUnit: 4,
    dailyClickCap: 3,
    velocityBurstBonus: 5,
    rapidFireBonus: 8,
    marathonSessionBonus: 12,
  },
  streakWeights: {
    streak3DaysBonus: 8,
    streak5DaysBonus: 15,
    streak7DaysBonus: 25,
    flexStreakActivePerDay: 3,
    flexStreakLengthPerDay: 1,
    flexStreakGapPenalty: 1,
    flexStreakAltPatternBonus: 4,
    flexStreakMaxBonus: 28,
    consistencyBonus: 10,
  },
  conversionWeights: {
    lead: 12,
    sale: 12,
    leadProximityBonus: 8,
    saleRecencyBonus: 6,
  },

  decayRates: {
    clickDecayDays: 10,
    leadDecayDays: 21,
    saleDecayDays: 45,
  },
};

// Export configuration for external use
export { DEFAULT_CONFIG as DEFAULT_SCORING_CONFIG };

// Exponential time decay with half-life in days
function recencyDecay(eventDate: Date, halfLifeDays: number = 7): number {
  const now = Date.now();
  const ageDays = (now - eventDate.getTime()) / (1000 * 60 * 60 * 24);
  const decay = Math.pow(0.5, ageDays / halfLifeDays);
  return decay;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// ENHANCED: Build a flexible activity window analysis with multiple patterns:
// - Active day threshold: configurable (>=1 events - clicks, leads, sales)
// - Smart gap handling: single gaps OK, double gaps break streaks
// - Pattern recognition: alternating, crescendo, burst patterns
// - Recency weighting and consistency bonuses
function computeBestFlexStreakWindow(
  eventsByDay: Record<string, number>,
  now: Date,
  config: ScoringConfig,
  lookbackDays: number = 14,
): {
  startIdx: number;
  endIdx: number;
  activeDays: number;
  length: number;
  zeros: number;
  altPattern: boolean;
  crescendoPattern: boolean; // NEW: increasing activity
  burstPattern: boolean; // NEW: concentrated bursts
  consistency: number; // NEW: consistency score
} | null {
  const dayKeys: string[] = [];
  for (let i = lookbackDays - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    dayKeys.push(d.toISOString().slice(0, 10));
  }

  const activity = dayKeys.map((k) => eventsByDay[k] || 0);
  const binaryActivity = activity.map((count) => (count >= 1 ? 1 : 0));

  let best: {
    startIdx: number;
    endIdx: number;
    score: number;
    activeDays: number;
    length: number;
    zeros: number;
    altPattern: boolean;
    crescendoPattern: boolean;
    burstPattern: boolean;
    consistency: number;
  } | null = null;

  for (let i = 0; i < binaryActivity.length; i++) {
    for (let j = i; j < binaryActivity.length; j++) {
      const slice = binaryActivity.slice(i, j + 1);
      const activitySlice = activity.slice(i, j + 1);
      const length = j - i + 1;
      const activeDays = slice.reduce((a, b) => a + b, 0);
      if (activeDays < 2) continue; // need at least 2 active days to matter

      // Check for double gaps (consecutive zeros)
      let hasDoubleGap = false;
      for (let k = 1; k < slice.length; k++) {
        if (slice[k] === 0 && slice[k - 1] === 0) {
          hasDoubleGap = true;
          break;
        }
      }
      if (hasDoubleGap) continue;

      const zeros = length - activeDays;

      // ENHANCED PATTERN DETECTION
      // 1. Alternating pattern (1-0-1-0)
      let altPattern = true;
      for (let k = 1; k < slice.length; k++) {
        if (slice[k] === slice[k - 1]) {
          altPattern = false;
          break;
        }
      }

      // 2. Crescendo pattern (increasing activity over time)
      let crescendoPattern = false;
      if (activeDays >= 3) {
        const firstHalf = activitySlice.slice(0, Math.floor(length / 2));
        const secondHalf = activitySlice.slice(Math.floor(length / 2));
        const firstSum = firstHalf.reduce((a, b) => a + b, 0);
        const secondSum = secondHalf.reduce((a, b) => a + b, 0);
        crescendoPattern =
          secondSum > firstHalf.length && secondSum > firstSum * 1.5;
      }

      // 3. Burst pattern (high activity days with strategic gaps)
      let burstPattern = false;
      const highActivityDays = activitySlice.filter(
        (count) => count >= 3,
      ).length;
      if (highActivityDays >= 2 && activeDays >= 3) {
        burstPattern = true;
      }

      // 4. Consistency score (regularity of activity)
      const consistency = activeDays / length; // 0 to 1

      // Recency factor: stronger bias for windows touching today
      const recencyBias = j === binaryActivity.length - 1 ? 5 : j * 0.01;

      // ENHANCED SCORING: reward patterns and consistency
      const base =
        activeDays * config.streakWeights.flexStreakActivePerDay +
        length * config.streakWeights.flexStreakLengthPerDay -
        zeros * config.streakWeights.flexStreakGapPenalty +
        (altPattern ? config.streakWeights.flexStreakAltPatternBonus : 0) +
        (crescendoPattern ? 6 : 0) + // NEW: crescendo bonus
        (burstPattern ? 8 : 0) + // NEW: burst bonus
        (consistency > 0.6 ? config.streakWeights.consistencyBonus : 0); // NEW: consistency bonus

      const score = base + recencyBias;

      if (!best || score > best.score) {
        best = {
          startIdx: i,
          endIdx: j,
          score,
          activeDays,
          length,
          zeros,
          altPattern,
          crescendoPattern,
          burstPattern,
          consistency,
        };
      }
    }
  }

  if (!best) return null;
  return best;
}

// ENHANCED: Advanced velocity burst detection with multiple patterns
function detectAdvancedVelocityBursts(
  clicks: ClickEvent[],
  config: ScoringConfig,
): {
  score: number;
  reasons: string[];
} {
  const timestamps = clicks
    .map((c) => new Date((c as any).timestamp))
    .sort((a, b) => a.getTime() - b.getTime());
  let velocityScore = 0;
  const reasons: string[] = [];

  // 1. Original: 2+ clicks within 60 minutes
  let hasBurst = false;
  for (let i = 0; i < timestamps.length - 1; i++) {
    const t1 = timestamps[i].getTime();
    const t2 = timestamps[i + 1].getTime();
    if (t2 - t1 <= 60 * 60 * 1000) {
      hasBurst = true;
      break;
    }
  }
  if (hasBurst) {
    velocityScore += config.clickWeights.velocityBurstBonus;
    reasons.push("Quick engagement burst (1h)");
  }

  // 2. NEW: Rapid fire (5+ clicks in 2 hours)
  for (let i = 0; i <= timestamps.length - 5; i++) {
    const windowStart = timestamps[i].getTime();
    const windowEnd = timestamps[i + 4].getTime();
    if (windowEnd - windowStart <= 2 * 60 * 60 * 1000) {
      velocityScore += config.clickWeights.rapidFireBonus;
      reasons.push("Rapid-fire clicking (2h)");
      break;
    }
  }

  // 3. NEW: Marathon session (10+ clicks in 1 day)
  for (let i = 0; i <= timestamps.length - 10; i++) {
    const windowStart = timestamps[i].getTime();
    const windowEnd = timestamps[i + 9].getTime();
    if (windowEnd - windowStart <= 24 * 60 * 60 * 1000) {
      velocityScore += config.clickWeights.marathonSessionBonus;
      reasons.push("Marathon research session (1 day)");
      break;
    }
  }

  return { score: velocityScore, reasons };
}

// ENHANCED: Conversion proximity and clustering detection
function detectConversionProximity(
  events: ActivityEvent[],
  config: ScoringConfig,
): {
  score: number;
  reasons: string[];
} {
  let proximityScore = 0;
  const reasons: string[] = [];

  const leads = events.filter((e) => (e as any).event === "lead");
  const sales = events.filter((e) => (e as any).event === "sale");

  // 1. Multiple leads close together (clustering)
  if (leads.length >= 2) {
    const leadTimestamps = leads.map((l) => new Date((l as any).timestamp));
    for (let i = 0; i < leadTimestamps.length - 1; i++) {
      const timeDiff =
        leadTimestamps[i + 1].getTime() - leadTimestamps[i].getTime();
      if (timeDiff <= 7 * 24 * 60 * 60 * 1000) {
        // Within 7 days
        proximityScore += config.conversionWeights.leadProximityBonus;
        reasons.push("Multiple leads within 7 days");
        break;
      }
    }
  }

  // 2. Recent sale bonus (last 7 days)
  if (sales.length > 0) {
    const mostRecentSale = sales.reduce((latest, sale) => {
      const saleTime = new Date((sale as any).timestamp);
      const latestTime = new Date((latest as any).timestamp);
      return saleTime > latestTime ? sale : latest;
    });

    const daysSinceLastSale =
      (Date.now() - new Date((mostRecentSale as any).timestamp).getTime()) /
      (24 * 60 * 60 * 1000);
    if (daysSinceLastSale <= 7) {
      proximityScore += config.conversionWeights.saleRecencyBonus;
      reasons.push(`Recent sale (${Math.floor(daysSinceLastSale)}d ago)`);
    }
  }

  // 3. Lead-to-sale velocity (converted within 30 days)
  leads.forEach((lead) => {
    const leadTime = new Date((lead as any).timestamp);
    const quickSales = sales.filter((sale) => {
      const saleTime = new Date((sale as any).timestamp);
      const timeDiff = saleTime.getTime() - leadTime.getTime();
      return timeDiff > 0 && timeDiff <= 30 * 24 * 60 * 60 * 1000;
    });

    if (quickSales.length > 0) {
      proximityScore += 10;
      reasons.push("Fast lead-to-sale conversion");
    }
  });

  return { score: proximityScore, reasons };
}

// Internal function that computes detailed lead scoring information
function computeLeadScoreInternal({
  clicks,
  events,
  config = DEFAULT_CONFIG,
  now = new Date(),
}: {
  clicks: ClickEvent[];
  events: ActivityEvent[];
  config?: ScoringConfig;
  now?: Date;
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
  let rawScore = 0;
  const breakdown = {
    clickScore: 0,
    streakScore: 0,
    velocityScore: 0,
    conversionScore: 0,
    proximityScore: 0,
  };
  const hotWindows: HotWindow[] = [];

  // Aggregate ALL events (clicks + conversions) by day for streak calculation
  const eventsByDay: Record<string, number> = {};
  const clicksByDay: Record<string, number> = {};
  
  // Add clicks to both eventsByDay and clicksByDay
  const sortedClicks = [...clicks].sort((a, b) => {
    const ta = new Date((a as any).timestamp).getTime();
    const tb = new Date((b as any).timestamp).getTime();
    return ta - tb;
  });
  for (const c of sortedClicks) {
    const ts = new Date((c as any).timestamp);
    const dayKey = ts.toISOString().slice(0, 10);
    clicksByDay[dayKey] = (clicksByDay[dayKey] || 0) + 1;
    eventsByDay[dayKey] = (eventsByDay[dayKey] || 0) + 1;
  }
  
  // Add conversion events to eventsByDay
  const sortedEvents = [...events].sort((a, b) => {
    const ta = new Date((a as any).timestamp).getTime();
    const tb = new Date((b as any).timestamp).getTime();
    return ta - tb;
  });
  for (const e of sortedEvents) {
    if ((e as any).event === "lead" || (e as any).event === "sale") {
      const ts = new Date((e as any).timestamp);
      const dayKey = ts.toISOString().slice(0, 10);
      eventsByDay[dayKey] = (eventsByDay[dayKey] || 0) + 1;
    }
  }

  // Calculate click scores
  let clickContribution = 0;
  Object.entries(clicksByDay).forEach(([day, count]) => {
    const dayDate = new Date(`${day}T00:00:00Z`);
    const effective = Math.min(config.clickWeights.dailyClickCap, count);
    const inc =
      effective *
      config.clickWeights.clickPerUnit *
      recencyDecay(dayDate, config.decayRates.clickDecayDays);
    clickContribution += inc;
  });
  breakdown.clickScore = clickContribution;
  rawScore += clickContribution;

  // ENHANCED: Streak bonuses with more granular detection
  const last14: string[] = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    last14.push(d.toISOString().slice(0, 10));
  }
  const activeDays = last14.filter((d) => (eventsByDay[d] || 0) >= 1).length;

  let streakContribution = 0;
  // NEW: 7+ active days bonus
  if (activeDays >= 10) {
    streakContribution += config.streakWeights.streak7DaysBonus;
  } else if (activeDays >= 8) {
    streakContribution += config.streakWeights.streak5DaysBonus;
  } else if (activeDays >= 4) {
    streakContribution += config.streakWeights.streak3DaysBonus;
  }

  // ENHANCED: Flexible 14-day streak window with advanced pattern detection
  const bestFlex = computeBestFlexStreakWindow(eventsByDay, now, config, 14);
  if (bestFlex) {
    // Enhanced scoring with new pattern bonuses
    const flexBase =
      bestFlex.activeDays * config.streakWeights.flexStreakActivePerDay +
      bestFlex.length * config.streakWeights.flexStreakLengthPerDay -
      bestFlex.zeros * config.streakWeights.flexStreakGapPenalty +
      (bestFlex.altPattern
        ? config.streakWeights.flexStreakAltPatternBonus
        : 0);

    // Additional recency weighting: more weight if window touches today
    const touchesToday = bestFlex.endIdx === 13; // index 13 is today in our 14-day array
    const recencyBoost = touchesToday ? 1.2 : 1.0;

    const flexScore = clamp(
      Math.round(flexBase * recencyBoost),
      0,
      config.streakWeights.flexStreakMaxBonus,
    );
    streakContribution += flexScore;

    // Create hot window for the streak period
    if (flexScore > 10) {
      const startDate = new Date(now);
      startDate.setDate(now.getDate() - (13 - bestFlex.startIdx));
      const endDate = new Date(now);
      endDate.setDate(now.getDate() - (13 - bestFlex.endIdx));
      
      const reasons: string[] = [];
      if (bestFlex.altPattern) reasons.push("Alternating pattern");
      if (bestFlex.crescendoPattern) reasons.push("Increasing activity");
      if (bestFlex.burstPattern) reasons.push("High activity bursts");
      if (bestFlex.consistency > 0.6) reasons.push("Consistent engagement");
      
      hotWindows.push({
        start: startDate.toISOString().slice(0, 10),
        end: endDate.toISOString().slice(0, 10),
        score: flexScore,
        reasons,
      });
    }
  }
  breakdown.streakScore = streakContribution;
  rawScore += streakContribution;

  // ENHANCED: Advanced velocity burst detection
  const velocityBursts = detectAdvancedVelocityBursts(clicks, config);
  breakdown.velocityScore = velocityBursts.score;
  rawScore += velocityBursts.score;

  // Add velocity hot windows
  if (velocityBursts.score > 0 && velocityBursts.reasons.length > 0) {
    // Find the date range for velocity bursts
    const sortedClickDates = sortedClicks.map(c => new Date((c as any).timestamp));
    if (sortedClickDates.length > 0) {
      const startDate = sortedClickDates[0];
      const endDate = sortedClickDates[sortedClickDates.length - 1];
      
      hotWindows.push({
        start: startDate.toISOString().slice(0, 10),
        end: endDate.toISOString().slice(0, 10),
        score: velocityBursts.score,
        reasons: velocityBursts.reasons,
      });
    }
  }

  // ENHANCED: Conversions with configurable decay rates
  let conversionContribution = 0;
  for (const e of events) {
    const ts = new Date((e as any).timestamp);
    if ((e as any).event === "lead") {
      const leadInc =
        config.conversionWeights.lead *
        recencyDecay(ts, config.decayRates.leadDecayDays);
      conversionContribution += leadInc;
    } else if ((e as any).event === "sale") {
      const saleInc =
        config.conversionWeights.sale *
        recencyDecay(ts, config.decayRates.saleDecayDays);
      conversionContribution += saleInc;
    }
  }
  breakdown.conversionScore = conversionContribution;
  rawScore += conversionContribution;

  // NEW: Enhanced conversion proximity detection
  const conversionProximity = detectConversionProximity(events, config);
  breakdown.proximityScore = conversionProximity.score;
  rawScore += conversionProximity.score;

  // Add conversion hot windows
  if (conversionProximity.score > 0 && conversionProximity.reasons.length > 0) {
    const conversionEvents = events.filter(e => (e as any).event === "lead" || (e as any).event === "sale");
    if (conversionEvents.length > 0) {
      const sortedConversions = conversionEvents
        .map(e => new Date((e as any).timestamp))
        .sort((a, b) => a.getTime() - b.getTime());
      
      hotWindows.push({
        start: sortedConversions[0].toISOString().slice(0, 10),
        end: sortedConversions[sortedConversions.length - 1].toISOString().slice(0, 10),
        score: conversionProximity.score,
        reasons: conversionProximity.reasons,
      });
    }
  }

  // Normalize and cap to 0-100
  const normalizedScore = clamp(Math.round(rawScore), 0, 100);

  // Calculate tier based on score
  let tier: 0 | 1 | 2 | 3;
  if (normalizedScore >= 75) {
    tier = 3; // very hot
  } else if (normalizedScore >= 50) {
    tier = 2; // hot
  } else if (normalizedScore >= 25) {
    tier = 1; // warm
  } else {
    tier = 0; // cold
  }

  return {
    score: normalizedScore,
    tier,
    hotWindows,
    breakdown,
  };
}

export function computeLeadScore({
  clicks,
  events,
  config = DEFAULT_CONFIG,
  now = new Date(),
}: {
  clicks: ClickEvent[];
  events: ActivityEvent[];
  config?: ScoringConfig;
  now?: Date;
}): number {
  const result = computeLeadScoreInternal({ clicks, events, config, now });
  return result.score;
}

export function getLeadScoreDetails({
  clicks,
  events,
  config = DEFAULT_CONFIG,
  now = new Date(),
}: {
  clicks: ClickEvent[];
  events: ActivityEvent[];
  config?: ScoringConfig;
  now?: Date;
}): HotSummary {
  const result = computeLeadScoreInternal({ clicks, events, config, now });
  return {
    score: result.score,
    tier: result.tier,
    hotWindows: result.hotWindows,
  };
}