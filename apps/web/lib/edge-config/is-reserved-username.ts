import { edgeConfigGet } from "./safe-get";

/**
 * Only for dub.sh / dub.link domains
 * Check if a username is reserved – should only be available on Pro+
 */
export const isReservedUsername = async (key: string) => {
  if (!process.env.NEXT_PUBLIC_IS_DUB || !process.env.EDGE_CONFIG) {
    return false;
  }

  let reservedUsernames;
  try {
    reservedUsernames = (await edgeConfigGet<string[]>("reservedUsernames")) ?? [];
  } catch (e) {
    reservedUsernames = [];
  }
  return reservedUsernames.includes(key.toLowerCase());
};
