"use server";

import { z } from "zod";
import { ONBOARDING_STEPS } from "../onboarding/types";
import { redis } from "../upstash";
import { authUserActionClient } from "./safe-action";
import { prisma } from "@dub/prisma";
import { sendEmail } from "@dub/email";
import { OnboardingCompletionEmail } from "@dub/email/templates/onboarding-completion";
import { waitUntil } from "@vercel/functions";

// Generate a new client secret for an integration
export const setOnboardingProgress = authUserActionClient
  .schema(
    z.object({
      onboardingStep: z.enum(ONBOARDING_STEPS).nullable(),
    }),
  )
  .action(async ({ ctx, parsedInput }) => {
    const { onboardingStep } = parsedInput;

    try {
      await redis.set(`onboarding-step:${ctx.user.id}`, onboardingStep);

      // Send email to Alexandre when onboarding is completed
      if (onboardingStep === "completed") {
        // Read data synchronously (before returning) to avoid stale reads
        // from PlanetScale's stateless HTTP driver in a deferred context.
        let emailData: {
          userEmail: string;
          userName: string | null;
          replyTo: string | undefined;
          workspaceName: string;
          onboardingAnswers: Record<string, unknown>;
          providerIds: string[];
          otherMessage: string;
        } | null = null;

        try {
          const user = await prisma.user.findUnique({
            where: { id: ctx.user.id },
            select: {
              email: true,
              name: true,
              defaultWorkspace: true,
            },
          });

          if (user?.defaultWorkspace) {
            const workspace = await prisma.project.findUnique({
              where: { slug: user.defaultWorkspace },
              select: {
                id: true,
                name: true,
                store: true,
              },
            });

            if (workspace) {
              const onboardingAnswers =
                ((workspace.store as any)?.onboardingAnswers as Record<string, unknown>) || {};

              let providerIds: string[] = [];
              let otherMessage = "";
              try {
                const prefsKey = `onboarding:preferences:${ctx.user.id}:${workspace.id}`;
                const prefs = await redis.get<any>(prefsKey);
                if (Array.isArray(prefs?.providerIds)) {
                  providerIds = prefs.providerIds;
                }
                if (typeof prefs?.otherMessage === "string") {
                  otherMessage = prefs.otherMessage;
                }
              } catch {
                // Non-critical: proceed without provider IDs
              }

              emailData = {
                userEmail: user.email || "unknown",
                userName: user.name,
                replyTo: user.email || undefined,
                workspaceName: workspace.name,
                onboardingAnswers,
                providerIds,
                otherMessage,
              };
            }
          }
        } catch (error) {
          console.error("Failed to read onboarding data for email:", error);
        }

        // Only defer the email send (the slow part)
        if (emailData) {
          const data = emailData;
          waitUntil(
            (async () => {
              try {
                await sendEmail({
                  email: "alexandre@pimms.io",
                  from: "alexandre+onboarding@pimms.io",
                  replyTo: data.replyTo,
                  subject: "New User Completed Onboarding",
                  react: OnboardingCompletionEmail({
                    email: data.userEmail,
                    name: data.userName,
                    workspaceName: data.workspaceName,
                    answers: data.onboardingAnswers as any,
                    providerIds: data.providerIds,
                    otherMessage: data.otherMessage || undefined,
                  }),
                });
              } catch (error) {
                console.error("Failed to send onboarding completion email:", error);
              }
            })(),
          );
        }
      }
    } catch (e) {
      console.error("Failed to update onboarding step", e);
      throw new Error("Failed to update onboarding step");
    }

    return { success: true };
  });
