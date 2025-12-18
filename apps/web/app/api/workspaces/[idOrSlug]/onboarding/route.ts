import { withWorkspace } from "@/lib/auth";
import { prisma } from "@dub/prisma";
import { NextResponse } from "next/server";

// POST /api/workspaces/[idOrSlug]/onboarding - save onboarding answers
export const POST = withWorkspace(
  async ({ req, workspace }) => {
    const data = await req.json();

    // Get current store or initialize it
    const currentStore = (workspace.store as any) || {};
    const currentOnboardingAnswers =
      currentStore.onboardingAnswers || {};

    // Merge new answers with existing ones
    const updatedOnboardingAnswers = {
      ...currentOnboardingAnswers,
      ...data,
    };

    // Update workspace store with merged onboarding answers
    const updatedStore = {
      ...currentStore,
      onboardingAnswers: updatedOnboardingAnswers,
    };

    await prisma.project.update({
      where: {
        id: workspace.id,
      },
      data: {
        store: updatedStore,
      },
    });

    return NextResponse.json({ success: true });
  },
  {
    requiredPermissions: ["workspaces.write"],
  },
);
