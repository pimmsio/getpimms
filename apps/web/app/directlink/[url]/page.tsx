import { getDirectLink } from "@/lib/middleware/utils";
import DirectLinkRedirect from "@/ui/links/direct-link-redirect";

export const runtime = "edge";

export default async function DirectlinkPage({
  params,
  searchParams,
}: {
  params: Promise<{ url: string }>;
  searchParams: Promise<{ os?: string; browser?: string }>;
}) {
  console.log('Runtime:', (globalThis as any).EdgeRuntime ? 'edge' : 'node');

  const { url: encodedUrl } = await params;
  const { os } = await searchParams;

  // First decode the full URL parameter from the route
  const url = decodeURIComponent(encodedUrl);

  const osParam = os as "ios" | "android" | undefined;

  // get direct link uri scheme
  const directLink = getDirectLink(url, osParam);

  console.log("direct link", {
    directLink,
    url,
    os: osParam,
  });

  return <DirectLinkRedirect directLink={directLink} url={url} />;
}
