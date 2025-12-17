import { generateFilters } from "@/lib/ai/generate-filters";
import {
  DUB_LINKS_ANALYTICS_INTERVAL,
  INTERVAL_DISPLAYS,
  VALID_ANALYTICS_FILTERS,
} from "@/lib/analytics/constants";
import { unsortedLinks } from "@/lib/folder/constants";
import {
  getGroupDisplayNameFromDomains,
  validDateRangeForPlan,
} from "@/lib/analytics/utils";
import { getStartEndDates } from "@/lib/analytics/utils/get-start-end-dates";
import { useAnalyticsUrl } from "@/lib/hooks/use-analytics-url";
import useDomains from "@/lib/swr/use-domains";
import useDomainsCount from "@/lib/swr/use-domains-count";
import useFolder from "@/lib/swr/use-folder";
import useFolders from "@/lib/swr/use-folders";
import useFoldersCount from "@/lib/swr/use-folders-count";
import useTags from "@/lib/swr/use-tags";
import useTagsCount from "@/lib/swr/use-tags-count";
import useWorkspace from "@/lib/swr/use-workspace";
import { LinkProps } from "@/lib/types";
import { DOMAINS_MAX_PAGE_SIZE } from "@/lib/zod/schemas/domains";
import { FOLDERS_MAX_PAGE_SIZE } from "@/lib/zod/schemas/folders";
import { TAGS_MAX_PAGE_SIZE } from "@/lib/zod/schemas/tags";
import {
  BlurImage,
  Button,
  ChartLine,
  DateRangePicker,
  ExpandingArrow,
  Filter,
  LinkLogo,
  Tooltip,
  TooltipContent,
  useMediaQuery,
  useRouterStuff,
  useScroll,
  UTM_PARAMETERS,
  Popover,
} from "@dub/ui";
import { MousePointerClick, TrendingUp, DollarSign, ArrowUpDown, RefreshCw, Folder } from "lucide-react";
import {
  Hyperlink,
  LinkBroken,
  ReferredVia,
  Tag,
} from "@dub/ui/icons";
import { useSWRConfig } from "swr";
import {
  APP_DOMAIN,
  cn,
  DUB_DEMO_LINKS,
  DUB_LOGO,
  getApexDomain,
  getGoogleFavicon,
  getNextPlan,
  linkConstructor,
  nFormatter,
} from "@dub/utils";
import { readStreamableValue } from "ai/rsc";
import { Globe2 } from "lucide-react";
import posthog from "posthog-js";
import {
  ComponentProps,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useDebounce } from "use-debounce";
import { WebhookErrorsWarning } from "../layout/sidebar/webhook-errors-warning";
import { LinkIcon } from "../links/link-icon";
import TagBadge from "../links/tag-badge";
import { FolderIcon } from "../folders/folder-icon";
import { AnalyticsContext } from "./analytics-provider";
import {
  ColdScoreIcon,
  HotScoreIcon,
  WarmScoreIcon,
  SingleFlameIcon,
} from "./events/hot-score-icons";
import useHotLeads from "../../lib/swr/use-hot-leads";
import RefererIcon from "./referer-icon";
import { ShareButton } from "./share-button";
import { useAnalyticsFilterOption, useAnalyticsFilterOptionWithoutSelf } from "./utils";
import { UTM_FILTER_KEYS, isUtmFilter } from "./utils/filter-utils";
import { createRegularFilterHandlers } from "./utils/regular-filter-handlers";
import { createUtmFilterHandlers } from "./utils/utm-filter-handlers";
import {
  buildActiveFilters,
  separateActiveFilters,
} from "./utils/active-filters";

export default function Toggle({
  page = "analytics",
}: {
  page?: "analytics" | "events" | "links";
}) {
  const { slug, plan, createdAt, flags } = useWorkspace();

  const { router, queryParams, searchParamsObj } = useRouterStuff();

  const buildAnalyticsUrl = useAnalyticsUrl();

  const {
    selectedTab,
    domain,
    key,
    url,
    adminPage,
    partnerPage,
    dashboardProps,
    start,
    end,
    interval,
    showConversions,
  } = useContext(AnalyticsContext);

  const scrolled = useScroll(120);

  // Determine whether filters should be fetched async
  const { data: tagsCount } = useTagsCount();
  const { data: domainsCount } = useDomainsCount({ ignoreParams: true });
  const { data: foldersCount } = useFoldersCount();
  // const { data: customersCount } = useCustomersCount();
  const tagsAsync = Boolean(tagsCount && tagsCount > TAGS_MAX_PAGE_SIZE);
  const domainsAsync = domainsCount && domainsCount > DOMAINS_MAX_PAGE_SIZE;
  const foldersAsync = foldersCount && foldersCount > FOLDERS_MAX_PAGE_SIZE;
  // const customersAsync =
  //   customersCount && customersCount > CUSTOMERS_MAX_PAGE_SIZE;

  // Separate state for regular filters
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounce(search, 500);

  // Separate state for UTM filters
  const [selectedUtmFilter, setSelectedUtmFilter] = useState<string | null>(null);
  const [utmSearch, setUtmSearch] = useState("");
  const [debouncedUtmSearch] = useDebounce(utmSearch, 500);

  const { tags, loading: loadingTags } = useTags({
    query: {
      search: tagsAsync && selectedFilter === "tagIds" ? debouncedSearch : "",
    },
  });
  const { folders, loading: loadingFolders } = useFolders({
    query: {
      search:
        foldersAsync && selectedFilter === "folderId" ? debouncedSearch : "",
    },
  });
  // const { customers } = useCustomers({
  //   query: {
  //     search:
  //       customersAsync && selectedFilter === "customerId"
  //         ? debouncedSearch
  //         : "",
  //   },
  // });

  const {
    allDomains: domains,
    primaryDomain,
    loading: loadingDomains,
  } = useDomains({
    ignoreParams: true,
    opts: {
      search:
        domainsAsync && selectedFilter === "domain" ? debouncedSearch : "",
    },
  });

  const selectedTagIds = useMemo(
    () => searchParamsObj.tagIds?.split(",")?.filter(Boolean) ?? [],
    [searchParamsObj.tagIds],
  );

  const { tags: selectedTags } = useTags({
    query: { ids: selectedTagIds },
    enabled: tagsAsync,
  });

  const selectedFolderId = searchParamsObj.folderId;
  const { folder: selectedFolder } = useFolder({
    folderId: selectedFolderId,
    enabled: !!selectedFolderId,
  });

  const selectedCustomerId = searchParamsObj.customerId;
  // const { data: selectedCustomer } = useCustomer({
  //   customerId: selectedCustomerId,
  // });

  const selectedHotScores = useMemo(
    () => searchParamsObj.hotScore?.split(",")?.filter(Boolean) ?? [],
    [searchParamsObj.hotScore],
  );

  // Parse selected UTM values from URL params
  const selectedUtmSources = useMemo(
    () => searchParamsObj.utm_source?.split(",")?.filter(Boolean) ?? [],
    [searchParamsObj.utm_source],
  );
  
  const selectedUtmMediums = useMemo(
    () => searchParamsObj.utm_medium?.split(",")?.filter(Boolean) ?? [],
    [searchParamsObj.utm_medium],
  );
  
  const selectedUtmCampaigns = useMemo(
    () => searchParamsObj.utm_campaign?.split(",")?.filter(Boolean) ?? [],
    [searchParamsObj.utm_campaign],
  );
  
  const selectedUtmTerms = useMemo(
    () => searchParamsObj.utm_term?.split(",")?.filter(Boolean) ?? [],
    [searchParamsObj.utm_term],
  );
  
  const selectedUtmContents = useMemo(
    () => searchParamsObj.utm_content?.split(",")?.filter(Boolean) ?? [],
    [searchParamsObj.utm_content],
  );

  // Parse selected values for other multi-select filters
  const selectedUrls = useMemo(
    () => searchParamsObj.url?.split(",")?.filter(Boolean) ?? [],
    [searchParamsObj.url],
  );

  const selectedCountries = useMemo(
    () => searchParamsObj.country?.split(",")?.filter(Boolean) ?? [],
    [searchParamsObj.country],
  );

  const selectedCities = useMemo(
    () => searchParamsObj.city?.split(",")?.filter(Boolean) ?? [],
    [searchParamsObj.city],
  );

  const selectedDevices = useMemo(
    () => searchParamsObj.device?.split(",")?.filter(Boolean) ?? [],
    [searchParamsObj.device],
  );

  const selectedBrowsers = useMemo(
    () => searchParamsObj.browser?.split(",")?.filter(Boolean) ?? [],
    [searchParamsObj.browser],
  );

  const selectedOs = useMemo(
    () => searchParamsObj.os?.split(",")?.filter(Boolean) ?? [],
    [searchParamsObj.os],
  );

  const selectedReferers = useMemo(
    () => searchParamsObj.referer?.split(",")?.filter(Boolean) ?? [],
    [searchParamsObj.referer],
  );

  const [requestedFilters, setRequestedFilters] = useState<string[]>([]);

  // Build all active filters
  const activeFilters = useMemo(
    () =>
      buildActiveFilters(searchParamsObj, {
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
      }),
    [
      searchParamsObj,
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
    ],
  );

  // Separate active filters for each dropdown
  const { regularFilters: activeRegularFilters, utmFilters: activeUtmFilters } =
    useMemo(
      () => separateActiveFilters(activeFilters),
      [activeFilters],
    );

  const isRequested = useCallback(
    (key: string) =>
      requestedFilters.includes(key) ||
      activeFilters.some((af) => af.key === key),
    [requestedFilters, activeFilters],
  );

  // Only fetch filter options when explicitly requested (filter opened or already active)
  // This prevents excessive Tinybird QPS on page load
  // Exclude domain and key from the query so we see all links, not just the filtered one
  const { data: links } = useAnalyticsFilterOptionWithoutSelf("top_links", ["domain", "key"], {
    cacheOnly: !isRequested("link"),
  });
  // Fetch filter options without applying the filter itself (so all options are visible for multi-select)
  const { data: countries } = useAnalyticsFilterOptionWithoutSelf("countries", "country", {
    cacheOnly: !isRequested("country"),
  });
  const { data: regions } = useAnalyticsFilterOption("regions", {
    cacheOnly: !isRequested("region"),
  });
  const { data: cities } = useAnalyticsFilterOptionWithoutSelf("cities", "city", {
    cacheOnly: !isRequested("city"),
  });
  const { data: continents } = useAnalyticsFilterOption("continents", {
    cacheOnly: !isRequested("continent"),
  });
  const { data: devices } = useAnalyticsFilterOptionWithoutSelf("devices", "device", {
    cacheOnly: !isRequested("device"),
  });
  const { data: browsers } = useAnalyticsFilterOptionWithoutSelf("browsers", "browser", {
    cacheOnly: !isRequested("browser"),
  });
  const { data: os } = useAnalyticsFilterOptionWithoutSelf("os", "os", {
    cacheOnly: !isRequested("os"),
  });
  const { data: triggers } = useAnalyticsFilterOption("triggers", {
    cacheOnly: !isRequested("trigger"),
  });
  const { data: referers } = useAnalyticsFilterOptionWithoutSelf("referers", "referer", {
    cacheOnly: !isRequested("referer"),
  });
  const { data: refererUrls } = useAnalyticsFilterOption("referer_urls", {
    cacheOnly: !isRequested("refererUrl"),
  });
  
  // Conditionally fetch URL filter data - only when requested or already active
  // Using conditional hook pattern to prevent ANY API calls until needed
  const shouldFetchUrl = isRequested("url");
  const { data: urls } = useAnalyticsFilterOptionWithoutSelf("top_urls", "url", {
    cacheOnly: !shouldFetchUrl,
  });
  
  // Fetch UTM data eagerly so search/filter works when dropdown opens
  // Use *WithoutSelf* so options are not restricted by the current UTM filter,
  // enabling multi-select (OR) behavior like on the links table.
  const { data: utmSourcesData } = useAnalyticsFilterOptionWithoutSelf(
    "utm_sources",
    "utm_source",
    {
      cacheOnly: false,
    },
  );
  
  const { data: utmMediumsData } = useAnalyticsFilterOptionWithoutSelf(
    "utm_mediums",
    "utm_medium",
    {
      cacheOnly: false,
    },
  );
  
  const { data: utmCampaignsData } = useAnalyticsFilterOptionWithoutSelf(
    "utm_campaigns",
    "utm_campaign",
    {
      cacheOnly: false,
    },
  );
  
  const { data: utmTermsData } = useAnalyticsFilterOptionWithoutSelf(
    "utm_terms",
    "utm_term",
    {
      cacheOnly: false,
    },
  );
  
  const { data: utmContentsData } = useAnalyticsFilterOptionWithoutSelf(
    "utm_contents",
    "utm_content",
    {
      cacheOnly: false,
    },
  );

  // Transform UTM data to match expected format
  const utmSources = useMemo(
    () =>
      utmSourcesData
        ?.map((item) => ({
          utm_source: item.utm_source,
          count: item.count,
        }))
        .filter((item) => item.utm_source) // Filter out empty values
        .sort((a, b) => a.utm_source!.localeCompare(b.utm_source!)) ?? null,
    [utmSourcesData],
  );

  const utmMediums = useMemo(
    () =>
      utmMediumsData
        ?.map((item) => ({
          utm_medium: item.utm_medium,
          count: item.count,
        }))
        .filter((item) => item.utm_medium) // Filter out empty values
        .sort((a, b) => a.utm_medium!.localeCompare(b.utm_medium!)) ?? null,
    [utmMediumsData],
  );

  const utmCampaigns = useMemo(
    () =>
      utmCampaignsData
        ?.map((item) => ({
          utm_campaign: item.utm_campaign,
          count: item.count,
        }))
        .filter((item) => item.utm_campaign) // Filter out empty values
        .sort((a, b) => a.utm_campaign!.localeCompare(b.utm_campaign!)) ?? null,
    [utmCampaignsData],
  );

  const utmTerms = useMemo(
    () =>
      utmTermsData
        ?.map((item) => ({
          utm_term: item.utm_term,
          count: item.count,
        }))
        .filter((item) => item.utm_term) // Filter out empty values
        .sort((a, b) => a.utm_term!.localeCompare(b.utm_term!)) ?? null,
    [utmTermsData],
  );

  const utmContents = useMemo(
    () =>
      utmContentsData
        ?.map((item) => ({
          utm_content: item.utm_content,
          count: item.count,
        }))
        .filter((item) => item.utm_content) // Filter out empty values
        .sort((a, b) => a.utm_content!.localeCompare(b.utm_content!)) ?? null,
    [utmContentsData],
  );

  const utmData = {
    utm_source: utmSources,
    utm_medium: utmMediums,
    utm_campaign: utmCampaigns,
    utm_term: utmTerms,
    utm_content: utmContents,
  };

  // Some suggestions will only appear if previously requested (see isRequested above)
  // const aiFilterSuggestions = useMemo(
  //   () => [
  //     ...(dashboardProps || partnerPage
  //       ? []
  //       : [
  //           {
  //             value: `Clicks on ${primaryDomain} domain this year`,
  //             icon: Globe2,
  //           },
  //         ]),
  //     {
  //       value: "Mobile users, US only",
  //       icon: MobilePhone,
  //     },
  //     {
  //       value: "Tokyo, Chrome users",
  //       icon: OfficeBuilding,
  //     },
  //     {
  //       value: "Safari, Singapore, last month",
  //       icon: FlagWavy,
  //     },
  //     {
  //       value: "QR scans last quarter",
  //       icon: QRCode,
  //     },
  //   ],
  //   [primaryDomain, dashboardProps, partnerPage],
  // );

  const [streaming, setStreaming] = useState<boolean>(false);

  const LinkFilterItem = {
    key: "link",
    icon: Hyperlink,
    label: "Link",
    multiple: true, // Enable multi-select with OR logic
    getOptionIcon: (value, props) => {
      const url = props.option?.data?.url;
      const [domain, key] = value.split("/");

      return <LinkIcon url={url} domain={domain} linkKey={key} />;
    },
    options:
      links
        ?.map(
          ({ domain, key, url, count }: LinkProps & { count?: number }) => ({
            value: linkConstructor({ domain, key, pretty: true }),
            label: linkConstructor({ domain, key, pretty: true }),
            right: nFormatter(count, { full: true }),
            data: { url },
          }),
        )
        .sort((a, b) => a.label.localeCompare(b.label)) ?? null,
  };

  // Regular filters (excluding UTM filters)
  const regularFilters: ComponentProps<typeof Filter.Select>["filters"] = useMemo(
    () => {
      const filterArray = [
      // {
      //   key: "ai",
      //   icon: Magic,
      //   label: "Ask AI",
      //   separatorAfter: true,
      //   options:
      //     aiFilterSuggestions?.map(({ icon, value }) => ({
      //       value,
      //       label: value,
      //       icon,
      //     })) ?? null,
      // },
      ...(dashboardProps
        ? []
        : partnerPage
          ? [LinkFilterItem]
          : [
              // ...(["leads", "sales"].includes(selectedTab)
              //   ? [
              //       {
              //         key: "customerId",
              //         icon: User,
              //         label: "Customer",
              //         shouldFilter: !customersAsync,
              //         options:
              //           customers?.map(({ id, email, name, avatar }) => {
              //             return {
              //               value: id,
              //               label: email ?? name,
              //               icon: (
              //                 <img
              //                   src={avatar || `${OG_AVATAR_URL}${id}`}
              //                   alt={`${email} avatar`}
              //                   className="size-4 rounded-full"
              //                 />
              //               ),
              //             };
              //           }) ?? null,
              //       },
              //     ]
              //   : []),
              ...(flags?.linkFolders
                ? [
                    {
                      key: "folderId",
                      icon: Folder,
                      label: "Folder",
                      shouldFilter: !foldersAsync,
                      getOptionIcon: (value, props) => {
                        const folderName = props.option?.label;
                        // Check if it's the unsorted folder
                        if (value === "unsorted") {
                          return (
                            <FolderIcon
                              folder={unsortedLinks}
                              shape="square"
                              iconClassName="size-3"
                            />
                          );
                        }
                        const folder = folders?.find(
                          ({ name }) => name === folderName,
                        );

                        return folder ? (
                          <FolderIcon
                            folder={folder}
                            shape="square"
                            iconClassName="size-3"
                          />
                        ) : null;
                      },
                      options: loadingFolders
                        ? null
                        : [
                            unsortedLinks,
                            ...(folders || []),
                            // Add currently filtered folder if not already in the list
                            ...(selectedFolder &&
                            selectedFolder.id !== "unsorted" &&
                            !folders?.find((f) => f.id === selectedFolder.id)
                              ? [selectedFolder]
                              : []),
                          ]
                            .map((folder) => ({
                              value: folder.id,
                              icon: (
                                <FolderIcon
                                  folder={folder}
                                  shape="square"
                                  iconClassName="size-3"
                                />
                              ),
                              label: folder.name,
                            }))
                            .sort((a, b) => {
                              // Always put "unsorted" first
                              if (a.value === "unsorted") return -1;
                              if (b.value === "unsorted") return 1;
                              return a.label.localeCompare(b.label);
                            }),
                    },
                  ]
                : []),
              {
                key: "tagIds",
                icon: Tag,
                label: "Tag",
                multiple: true,
                shouldFilter: !tagsAsync,
                getOptionIcon: (value, props) => {
                  const tagColor =
                    props.option?.data?.color ??
                    tags?.find(({ id }) => id === value)?.color;
                  return tagColor ? (
                    <TagBadge color={tagColor} withIcon className="sm:p-1" />
                  ) : null;
                },
                options: loadingTags
                  ? null
                  : [
                      ...(tags || []),
                      // Add currently filtered tags if not already in the list
                      ...(selectedTags || []).filter(
                        ({ id }) => !tags?.some((t) => t.id === id),
                      ),
                    ]
                      .map(({ id, name, color }) => ({
                        value: id,
                        icon: (
                          <TagBadge color={color} withIcon className="sm:p-1" />
                        ),
                        label: name,
                        data: { color },
                      }))
                      .sort((a, b) => a.label.localeCompare(b.label)),
              },
              LinkFilterItem,
              ...(page === "events"
                ? [
                    {
                      key: "hotScore",
                      icon: HotScoreIcon,
                      label: "Hot Score",
                      multiple: true,
                      options: [
                        {
                          value: "cold",
                          label: "Cold (0-33)",
                          icon: <ColdScoreIcon className="h-4 w-4" />,
                        },
                        {
                          value: "warm",
                          label: "Warm (34-66)",
                          icon: <WarmScoreIcon className="h-4 w-4" />,
                        },
                        {
                          value: "hot",
                          label: "Hot (67-100)",
                          icon: <HotScoreIcon className="h-4 w-4" />,
                        },
                      ],
                    },
                  ]
                : []),
              // {
              //   key: "domain",
              //   icon: Globe2,
              //   label: "Domain",
              //   shouldFilter: !domainsAsync,
              //   getOptionIcon: (value) => (
              //     <BlurImage
              //       src={getGoogleFavicon(value, false)}
              //       alt={value}
              //       className="h-4 w-4 rounded-full"
              //       width={16}
              //       height={16}
              //     />
              //   ),
              //   options: loadingDomains
              //     ? null
              //     : [
              //         ...domains.map((domain) => ({
              //           value: domain.slug,
              //           label: domain.slug,
              //         })),
              //         // Add currently filtered domain if not already in the list
              //         ...(!searchParamsObj.domain ||
              //         domains.some((d) => d.slug === searchParamsObj.domain)
              //           ? []
              //           : [
              //               {
              //                 value: searchParamsObj.domain,
              //                 label: searchParamsObj.domain,
              //                 hideDuringSearch: true,
              //               },
              //             ]),
              //       ],
              // },
              // {
              //   key: "root",
              //   icon: Sliders,
              //   label: "Link type",
              //   separatorAfter: true,
              //   options: [
              //     {
              //       value: true,
              //       icon: Globe2,
              //       label: "Root domain link",
              //     },
              //     {
              //       value: false,
              //       icon: Hyperlink,
              //       label: "Regular short link",
              //     },
              //   ],
              // },
            ]),
      {
        key: "referer",
        icon: ReferredVia,
        label: "Referer",
        multiple: true, // Enable multi-select with OR logic
        getOptionIcon: (value) => (
          <RefererIcon display={value} className="h-4 w-4" />
        ),
        getOptionLabel: (value) => {
          // If value is a comma-separated list of domains, check if it maps to a group
          if (typeof value === "string" && value.includes(",")) {
            const domains = value.split(",");
            const groupName = getGroupDisplayNameFromDomains(domains);
            if (groupName) {
              return groupName;
            }
          }
          return value;
        },
        options:
          referers
            ?.map(({ referer, count }) => ({
              value: referer,
              label: referer,
              right: nFormatter(count, { full: true }),
            }))
            .sort((a, b) => a.label.localeCompare(b.label)) ?? null,
      },
      // {
      //   key: "refererUrl",
      //   icon: ReferredVia,
      //   label: "Referrer URL",
      //   getOptionIcon: (value, props) => (
      //     <RefererIcon display={value} className="h-4 w-4" />
      //   ),
      //   options:
      //     refererUrls?.map(({ refererUrl, count }) => ({
      //       value: refererUrl,
      //       label: refererUrl,
      //       right: nFormatter(count, { full: true }),
      //     })) ?? null,
      // },
      {
        key: "url",
        icon: LinkBroken,
        label: "Destination URL",
        multiple: true,
        shouldFilter: true,
        getOptionIcon: (value, props) => (
          <LinkLogo
            apexDomain={getApexDomain(value)}
            className="size-4 sm:size-4"
          />
        ),
        options:
          urls
            ?.map(({ url, count = 0 }) => {
              const displayUrl = url
                .replace(/^https?:\/\//, '')
                .replace(/\/$/, '');
              
              return {
                value: url,
                label: displayUrl,
                count: count,
                right: nFormatter(count, { full: true }),
              };
            })
            .sort((a, b) => a.label.localeCompare(b.label)) ?? null,
      },
      // {
      //   key: "country",
      //   icon: FlagWavy,
      //   label: "Country",
      //   multiple: true, // Enable multi-select with OR logic
      //   getOptionIcon: (value) => (
      //     <img
      //       alt={value}
      //       src={`https://flag.vercel.app/m/${value}.svg`}
      //       className="h-2.5 w-4"
      //     />
      //   ),
      //   getOptionLabel: (value) => COUNTRIES[value],
      //   options:
      //     countries
      //       ?.map(({ country, count }) => ({
      //         value: country,
      //         label: COUNTRIES[country],
      //         right: nFormatter(count, { full: true }),
      //       }))
      //       .sort((a, b) => a.label.localeCompare(b.label)) ?? null,
      // },
      // {
      //   key: "city",
      //   icon: OfficeBuilding,
      //   label: "City",
      //   multiple: true, // Enable multi-select with OR logic
      //   options:
      //     cities
      //       ?.map(({ city, country, count }) => ({
      //         value: city,
      //         label: city,
      //         icon: (
      //           <img
      //             alt={country}
      //             src={`https://flag.vercel.app/m/${country}.svg`}
      //             className="h-2.5 w-4"
      //           />
      //         ),
      //         right: nFormatter(count, { full: true }),
      //       }))
      //       .sort((a, b) => a.label.localeCompare(b.label)) ?? null,
      // },
      // {
      //   key: "region",
      //   icon: LocationPin,
      //   label: "Region",
      //   options:
      //     regions?.map(({ region, country, count }) => ({
      //       value: region,
      //       label: REGIONS[region] || region.split("-")[1],
      //       icon: (
      //         <img
      //           alt={country}
      //           src={`https://flag.vercel.app/m/${country}.svg`}
      //           className="h-2.5 w-4"
      //         />
      //       ),
      //       right: nFormatter(count, { full: true }),
      //     })) ?? null,
      // },
      // {
      //   key: "continent",
      //   icon: MapPosition,
      //   label: "Continent",
      //   getOptionIcon: (value) => (
      //     <ContinentIcon display={value} className="size-2.5" />
      //   ),
      //   getOptionLabel: (value) => CONTINENTS[value],
      //   options:
      //     continents?.map(({ continent, count }) => ({
      //       value: continent,
      //       label: CONTINENTS[continent],
      //       right: nFormatter(count, { full: true }),
      //     })) ?? null,
      // },
      // {
      //   key: "device",
      //   icon: MobilePhone,
      //   label: "Device",
      //   multiple: true, // Enable multi-select with OR logic
      //   getOptionIcon: (value) => (
      //     <DeviceIcon
      //       display={capitalize(value) ?? value}
      //       tab="devices"
      //       className="h-4 w-4"
      //     />
      //   ),
      //   options:
      //     devices
      //       ?.map(({ device, count }) => ({
      //         value: device,
      //         label: device,
      //         right: nFormatter(count, { full: true }),
      //       }))
      //       .sort((a, b) => a.label.localeCompare(b.label)) ?? null,
      // },
      // {
      //   key: "browser",
      //   icon: Window,
      //   label: "Browser",
      //   multiple: true, // Enable multi-select with OR logic
      //   getOptionIcon: (value) => (
      //     <DeviceIcon display={value} tab="browsers" className="h-4 w-4" />
      //   ),
      //   options:
      //     browsers
      //       ?.map(({ browser, count }) => ({
      //         value: browser,
      //         label: browser,
      //         right: nFormatter(count, { full: true }),
      //       }))
      //       .sort((a, b) => a.label.localeCompare(b.label)) ?? null,
      // },
      // {
      //   key: "os",
      //   icon: Cube,
      //   label: "OS",
      //   multiple: true, // Enable multi-select with OR logic
      //   getOptionIcon: (value) => (
      //     <DeviceIcon display={value} tab="os" className="h-4 w-4" />
      //   ),
      //   options:
      //     os
      //       ?.map(({ os, count }) => ({
      //         value: os,
      //         label: os,
      //         right: nFormatter(count, { full: true }),
      //       }))
      //       .sort((a, b) => a.label.localeCompare(b.label)) ?? null,
      // },
      // {
      //   key: "trigger",
      //   icon: CursorRays,
      //   label: "Trigger",
      //   options:
      //     triggers?.map(({ trigger, count }) => ({
      //       value: trigger,
      //       label: TRIGGER_DISPLAY[trigger],
      //       icon: trigger === "qr" ? QRCode : CursorRays,
      //       right: nFormatter(count, { full: true }),
      //     })) ?? null,
      //   separatorAfter: true,
      // },
    ];

      return filterArray;
    },
    [
      selectedTab,
      dashboardProps,
      partnerPage,
      links,
      tags,
      selectedTags,
      selectedTagIds,
      selectedCustomerId,
      countries,
      cities,
      devices,
      browsers,
      os,
      referers,
      refererUrls,
      urls,
      tagsAsync,
      loadingTags,
      searchParamsObj.tagIds,
      searchParamsObj.domain,
      flags?.linkFolders,
      folders,
      loadingFolders,
      selectedFolder,
    ],
  );

  // UTM filters only
  const utmFilters: ComponentProps<typeof Filter.Select>["filters"] = useMemo(
    () => {
      return UTM_PARAMETERS.filter(({ key }) => key !== "ref").map(
        ({ key, label, icon: Icon }) => ({
          key,
          icon: Icon,
          label: `UTM ${label}`,
          multiple: true,
          shouldFilter: true,
          getOptionIcon: (value) => (
            <Icon display={value} className="h-4 w-4" />
          ),
          options:
            utmData[key]
              ?.map((dt) => ({
                value: dt[key],
                label: dt[key],
                right: nFormatter(dt.count, { full: true }),
              }))
              .sort((a, b) => a.label.localeCompare(b.label)) ?? null,
        }),
      );
    },
    [utmData],
  );

  // Combined filters for Filter.List (to show all active filters)
  const filters = useMemo(
    () => [...regularFilters, ...utmFilters],
    [regularFilters, utmFilters],
  );

  const { isMobile } = useMediaQuery();

  // Create handlers using utility functions
  const { handleSelect: handleRegularFilterSelect, handleRemove: handleRegularFilterRemove } =
    useMemo(
      () =>
        createRegularFilterHandlers({
          queryParams,
          selectedTagIds,
          selectedHotScores,
          selectedUrls,
          selectedCountries,
          selectedCities,
          selectedDevices,
          selectedBrowsers,
          selectedOs,
          selectedReferers,
          activeFilters,
          setStreaming,
        }),
      [
        queryParams,
        selectedTagIds,
        selectedHotScores,
        selectedUrls,
        selectedCountries,
        selectedCities,
        selectedDevices,
        selectedBrowsers,
        selectedOs,
        selectedReferers,
        activeFilters,
        setStreaming,
      ],
    );

  const { handleSelect: handleUtmFilterSelect, handleRemove: handleUtmFilterRemove } =
    useMemo(
      () =>
        createUtmFilterHandlers({
          queryParams,
          selectedUtmSources,
          selectedUtmMediums,
          selectedUtmCampaigns,
          selectedUtmTerms,
          selectedUtmContents,
        }),
      [
        queryParams,
        selectedUtmSources,
        selectedUtmMediums,
        selectedUtmCampaigns,
        selectedUtmTerms,
        selectedUtmContents,
      ],
    );

  // Combined handler for Filter.List (handles both regular and UTM filters)
  const handleFilterRemove = (key: string, value: any) => {
    if (isUtmFilter(key)) {
      handleUtmFilterRemove(key, value);
    } else {
      handleRegularFilterRemove(key, value);
    }
  };

  const filterSelect = (
    <div className="flex w-full gap-2 md:w-fit">
      <Filter.Select
        className="w-full md:w-fit md:min-w-[100px]"
        filters={regularFilters}
        activeFilters={activeRegularFilters}
        onSearchChange={setSearch}
        onSelectedFilterChange={setSelectedFilter}
        onSelect={handleRegularFilterSelect}
        onRemove={handleRegularFilterRemove}
        onOpenFilter={(key) =>
          setRequestedFilters((rf) => (rf.includes(key) ? rf : [...rf, key]))
        }
        askAI
      />
      <Filter.Select
        className="w-full md:w-fit"
        filters={utmFilters}
        activeFilters={activeUtmFilters}
        onSearchChange={setUtmSearch}
        onSelectedFilterChange={setSelectedUtmFilter}
        onSelect={handleUtmFilterSelect}
        onRemove={handleUtmFilterRemove}
        onOpenFilter={(key) =>
          setRequestedFilters((rf) => (rf.includes(key) ? rf : [...rf, key]))
        }
        hideIcon
      >
        By UTM
      </Filter.Select>
    </div>
  );

  const dateRangePicker = (
    <DateRangePicker
      className="w-full sm:min-w-[200px] md:w-fit"
      align={dashboardProps ? "end" : "center"}
      value={
        start && end
          ? {
              from: start,
              to: end,
            }
          : undefined
      }
      presetId={
        start && end ? undefined : interval ?? DUB_LINKS_ANALYTICS_INTERVAL
      }
      onChange={(range, preset) => {
        if (preset) {
          queryParams({
            del: ["start", "end"],
            set: {
              interval: preset.id,
            },
            scroll: false,
          });

          return;
        }

        // Regular range
        if (!range || !range.from || !range.to) return;

        // For link insights page, validate that custom range doesn't exceed 1 month
        if (page === "links") {
          const diffTime = Math.abs(range.to.getTime() - range.from.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays > 30) {
            // TODO: Show error message to user
            console.warn(
              "Link insights are limited to a maximum of 1 month of data",
            );
            return;
          }
        }

        queryParams({
          del: "preset",
          set: {
            start: range.from.toISOString(),
            end: range.to.toISOString(),
          },
          scroll: false,
        });
      }}
      presets={INTERVAL_DISPLAYS.filter(({ value }) => {
        // For link insights page, limit to 1 month maximum
        if (page === "links") {
          return !["90d", "6m", "1y", "mtd", "qtd", "ytd", "all"].includes(
            value,
          );
        }
        return true;
      }).map(({ display, value, shortcut }) => {
        const requiresUpgrade =
          !adminPage &&
          (partnerPage ||
          DUB_DEMO_LINKS.find((l) => l.domain === domain && l.key === key)
            ? false
            : !validDateRangeForPlan({
                plan: plan || dashboardProps?.workspacePlan,
                dataAvailableFrom: createdAt,
                interval: value,
                start,
                end,
              }));

        const { startDate, endDate } = getStartEndDates({
          interval: value,
          dataAvailableFrom: createdAt,
        });

        return {
          id: value,
          label: display,
          dateRange: {
            from: startDate,
            to: endDate,
          },
          requiresUpgrade,
          tooltipContent: requiresUpgrade ? (
            <UpgradeTooltip rangeLabel={display} plan={plan} />
          ) : undefined,
          shortcut,
        };
      })}
    />
  );

  return (
    <>
      <div
        className={cn("py-3 md:py-3", {
          "sticky top-14 z-10 bg-neutral-50": dashboardProps,
          "shadow-md": scrolled && dashboardProps,
        })}
      >
        <div
          className={cn(
            "mx-auto flex w-full max-w-screen-xl flex-col gap-2 px-3 lg:px-10",
            {
              "md:h-10": key,
            },
          )}
        >
          <div
            className={cn(
              "flex w-full flex-col items-center justify-between gap-2 md:flex-row",
              {
                "flex-col md:flex-row": !key,
                "items-center": key,
              },
            )}
          >
            {dashboardProps && (
              <a
                className="group flex items-center text-lg font-semibold text-neutral-800"
                href={linkConstructor({ domain, key })}
                target="_blank"
                rel="noreferrer"
              >
                <BlurImage
                  alt={url || "PIMMS"}
                  src={url ? getGoogleFavicon(url) : DUB_LOGO}
                  className="mr-2 h-6 w-6 flex-shrink-0 overflow-hidden rounded-full"
                  width={48}
                  height={48}
                />
                <p className="max-w-[192px] truncate sm:max-w-[400px]">
                  {linkConstructor({
                    domain,
                    key,
                    pretty: true,
                  })}
                </p>
                <ExpandingArrow className="h-5 w-5" />
              </a>
            )}
            <div
              className={cn(
                "flex w-full flex-col-reverse items-center gap-2 min-[550px]:flex-row",
                dashboardProps && "md:w-auto",
              )}
            >
              {isMobile ? dateRangePicker : filterSelect}
              <div
                className={cn("flex w-full grow items-center gap-2 md:w-auto", {
                  "grow-0": dashboardProps,
                })}
              >
                {isMobile ? filterSelect : dateRangePicker}
                {page === "events" && <HotLeadsFilter />}
                {showConversions && (page === "analytics" || page === "links") && (
                  <>
                    <SortSelector />
                    <RefreshButton />
                  </>
                )}
                <WebhookErrorsWarning />
                {!dashboardProps && (
                  <div className="flex grow justify-end gap-2">
                    {page === "analytics" && !partnerPage && (
                      <>
                        {domain && key && <ShareButton />}
                        {/* <Button
                          variant="secondary"
                          className="w-fit"
                          icon={
                            <SquareLayoutGrid6 className="h-4 w-4 text-neutral-600" />
                          }
                          text={isMobile ? undefined : "Switch to Events"}
                          onClick={() => {
                            if (dashboardProps) {
                              window.open("https://d.to/events");
                            } else {
                              router.push(
                                `/${slug}/conversions${getQueryString({}, { exclude: ["view"] })}`,
                              );
                            }
                          }}
                        /> */}
                        {/* <AnalyticsOptions /> */}
                      </>
                    )}
                    {page === "events" && !partnerPage && (
                      <>
                        <Button
                          variant="secondary"
                          className="w-fit"
                          icon={
                            <ChartLine className="h-4 w-4 text-neutral-600" />
                          }
                          text={isMobile ? undefined : "Switch to Analytics"}
                          onClick={() =>
                            router.push(buildAnalyticsUrl(`/${slug}/analytics`))
                          }
                        />
                        {/* <EventsOptions /> */}
                      </>
                    )}
                    {page === "links" && !partnerPage && (
                      <>
                        <Button
                          variant="secondary"
                          className="w-fit"
                          icon={
                            <ChartLine className="h-4 w-4 text-neutral-600" />
                          }
                          text={isMobile ? undefined : "Switch to Analytics"}
                          onClick={() =>
                            router.push(buildAnalyticsUrl(`/${slug}/analytics`))
                          }
                        />
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-screen-xl px-3 lg:px-10">
        <Filter.List
          filters={filters}
          activeFilters={[
            ...activeFilters,
            ...(streaming && !activeFilters.length
              ? Array.from({ length: 2 }, (_, i) => i).map((i) => ({
                  key: "loader",
                  value: i,
                }))
              : []),
          ]}
          onRemove={handleFilterRemove}
          onRemoveAll={() =>
            queryParams({
              // Reset all filters except for date range
              del: VALID_ANALYTICS_FILTERS.concat(["page"]).filter(
                (f) => !["interval", "start", "end"].includes(f),
              ),
              scroll: false,
            })
          }
        />
        <div
          className={cn(
            "transition-[height] duration-[300ms]",
            streaming || activeFilters.length ? "h-3" : "h-0",
          )}
        />
      </div>
    </>
  );
}

function HotLeadsFilter() {
  const { searchParams, queryParams } = useRouterStuff();
  const { data: hotLeadsData } = useHotLeads();
  const hotOnly = searchParams.get("hotOnly") === "1";
  const selectedHotScores = useMemo(
    () => searchParams.get("hotScore")?.split(",")?.filter(Boolean) ?? [],
    [searchParams.get("hotScore")],
  );
  // Check if both warm and hot are selected, or if hotOnly is enabled
  const hasWarmHotFilter = hotOnly || 
    (selectedHotScores.includes("warm") && selectedHotScores.includes("hot")) ||
    (selectedHotScores.length === 2 && selectedHotScores.includes("warm") && selectedHotScores.includes("hot"));
  
  // Calculate total touch points from warm + hot leads
  const warmCount = hotLeadsData?.warm ?? 0;
  const hotCount = hotLeadsData?.hot ?? 0;
  const totalWarmHot = warmCount + hotCount;
  const buttonText = totalWarmHot > 0 ? `${totalWarmHot}` : "Hot";

  return (
    <Button
      variant={hasWarmHotFilter ? "primary" : "secondary"}
      className={cn(
        "h-9 w-auto rounded-full px-3 gap-1.5",
        hasWarmHotFilter && "bg-blue-600 hover:bg-blue-700 border-blue-600 text-white",
        !hasWarmHotFilter && "border-neutral-200 hover:border-blue-300",
      )}
      icon={
        <div className="flex items-center gap-0.5">
          {/* Orange flame for warm */}
          <SingleFlameIcon 
            className="h-4 w-4 shrink-0" 
            score={50}
          />
          {/* Red flame for hot */}
          <SingleFlameIcon 
            className="h-4 w-4 shrink-0" 
            score={67}
          />
        </div>
      }
      text={buttonText}
      onClick={() => {
        if (hasWarmHotFilter) {
          // Remove filter
          queryParams({
            del: ["hotOnly", "hotScore"],
            set: { page: "1" },
            scroll: false,
          });
        } else {
          // Set filter for warm + hot (scores 34-100)
          queryParams({
            set: { 
              hotScore: "warm,hot",
              page: "1" 
            },
            scroll: false,
          });
        }
      }}
    />
  );
}

function SortSelector() {
  const { selectedTab } = useContext(AnalyticsContext);
  const { queryParams } = useRouterStuff();
  const [isOpen, setIsOpen] = useState(false);

  const sortOptions = [
    { value: "clicks", label: "Clicks", icon: <MousePointerClick className="h-3.5 w-3.5" /> },
    { value: "leads", label: "Leads", icon: <TrendingUp className="h-3.5 w-3.5" /> },
    { value: "sales", label: "Sales", icon: <DollarSign className="h-3.5 w-3.5" /> },
  ];

  const currentSort = sortOptions.find(s => s.value === selectedTab) || sortOptions[0];

  return (
    <Popover
      openPopover={isOpen}
      setOpenPopover={setIsOpen}
      content={
        <div className="w-48 p-2">
          <div className="text-xs font-medium text-neutral-500 mb-2 px-2">Sort by</div>
          {sortOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                queryParams({ set: { event: option.value }, scroll: false });
                setIsOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium transition-all",
                selectedTab === option.value
                  ? "bg-blue-600 text-white"
                  : "text-neutral-700 hover:bg-neutral-100"
              )}
            >
              {option.icon}
              {option.label}
            </button>
          ))}
        </div>
      }
      align="end"
    >
      <Button
        variant="secondary"
        className="h-10 px-3 text-sm w-fit rounded-full"
        icon={<ArrowUpDown className="h-4 w-4" />}
        text={`Sort: ${currentSort.label}`}
      />
    </Popover>
  );
}

function RefreshButton() {
  const { mutate, cache } = useSWRConfig();
  const { slug } = useWorkspace();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [hasLoadedFromStorage, setHasLoadedFromStorage] = useState(false);

  const workspaceSlug = slug || 'default';
  const cooldownKey = `analytics_refresh_cooldown_${workspaceSlug}`;
  const lastFetchKey = `analytics_last_fetch_${workspaceSlug}`;

  // Load persisted cooldown on mount (from manual refresh OR any fetch)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      const manualRefresh = localStorage.getItem(cooldownKey);
      const lastFetch = localStorage.getItem(lastFetchKey);
      
      const timestamps = [manualRefresh, lastFetch].filter(Boolean).map(t => parseInt(t!, 10));
      const mostRecentTimestamp = timestamps.length > 0 ? Math.max(...timestamps) : null;
      
      if (mostRecentTimestamp) {
        const elapsed = Date.now() - mostRecentTimestamp;
        if (elapsed < 60000) {
          setLastRefreshTime(mostRecentTimestamp);
        } else {
          localStorage.removeItem(cooldownKey);
          localStorage.removeItem(lastFetchKey);
        }
      }
      
      setHasLoadedFromStorage(true);
    } catch (error) {
      console.error('Failed to load cooldown from localStorage:', error);
    }
  }, [cooldownKey, lastFetchKey]);

  // Listen for cache changes to detect when data is fetched
  useEffect(() => {
    if (typeof window === 'undefined' || lastRefreshTime || !hasLoadedFromStorage) {
      return;
    }
    
    const checkForRecentFetch = () => {
      try {
        const keys = [...cache.keys()];
        const analyticsKeys = keys.filter(
          (key) => typeof key === 'string' && key.includes('/api/analytics')
        );
        
        let mostRecentTimestamp = 0;
        
        analyticsKeys.forEach((key) => {
          const cacheKey = `analytics_cache_${workspaceSlug}_${key}`;
          const stored = localStorage.getItem(cacheKey);
          
          if (stored) {
            try {
              const entry = JSON.parse(stored);
              if (entry.timestamp > mostRecentTimestamp) {
                mostRecentTimestamp = entry.timestamp;
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        });
        
        if (mostRecentTimestamp > 0) {
          const age = Date.now() - mostRecentTimestamp;
          if (age < 60000) {
            setLastRefreshTime(mostRecentTimestamp);
            localStorage.setItem(lastFetchKey, mostRecentTimestamp.toString());
          }
        }
      } catch (error) {
        // Silently ignore errors
      }
    };
    
    checkForRecentFetch();
    const timeout = setTimeout(checkForRecentFetch, 1000);
    
    return () => clearTimeout(timeout);
  }, [cache, workspaceSlug, lastRefreshTime, lastFetchKey, hasLoadedFromStorage]);

  // Persist cooldown to localStorage whenever it changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!hasLoadedFromStorage && !lastRefreshTime) {
      return;
    }

    try {
      if (lastRefreshTime) {
        localStorage.setItem(cooldownKey, lastRefreshTime.toString());
        localStorage.setItem(lastFetchKey, lastRefreshTime.toString());
      } else {
        localStorage.removeItem(cooldownKey);
        localStorage.removeItem(lastFetchKey);
      }
    } catch (error) {
      console.error('Failed to save cooldown to localStorage:', error);
    }
  }, [lastRefreshTime, cooldownKey, lastFetchKey, hasLoadedFromStorage]);

  // Update countdown every second
  useEffect(() => {
    if (!lastRefreshTime) return;
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - lastRefreshTime;
      const remaining = Math.max(0, 60 - Math.floor(elapsed / 1000));
      
      setTimeRemaining(remaining);
      
      if (remaining === 0) {
        setLastRefreshTime(null);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [lastRefreshTime]);

  const isDisabled = isRefreshing || timeRemaining > 0;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await mutate(
        (key) => typeof key === 'string' && key.includes('/api/analytics'),
        undefined,
        { revalidate: true }
      );
      
      setLastRefreshTime(Date.now());
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const tooltipContent = timeRemaining > 0
    ? `Wait ${timeRemaining} seconds before refreshing again`
    : isRefreshing
      ? "Refreshing analytics data..."
      : "Refresh analytics data";

  return (
    <Tooltip
      content={
        <TooltipContent
          title={tooltipContent}
          cta={timeRemaining > 0 ? "Prevents excessive API calls" : "Click to reload latest data"}
        />
      }
    >
      <Button
        variant="secondary"
        className="h-10 px-3 w-fit rounded-full"
        icon={
          <RefreshCw 
            className={cn(
              "h-4 w-4",
              isRefreshing && "animate-spin"
            )} 
          />
        }
        onClick={handleRefresh}
        disabled={isDisabled}
      />
    </Tooltip>
  );
}

function UpgradeTooltip({
  rangeLabel,
  plan,
}: {
  rangeLabel: string;
  plan?: string;
}) {
  const { slug } = useWorkspace();

  const isAllTime = rangeLabel === "All Time";

  return (
    <TooltipContent
      title={`${rangeLabel} can only be viewed on a ${isAllTime ? "Business" : getNextPlan(plan).name} plan or higher. Upgrade now to view more stats.`}
      cta={`Upgrade to ${isAllTime ? "Business" : getNextPlan(plan).name}`}
      href={slug ? `/${slug}/upgrade` : APP_DOMAIN}
    />
  );
}
