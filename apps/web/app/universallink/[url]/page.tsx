import { getDirectLink } from "@/lib/middleware/utils";
import UniversalLinkRedirect from "@/ui/links/universal-link-redirect";
import { linkConstructor } from "@dub/utils";

export const runtime = "edge";

export default async function UniversalLinkPage({
  params,
  searchParams,
}: {
  params: Promise<{ url: string }>;
  searchParams: Promise<{
    os?: string;
    browser?: string;
    key?: string;
    domain?: string;
    universal?: string;
  }>;
}) {
  console.log("Runtime:", (globalThis as any).EdgeRuntime ? "edge" : "node");

  const { url: encodedUrl } = await params;
  const { os, browser, key, domain, universal } = await searchParams;

  // First decode the full URL parameter from the route
  const url = decodeURIComponent(encodedUrl);

  const osParam = os as "ios" | "android" | undefined;
  const browserParam = browser as string | undefined;
  const keyParam = key as string | undefined;
  const domainParam = domain as string | undefined;
  const universalParam = universal as string | undefined;
  // get direct link uri scheme
  const directLink = !universalParam
    ? getDirectLink(
        browserParam?.includes("safari")
          ? url
          : linkConstructor({
              domain: domainParam,
              key: keyParam,
              searchParams: { universal: "true" },
            }),
        osParam,
      )
    : undefined;

  console.log("universal link", {
    directLink,
    url,
    os: osParam,
    key: keyParam,
    domain: domainParam,
    universal: universalParam,
  });

  return <UniversalLinkRedirect directLink={directLink} url={url} />;
}
