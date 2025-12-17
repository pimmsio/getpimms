import { LinkUtmColumns } from "@/ui/links/link-utm-columns";

type LinkData = {
  url?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_term?: string | null;
  utm_content?: string | null;
};

type TagData = {
  id: string;
  name: string;
  color: string;
};

export function TableUtmCellContent({
  link,
  tags,
  isSkeleton,
  showAllUtms = false,
}: {
  link?: LinkData | null;
  tags?: TagData[];
  isSkeleton?: boolean;
  showAllUtms?: boolean;
}) {
  if (isSkeleton) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-4 w-20 animate-pulse rounded bg-neutral-200" />
        <div className="h-4 w-24 animate-pulse rounded bg-neutral-200" />
        <div className="h-4 w-16 animate-pulse rounded bg-neutral-200" />
      </div>
    );
  }

  if (!link) {
    return <span className="text-neutral-400">-</span>;
  }

  return (
    <div className="w-full overflow-x-auto">
      <LinkUtmColumns
        link={{
          url: link.url ?? null,
          utm_source: link.utm_source ?? null,
          utm_medium: link.utm_medium ?? null,
          utm_campaign: link.utm_campaign ?? null,
          utm_term: link.utm_term ?? null,
          utm_content: link.utm_content ?? null,
        }}
        tags={tags || []}
        visibleUtmKeys={
          showAllUtms
            ? ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"]
            : undefined
        }
        showTagsColumn={true}
      />
    </div>
  );
}
