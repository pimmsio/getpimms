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
        waitUntil(
          (async () => {
            try {
              // Get user's default workspace and onboarding answers
              const user = await prisma.user.findUnique({
                where: { id: ctx.user.id },
                select: {
                  email: true,
                  name: true,
                  defaultWorkspace: true,
                },
              });

              if (!user?.defaultWorkspace) {
                return;
              }

              const workspace = await prisma.project.findUnique({
                where: { slug: user.defaultWorkspace },
                select: {
                  name: true,
                  store: true,
                },
              });

              if (!workspace) {
                return;
              }

              const onboardingAnswers =
                ((workspace.store as any)?.onboardingAnswers as {
                  trackingFamiliarity?: string;
                  utmConversion?: any;
                }) || {};

              // Send email to Alexandre
              await sendEmail({
                email: "alexandre@pimms.io",
                from: "alexandre+onboarding@pimms.io",
                replyTo: user.email || undefined,
                subject: "🎉 New User Completed Onboarding",
                react: OnboardingCompletionEmail({
                  email: user.email || "unknown",
                  name: user.name,
                  workspaceName: workspace.name,
                  answers: onboardingAnswers,
                }),
              });
            } catch (error) {
              console.error("Failed to send onboarding completion email:", error);
            }
          })(),
        );
      }
    } catch (e) {
      console.error("Failed to update onboarding step", e);
      throw new Error("Failed to update onboarding step");
    }

    return { success: true };
  });
