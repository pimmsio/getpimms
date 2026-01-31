import { withWorkspace } from "@/lib/auth";
import { redis } from "@/lib/upstash";
import z from "@/lib/zod";
import { NextResponse } from "next/server";

const startedProviderSchema = z.object({
  id: z.string().min(1),
  startedAt: z.number().int(),
});

const bodySchema = z.object({
  providerIds: z.array(z.string().min(1)).optional(),
  completedProviderIds: z.array(z.string().min(1)).optional(),
  startedProviderIds: z.array(startedProviderSchema).optional(),
});

function keyFor({ userId, workspaceId }: { userId: string; workspaceId: string }) {
  return `onboarding:preferences:${userId}:${workspaceId}`;
}

const STARTED_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function normalizeStarted(raw: unknown) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => ({
      id: typeof entry?.id === "string" ? entry.id : "",
      startedAt: typeof entry?.startedAt === "number" ? entry.startedAt : 0,
    }))
    .filter((entry) => entry.id && entry.startedAt > 0);
}

function dedupeStarted(items: Array<{ id: string; startedAt: number }>) {
  const map = new Map<string, number>();
  for (const item of items) {
    const prev = map.get(item.id);
    if (!prev || item.startedAt > prev) {
      map.set(item.id, item.startedAt);
    }
  }
  return Array.from(map.entries()).map(([id, startedAt]) => ({ id, startedAt }));
}

function filterFreshStarted(
  items: Array<{ id: string; startedAt: number }>,
  now = Date.now(),
) {
  return items.filter((item) => now - item.startedAt <= STARTED_TTL_MS);
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

  const startedProviderIdsRaw = normalizeStarted(stored?.startedProviderIds);
  const startedProviderIds = filterFreshStarted(
    dedupeStarted(startedProviderIdsRaw),
  );

  return NextResponse.json({
    providerIds: providerIdsRaw,
    completedProviderIds: completedProviderIdsRaw,
    startedProviderIds,
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
  const prevStartedProviderIds = normalizeStarted(stored?.startedProviderIds);

  const nextCompletedProviderIds = body.completedProviderIds ?? prevCompletedProviderIds;
  const completedSet = new Set(nextCompletedProviderIds);
  const nextStartedProviderIds = filterFreshStarted(
    dedupeStarted(body.startedProviderIds ?? prevStartedProviderIds),
  ).filter((entry) => !completedSet.has(entry.id));

  const next = {
    providerIds: body.providerIds ?? prevProviderIds,
    completedProviderIds: nextCompletedProviderIds,
    startedProviderIds: nextStartedProviderIds,
  };
  await redis.set(key, next);

  return NextResponse.json(next);
});

