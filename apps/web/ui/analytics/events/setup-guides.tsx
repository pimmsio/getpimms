"use client";

import { AppButtonLink } from "@/ui/components/controls/app-button";
import { cn, fetcher } from "@dub/utils";
import { BookOpen } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import useSWR from "swr";

type GuidesApiResponse =
  | {
      ok: true;
      guides: Array<{
        title: string;
        href: string;
        date?: string | null;
      }>;
    }
  | { ok: false; error: string; guides: [] };

export default function SetupGuides({
  embedded = false,
  className,
}: {
  embedded?: boolean;
  className?: string;
}) {
  const { data: guidesResponse } = useSWR<GuidesApiResponse>(
    "/api/pimms/guides",
    fetcher,
    { revalidateOnFocus: false, keepPreviousData: true },
  );

  const guides = guidesResponse?.ok ? guidesResponse.guides : [];
  const uniqueGuides = useMemo(() => {
    const byHref = new Map<string, (typeof guides)[number]>();
    for (const g of guides) {
      if (!byHref.has(g.href)) byHref.set(g.href, g);
    }
    return Array.from(byHref.values());
  }, [guides]);

  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? uniqueGuides : uniqueGuides.slice(0, 3);

  return (
    <div
      className={cn(
        embedded
          ? "rounded-lg border border-neutral-100 bg-neutral-50/40 p-4"
          : "mb-6 rounded-lg border border-neutral-200 bg-white p-4",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-neutral-900">Setup guides</div>
        <AppButtonLink
          href="https://pimms.io/guides"
          target="_blank"
          rel="noreferrer"
          variant="secondary"
          size="sm"
        >
          View all
        </AppButtonLink>
      </div>

      <div className="mt-1 text-sm text-neutral-600">
        Quick setup help to start tracking conversions.
      </div>

      {guidesResponse && !guidesResponse.ok ? (
        <div className="mt-4 text-sm text-neutral-600">Failed to load guides.</div>
      ) : uniqueGuides.length === 0 ? (
        <div className="mt-4 text-sm text-neutral-600">No guides found.</div>
      ) : (
        <>
          <div className="mt-4 divide-y divide-neutral-100 rounded-md border border-neutral-100">
            {visible.map((g) => (
              <Link
                key={g.href}
                href={g.href}
                target="_blank"
                rel="noreferrer"
                className="group flex items-center justify-between gap-3 px-3 py-2 transition-colors hover:bg-neutral-50"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-neutral-900">
                    {g.title}
                  </div>
                  <div className="mt-0.5 text-xs text-neutral-500">
                    {g.date ? g.date : "Guide"}
                  </div>
                </div>
                <BookOpen className="size-4 shrink-0 text-neutral-400 group-hover:text-neutral-700" />
              </Link>
            ))}
          </div>

          {uniqueGuides.length > 3 ? (
            <div className="mt-3 flex items-center justify-between">
              <button
                type="button"
                className="text-sm font-medium text-neutral-700 underline-offset-4 hover:underline"
                onClick={() => setExpanded((v) => !v)}
              >
                {expanded ? "Show less" : "Show more"}
              </button>
              <div className="text-xs text-neutral-500">
                Showing {visible.length} of {uniqueGuides.length}
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}


