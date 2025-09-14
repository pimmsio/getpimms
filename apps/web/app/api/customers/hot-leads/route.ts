import { withWorkspace } from "@/lib/auth";
import { getHotScoreLabel } from "@/ui/analytics/events/hot-score-icons";
import { prisma } from "@dub/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const querySchema = z.object({
  start: z.string().optional(),
  end: z.string().optional(),
  interval: z.string().optional(),
});

// GET /api/customers/hot-leads - get hot lead counts by score range
export const GET = withWorkspace(async ({ workspace, searchParams }) => {
  console.log("🔥 Hot leads API called with workspace:", workspace.id, workspace.name);
  
  try {
    const { start, end, interval } = querySchema.parse(searchParams);
    console.log("🔍 Raw params:", { start, end, interval });
    
    // Calculate time range - default to last 24 hours if not provided
    let startDate: Date;
    let endDate = new Date();
    
    console.log("🕐 Current time (endDate):", endDate.toISOString());
    
    if (start && end) {
      startDate = new Date(start);
      endDate = new Date(end);
      console.log("📅 Using provided date range:", { start, end });
      console.log("📅 Parsed dates:", { startDate: startDate.toISOString(), endDate: endDate.toISOString() });
    } else if (interval) {
      console.log("⏱️ Using interval:", interval);
      // Parse interval (e.g., "24h", "7d", "30d")
      const num = parseInt(interval);
      const unit = interval.slice(-1);
      console.log("🔢 Parsed interval - num:", num, "unit:", unit);
      
      const multiplier = unit === 'h' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
      console.log("📐 Multiplier:", multiplier, "ms");
      
      const totalMs = num * multiplier;
      console.log("⏰ Total milliseconds back:", totalMs);
      
      startDate = new Date(Date.now() - totalMs);
      console.log("📅 Calculated startDate:", startDate.toISOString());
    } else {
      // Default to last 24 hours
      console.log("🔄 Using default 24h");
      startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      console.log("📅 Default startDate:", startDate.toISOString());
    }
    
    console.log("📅 FINAL Time range:", { 
      startDate: startDate.toISOString(), 
      endDate: endDate.toISOString(),
      durationHours: (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60)
    });
    
    // Get customers whose lastEventAt is within the time filter (actual activity period)
    const customers = await prisma.customer.findMany({
      where: {
        projectId: workspace.id,
        hotScore: {
          gte: 0, // Has a hot score
        },
        lastEventAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        id: true,
        hotScore: true,
        lastEventAt: true,
        lastHotScoreAt: true,
      },
    });

    console.log("👥 Found customers with lastEventAt in time range:", customers.length);
    
    // Log first few customers to debug
    customers.slice(0, 5).forEach((customer, i) => {
      console.log(`🔍 Customer ${i + 1}:`, {
        id: customer.id,
        hotScore: customer.hotScore,
        lastEventAt: customer.lastEventAt?.toISOString(),
        lastHotScoreAt: customer.lastHotScoreAt?.toISOString(),
        isInRange: customer.lastEventAt ? 
          (customer.lastEventAt >= startDate && customer.lastEventAt <= endDate) : false
      });
    });

    // Group customers by hot score range
    const hotLeadCounts = {
      cold: 0,
      warm: 0,
      hot: 0,
      total: customers.length,
    };

    customers.forEach((customer) => {
      const score = customer.hotScore ?? 0;
      const label = getHotScoreLabel(score).toLowerCase();
      
      console.log("🎯 Customer score:", score, "label:", label, "lastEventAt:", customer.lastEventAt?.toISOString());
      
      if (label === "cold") {
        hotLeadCounts.cold++;
      } else if (label === "warm") {
        hotLeadCounts.warm++;
      } else if (label === "hot") {
        hotLeadCounts.hot++;
      }
    });

    console.log("📈 Final hot lead counts:", hotLeadCounts);
    return NextResponse.json(hotLeadCounts);
  } catch (error) {
    console.error("❌ Error fetching hot leads data:", error);
    console.error("Stack trace:", error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: "Failed to fetch hot leads data" },
      { status: 500 }
    );
  }
});