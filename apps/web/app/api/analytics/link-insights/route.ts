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
      // Get top links data with all metrics
      const topLinksData = await getAnalytics({
        ...parsedParams,
        event: "composite", // Force composite to get clicks, leads, sales
        groupBy: "top_links",
        workspaceId: workspace.id,
      });

      // Get timeseries data grouped by link_id using our new pipe
      const linkTimeseriesData = await getAnalytics({
        ...parsedParams,
        event: "composite", // Force composite to get clicks, leads, sales
        groupBy: "link_timeseries", // Use our new pipe
        workspaceId: workspace.id,
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
          description: true,
          createdAt: true,
          utm_source: true,
          utm_medium: true,
          utm_campaign: true,
          utm_term: true,
          utm_content: true,
          tags: {
            select: {
              tag: {
                select: {
                  id: true,
                  name: true,
                  color: true,
                },
              },
            },
          },
        },
      });

      // Group link timeseries data by link_id
      const linkTimeseriesMap = new Map<string, any[]>();
      
      if (Array.isArray(linkTimeseriesData)) {
        linkTimeseriesData.forEach((item: any) => {
          const linkId = item.link_id;
          
          if (!linkTimeseriesMap.has(linkId)) {
            linkTimeseriesMap.set(linkId, []);
          }
          
          linkTimeseriesMap.get(linkId)!.push({
            start: item.start,
            clicks: item.clicks || 0,
            leads: item.leads || 0,
            sales: item.sales || 0,
            saleAmount: item.saleAmount || 0,
          });
        });
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
          description: link.description || null,
          createdAt: link.createdAt.toISOString(),
          utmSource: link.utm_source,
          utmMedium: link.utm_medium,
          utmCampaign: link.utm_campaign,
          utmTerm: link.utm_term,
          utmContent: link.utm_content,
          tags: link.tags.map((t) => t.tag),
          // Use the totals from top links
          clicks: linkData.clicks || 0,
          leads: linkData.leads || 0,
          sales: linkData.sales || 0,
          saleAmount: linkData.saleAmount || 0,
          // Get specific timeseries data for this link
          timeseriesData: linkTimeseriesMap.get(linkData.id) || [],
        };
      }).filter(item => item !== null);

      // Sort by creation date (oldest first)
      const result = linksWithMetadata.sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

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
