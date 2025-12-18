import { edgeConfigGet } from "./safe-get";

export const isBlacklistedEmail = async (email: string) => {
  if (!process.env.NEXT_PUBLIC_IS_DUB || !process.env.EDGE_CONFIG) {
    return false;
  }

  let blacklistedEmails;
  try {
    blacklistedEmails = (await edgeConfigGet<string[]>("emails")) ?? [];
  } catch (e) {
    blacklistedEmails = [];
  }
  if (blacklistedEmails.length === 0) return false;
  return new RegExp(blacklistedEmails.join("|"), "i").test(email);
};
