import { useRouterStuff } from "@dub/ui";
import { PLANS } from "@dub/utils";
import { Tag } from "lucide-react";
import { useMemo } from "react";

export function useWorkspaceFilters() {
  const { queryParams, searchParamsObj } = useRouterStuff();

  // Available plan options - extract just the plan names
  const planOptions = useMemo(() => {
    const planNames = ["free", "starter", "pro", "business", "enterprise"];
    return planNames.map((planName) => ({
      value: planName,
      label: planName.charAt(0).toUpperCase() + planName.slice(1),
      count: undefined, // We could add counts later if needed
    }));
  }, []);

  const filters = useMemo(() => {
    return [
      {
        key: "plan",
        label: "Plan",
        icon: Tag,
        options: planOptions,
        multiple: true,
      },
    ];
  }, [planOptions]);

  // Parse selected plan(s) from URL
  const selectedPlans = useMemo(() => {
    const plans = searchParamsObj.plan;
    if (!plans) return [];
    return typeof plans === "string" ? plans.split(",") : [plans];
  }, [searchParamsObj.plan]);

  const activeFilters = useMemo(() => {
    const { plan } = searchParamsObj;
    console.log("Debug filters:", { plan, selectedPlans, searchParamsObj });
    return [
      ...(plan ? [{ key: "plan", value: selectedPlans }] : []),
    ];
  }, [searchParamsObj, selectedPlans]);

  const onSelect = (key: string, value: any) => {
    if (key === "plan") {
      queryParams({
        set: {
          plan: selectedPlans.concat(value).join(","),
        },
        del: "page",
      });
    } else {
      queryParams({
        set: {
          [key]: value,
        },
        del: "page",
      });
    }
  };

  const onRemove = (key: string, value: any) => {
    if (
      key === "plan" &&
      !(selectedPlans.length === 1 && selectedPlans[0] === value)
    ) {
      queryParams({
        set: {
          plan: selectedPlans.filter((plan) => plan !== value).join(","),
        },
        del: "page",
      });
    } else {
      queryParams({
        del: [key, "page"],
      });
    }
  };

  const onRemoveAll = () => {
    queryParams({
      del: ["plan", "search"],
    });
  };

  return {
    filters,
    activeFilters,
    onSelect,
    onRemove,
    onRemoveAll,
  };
}
