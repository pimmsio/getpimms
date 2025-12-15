import { generateFilters } from "@/lib/ai/generate-filters";
import { readStreamableValue } from "ai/rsc";
import posthog from "posthog-js";

type QueryParams = (params: {
  set?: Record<string, string | string[]>;
  del?: string | string[];
  replace?: boolean;
  scroll?: boolean;
  getNewPath?: boolean;
  arrayDelimiter?: string;
}) => void;

type RegularFilterHandlersProps = {
  queryParams: QueryParams;
  selectedTagIds: string[];
  selectedHotScores: string[];
  selectedUrls: string[];
  selectedCountries: string[];
  selectedCities: string[];
  selectedDevices: string[];
  selectedBrowsers: string[];
  selectedOs: string[];
  selectedReferers: string[];
  activeFilters: Array<{ key: string; value: any }>;
  setStreaming: (streaming: boolean) => void;
};

export function createRegularFilterHandlers({
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
}: RegularFilterHandlersProps) {
  const handleSelect = async (key: string, value: any) => {
    if (key === "ai") {
      setStreaming(true);
      const prompt = value.replace("Ask AI ", "");
      const { object } = await generateFilters(prompt);
      for await (const partialObject of readStreamableValue(object)) {
        if (partialObject) {
          queryParams({
            set: Object.fromEntries(
              Object.entries(partialObject).map(([key, value]) => [
                key,
                // Convert Dates to ISO strings
                value instanceof Date ? value.toISOString() : String(value),
              ]),
            ),
          });
        }
      }
      posthog.capture("ai_filters_generated", {
        prompt,
        filters: activeFilters,
      });
      setStreaming(false);
      return;
    }

    // Build the set object based on filter type
    let setValue: Record<string, string> = {};

    if (key === "link") {
      setValue = {
        domain: new URL(`https://${value}`).hostname,
        key: new URL(`https://${value}`).pathname.slice(1) || "_root",
      };
    } else if (key === "tagIds") {
      setValue = {
        tagIds: selectedTagIds.concat(value).join(","),
      };
    } else if (key === "hotScore") {
      setValue = {
        hotScore: selectedHotScores.concat(value).join(","),
      };
    } else if (key === "url") {
      setValue = {
        url: selectedUrls.concat(value).join(","),
      };
    } else if (key === "country") {
      setValue = {
        country: selectedCountries.concat(value).join(","),
      };
    } else if (key === "city") {
      setValue = {
        city: selectedCities.concat(value).join(","),
      };
    } else if (key === "device") {
      setValue = {
        device: selectedDevices.concat(value).join(","),
      };
    } else if (key === "browser") {
      setValue = {
        browser: selectedBrowsers.concat(value).join(","),
      };
    } else if (key === "os") {
      setValue = {
        os: selectedOs.concat(value).join(","),
      };
    } else if (key === "referer") {
      setValue = {
        referer: selectedReferers.concat(value).join(","),
      };
    } else {
      setValue = {
        [key]: value,
      };
    }

    queryParams({
      set: setValue,
      del: "page",
      scroll: false,
    });
  };

  const handleRemove = (key: string, value: any) => {
    // Handle multi-select filters that need to remove a single value
    if (key === "tagIds" && !(selectedTagIds.length === 1 && selectedTagIds[0] === value)) {
      queryParams({
        set: {
          tagIds: selectedTagIds.filter((id) => id !== value).join(","),
        },
        scroll: false,
      });
      return;
    }

    if (key === "url" && !(selectedUrls.length === 1 && selectedUrls[0] === value)) {
      queryParams({
        set: {
          url: selectedUrls.filter((v) => v !== value).join(","),
        },
        scroll: false,
      });
      return;
    }

    if (key === "country" && !(selectedCountries.length === 1 && selectedCountries[0] === value)) {
      queryParams({
        set: {
          country: selectedCountries.filter((v) => v !== value).join(","),
        },
        scroll: false,
      });
      return;
    }

    if (key === "city" && !(selectedCities.length === 1 && selectedCities[0] === value)) {
      queryParams({
        set: {
          city: selectedCities.filter((v) => v !== value).join(","),
        },
        scroll: false,
      });
      return;
    }

    if (key === "device" && !(selectedDevices.length === 1 && selectedDevices[0] === value)) {
      queryParams({
        set: {
          device: selectedDevices.filter((v) => v !== value).join(","),
        },
        scroll: false,
      });
      return;
    }

    if (key === "browser" && !(selectedBrowsers.length === 1 && selectedBrowsers[0] === value)) {
      queryParams({
        set: {
          browser: selectedBrowsers.filter((v) => v !== value).join(","),
        },
        scroll: false,
      });
      return;
    }

    if (key === "os" && !(selectedOs.length === 1 && selectedOs[0] === value)) {
      queryParams({
        set: {
          os: selectedOs.filter((v) => v !== value).join(","),
        },
        scroll: false,
      });
      return;
    }

    if (key === "referer" && !(selectedReferers.length === 1 && selectedReferers[0] === value)) {
      queryParams({
        set: {
          referer: selectedReferers.filter((v) => v !== value).join(","),
        },
        scroll: false,
      });
      return;
    }

    // Default: remove the entire filter
    const delKey = key === "link" ? ["domain", "key", "url"] : key;
    queryParams({
      del: delKey,
      scroll: false,
    });
  };

  return { handleSelect, handleRemove };
}

