import { WorkspaceWithUsers } from "@/lib/types";
import { DubApiError, exceededLimitError } from "../errors";

// Workspace events usage overage checks
export const throwIfEventsUsageExceeded = (workspace: WorkspaceWithUsers) => {
  if (workspace.eventsUsage >= workspace.eventsLimit) {
    throw new DubApiError({
      code: "forbidden",
      message: exceededLimitError({
        plan: workspace.plan,
        limit: workspace.eventsLimit,
        type: "events",
      }),
    });
  }
};

// Workspace links usage overage checks
export const throwIfLinksUsageExceeded = (workspace: WorkspaceWithUsers) => {
  if (
    workspace.linksUsage >= workspace.linksLimit) {
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
