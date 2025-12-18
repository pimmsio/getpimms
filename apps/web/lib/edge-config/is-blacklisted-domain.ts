export const isBlacklistedDomain = async (
  domain: string,
): Promise<boolean | "whitelisted"> => {
  if (!process.env.EDGE_CONFIG) {
    return false;
  }

  if (!domain) {
    return false;
  }

  try {
    const { getAll } = await import("@vercel/edge-config");
    const {
      domains: blacklistedDomains,
      terms: blacklistedTerms,
      whitelistedDomains,
    } = (await getAll(["domains", "terms", "whitelistedDomains"])) as {
      domains: string[];
      terms: string[];
      whitelistedDomains: string[];
    };

    if (whitelistedDomains.includes(domain)) {
      console.log("Domain is whitelisted", domain);
      return "whitelisted";
    }

      const blacklistedTermsRegex = new RegExp(
      blacklistedTerms
          .map((term: string) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")) // replace special characters with escape sequences
          .join("|"),
      );

    const isBlacklisted =
      blacklistedDomains.includes(domain) || blacklistedTermsRegex.test(domain);

    if (isBlacklisted) {
        return true;
    }

    return false;
  } catch (e) {
    console.error("Error checking blacklisted domain", e);
    return false;
  }
};
