import { getDomainWithoutWWW } from "@dub/utils";
import { edgeConfigGet } from "./safe-get";

export const isBlacklistedReferrer = async (referrer: string | null) => {
  if (!process.env.NEXT_PUBLIC_IS_DUB || !process.env.EDGE_CONFIG) {
    return false;
  }

  const hostname = referrer ? getDomainWithoutWWW(referrer) : "(direct)";
  let referrers;
  try {
    referrers = (await edgeConfigGet<string[]>("referrers")) ?? [];
  } catch (e) {
    referrers = [];
  }
  return !referrers.includes(hostname);
};
