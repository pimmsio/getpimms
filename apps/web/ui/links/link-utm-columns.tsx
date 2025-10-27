import { Tooltip, useRouterStuff } from "@dub/ui";
import { cn } from "@dub/utils";
import { useSearchParams } from "next/navigation";
import { ResponseLink } from "./links-container";

type UtmField = "utm_source" | "utm_medium" | "utm_campaign";

const UTM_LABELS: Record<UtmField, string> = {
  utm_source: "Source",
  utm_medium: "Medium",
  utm_campaign: "Campaign",
};

interface UtmColumnProps {
  link: ResponseLink;
  field: UtmField;
}

function UtmColumn({ link, field }: UtmColumnProps) {
  const { queryParams } = useRouterStuff();
  const searchParams = useSearchParams();
  const value = link[field];

  const selectedValues =
    searchParams?.get(field)?.split(",")?.filter(Boolean) ?? [];
  const isSelected = value && selectedValues.includes(value);

  const columnContent = (
    <div className="flex w-[80px] xl:w-[110px] flex-col gap-0.5">
      <span className="text-[8px] font-semibold uppercase tracking-wider text-neutral-400 text-center">
        {UTM_LABELS[field]}
      </span>
      {!value ? (
        <div className="flex h-7 items-center justify-center rounded-md border border-neutral-100 bg-white px-2">
          <span className="text-xs text-neutral-300">—</span>
        </div>
      ) : (
        <button
          onClick={(e) => {
            e.stopPropagation();
            const newValues = isSelected
              ? selectedValues.filter((v) => v !== value)
              : [...selectedValues, value];

            queryParams({
              set: {
                [field]: newValues.join(","),
              },
              del: [...(newValues.length ? [] : [field]), "page"],
            });
          }}
          className={cn(
            "flex h-7 items-center justify-center rounded-md border px-2 transition-colors",
            isSelected
              ? "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
              : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50",
          )}
        >
          <span className="truncate text-xs font-medium">{value}</span>
        </button>
      )}
    </div>
  );

  // Only show tooltip if value exists and is long
  if (value && value.length > 11) {
    return (
      <Tooltip content={value} side="top">
        {columnContent}
      </Tooltip>
    );
  }

  return columnContent;
}

export function LinkUtmColumns({ link }: { link: ResponseLink }) {
  // Check if link has any UTM values
  const hasUtmValues = !!(link.utm_source || link.utm_medium || link.utm_campaign);
  
  if (!hasUtmValues) {
    return null;
  }

  return (
    <div className="hidden items-start gap-2.5 lg:flex">
      <UtmColumn link={link} field="utm_source" />
      <UtmColumn link={link} field="utm_medium" />
      <UtmColumn link={link} field="utm_campaign" />
    </div>
  );
}

