import { sendEmail } from "@dub/email";
import { ClicksExceeded } from "@dub/email/templates/clicks-exceeded";
import { LinksLimitAlert } from "@dub/email/templates/links-limit";
import { prisma } from "@dub/prisma";
import { WorkspaceProps } from "../types";
import { limiter } from "./limiter";

export const sendLimitEmail = async ({
  emails,
  workspace,
  type,
}: {
  emails: string[];
  workspace: WorkspaceProps;
  type:
    | "firstUsageLimitEmail"
    | "secondUsageLimitEmail"
    | "firstLinksLimitEmail"
    | "secondLinksLimitEmail";
}) => {
  const percentage = Math.round(
    (workspace.linksUsage / workspace.linksLimit) * 100,
  );

  // Prepare workspace data with "exceed" for exceeded limits
  const workspaceData = {
    ...workspace,
    eventsUsage: workspace.eventsUsage >= workspace.eventsLimit ? "exceed" : workspace.eventsUsage,
    clicksUsage: workspace.clicksUsage >= workspace.eventsLimit ? "exceed" : workspace.clicksUsage,
    leadsUsage: workspace.leadsUsage >= workspace.eventsLimit ? "exceed" : workspace.leadsUsage,
    salesUsage: workspace.salesUsage >= workspace.eventsLimit ? "exceed" : workspace.salesUsage,
  };

  return await Promise.allSettled([
    emails.map((email) => {
      limiter.schedule(() =>
        sendEmail({
          subject: type.endsWith("UsageLimitEmail")
            ? "PiMMs Alert: Events Limit Exceeded"
            : `PiMMs Alert: ${workspace.name} has used ${percentage.toString()}% of its links limit for the month.`,
          email,
          react: type.endsWith("UsageLimitEmail")
            ? ClicksExceeded({
                email,
                workspace: workspaceData as any,
                type: type as "firstUsageLimitEmail" | "secondUsageLimitEmail",
              })
            : LinksLimitAlert({
                email,
                workspace: workspaceData as any,
              }),
          variant: "notifications",
        }),
      );
    }),
    prisma.sentEmail.create({
      data: {
        projectId: workspace.id,
        type,
      },
    }),
  ]);
};
