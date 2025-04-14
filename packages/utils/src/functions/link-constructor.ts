import { getApexDomain, punycode } from ".";
import { GOOGLE_FAVICON_URL } from "../constants";

export function linkConstructor({
  domain,
  key,
  pretty,
  searchParams,
}: {
  domain?: string;
  key?: string;
  pretty?: boolean;
  searchParams?: Record<string, string>;
}) {
  if (!domain) {
    return "";
  }

  let url = `https://${punycode(domain)}${key && key !== "_root" ? `/${punycode(key)}` : ""}`;

  if (searchParams) {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      search.set(key, value);
    }
    url += `?${search.toString()}`;
  }

  return pretty ? url.replace(/^https?:\/\//, "") : url;
}

export function linkConstructorSimple({
  domain,
  key,
}: {
  domain: string;
  key: string;
}) {
  return `https://${domain}${key === "_root" ? "" : `/${key}`}`;
}


export const getGoogleFavicon = (url: string, withApexDomain = true) => {
  let finalUrl = url;
  if (url.includes("pim.ms")) {
    finalUrl = url.replace("pim.ms", "pimms.io");
  }

  return `${GOOGLE_FAVICON_URL}${withApexDomain ? getApexDomain(finalUrl) : finalUrl}`;
};
