import { edgeConfigGet } from "./safe-get";

export const isBlacklistedKey = async (key: string) => {
  if (!process.env.NEXT_PUBLIC_IS_DUB || !process.env.EDGE_CONFIG) {
    return false;
  }

  let blacklistedKeys;
  try {
    blacklistedKeys = (await edgeConfigGet<string[]>("keys")) ?? [];
  } catch (e) {
    blacklistedKeys = [];
  }
  if (blacklistedKeys.length === 0) return false;
  return new RegExp(blacklistedKeys.join("|"), "i").test(key);
};
