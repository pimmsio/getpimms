import { getDirectLink } from "@/lib/middleware/utils";
import DirectLinkRedirect from "@/ui/links/direct-link-redirect";

export const runtime = "edge";

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
  const browser = searchParams.browser as string | undefined;

  // get direct link uri scheme
  const directLink = getDirectLink(url, os);

  console.log("direct link", {
    directLink,
    url,
    os,
    browser,
  });
  
  return <DirectLinkRedirect directLink={directLink} url={url} os={os} browser={browser} />;
}
