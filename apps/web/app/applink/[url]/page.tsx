import { getDirectAppLink } from "@/lib/middleware/utils";
import AppLinkRedirect from "@/ui/links/app-link-redirect";

export const runtime = "edge";

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