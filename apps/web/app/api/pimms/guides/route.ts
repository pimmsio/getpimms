import { NextResponse } from "next/server";

type GuideItem = {
  title: string;
  href: string;
  date?: string | null;
  thumbnail?: string | null;
};

function parseGuidesFromHtml(html: string): GuideItem[] {
  const out: GuideItem[] = [];

  const cardRegex =
    /<a\b[^>]*href="(\/guides\/[^"]+)"[^>]*>[\s\S]*?<img\b[^>]*alt="([^"]+)"[^>]*>[\s\S]*?<\/a>/g;

  const dateRegex = /\b([A-Z][a-z]+ \d{1,2}, \d{4})\b/;
  const assetRegexGlobal = /https?:\/\/assets\.pimms\.io\/[^"'\s)]+/g;
  const nextImageEncodedAssetRegexGlobal =
    /url=(https%3A%2F%2Fassets\.pimms\.io%2F[^&"'\s)]+)/g;
  const preferredAssetRegex =
    /(guide|pimms\.webp|conversion|stripe|systeme|calcom|webflow|framer|wordpress|tally|zapier|calendly|elementor|brevo|podia)/i;
  const excludedAssetRegex = /(linkedin-profile|avatar|dicebear)/i;

  for (const match of html.matchAll(cardRegex)) {
    const hrefPath = match[1];
    const title = match[2];
    if (!hrefPath || !title) continue;

    const block = match[0] || "";
    const dateMatch = block.match(dateRegex)?.[1] ?? null;
    const decodedAssets = [...block.matchAll(nextImageEncodedAssetRegexGlobal)]
      .map((m) => {
        try {
          return decodeURIComponent(m[1] || "");
        } catch {
          return null;
        }
      })
      .filter((u): u is string => Boolean(u));

    const plainAssets = [...block.matchAll(assetRegexGlobal)].map((m) => m[0]);
    const assets = [...decodedAssets, ...plainAssets];

    const asset =
      assets.find(
        (u) => preferredAssetRegex.test(u) && !excludedAssetRegex.test(u),
      ) ??
      assets.find((u) => !excludedAssetRegex.test(u)) ??
      assets[0] ??
      null;

    out.push({
      title,
      href: `https://pimms.io${hrefPath}`,
      date: dateMatch,
      thumbnail: asset && excludedAssetRegex.test(asset) ? null : asset,
    });
  }

  return out;
}

function dedupeGuides(items: GuideItem[]) {
  const seen = new Set<string>();
  const out: GuideItem[] = [];
  for (const item of items) {
    const key = item.href;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

function sortNewestFirst(items: GuideItem[]) {
  return [...items].sort((a, b) => {
    const da = a.date ? Date.parse(a.date) : 0;
    const db = b.date ? Date.parse(b.date) : 0;
    return db - da;
  });
}

export async function GET() {
  const res = await fetch("https://pimms.io/guides", {
    // cache on the Next.js side
    next: { revalidate: 60 * 30 },
    headers: {
      "User-Agent": "PIMMS-App-GuidesFetcher/1.0",
      Accept: "text/html",
    },
  });

  if (!res.ok) {
    return NextResponse.json(
      { ok: false, error: `Failed to fetch guides (${res.status})`, guides: [] },
      { status: 200 },
    );
  }

  const html = await res.text();
  const parsed = parseGuidesFromHtml(html);
  const guides = sortNewestFirst(dedupeGuides(parsed));

  return NextResponse.json({ ok: true, guides }, { status: 200 });
}

