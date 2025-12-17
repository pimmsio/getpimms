import { NewLinkProps } from "@/lib/types";
import { combineWords } from "@dub/utils";

export const starterFeaturesCheck = (payload: NewLinkProps) => {
  const {
    password,
    rewrite,
    expiresAt,
  } = payload;

  if (
    password ||
    rewrite ||
    expiresAt
  ) {
    const starterFeaturesString = combineWords(
      [
        password && "password protection",
        rewrite && "link cloaking",
        expiresAt && "link expiration",
      ].filter(Boolean) as string[],
    );

    throw new Error(
      `You can only use ${starterFeaturesString} on a Starter plan and above. Upgrade to Starter to use these features.`,
    );
  }
};

export const proFeaturesCheck = (payload: NewLinkProps) => {
  const {
    ios,
    android,
    geo,
    testVariants,
    doIndex,
  } = payload;

  if (
    ios ||
    android ||
    geo ||
    testVariants ||
    doIndex
  ) {
    const starterFeaturesString = combineWords(
      [
        ios && "iOS targeting",
        android && "Android targeting",
        geo && "geo targeting",
        testVariants && "A/B testing",
        doIndex && "search engine indexing",
      ].filter(Boolean) as string[],
    );

    throw new Error(
      `You can only use ${starterFeaturesString} on a Pro plan and above. Upgrade to Pro to use these features.`,
    );
  }
};

export const businessFeaturesCheck = (payload: NewLinkProps) => {
  // Business features have no restrictions
};
