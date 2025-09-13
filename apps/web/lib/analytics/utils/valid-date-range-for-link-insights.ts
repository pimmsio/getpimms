import { getDaysDifference } from "@dub/utils";
import { DubApiError } from "../../api/errors";

export const validDateRangeForLinkInsights = ({
  interval,
  start,
  end,
  throwError,
}: {
  interval?: string;
  start?: Date | null;
  end?: Date | null;
  throwError?: boolean;
}) => {
  const now = new Date(Date.now());
  
  // Check if the interval exceeds 1 month
  if (
    interval === "90d" ||
    interval === "6m" ||
    interval === "1y" ||
    interval === "mtd" ||
    interval === "qtd" ||
    interval === "ytd" ||
    interval === "all"
  ) {
    if (throwError) {
      throw new DubApiError({
        code: "forbidden",
        message:
          "Link insights are limited to a maximum of 1 month of data. Please select a shorter time period.",
      });
    } else {
      return false;
    }
  }

  // Check if custom date range exceeds 1 month (approximately 30 days)
  if (start && getDaysDifference(new Date(start), end || now) > 30) {
    if (throwError) {
      throw new DubApiError({
        code: "forbidden",
        message:
          "Link insights are limited to a maximum of 1 month of data. Please select a shorter date range.",
      });
    } else {
      return false;
    }
  }

  return true;
};
