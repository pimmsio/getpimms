import { withAdmin } from "@/lib/auth";
import { prisma } from "@dub/prisma";
import { getBillingStartDate } from "@dub/utils";
import { NextResponse } from "next/server";

// GET /api/admin/user-reports – get user reports for admin
export const GET = withAdmin(async ({ searchParams }) => {
  try {
    const {
      search,
      plan,
      sortBy = "createdAt",
      sortOrder = "desc",
      page = "1",
      limit = "100", // Increased default limit as requested
    } = searchParams;

    const orderBy = {
      [sortBy]: sortOrder === "desc" ? "desc" : "asc",
    };

    // Parse plan filter
    const planFilters = plan ? plan.split(",") : null;

    // Get workspaces with their owners - ONLY workspace and user tables
    const workspaces = await prisma.project.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        plan: true,
        totalClicks: true,
        totalLinks: true,
        linksUsage: true,
        clicksUsage: true,
        billingCycleStart: true,
        createdAt: true,
        users: {
          where: { role: "owner" },
          select: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                emailVerified: true,
                createdAt: true,
              },
            },
          },
          take: 1,
        },
      },
      where: {
        ...(search && {
          OR: [
            { slug: { contains: search } },
            { users: { some: { user: { email: { contains: search } } } } },
          ],
        }),
        ...(planFilters && {
          plan: { in: planFilters },
        }),
      },
      orderBy,
    });

    const workspaceReports = workspaces.map((workspace) => {
      const owner = workspace.users[0]?.user || null;

      // Calculate days since billing cycle start (not calendar month)
      const billingStartDate = getBillingStartDate(workspace.billingCycleStart);
      const now = new Date();
      const daysSinceBillingStart = Math.floor(
        (now.getTime() - billingStartDate.getTime()) / (24 * 60 * 60 * 1000),
      );

      const totalLinks = workspace.totalLinks;
      const totalClicks = workspace.totalClicks;
      const monthlyLinks = workspace.linksUsage;
      const monthlyClicks = workspace.clicksUsage;

      // Calculate activity score for Free plans only
      let activityScore: number | null = null;
      let activityEmoji: string | null = null;

      if (workspace.plan === "free") {
        // Calculate workspace age
        const ageInDays = Math.max(1, Math.floor((Date.now() - new Date(workspace.createdAt).getTime()) / (24 * 60 * 60 * 1000)));
        const ageInMonths = Math.max(1, ageInDays / 30);
        
        // New account factor (more indulgent for newer accounts)
        const newAccountMultiplier = ageInDays <= 30 ? 2.0 : ageInDays <= 90 ? 1.5 : 1.0;
        
        // Recent activity metrics (weighted MORE heavily)
        const recentDailyLinks = daysSinceBillingStart > 0 ? monthlyLinks / daysSinceBillingStart : 0;
        const recentDailyClicks = daysSinceBillingStart > 0 ? monthlyClicks / daysSinceBillingStart : 0;
        
        // Historical metrics (weighted LESS)
        const historicalDailyLinks = totalLinks / ageInDays;
        const historicalDailyClicks = totalClicks / ageInDays;
        const clicksPerLink = totalLinks > 0 ? totalClicks / totalLinks : 0;

        // Score calculation (0-10) - focus on recent activity
        let score = 0;

        // Recent Links Activity (0-4 points) - MORE weight for monthly
        if (recentDailyLinks >= 2) score += 4;
        else if (recentDailyLinks >= 1) score += 3;
        else if (recentDailyLinks >= 0.5) score += 2;
        else if (recentDailyLinks >= 0.2) score += 1;

        // Recent Clicks Activity (0-4 points) - MORE weight for monthly
        if (recentDailyClicks >= 20) score += 4;
        else if (recentDailyClicks >= 10) score += 3;
        else if (recentDailyClicks >= 5) score += 2;
        else if (recentDailyClicks >= 2) score += 1;

        // Historical consistency bonus (0-2 points) - LESS weight
        if (historicalDailyLinks >= 0.5 && clicksPerLink >= 5) score += 2;
        else if (historicalDailyLinks >= 0.2 || clicksPerLink >= 3) score += 1;

        // Apply new account multiplier and cap at 10
        score = Math.min(10, Math.round(score * newAccountMultiplier));
        activityScore = score;

        // Emoji based on score
        if (activityScore >= 9) activityEmoji = "🤩";
        else if (activityScore >= 7) activityEmoji = "😊";
        else if (activityScore >= 5) activityEmoji = "🙂";
        else if (activityScore >= 3) activityEmoji = "😐";
        else activityEmoji = "😟";
      }

      return {
        // Workspace info (direct from workspace table)
        workspaceId: workspace.id,
        workspaceName: workspace.name,
        workspaceSlug: workspace.slug,
        plan: workspace.plan,
        createdAt: workspace.createdAt,
        daysSinceBillingStart,

        // Links stats (calculated from actual links, not workspace fields)
        totalLinks,
        thisMonthLinks: monthlyLinks,

        // Clicks stats (calculated from actual links, not workspace fields)
        totalClicks,
        thisMonthClicks: monthlyClicks,

        // Activity score for Free plans
        activityScore,
        activityEmoji,

        // Owner info (direct from user table)
        ownerId: owner?.id || null,
        ownerName: owner?.name || null,
        ownerEmail: owner?.email || null,
        ownerImage: owner?.image || null,
        ownerEmailVerified: owner?.emailVerified || null,
        ownerCreatedAt: owner?.createdAt || null,
      };
    });
    
    return NextResponse.json({
      workspaces: workspaceReports,
      totalCount: workspaceReports.length,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(workspaceReports.length / parseInt(limit)),
    });
  } catch (error) {
    console.error("Admin user reports error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch user reports",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
});
