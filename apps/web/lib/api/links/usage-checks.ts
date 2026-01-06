import { WorkspaceWithUsers } from "@/lib/types";
import { DubApiError, exceededLimitError } from "../errors";

// Workspace events usage overage checks (events = clicks + conversions)
export const throwIfEventsUsageExceeded = (workspace: WorkspaceWithUsers) => {
  if (workspace.usage > workspace.usageLimit) {
    throw new DubApiError({
      code: "forbidden",
      message: exceededLimitError({
        plan: workspace.plan,
        limit: workspace.usageLimit,
        type: "events",
      }),
    });
  }
};

// Backwards compatible alias (legacy naming).
export const throwIfClicksUsageExceeded = throwIfEventsUsageExceeded;

// Workspace links usage overage checks
export const throwIfLinksUsageExceeded = (workspace: WorkspaceWithUsers) => {
  if (workspace.linksUsage >= workspace.linksLimit) {
    throw new DubApiError({
      code: "forbidden",
      message: exceededLimitError({
        plan: workspace.plan,
        limit: workspace.linksLimit,
        type: "links",
      }),
    });
  }
};

export const throwIfAIUsageExceeded = (workspace: WorkspaceWithUsers) => {
  if (workspace.aiUsage >= workspace.aiLimit) {
    throw new DubApiError({
      code: "forbidden",
      message: exceededLimitError({
        plan: workspace.plan,
        limit: workspace.aiLimit,
        type: "AI",
      }),
    });
  }
};
