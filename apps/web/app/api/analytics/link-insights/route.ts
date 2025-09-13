import { getAnalytics } from "@/lib/analytics/get-analytics";
import { groupTimeseriesData } from "@/lib/analytics/utils/group-timeseries-data";
import { validDateRangeForLinkInsights } from "@/lib/analytics/utils/valid-date-range-for-link-insights";
import { withWorkspace } from "@/lib/auth";
import { analyticsQuerySchema } from "@/lib/zod/schemas/analytics";
import { prismaEdge } from "@dub/prisma/edge";
import { linkConstructor, punyEncode } from "@dub/utils";
import { decodeKeyIfCaseSensitive } from "@/lib/api/links/case-sensitivity";
import { NextResponse } from "next/server";

// GET /api/analytics/link-insights - get links with their timeseries data
export const GET = withWorkspace(
  async ({ workspace, searchParams, req }) => {
    const parsedParams = analyticsQuerySchema.parse(searchParams);
    
    // Validate date range for link insights (max 1 month)
    validDateRangeForLinkInsights({
      interval: parsedParams.interval,
      start: parsedParams.start,
      end: parsedParams.end,
      throwError: true,
    });
    
    // Removed groupBy parameter - using days only for now

    try {
      console.log("🔍 Starting analytics fetch...");
      console.log("📊 Params:", { ...parsedParams, workspaceId: workspace.id });
      
      // Get top links data with all metrics
      console.log("🔗 Fetching top links...");
      const topLinksData = await getAnalytics({
        ...parsedParams,
        event: "composite", // Force composite to get clicks, leads, sales
        groupBy: "top_links",
        workspaceId: workspace.id,
      });
      console.log("✅ Top links result:", { 
        isArray: Array.isArray(topLinksData), 
        count: Array.isArray(topLinksData) ? topLinksData.length : 'not array',
        sample: Array.isArray(topLinksData) ? topLinksData.slice(0, 1) : topLinksData
      });

      // TEST: Try standard timeseries first to see if we have data at all
      console.log("🧪 Testing standard timeseries first...");
      const standardTimeseries = await getAnalytics({
        ...parsedParams,
        event: "composite",
        groupBy: "timeseries",
        workspaceId: workspace.id,
      });
      console.log("🧪 Standard timeseries result:", { 
        isArray: Array.isArray(standardTimeseries), 
        count: Array.isArray(standardTimeseries) ? standardTimeseries.length : 'not array',
        sample: Array.isArray(standardTimeseries) ? standardTimeseries.slice(0, 1) : standardTimeseries
      });

      // Get timeseries data grouped by link_id using our new pipe
      console.log("📈 Fetching link timeseries with our custom pipe...");
      const linkTimeseriesData = await getAnalytics({
        ...parsedParams,
        event: "composite", // Force composite to get clicks, leads, sales
        groupBy: "link_timeseries", // Use our new pipe
        workspaceId: workspace.id,
      });
      console.log("✅ Link timeseries result:", { 
        isArray: Array.isArray(linkTimeseriesData), 
        count: Array.isArray(linkTimeseriesData) ? linkTimeseriesData.length : 'not array',
        sample: Array.isArray(linkTimeseriesData) ? linkTimeseriesData.slice(0, 2) : linkTimeseriesData
      });

      if (!Array.isArray(topLinksData)) {
        return NextResponse.json([]);
      }

      // Get detailed link information including UTM parameters
      const linkIds = topLinksData.map((item: any) => item.id).filter(Boolean);
      
      const links = await prismaEdge.link.findMany({
        where: {
          projectId: workspace.id,
          id: {
            in: linkIds,
          },
        },
        select: {
          id: true,
          domain: true,
          key: true,
          url: true,
          comments: true,
          title: true,
          createdAt: true,
          utm_source: true,
          utm_medium: true,
          utm_campaign: true,
          utm_term: true,
          utm_content: true,
        },
      });

      // Group link timeseries data by link_id
      console.log("🗂️ Grouping timeseries data by link_id...");
      const linkTimeseriesMap = new Map<string, any[]>();
      
      if (Array.isArray(linkTimeseriesData)) {
        console.log("📋 Processing", linkTimeseriesData.length, "timeseries items");
        linkTimeseriesData.forEach((item: any, index) => {
          const linkId = item.link_id;
          if (index < 3) { // Log first 3 items for debugging
            console.log(`📈 Item ${index}:`, { linkId, start: item.start, clicks: item.clicks, leads: item.leads, sales: item.sales });
          }
          
          if (!linkTimeseriesMap.has(linkId)) {
            linkTimeseriesMap.set(linkId, []);
          }
          
          let processedItem = {
            start: item.start,
            clicks: item.clicks || 0,
            leads: item.leads || 0,
            sales: item.sales || 0,
            saleAmount: item.saleAmount || 0,
          };
          
          linkTimeseriesMap.get(linkId)!.push(processedItem);
        });
        console.log("🗂️ Created map with", linkTimeseriesMap.size, "links");
        console.log("🔑 Link IDs in map:", Array.from(linkTimeseriesMap.keys()).slice(0, 5));
        
        // Keep daily data as-is
        console.log("📅 Using daily data only");
      } else {
        console.log("❌ linkTimeseriesData is not an array:", typeof linkTimeseriesData);
      }

      // Map links with their metadata (no individual timeseries fetching)
      const linksWithMetadata = topLinksData.map((linkData: any) => {
        const link = links.find((l) => l.id === linkData.id);
        if (!link) return null;

        link.key = decodeKeyIfCaseSensitive({
          domain: link.domain,
          key: link.key,
        });

        return {
          id: link.id,
          domain: link.domain,
          key: punyEncode(link.key),
          url: link.url,
          shortLink: linkConstructor({
            domain: link.domain,
            key: punyEncode(link.key),
          }),
          comments: link.comments,
          title: link.title || null,
          createdAt: link.createdAt.toISOString(),
          utmSource: link.utm_source,
          utmMedium: link.utm_medium,
          utmCampaign: link.utm_campaign,
          utmTerm: link.utm_term,
          utmContent: link.utm_content,
          // Use the totals from top links
          clicks: linkData.clicks || 0,
          leads: linkData.leads || 0,
          sales: linkData.sales || 0,
          saleAmount: linkData.saleAmount || 0,
          // Get specific timeseries data for this link
          timeseriesData: linkTimeseriesMap.get(linkData.id) || [],
        };
      }).filter(item => item !== null);

      console.log("Debug - Parsed params:", parsedParams);
      console.log("Debug - Top links data count:", Array.isArray(topLinksData) ? topLinksData.length : 'not array');
      console.log("Debug - Link timeseries data count:", Array.isArray(linkTimeseriesData) ? linkTimeseriesData.length : 'not array');
      console.log("Debug - Link timeseries map size:", linkTimeseriesMap.size);
      console.log("Debug - Links from DB:", links.length);

      // Sort by creation date (oldest first)
      const result = linksWithMetadata.sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      console.log("Debug - Final result count:", result.length);

      return NextResponse.json({
        links: result,
        timeseries: linkTimeseriesData, // Return raw link timeseries data for debugging
      });

    } catch (error) {
      console.error("Link insights error:", error);
      return NextResponse.json(
        { error: "Failed to fetch link insights data" },
        { status: 500 }
      );
    }
  },
  {
    requiredPermissions: ["analytics.read"],
  },
);
