import { withWorkspace } from "@/lib/auth";
import { redis } from "@/lib/upstash";
import z from "@/lib/zod";
import { NextResponse } from "next/server";

const bodySchema = z.object({
  providerIds: z.array(z.string().min(1)).optional(),
  completedProviderIds: z.array(z.string().min(1)).optional(),
});

function keyFor({ userId, workspaceId }: { userId: string; workspaceId: string }) {
  return `onboarding:preferences:${userId}:${workspaceId}`;
}

// GET /api/onboarding-preferences - onboarding preferences for current user+workspace
export const GET = withWorkspace(async ({ session, workspace }) => {
  const key = keyFor({ userId: session.user.id, workspaceId: workspace.id });
  const stored = await redis.get<any>(key);

  // Backward compatible with the previous `{ providerId }` shape.
  const providerIdsRaw =
    Array.isArray(stored?.providerIds)
      ? stored.providerIds
      : typeof stored?.providerId === "string"
        ? [stored.providerId]
        : [];

  const completedProviderIdsRaw = Array.isArray(stored?.completedProviderIds)
    ? stored.completedProviderIds
    : [];

  return NextResponse.json({
    providerIds: providerIdsRaw,
    completedProviderIds: completedProviderIdsRaw,
  });
});

// POST /api/onboarding-preferences - update onboarding preferences for current user+workspace
export const POST = withWorkspace(async ({ req, session, workspace }) => {
  const body = bodySchema.parse(await req.json().catch(() => null));
  const key = keyFor({ userId: session.user.id, workspaceId: workspace.id });

  const stored = await redis.get<any>(key);
  const prevProviderIds =
    Array.isArray(stored?.providerIds)
      ? stored.providerIds
      : typeof stored?.providerId === "string"
        ? [stored.providerId]
        : [];
  const prevCompletedProviderIds = Array.isArray(stored?.completedProviderIds)
    ? stored.completedProviderIds
    : [];

  const next = {
    providerIds: body.providerIds ?? prevProviderIds,
    completedProviderIds: body.completedProviderIds ?? prevCompletedProviderIds,
  };
  await redis.set(key, next);

  return NextResponse.json(next);
});

