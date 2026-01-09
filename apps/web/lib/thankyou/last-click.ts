import { redis } from "@/lib/upstash";

type TyLastClickPayload = {
  clickId: string;
  linkId: string;
  timestamp: string;
};

const TY_LAST_CLICK_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

export function tyLastClickKey(workspaceId: string, anonymousId: string) {
  return `ty:lastClick:${workspaceId}:${anonymousId}`;
}

// Best-effort attribution helper: no-op if workspaceId/anonymousId missing.
export async function setTyLastClick({
  workspaceId,
  anonymousId,
  clickId,
  linkId,
  timestamp,
}: {
  workspaceId?: string;
  anonymousId?: string;
  clickId: string;
  linkId: string;
  timestamp?: string;
}) {
  if (!workspaceId || !anonymousId) return;

  const key = tyLastClickKey(workspaceId, anonymousId);
  const payload: TyLastClickPayload = {
    clickId,
    linkId,
    timestamp: timestamp ?? new Date(Date.now()).toISOString(),
  };

  await redis.set(key, payload, { ex: TY_LAST_CLICK_TTL_SECONDS });
}
