import { constructMetadata, getApexDomain, getGoogleFavicon } from "@dub/utils";
import { getMetaTags } from "app/api/metatags/utils";

export const runtime = "edge";
export const fetchCache = "force-no-store";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ url: string }>;
}) {
  const { url: encodedUrl } = await params;
  const url = decodeURIComponent(encodedUrl); // key can potentially be encoded

  const metatags = await getMetaTags(url);

  const apexDomain = getApexDomain(url);

  return constructMetadata({
    fullTitle: metatags.title,
    description: metatags.description,
    image: metatags.image,
    icons: getGoogleFavicon(apexDomain, false),
    noIndex: true,
  });
}

export default async function CloakedPage({
  params,
}: {
  params: Promise<{ url: string }>;
}) {
  const { url: encodedUrl } = await params;
  const url = decodeURIComponent(encodedUrl);

  return <iframe src={url} className="min-h-screen w-full border-none" />;
}
