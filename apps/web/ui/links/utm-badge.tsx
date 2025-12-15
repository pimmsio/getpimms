import { Tooltip } from "@dub/ui";
import { cn } from "@dub/utils";

export type UtmType = "source" | "medium" | "campaign";

const UTM_CONFIG: Record<UtmType, { label: string; bg: string; border: string; text: string }> = {
  source: {
    label: "Source",
    bg: "bg-gray-50",
    border: "border-gray-200",
    text: "text-gray-700",
  },
  medium: {
    label: "Medium",
    bg: "bg-gray-50",
    border: "border-gray-200",
    text: "text-gray-700",
  },
  campaign: {
    label: "Campaign",
    bg: "bg-gray-50",
    border: "border-gray-200",
    text: "text-gray-700",
  },
};

export function UtmBadge({
  type,
  value,
  className,
  onClick,
}: {
  type: UtmType;
  value: string;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}) {
  const config = UTM_CONFIG[type];
  const tooltipContent = `${config.label}: ${value}`;

  const badge = (
    <span
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-xs font-medium w-[80px] xl:w-[110px]",
        config.bg,
        config.border,
        config.text,
        onClick && "cursor-pointer transition-all hover:opacity-80 hover:shadow-sm",
        className,
      )}
    >
      <span className="truncate">{value}</span>
    </span>
  );

  // Only show tooltip if value is long enough to potentially truncate
  if (value.length > 8 || onClick) {
    return (
      <Tooltip content={tooltipContent} side="top">
        {badge}
      </Tooltip>
    );
  }

  return badge;
}
