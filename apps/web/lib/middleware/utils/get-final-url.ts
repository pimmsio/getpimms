import { REDIRECTION_QUERY_PARAM } from "@dub/utils/src/constants";
import { getUrlFromStringIfValid } from "@dub/utils/src/functions";
import { NextRequest } from "next/server";

export const getFinalUrl = (
  url: string,
  { req, clickId }: { req: NextRequest; clickId?: string },
) => {
  // query is the query string (e.g. d.to/github?utm_source=twitter -> ?utm_source=twitter)
  const searchParams = req.nextUrl.searchParams;

  // if there is a redirection url set, then use it instead of the target url
  const redirectionUrl = getUrlFromStringIfValid(
    searchParams.get(REDIRECTION_QUERY_PARAM) ?? "",
  );

  // get the query params of the target url
  const urlObj = redirectionUrl ? new URL(redirectionUrl) : new URL(url);

  if (clickId) {
    /*
       custom query param for stripe payment links + Dub Conversions
       - if there is a clickId and pimms_client_reference_id is 1
       - then set client_reference_id to pimms_id_${clickId} and drop the pimms_client_reference_id param
       - our Stripe integration will then detect `pimms_id_${clickId}` as the dubClickId in the `checkout.session.completed` webhook
       - @see: https://github.com/dubinc/dub/blob/main/apps/web/app/api/stripe/integration/webhook/checkout-session-completed.ts
    */
    if (urlObj.searchParams.get("pimms_client_reference_id") === "1") {
      urlObj.searchParams.set("client_reference_id", `pimms_id_${clickId}`);
      urlObj.searchParams.delete("pimms_client_reference_id");

      // if there's a clickId and no pimms-no-track search param, then add clickId to the final url
      // reasoning: if you're skipping tracking, there's no point in passing the clickId anyway
    } else if (!searchParams.has("pimms-no-track")) {
      // if it's a calendly link, then set the pimms_id into the utm_term
      if (urlObj.hostname.includes("calendly")) {
        urlObj.searchParams.set("utm_term", `pimms_id_${clickId}`);
      } else {
        urlObj.searchParams.set("pimms_id", clickId);
      }
    }
  }

  // if there are no query params, then return the target url as is (no need to parse it)
  // @ts-ignore – until https://github.com/microsoft/TypeScript/issues/54466 is fixed
  if (searchParams.size === 0) return urlObj.toString();

  // if searchParams (type: `URLSearchParams`) has the same key as target url, then overwrite it
  for (const [key, value] of searchParams) {
    // we will pass everything except internal query params (pimms-no-track and redir_url)
    if (["pimms-no-track", REDIRECTION_QUERY_PARAM].includes(key)) continue;
    urlObj.searchParams.set(key, value);
  }

  // remove qr param from the final url if the value is "1" (only used for detectQr function)
  if (urlObj.searchParams.get("qr") === "1") {
    urlObj.searchParams.delete("qr");
  }

  return urlObj.toString();
};

// Only add query params to the final URL if they are in this list
const allowedQueryParams = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "ref",
];

// Get final cleaned url for storing in TB
export const getFinalUrlForRecordClick = ({
  req,
  url,
}: {
  req: Request;
  url: string;
}) => {
  const searchParams = new URL(req.url).searchParams;

  // if there is a redirection url set, then use it instead of the target url
  const redirectionUrl = getUrlFromStringIfValid(
    searchParams.get(REDIRECTION_QUERY_PARAM) ?? "",
  );

  // get the query params of the target url
  const urlObj = redirectionUrl ? new URL(redirectionUrl) : new URL(url);

  // Filter out query params that are not in the allowed list
  if (searchParams.size > 0) {
    for (const [key, value] of searchParams) {
      if (allowedQueryParams.includes(key)) {
        urlObj.searchParams.set(key, value);
      }
    }
  }

  return urlObj.toString();
};
