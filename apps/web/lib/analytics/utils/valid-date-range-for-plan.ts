import { getDaysDifference } from "@dub/utils";
import { DubApiError } from "../../api/errors";

export const validDateRangeForPlan = ({
  plan,
  dataAvailableFrom,
  interval,
  start,
  end,
  throwError,
}: {
  plan?: string | null;
  dataAvailableFrom?: Date;
  interval?: string;
  start?: Date | null;
  end?: Date | null;
  throwError?: boolean;
}) => {
  const now = new Date(Date.now());
  if (interval === "all" && dataAvailableFrom && !start) {
    start = dataAvailableFrom;
  }

  // Free plan users can only get analytics for 30 days
  if (
    (!plan || plan === "free") &&
    (interval === "90d" ||
      interval === "6m" ||
      interval === "1y" ||
      interval === "ytd" ||
      (start && getDaysDifference(new Date(start), end || now) > 31))
  ) {
    if (throwError) {
      throw new DubApiError({
        code: "exceeded_limit",
        message:
          "You can only get analytics for up to 30 days on a Free plan. Upgrade to Tiny or Solo to get analytics for longer periods.",
      });
    } else {
      return false;
    }
  }

  // Tiny, Solo, Pro plan users can only get analytics for 1 year
  if (
    ["tiny", "solo", "pro"].includes(plan ?? "") &&
    start &&
    getDaysDifference(new Date(start), end || now) > 366
  ) {
    if (throwError) {
      throw new DubApiError({
        code: "exceeded_limit",
        message:
          "You can only get analytics for up to 1 year on this plan. Upgrade to Business to get analytics for longer periods.",
      });
    } else {
      return false;
    }
  }

  return true;
};
