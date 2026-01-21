"use client";

import { useParams, useSearchParams } from "next/navigation";

export function useWorkspaceSlug(): string | null {
  // `next/navigation` hooks can throw when rendered outside the App Router context
  // (e.g. Storybook/tests). We fall back gracefully instead of crashing the whole page.
  let params: Record<string, unknown> = {};
  let searchParams: ReturnType<typeof useSearchParams> | null = null;
  try {
    params = useParams() as Record<string, unknown>;
  } catch {
    params = {};
  }
  try {
    searchParams = useSearchParams();
  } catch {
    searchParams = null;
  }

  const rawSlug = params?.slug;
  let slug =
    typeof rawSlug === "string"
      ? rawSlug
      : Array.isArray(rawSlug) && typeof rawSlug[0] === "string"
        ? rawSlug[0]
        : null;
  if (!slug) {
    slug = searchParams?.get("slug") || searchParams?.get("workspace") || null;
  }

  return slug;
}
