import { LinksRow, LinksRowSkeleton } from "@/ui/shared/links-row";
import { LinkUtmColumns } from "@/ui/links/link-utm-columns";

type LinkData = {
  domain: string;
  key: string;
  url: string;
  title?: string | null;
  description?: string | null;
  createdAt?: string | Date | null;
};

type LinkUtmData = {
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

export function TableLinkCellContent({
  link,
  tags,
  isSkeleton,
}: {
  link?: LinkData | null;
  tags?: TagData[];
  isSkeleton?: boolean;
}) {
  if (isSkeleton) {
    return <LinksRowSkeleton showUtmRow={false} showMetrics={false} />;
  }

  if (!link) {
    return <span className="text-neutral-400">-</span>;
  }

  return (
    <LinksRow
      link={{
        domain: link.domain,
        key: link.key,
        url: link.url,
        title: link.title,
        description: link.description,
        createdAt: link.createdAt,
      }}
      tags={tags || []}
      showUtmRow={false}
    />
  );
}

export function TableUtmCellContent({
  link,
  tags,
  isSkeleton,
  showAllUtms = false,
}: {
  link?: LinkUtmData | null;
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
