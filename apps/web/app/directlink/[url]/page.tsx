import { getDirectLink } from "@/lib/middleware/utils";
import { getLinkViaEdge } from "@/lib/planetscale";
import DirectLinkRedirect from "@/ui/links/direct-link-redirect";
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

export default function DirectlinkPage({
  params,
  searchParams,
}: {
  params: { url: string };
  searchParams: { os?: string; browser?: string };
}) {
  // First decode the full URL parameter from the route
  const url = decodeURIComponent(params.url);

  const os = searchParams.os as "ios" | "android" | undefined;

  // get direct link uri scheme
  const directLink = getDirectLink(url, os);

  console.log("direct link", {
    directLink,
    url,
    os,
  });

  return <DirectLinkRedirect directLink={directLink} url={url} />;
}
