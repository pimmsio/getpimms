// Helper: Extract the full pathname from the URL.
// example: https://vercel.com/pimms/pim-ms/logs?abc
// returns: pimms/pim-ms/logs
export const extractPathname = (url: string): string | null => {
  try {
    const parsedUrl = new URL(url);
    const pathname = parsedUrl.pathname.slice(1);
    const searchParams = parsedUrl.search;
    return `${pathname}${searchParams}`;
  } catch {
    return null;
  }
};

// Helper: Extract domain, pathname, and search params from the URL.
// example: https://vercel.com/pimms/pim-ms/logs?abc
// returns: vercel.com/pimms/pim-ms/logs?abc
export const extractDomainAndPath = (url: string): string | null => {
  try {
    const parsedUrl = new URL(url);
    // Remove 'www.' from the hostname if it exists.
    const hostname = parsedUrl.hostname.replace(/^www\./, "");
    // Get pathname and search params
    const pathname = parsedUrl.pathname;
    const searchParams = parsedUrl.search;
    return `${hostname}${pathname}${searchParams}`;
  } catch {
    return null;
  }
};

// Helper: Extract domain, pathname, and search params from the URL.
// example: https://vercel.com/pimms/pim-ms/logs?abc
// returns: www.vercel.com/pimms/pim-ms/logs?abc
export const extractDomainWwwAndPath = (url: string): string | null => {
  try {
    const parsedUrl = new URL(url);
    // Remove 'www.' from the hostname if it exists.
    const hostname = parsedUrl.hostname.replace(/^www\./, "");
    // Get pathname and search params
    const pathname = parsedUrl.pathname;
    const searchParams = parsedUrl.search;
    return `www.${hostname}${pathname}${searchParams}`;
  } catch {
    return null;
  }
};
