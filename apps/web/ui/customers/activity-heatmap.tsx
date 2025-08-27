"use client";

import { cn } from "@dub/utils";
import { useState } from "react";

interface DayActivity {
  date: string;
  count: number;
  events?: Array<{
    type: "click" | "lead" | "sale";
    timestamp: string;
    eventName?: string;
  }>;
}

interface ActivityHeatmapProps {
  customerId: string;
  customerActivity?: any;
  clickHistory?: any; // Also pass click history for complete data
  className?: string;
}

export function ActivityHeatmap({ customerId, customerActivity, clickHistory, className }: ActivityHeatmapProps) {
  const [hoveredDay, setHoveredDay] = useState<DayActivity | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Generate last 14 days with real data
  const days: DayActivity[] = [];
  const today = new Date();
  
  for (let i = 13; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    // Count ALL events for this day (conversions + clicks)
    let dayEvents: any[] = [];
    
    // Add conversion events for this day
    if (customerActivity?.events) {
      const conversions = customerActivity.events.filter((event: any) => {
        const eventDate = new Date(event.timestamp).toISOString().split('T')[0];
        return eventDate === dateStr;
      });
      dayEvents = [...dayEvents, ...conversions];
    }
    
    // Add click events for this day
    if (clickHistory?.clickHistory) {
      const clicks = clickHistory.clickHistory.filter((event: any) => {
        const eventDate = new Date(event.timestamp).toISOString().split('T')[0];
        return eventDate === dateStr;
      });
      dayEvents = [...dayEvents, ...clicks];
    }
    
    days.push({
      date: dateStr,
      count: dayEvents.length,
      events: dayEvents.map((event: any) => ({
        type: event.event,
        timestamp: event.timestamp,
        eventName: event.eventName || event.event
      }))
    });
  }

  // Find the longest engagement span (allowing single-day gaps)
  // Count the span from first to last active day in a flexible streak
  const activityBinary = days.map((d) => (d.count > 0 ? 1 : 0));
  let bestStreak = 0;
  
  // Find all potential streak windows
  for (let start = 0; start < activityBinary.length; start++) {
    if (activityBinary[start] === 1) { // Start from an active day
      let end = start;
      let gapCount = 0;
      let consecutiveGaps = 0;
      
      // Extend the window as far as possible
      for (let i = start + 1; i < activityBinary.length; i++) {
        if (activityBinary[i] === 1) {
          end = i;
          consecutiveGaps = 0; // Reset consecutive gap counter
        } else {
          consecutiveGaps++;
          if (consecutiveGaps >= 2) {
            break; // Two consecutive gaps break the streak
          }
          gapCount++;
        }
      }
      
      // Calculate the span (days from start to end, inclusive)
      if (end > start) {
        const span = end - start + 1;
        bestStreak = Math.max(bestStreak, span);
      }
    }
  }

  const getIntensity = (count: number) => {
    if (count === 0) return 0;
    if (count <= 2) return 1;
    if (count <= 4) return 2;
    return 3;
  };

  const getIntensityColor = (intensity: number) => {
    switch (intensity) {
      case 0: return "bg-neutral-100";
      case 1: return "bg-emerald-200";
      case 2: return "bg-emerald-400";
      case 3: return "bg-emerald-600";
      default: return "bg-neutral-100";
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className={cn("relative", className)}>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-medium text-neutral-900">Last 14 days activity</h3>
            <p className="text-xs text-neutral-500 mt-1">Hover over squares to see daily activity</p>
          </div>
          <div className="flex items-center gap-3 text-xs text-neutral-600">
            {bestStreak >= 4 && (
              <div className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700 ring-1 ring-emerald-200">
                <span className="font-medium">Streak</span>
                <span>·</span>
                <span>{bestStreak} days</span>
              </div>
            )}
            <span>Less</span>
            <div className="flex gap-1">
              {[0, 1, 2, 3].map(intensity => (
                <div
                  key={intensity}
                  className={cn(
                    "size-3 rounded",
                    getIntensityColor(intensity)
                  )}
                />
              ))}
            </div>
            <span>More</span>
          </div>
        </div>
        
        {/* Heatmap grid */}
        <div className="flex flex-wrap gap-1 max-w-fit">
          {days.map((day, index) => {
            const intensity = getIntensity(day.count);
            return (
              <div
                key={day.date}
                className={cn(
                  "size-6 rounded cursor-pointer transition-all duration-200 hover:scale-110 hover:z-10 relative",
                  getIntensityColor(intensity),
                  intensity > 0 && "hover:ring-2 hover:ring-emerald-400 hover:ring-opacity-60 hover:shadow-lg"
                )}
                onMouseEnter={(e) => {
                  setHoveredDay(day);
                  setMousePosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseMove={(e) => {
                  setMousePosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseLeave={() => setHoveredDay(null)}
              />
            );
          })}
        </div>

        {/* Tooltip */}
        {hoveredDay && (
          <div 
            className="fixed z-50 bg-neutral-900 text-white text-xs rounded-lg p-3 shadow-lg pointer-events-none"
            style={{
              left: mousePosition.x + 10,
              top: mousePosition.y - 60,
            }}
          >
            <div className="font-medium">
              {hoveredDay.count} event{hoveredDay.count !== 1 ? 's' : ''} on {formatDate(hoveredDay.date)}
            </div>
            {hoveredDay.events && hoveredDay.events.length > 0 && (
              <div className="mt-1 space-y-0.5">
                {hoveredDay.events.slice(0, 3).map((event, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-neutral-300">
                    <span className={cn(
                      "size-1.5 rounded-full",
                      event.type === "sale" ? "bg-green-400" :
                      event.type === "lead" ? "bg-blue-400" : "bg-neutral-400"
                    )} />
                    <span>{event.type}</span>
                  </div>
                ))}
                {hoveredDay.events.length > 3 && (
                  <div className="text-xs text-neutral-400">+{hoveredDay.events.length - 3} more</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
