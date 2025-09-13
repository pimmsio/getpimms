import { Button } from "@dub/ui";
import { Download } from "@dub/ui/icons";
import { useContext, useState } from "react";
import { toast } from "sonner";
import { AnalyticsContext } from "./analytics-provider";

export default function LinkInsightsExportButton() {
  const [loading, setLoading] = useState(false);
  const { queryString } = useContext(AnalyticsContext);

  async function exportData() {
    setLoading(true);
    try {
      // Force event=composite to get all metrics
      let enhancedQueryString = queryString.includes('event=') 
        ? queryString.replace(/event=[^&]*/, 'event=composite')
        : `${queryString}&event=composite`;

      const response = await fetch(`/api/analytics/link-insights-export?${enhancedQueryString}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(response.statusText);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `PIMMS Link Insights Export - ${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export error:", error);
      throw new Error("Failed to export data");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      text="Export CSV"
      variant="outline"
      icon={<Download className="h-4 w-4" />}
      className="h-9"
      onClick={() => {
        toast.promise(exportData(), {
          loading: "Exporting link insights...",
          success: "CSV exported successfully",
          error: (error) => error.message,
        });
      }}
      loading={loading}
    />
  );
}
