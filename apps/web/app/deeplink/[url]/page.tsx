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

export default function DeepLinkPage({ params }: { params: { url: string } }) {
  // First decode the full URL parameter from the route
  const url = decodeURIComponent(params.url);
  // Split into base URL and query string
  const [baseUrl, queryString] = url.split("?");

  let redirectUrl = url;

  // if there are query parameters, we need to process them
  if (queryString) {
    // Parse the query string (but don't use toString() later as it adds extra encoding)
    const queryParams = new URLSearchParams(queryString);

    // Process each parameter with proper encoding
    const processedParams = Array.from(queryParams.entries()).map(
      ([key, value]) => {
        // Handle form-encoded spaces ('+' → ' ')
        const decodedFromForm = value.replace(/\+/g, " ");
        // Decode any existing percent-encoding (e.g., '%26' → '&')
        const fullyDecoded = decodeURIComponent(decodedFromForm);
        // Apply one clean round of encoding
        const encoded = encodeURIComponent(fullyDecoded);

        return `${key}=${encoded}`;
      },
    );

    // Reconstruct the URL with properly encoded parameters
    redirectUrl = `${baseUrl}?${processedParams.join("&")}`;
  }

  // Redirect to the redirect URL (which may be the same as the original URL,
  // or a cleaned-up version with properly encoded parameters)
  return <meta httpEquiv="refresh" content={`0; url=${redirectUrl}`} />;
}
