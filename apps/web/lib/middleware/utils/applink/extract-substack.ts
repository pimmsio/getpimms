import { extractDomainAndPath } from "./extract-generic";

export const getSubstackAndroidPath = (url: string): string | null => {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname;
    const search = parsed.search;

    // Case 1: open.substack.com → use as-is
    if (hostname === "open.substack.com") {
      const path = extractDomainAndPath(url);
      return path || null;
    }

    // Case 2: username.substack.com → rewrite
    const subdomainMatch = hostname.match(/^([a-z0-9-]+)\.substack\.com$/i);
    if (subdomainMatch) {
      const username = subdomainMatch[1];
      const pathname = parsed.pathname.replace(/^\/+|\/+$/g, "");
      const pathPart = pathname ? `${username}/${pathname}` : username;
      return `open.substack.com/pub/${pathPart}${search}`;
    }

    // Case 3: fallback
    return extractDomainAndPath(url) || null;
  } catch {
    return null;
  }
};

export function normalizeSubstack(url: string): string {
  // 1. 99 % des cas : l’URL ne contient même pas ".substack.com"
  //    → on la renvoie instantanément (0 allocation, 0 try/catch).
  if (url.indexOf(".substack.com") === -1) return url;

  try {
    // 2. Parsing uniquement pour les URL Substack.
    const u = new URL(url);

    // 2.a Déjà au bon domaine.
    if (u.hostname === "open.substack.com") return url;

    console.log("url is a substack", url);

    // 2.b username.substack.com
    const m = u.hostname.match(/^([a-z0-9-]+)\.substack\.com$/i);
    if (!m) return url; // sous-domaine inattendu → aucun changement

    const user = m[1];
    const cleanPath = u.pathname.replace(/^\/+|\/+$/g, ""); // supprime "/" en trop
    const tail = cleanPath ? `${user}/${cleanPath}` : user;
    const normalizedUrl = `https://open.substack.com/pub/${tail}${u.search}${u.hash}`;

    console.log("normalized url", normalizedUrl);
    // 3. Conserve intégralement search-params et hash.
    return normalizedUrl;
  } catch {
    // URL invalide, new URL() a lancé une erreur → on renvoie telle quelle.
    return url;
  }
}
