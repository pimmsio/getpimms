import { validDomainRegex } from "@dub/utils";

/**
 * Client-safe domain validator (no DB / server imports).
 */
export const isValidDomain = (domain: string) => {
  return (
    validDomainRegex.test(domain) &&
    // make sure the domain doesn't contain pimms.io|pim.ms
    !/^(pimms\.io|.*\.pimms\.io|pim\.ms|.*\.pim\.ms)$/i.test(domain)
  );
};


