import { TagProps } from "@/lib/types";
import { getParamsFromURL } from "@dub/utils";
import { ResponseLink } from "./links-container";
import TagBadge from "./tag-badge";
import { UtmBadge } from "./utm-badge";

export function LinkUtmColumns({ 
  link, 
  tags 
}: { 
  link: ResponseLink;
  tags?: TagProps[];
}) {
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
  const hasTags = tags && tags.length > 0;
  
  if (!hasAnyUtms && !hasTags) {
    return null;
  }

  return (
    <div className="hidden flex-col gap-1.5 lg:flex">
      {/* First row: UTM parameters */}
      {hasAnyUtms && (
        <div className="flex items-start gap-1.5">
          {utmSource && <UtmBadge type="source" value={utmSource} />}
          {utmMedium && <UtmBadge type="medium" value={utmMedium} />}
          {utmCampaign && <UtmBadge type="campaign" value={utmCampaign} />}
        </div>
      )}
      
      {/* Second row: Tags */}
      {hasTags && (
        <div className="flex flex-wrap items-start gap-1.5">
          {tags.map((tag) => (
            <TagBadge key={tag.id} {...tag} withIcon />
          ))}
        </div>
      )}
    </div>
  );
}

