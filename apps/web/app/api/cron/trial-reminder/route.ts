import { handleAndReturnErrorResponse } from "@/lib/api/errors";
import { limiter } from "@/lib/cron/limiter";
import { verifyVercelSignature } from "@/lib/cron/verify-vercel";
import { sendEmail } from "@dub/email";
import { TrialEnding } from "@dub/email/templates/trial-ending";
import { prisma } from "@dub/prisma";
import { log } from "@dub/utils";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Sends a reminder email to workspace owners whose Pro trial ends in ~2 days.
 * Runs once daily. Uses a SentEmail record to avoid duplicate sends.
 */
async function handler(req: Request) {
  try {
    await verifyVercelSignature(req);

    const now = new Date();
    // Find workspaces where trialEndsAt is between 1 and 3 days from now
    // (targets day 5 of a 7-day trial with some tolerance for cron timing)
    const from = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);
    const to = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    const workspaces = await prisma.project.findMany({
      where: {
        trialEndsAt: { gte: from, lte: to },
        plan: { not: "free" },
        sentEmails: {
          none: { type: "trialEndingEmail" },
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        trialEndsAt: true,
        users: {
          select: {
            user: {
              select: { name: true, email: true },
            },
          },
          where: {
            role: "owner",
            user: { isMachine: false, email: { not: null } },
          },
        },
      },
    });

    if (workspaces.length === 0) {
      return NextResponse.json({ message: "No trial reminders to send" });
    }

    await Promise.allSettled(
      workspaces.map(async (workspace) => {
        const owners = workspace.users
          .map(({ user }) => user)
          .filter((u) => u.email);
        if (owners.length === 0) return;

        // Mark as sent BEFORE sending to guarantee at-most-once delivery
        await prisma.sentEmail.create({
          data: {
            projectId: workspace.id,
            type: "trialEndingEmail",
          },
        });

        const daysLeft = Math.max(
          1,
          Math.ceil(
            (workspace.trialEndsAt!.getTime() - now.getTime()) /
              (24 * 60 * 60 * 1000),
          ),
        );

        await Promise.allSettled(
          owners.map((owner) =>
            limiter.schedule(() =>
              sendEmail({
                email: owner.email!,
                replyTo: "alexandre@pimms.io",
                subject: `Your PiMMs Pro trial ends in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`,
                react: TrialEnding({
                  name: owner.name,
                  email: owner.email!,
                  workspaceName: workspace.name,
                  workspaceSlug: workspace.slug,
                  daysLeft,
                }),
              }),
            ),
          ),
        );
      }),
    );

    return NextResponse.json({
      message: `Sent trial reminders for ${workspaces.length} workspace(s)`,
    });
  } catch (error) {
    await log({
      message: `Error sending trial reminders: ${error instanceof Error ? error.message : String(error)}`,
      type: "cron",
    });
    return handleAndReturnErrorResponse(error);
  }
}

export { handler as GET };
