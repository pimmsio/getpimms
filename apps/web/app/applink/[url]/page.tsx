import { getDirectAppLink } from "@/lib/middleware/utils";
import AppLinkRedirect from "@/ui/links/app-link-redirect";

export const runtime = "edge";

export default async function ApplinkPage({
  params,
  searchParams,
}: {
  params: Promise<{ url: string }>;
  searchParams: Promise<{ os?: string; browser?: string }>;
}) {
  // First decode the full URL parameter from the route
  const { url: rawUrl } = await params;
  const { os: rawOs, browser } = await searchParams;
  const url = decodeURIComponent(rawUrl);

  const os = rawOs as "ios" | "android" | undefined;

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
