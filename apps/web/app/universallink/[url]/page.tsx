import { getDirectLink } from "@/lib/middleware/utils";
import { linkConstructor } from "@dub/utils";
import UniversalLinkRedirect from "@/ui/links/universal-link-redirect";

export const runtime = "edge";

export default function UniversalLinkPage({
  params,
  searchParams,
}: {
  params: { url: string };
  searchParams: {
    os?: string;
    browser?: string;
    key?: string;
    domain?: string;
    universal?: string;
  };
}) {
  console.log('Runtime:', (globalThis as any).EdgeRuntime ? 'edge' : 'node');

  // First decode the full URL parameter from the route
  const url = decodeURIComponent(params.url);

  const os = searchParams.os as "ios" | "android" | undefined;
  const browser = searchParams.browser as string | undefined;
  const key = searchParams.key as string | undefined;
  const domain = searchParams.domain as string | undefined;
  const universal = searchParams.universal as string | undefined;
  // get direct link uri scheme
  const directLink = !universal
    ? getDirectLink(
        browser?.includes("safari")
          ? url
          : linkConstructor({
              domain,
              key,
              searchParams: { universal: "true" },
            }),
        os,
      )
    : undefined;

  console.log("universal link", {
    directLink,
    url,
    os,
    key,
    domain,
    universal,
  });

  return <UniversalLinkRedirect directLink={directLink} url={url} />;
}
