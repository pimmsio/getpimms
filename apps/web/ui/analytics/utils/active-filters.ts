import { linkConstructor } from "@dub/utils";
import { VALID_ANALYTICS_FILTERS } from "@/lib/analytics/constants";
import { isUtmFilter } from "./filter-utils";

type SearchParamsObj = Record<string, string | undefined>;

type SelectedValues = {
  selectedTagIds: string[];
  selectedHotScores: string[];
  selectedUtmSources: string[];
  selectedUtmMediums: string[];
  selectedUtmCampaigns: string[];
  selectedUtmTerms: string[];
  selectedUtmContents: string[];
  selectedUrls: string[];
  selectedCountries: string[];
  selectedCities: string[];
  selectedDevices: string[];
  selectedBrowsers: string[];
  selectedOs: string[];
  selectedReferers: string[];
};

export function buildActiveFilters(
  searchParamsObj: SearchParamsObj,
  selectedValues: SelectedValues,
) {
  const { domain, key, root, folderId, ...params } = searchParamsObj;
  const {
    selectedTagIds,
    selectedHotScores,
    selectedUtmSources,
    selectedUtmMediums,
    selectedUtmCampaigns,
    selectedUtmTerms,
    selectedUtmContents,
    selectedUrls,
    selectedCountries,
    selectedCities,
    selectedDevices,
    selectedBrowsers,
    selectedOs,
    selectedReferers,
  } = selectedValues;

  // Handle special cases first
  const filters: Array<{ key: string; value: any }> = [
    // Handle domain/key special case
    ...(domain && !key ? [{ key: "domain", value: domain }] : []),
    ...(domain && key
      ? [
          {
            key: "link",
            value: linkConstructor({ domain, key, pretty: true }),
          },
        ]
      : []),
    // Handle tagIds special case
    ...(selectedTagIds.length > 0
      ? [{ key: "tagIds", value: selectedTagIds }]
      : []),
    // Handle hotScore special case
    ...(selectedHotScores.length > 0
      ? [{ key: "hotScore", value: selectedHotScores }]
      : []),
    // Handle UTM multi-select special cases
    ...(selectedUtmSources.length > 0
      ? [{ key: "utm_source", value: selectedUtmSources }]
      : []),
    ...(selectedUtmMediums.length > 0
      ? [{ key: "utm_medium", value: selectedUtmMediums }]
      : []),
    ...(selectedUtmCampaigns.length > 0
      ? [{ key: "utm_campaign", value: selectedUtmCampaigns }]
      : []),
    ...(selectedUtmTerms.length > 0
      ? [{ key: "utm_term", value: selectedUtmTerms }]
      : []),
    ...(selectedUtmContents.length > 0
      ? [{ key: "utm_content", value: selectedUtmContents }]
      : []),
    // Handle other multi-select filters
    ...(selectedUrls.length > 0 ? [{ key: "url", value: selectedUrls }] : []),
    ...(selectedCountries.length > 0
      ? [{ key: "country", value: selectedCountries }]
      : []),
    ...(selectedCities.length > 0
      ? [{ key: "city", value: selectedCities }]
      : []),
    ...(selectedDevices.length > 0
      ? [{ key: "device", value: selectedDevices }]
      : []),
    ...(selectedBrowsers.length > 0
      ? [{ key: "browser", value: selectedBrowsers }]
      : []),
    ...(selectedOs.length > 0 ? [{ key: "os", value: selectedOs }] : []),
    ...(selectedReferers.length > 0
      ? [{ key: "referer", value: selectedReferers }]
      : []),
    // Handle root special case - convert string to boolean
    ...(root ? [{ key: "root", value: root === "true" }] : []),
    // Handle folderId special case
    ...(folderId ? [{ key: "folderId", value: folderId }] : []),
  ];

  // Handle all other filters dynamically
  VALID_ANALYTICS_FILTERS.forEach((filter) => {
    // Skip special cases we handled above
    if (
      [
        "domain",
        "key",
        "tagId",
        "tagIds",
        "hotScore",
        "root",
        "folderId",
        "utm_source",
        "utm_medium",
        "utm_campaign",
        "utm_term",
        "utm_content",
        "url",
        "country",
        "city",
        "device",
        "browser",
        "os",
        "referer",
      ].includes(filter)
    )
      return;
    // also skip date range filters and qr
    if (["interval", "start", "end", "qr"].includes(filter)) return;

    const value = params[filter];
    if (value) {
      filters.push({ key: filter, value });
    }
  });

  return filters;
}

export function separateActiveFilters(
  activeFilters: Array<{ key: string; value: any }>,
) {
  const regularFilters: Array<{ key: string; value: any }> = [];
  const utmFilters: Array<{ key: string; value: any }> = [];

  activeFilters.forEach((filter) => {
    if (isUtmFilter(filter.key)) {
      utmFilters.push(filter);
    } else {
      regularFilters.push(filter);
    }
  });

  return { regularFilters, utmFilters };
}

