import { CustomerActivityResponse } from "@/lib/types";
import { FlameIcon } from "../analytics/events/flame-icon";
import { cn, formatDateTimeSmart } from "@dub/utils";
import { ProgressBar } from "@dub/ui";
import { ActivityHeatmap } from "./activity-heatmap";
import { card, text } from "@/ui/design/tokens";

interface LeadScoringDetailsProps {
  customerActivity?: CustomerActivityResponse;
  clickHistory?: any;
  customerId: string;
  isLoading: boolean;
}

export function LeadScoringDetails({ customerActivity, clickHistory, customerId, isLoading }: LeadScoringDetailsProps) {
  if (isLoading) {
    return (
      <div className={cn(card.base, "p-6")}>
        <div className="animate-pulse">
          <div className="mb-4 h-6 w-48 rounded bg-neutral-200"></div>
          <div className="space-y-4">
            <div className="h-24 rounded bg-neutral-100"></div>
            <div className="h-32 rounded bg-neutral-100"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!customerActivity?.hot) {
    return (
      <div className={cn(card.base, "p-6")}>
        <h2 className={cn(text.sectionTitle, "mb-4 text-lg")}>
          Contact scoring
        </h2>
        <div className="py-8 text-center text-neutral-500">
          No scoring data available
        </div>
      </div>
    );
  }

  const { hot } = customerActivity;
  const score = Math.round(hot.score);

  // Calculate actual metrics based on real data
  const clickCount = clickHistory?.clickHistory?.length || 0;
  const conversionEvents = customerActivity?.events?.filter(e => e.event === "lead" || e.event === "sale") || [];
  
  // Calculate click activity level
  const getClickActivity = () => {
    if (clickCount === 0) return { level: "None", description: "No activity" };
    if (clickCount === 1) return { level: "Low", description: "Single visit" };
    if (clickCount <= 5) return { level: "Moderate", description: "Few visits" };
    if (clickCount <= 15) return { level: "Good", description: "Regular visits" };
    return { level: "High", description: "Very active" };
  };

  // Calculate engagement consistency
  const getEngagementConsistency = () => {
    if (clickCount === 0) return { level: "None", description: "No engagement" };
    if (clickCount === 1) return { level: "Poor", description: "One-time visit" };
    
    // Check if clicks span multiple days
    const clickDates = clickHistory?.clickHistory?.map(click => new Date(click.timestamp).toDateString()) || [];
    const uniqueDays = new Set(clickDates).size;
    
    if (uniqueDays === 1) return { level: "Fair", description: "Single day activity" };
    if (uniqueDays <= 3) return { level: "Good", description: "Multi-day visits" };
    return { level: "Excellent", description: "Consistent engagement" };
  };

  // Calculate conversion activity
  const getConversionActivity = () => {
    if (conversionEvents.length === 0) return { level: "None", description: "No conversions" };
    if (conversionEvents.length === 1) return { level: "Initial", description: "First conversion" };
    if (conversionEvents.length <= 3) return { level: "Active", description: "Multiple conversions" };
    return { level: "Very Active", description: "Highly engaged" };
  };

  const clickActivity = getClickActivity();
  const engagementConsistency = getEngagementConsistency();
  const conversionActivity = getConversionActivity();

  const getTierInfo = (tier: number) => {
    switch (tier) {
      case 3: return { label: "Very Hot", color: "text-red-600", bgColor: "bg-red-50", borderColor: "border-red-200" };
      case 2: return { label: "Hot", color: "text-orange-600", bgColor: "bg-orange-50", borderColor: "border-orange-200" };
      case 1: return { label: "Warm", color: "text-yellow-600", bgColor: "bg-yellow-50", borderColor: "border-yellow-200" };
      default: return { label: "Cold", color: "text-gray-600", bgColor: "bg-gray-50", borderColor: "border-gray-200" };
    }
  };

  const tierInfo = getTierInfo(hot.tier);

  return (
    <div className={cn(card.base, "p-4")}>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className={cn(text.sectionTitle, "text-base")}>Contact scoring</h2>
          {hot.lastHotScoreAt && (
            <p className="mt-1 text-xs text-neutral-500">
              Last updated: {formatDateTimeSmart(hot.lastHotScoreAt)}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {hot.tier >= 1 ? (
            <FlameIcon 
              intensity={hot.tier >= 3 ? 3 : hot.tier >= 2 ? 2 : 1}
              className="size-6" 
            />
          ) : (
            <div className="flex size-6 items-center justify-center rounded-full bg-neutral-200">
              <div className="size-2 rounded-full bg-neutral-400" />
            </div>
          )}
          <span className="text-lg font-bold text-neutral-900">{score}/100</span>
          <span className={cn("text-sm font-medium", tierInfo.color)}>({tierInfo.label})</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <ProgressBar value={score} className="h-2" />
      </div>

      {/* Activity Summary */}
      <div className="mb-4 grid grid-cols-3 gap-3">
        <div className="rounded-lg bg-neutral-50 p-3 text-center">
          <div className="text-lg font-bold text-neutral-900">{clickCount}</div>
          <div className="text-xs text-neutral-500">{clickCount === 1 ? "Click" : "Clicks"}</div>
        </div>
        <div className="rounded-lg bg-neutral-50 p-3 text-center">
          <div className="text-lg font-bold text-neutral-900">{conversionEvents.length}</div>
          <div className="text-xs text-neutral-500">{conversionEvents.length === 1 ? "Contact" : "Contacts"}</div>
        </div>
        <div className="rounded-lg bg-neutral-50 p-3 text-center">
          <div className="text-lg font-bold text-neutral-900">
            {clickHistory?.clickHistory ? new Set(clickHistory.clickHistory.map(click => new Date(click.timestamp).toDateString())).size : 0}
          </div>
          <div className="text-xs text-neutral-500">Active Days</div>
        </div>
      </div>

      {/* Activity Heatmap */}
      <div className="mb-4">
        <ActivityHeatmap
          customerId={customerId}
          customerActivity={customerActivity}
          clickHistory={clickHistory}
          className="w-full"
        />
      </div>

      {/* Simple Summary */}
      <div className="rounded-lg bg-neutral-50 p-3">
        <div className="text-sm text-neutral-700">
          <strong>Summary:</strong> {clickCount} {clickCount === 1 ? "click" : "clicks"}, {conversionEvents.length} {conversionEvents.length === 1 ? "conversion" : "conversions"} across {clickHistory?.clickHistory ? new Set(clickHistory.clickHistory.map(click => new Date(click.timestamp).toDateString())).size : 0} {clickHistory?.clickHistory && new Set(clickHistory.clickHistory.map(click => new Date(click.timestamp).toDateString())).size === 1 ? "day" : "days"}. {hot.tier >= 2 ? "High engagement level." : hot.tier === 1 ? "Moderate engagement." : "Limited engagement so far."}
        </div>
      </div>
    </div>
  );
}
