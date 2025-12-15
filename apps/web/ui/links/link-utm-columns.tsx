import { TagProps } from "@/lib/types";
import { useRouterStuff } from "@dub/ui";
import { getParamsFromURL } from "@dub/utils";
import { useMemo } from "react";
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
  const { queryParams, searchParamsObj } = useRouterStuff();

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

  // Get currently selected values from query params
  const selectedTagIds = useMemo(
    () => searchParamsObj["tagIds"]?.split(",")?.filter(Boolean) ?? [],
    [searchParamsObj],
  );

  const selectedUtmSources = useMemo(
    () => searchParamsObj["utm_source"]?.split(",")?.filter(Boolean) ?? [],
    [searchParamsObj],
  );

  const selectedUtmMediums = useMemo(
    () => searchParamsObj["utm_medium"]?.split(",")?.filter(Boolean) ?? [],
    [searchParamsObj],
  );

  const selectedUtmCampaigns = useMemo(
    () => searchParamsObj["utm_campaign"]?.split(",")?.filter(Boolean) ?? [],
    [searchParamsObj],
  );

  // Handler for tag clicks
  const handleTagClick = (tagId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // Prevent duplicate values
    if (selectedTagIds.includes(tagId)) return;
    queryParams({
      set: {
        tagIds: selectedTagIds.concat(tagId).join(","),
      },
      del: "page",
    });
  };

  // Handler for UTM source clicks
  const handleUtmSourceClick = (value: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // Prevent duplicate values
    if (selectedUtmSources.includes(value)) return;
    queryParams({
      set: {
        utm_source: selectedUtmSources.concat(value).join(","),
      },
      del: "page",
    });
  };

  // Handler for UTM medium clicks
  const handleUtmMediumClick = (value: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // Prevent duplicate values
    if (selectedUtmMediums.includes(value)) return;
    queryParams({
      set: {
        utm_medium: selectedUtmMediums.concat(value).join(","),
      },
      del: "page",
    });
  };

  // Handler for UTM campaign clicks
  const handleUtmCampaignClick = (value: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // Prevent duplicate values
    if (selectedUtmCampaigns.includes(value)) return;
    queryParams({
      set: {
        utm_campaign: selectedUtmCampaigns.concat(value).join(","),
      },
      del: "page",
    });
  };

  return (
    <div className="hidden flex-col gap-1.5 lg:flex">
      {/* First row: UTM parameters */}
      {hasAnyUtms && (
        <div className="flex items-start gap-1.5">
          {utmSource && (
            <UtmBadge 
              type="source" 
              value={utmSource}
              onClick={(e) => handleUtmSourceClick(utmSource!, e)}
            />
          )}
          {utmMedium && (
            <UtmBadge 
              type="medium" 
              value={utmMedium}
              onClick={(e) => handleUtmMediumClick(utmMedium!, e)}
            />
          )}
          {utmCampaign && (
            <UtmBadge 
              type="campaign" 
              value={utmCampaign}
              onClick={(e) => handleUtmCampaignClick(utmCampaign!, e)}
            />
          )}
        </div>
      )}
      
      {/* Second row: Tags */}
      {hasTags && (
        <div className="flex flex-wrap items-start gap-1.5">
          {tags.map((tag) => (
            <TagBadge 
              key={tag.id} 
              {...tag} 
              withIcon
              onClick={(e) => handleTagClick(tag.id, e)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

