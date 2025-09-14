import { useMemo } from "react";
import { useAnalyticsFilterOption } from "./utils";
import UTM from "./utm";

export default function UTMDetector() {
  const { data: utmSourcesData } = useAnalyticsFilterOption({
    groupBy: "utm_sources",
  });
  
  const { data: utmMediumsData } = useAnalyticsFilterOption({
    groupBy: "utm_mediums",
  });
  
  const { data: utmCampaignsData } = useAnalyticsFilterOption({
    groupBy: "utm_campaigns",
  });

  // Check if any UTM data exists
  const hasUTMData = useMemo(() => {
    return (
      (utmSourcesData && utmSourcesData.length > 0) ||
      (utmMediumsData && utmMediumsData.length > 0) ||
      (utmCampaignsData && utmCampaignsData.length > 0)
    );
  }, [utmSourcesData, utmMediumsData, utmCampaignsData]);

  // Only render UTM component if UTM data exists
  return hasUTMData ? <UTM /> : null;
}
