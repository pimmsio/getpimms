import { getParamsFromURL } from "@dub/utils";
import { ResponseLink } from "./links-container";
import { UtmBadge } from "./utm-badge";

export function LinkUtmColumns({ link }: { link: ResponseLink }) {
  // Get UTM values from link or URL params
  let utmSource = link.utm_source;
  let utmMedium = link.utm_medium;
  let utmCampaign = link.utm_campaign;
  
  if (!utmSource && !utmMedium && !utmCampaign && link.url) {
    const urlParams = getParamsFromURL(link.url);
    utmSource = urlParams.utm_source || null;
    utmMedium = urlParams.utm_medium || null;
    utmCampaign = urlParams.utm_campaign || null;
  }
  
  const hasAnyUtms = !!(utmSource || utmMedium || utmCampaign);
  
  if (!hasAnyUtms) {
    return null;
  }

  return (
    <div className="hidden items-start gap-2.5 lg:flex">
      {utmSource && <UtmBadge type="source" value={utmSource} />}
      {utmMedium && <UtmBadge type="medium" value={utmMedium} />}
      {utmCampaign && <UtmBadge type="campaign" value={utmCampaign} />}
    </div>
  );
}

