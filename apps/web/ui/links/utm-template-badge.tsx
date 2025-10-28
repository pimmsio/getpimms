import { TagColorProps } from "@/lib/types";
import { COLORS_LIST } from "@/ui/links/tag-badge";
import { cn } from "@dub/utils";

export default function UtmTemplateBadge({
  name,
  color,
  className,
}: {
  name: string;
  color: TagColorProps;
  className?: string;
}) {
  const colorConfig = COLORS_LIST.find((c) => c.color === color);
  const css = colorConfig?.css || "bg-neutral-100 text-neutral-600";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-2 py-0.5 text-xs font-medium",
        css,
        className,
      )}
    >
      {name}
    </span>
  );
}

