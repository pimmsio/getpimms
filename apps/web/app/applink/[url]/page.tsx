import { getDirectAppLink } from "@/lib/middleware/utils";
import AppLinkRedirect from "@/ui/links/app-link-redirect";
import { getLinkViaEdge } from "@/lib/planetscale";
import { getApexDomain, constructMetadata, getGoogleFavicon } from "@dub/utils";
import { unescape } from "html-escaper";

export const runtime = "edge";

export async function generateMetadata({
  params,
}: {
  params: { domain: string; key: string };
}) {
  const domain = params.domain;
  const key = decodeURIComponent(params.key); // key can potentially be encoded

  const data = await getLinkViaEdge({ domain, key });

  if (!data?.proxy) {
    return;
  }

  const apexDomain = getApexDomain(data.url);

  return constructMetadata({
    title: unescape(data.title || ""),
    description: unescape(data.description || ""),
    image: data.image,
    video: data.video,
    icons: getGoogleFavicon(apexDomain, false),
    noIndex: true,
  });
}

export default function ApplinkPage({
  params,
  searchParams,
}: {
  params: { url: string; };
  searchParams: { os?: string; browser?: string };
}) {
  // First decode the full URL parameter from the route
  const url = decodeURIComponent(params.url);

  const os = searchParams.os as "ios" | "android" | undefined;
  const browser = searchParams.browser as string | undefined;

  // get app link uri scheme
  const appLink = getDirectAppLink(url, os);

  console.log("direct app link", {
    appLink,
    url,
    os,
    browser,
  });

  return <AppLinkRedirect appLink={appLink} url={url} />;
}