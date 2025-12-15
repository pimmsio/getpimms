export const isValidUrl = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

export const getUrlFromString = (str: string) => {
  // #region agent log
  const inputStr = str;
  // #endregion
  if (isValidUrl(str)) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/6cdbc392-7dc8-4dc6-8f38-3f8b9abe8267',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'urls.ts:11',message:'getUrlFromString - already valid URL',data:{input:inputStr,output:str},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    return str;
  }
  try {
    if (str.includes(".") && !str.includes(" ")) {
      const result = new URL(`https://${str}`).toString();
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/6cdbc392-7dc8-4dc6-8f38-3f8b9abe8267',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'urls.ts:14',message:'getUrlFromString - added https://',data:{input:inputStr,output:result},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      return result;
    }
  } catch (_) {}
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/6cdbc392-7dc8-4dc6-8f38-3f8b9abe8267',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'urls.ts:17',message:'getUrlFromString - returned as-is',data:{input:inputStr,output:str},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  // #endregion
  return str;
};

export const getUrlFromStringIfValid = (str: string) => {
  if (isValidUrl(str)) return str;
  try {
    if (str.includes(".") && !str.includes(" ")) {
      return new URL(`https://${str}`).toString();
    }
  } catch (_) {}
  return null;
};

export const getSearchParams = (url: string) => {
  // Create a params object
  let params = {} as Record<string, string>;

  new URL(url).searchParams.forEach(function (val, key) {
    params[key] = val;
  });

  return params;
};

export const getSearchParamsWithArray = (url: string) => {
  let params = {} as Record<string, string | string[]>;

  new URL(url).searchParams.forEach(function (val, key) {
    if (key in params) {
      const param = params[key];
      Array.isArray(param) ? param.push(val) : (params[key] = [param, val]);
    } else {
      params[key] = val;
    }
  });

  return params;
};

export const getParamsFromURL = (url: string) => {
  if (!url) return {};
  try {
    const params = new URL(url).searchParams;
    const paramsObj: Record<string, string> = {};
    for (const [key, value] of params.entries()) {
      if (value && value !== "") {
        paramsObj[key] = value;
      }
    }
    return paramsObj;
  } catch (e) {
    return {};
  }
};

export const UTMTags = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "ref",
] as const;

export const constructURLFromUTMParams = (
  url: string,
  utmParams: Record<string, string>,
) => {
  if (!url) return "";
  try {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/6cdbc392-7dc8-4dc6-8f38-3f8b9abe8267',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'urls.ts:87',message:'constructURLFromUTMParams entry',data:{inputUrl:url,utmParams},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    const parsedUrl = getUrlFromString(url);
    const newURL = new URL(parsedUrl);
    // #region agent log
    const originalSearchParams = newURL.searchParams.toString();
    fetch('http://127.0.0.1:7242/ingest/6cdbc392-7dc8-4dc6-8f38-3f8b9abe8267',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'urls.ts:89',message:'Before setting UTM params',data:{originalSearchParams,parsedUrl},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    for (const [key, value] of Object.entries(utmParams)) {
      if (value === "") {
        newURL.searchParams.delete(key);
      } else {
        const valueBeforeReplace = value;
        const valueAfterReplace = value.replace("+", " ");
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/6cdbc392-7dc8-4dc6-8f38-3f8b9abe8267',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'urls.ts:93',message:'Setting UTM param with character replacement',data:{key,valueBeforeReplace,valueAfterReplace},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        newURL.searchParams.set(key, valueAfterReplace);
      }
    }
    const finalUrl = newURL.toString();
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/6cdbc392-7dc8-4dc6-8f38-3f8b9abe8267',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'urls.ts:96',message:'constructURLFromUTMParams exit',data:{finalUrl,originalSearchParams,finalSearchParams:newURL.searchParams.toString()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    return finalUrl;
  } catch (e) {
    return "";
  }
};

export const paramsMetadata = [
  { display: "UTM Source", key: "utm_source", examples: "google, twitter" },
  { display: "UTM Medium", key: "utm_medium", examples: "social, email" },
  { display: "UTM Campaign", key: "utm_campaign", examples: "summer sale" },
  { display: "UTM Term", key: "utm_term", examples: "blue shoes" },
  { display: "UTM Content", key: "utm_content", examples: "logo link" },
  { display: "Referral (ref)", key: "ref", examples: "google, twitter" },
];

export const getUrlWithoutUTMParams = (url: string) => {
  try {
    const parsedUrl = getUrlFromString(url);
    const newURL = new URL(parsedUrl);
    paramsMetadata.forEach((param) => newURL.searchParams.delete(param.key));
    return newURL.toString();
  } catch (e) {
    return url;
  }
};

export const getPrettyUrl = (url?: string | null) => {
  if (!url) return "";
  // remove protocol (http/https) and www.
  // also remove trailing slash
  return url
    .replace(/(^\w+:|^)\/\//, "")
    .replace("www.", "")
    .replace(/\/$/, "");
};

export const createHref = (
  href: string,
  domain: string,
  // any params, doesn't have to be all of them
  utmParams?: Partial<Record<(typeof UTMTags)[number], string>>,
) => {
  if (domain === "pimms.io") return href;
  const url = new URL(href.startsWith("/") ? `https://pimms.io${href}` : href);
  if (utmParams) {
    Object.entries(utmParams).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }
  return url.toString();
};
