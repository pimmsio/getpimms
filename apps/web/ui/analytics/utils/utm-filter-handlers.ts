type QueryParams = (params: {
  set?: Record<string, string | string[]>;
  del?: string | string[];
  replace?: boolean;
  scroll?: boolean;
  getNewPath?: boolean;
  arrayDelimiter?: string;
}) => void;

type UtmFilterHandlersProps = {
  queryParams: QueryParams;
  selectedUtmSources: string[];
  selectedUtmMediums: string[];
  selectedUtmCampaigns: string[];
  selectedUtmTerms: string[];
  selectedUtmContents: string[];
};

export function createUtmFilterHandlers({
  queryParams,
  selectedUtmSources,
  selectedUtmMediums,
  selectedUtmCampaigns,
  selectedUtmTerms,
  selectedUtmContents,
}: UtmFilterHandlersProps) {
  const handleSelect = (key: string, value: any) => {
    let setValue: Record<string, string> = {};

    if (key === "utm_source") {
      setValue = {
        utm_source: selectedUtmSources.concat(value).join(","),
      };
    } else if (key === "utm_medium") {
      setValue = {
        utm_medium: selectedUtmMediums.concat(value).join(","),
      };
    } else if (key === "utm_campaign") {
      setValue = {
        utm_campaign: selectedUtmCampaigns.concat(value).join(","),
      };
    } else if (key === "utm_term") {
      setValue = {
        utm_term: selectedUtmTerms.concat(value).join(","),
      };
    } else if (key === "utm_content") {
      setValue = {
        utm_content: selectedUtmContents.concat(value).join(","),
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
    if (key === "utm_source" && !(selectedUtmSources.length === 1 && selectedUtmSources[0] === value)) {
      queryParams({
        set: {
          utm_source: selectedUtmSources.filter((v) => v !== value).join(","),
        },
        scroll: false,
      });
      return;
    }

    if (key === "utm_medium" && !(selectedUtmMediums.length === 1 && selectedUtmMediums[0] === value)) {
      queryParams({
        set: {
          utm_medium: selectedUtmMediums.filter((v) => v !== value).join(","),
        },
        scroll: false,
      });
      return;
    }

    if (key === "utm_campaign" && !(selectedUtmCampaigns.length === 1 && selectedUtmCampaigns[0] === value)) {
      queryParams({
        set: {
          utm_campaign: selectedUtmCampaigns.filter((v) => v !== value).join(","),
        },
        scroll: false,
      });
      return;
    }

    if (key === "utm_term" && !(selectedUtmTerms.length === 1 && selectedUtmTerms[0] === value)) {
      queryParams({
        set: {
          utm_term: selectedUtmTerms.filter((v) => v !== value).join(","),
        },
        scroll: false,
      });
      return;
    }

    if (key === "utm_content" && !(selectedUtmContents.length === 1 && selectedUtmContents[0] === value)) {
      queryParams({
        set: {
          utm_content: selectedUtmContents.filter((v) => v !== value).join(","),
        },
        scroll: false,
      });
      return;
    }

    // Default: remove the entire filter
    queryParams({
      del: key,
      scroll: false,
    });
  };

  return { handleSelect, handleRemove };
}

