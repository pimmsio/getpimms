import { withWorkspace } from "@/lib/auth";
import { analyticsQuerySchema } from "@/lib/zod/schemas/analytics";
import { getAnalytics } from "@/lib/analytics/get-analytics";
import { throwIfEventsUsageExceeded } from "@/lib/api/links/usage-checks";
import { prisma } from "@dub/prisma";
import { NextResponse } from "next/server";

// Simple CSV conversion function
function arrayToCSV(data: any[]): string {
  if (data.length === 0) return "";
  
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(","), // Header row
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Escape commas and quotes in values
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(",")
    )
  ];
  
  return csvRows.join("\n");
}

// GET /api/analytics/link-insights-export – export link insights table as CSV
export const GET = withWorkspace(
  async ({ searchParams, workspace }) => {
    throwIfEventsUsageExceeded(workspace);

    const parsedParams = analyticsQuerySchema.parse(searchParams);

    try {
      console.log("🔍 Starting link insights export...");

      // Get top links data with all metrics
      const topLinksData = await getAnalytics({
        ...parsedParams,
        event: "composite",
        groupBy: "top_links",
        workspaceId: workspace.id,
      });

      // Get timeseries data - try custom pipe first, fallback to standard
      let linkTimeseriesData;
      try {
        linkTimeseriesData = await getAnalytics({
          ...parsedParams,
          event: "composite",
          groupBy: "link_timeseries",
          workspaceId: workspace.id,
        });
      } catch (error) {
        // Fallback to standard timeseries
        linkTimeseriesData = await getAnalytics({
          ...parsedParams,
          event: "composite",
          groupBy: "timeseries",
          workspaceId: workspace.id,
        });
      }

      // Group link timeseries data by link_id
      const linkTimeseriesMap = new Map<string, any[]>();
      if (Array.isArray(linkTimeseriesData)) {
        linkTimeseriesData.forEach((item: any) => {
          const linkId = item.link_id || 'global'; // Handle both custom and standard pipe
          if (!linkTimeseriesMap.has(linkId)) {
            linkTimeseriesMap.set(linkId, []);
          }
          linkTimeseriesMap.get(linkId)!.push({
            date: item.start,
            clicks: item.clicks || 0,
            leads: item.leads || 0,
            sales: item.sales || 0,
            saleAmount: item.saleAmount || 0,
          });
        });
      }

      // Get link metadata from database
      const linkIds = Array.isArray(topLinksData) ? topLinksData.map((item: any) => item.link_id).filter(Boolean) : [];
      const links = await prisma.link.findMany({
        where: {
          id: { in: linkIds },
          projectId: workspace.id,
        },
        select: {
          id: true,
          domain: true,
          key: true,
          url: true,
          comments: true,
          createdAt: true,
        },
      });

      // Combine data for export - exactly like the table
      const exportData = links.map(link => {
        const linkData = Array.isArray(topLinksData) ? topLinksData.find((item: any) => item.link_id === link.id) : null;
        const timeseriesData = linkTimeseriesMap.get(link.id) || [];
        
        const shortLink = `${link.domain}${link.key === '_root' ? '' : `/${link.key}`}`;
        
        // Calculate metrics exactly like the frontend
        const clicks = linkData?.clicks || 0;
        const leads = linkData?.leads || 0;
        const sales = linkData?.sales || 0;
        const saleAmount = linkData?.saleAmount || 0;
        
        const rpc = clicks > 0 ? ((saleAmount / 100) / clicks).toFixed(1) : "0.0";
        const cvr = clicks > 0 ? ((leads / clicks) * 100).toFixed(0) : "0";
        const closed = leads > 0 ? ((sales / leads) * 100).toFixed(0) : "0";
        const aov = sales > 0 ? ((saleAmount / 100) / sales).toFixed(0) : "0";

        // Base row data
        const rowData: any = {
          "Short Link": shortLink,
          "Destination URL": link.url,
          "Comments": link.comments || "",
          "Created At": link.createdAt.toISOString().split('T')[0],
          "Total Clicks": clicks,
          "Total Leads": leads,
          "Total Sales": `€${(saleAmount / 100).toFixed(2)}`,
          "RPC": `€${rpc}`,
          "CVR": `${cvr}%`,
          "Closed": `${closed}%`,
          "AOV": `€${aov}`,
        };

        // Add daily data columns
        timeseriesData.forEach((day, index) => {
          const dateStr = new Date(day.date).toLocaleDateString('en-CA'); // YYYY-MM-DD format
          rowData[`${dateStr} - Clicks`] = day.clicks;
          rowData[`${dateStr} - Leads`] = day.leads;
          rowData[`${dateStr} - Sales`] = `€${(day.saleAmount / 100).toFixed(2)}`;
        });

        return rowData;
      });

      console.log("📄 Generated export data for", exportData.length, "links");

      if (exportData.length === 0) {
        return new NextResponse("No data available for export", {
          status: 404,
          headers: { "Content-Type": "text/plain" },
        });
      }

      // Convert to CSV
      const csvData = arrayToCSV(exportData);

      // Return CSV file
      return new NextResponse(csvData, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="PIMMS Link Insights Export - ${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });

    } catch (error) {
      console.error("❌ Export error:", error);
      return NextResponse.json({ error: "Failed to export data" }, { status: 500 });
    }
  },
  {
    requiredPermissions: ["analytics.read"],
  },
);
