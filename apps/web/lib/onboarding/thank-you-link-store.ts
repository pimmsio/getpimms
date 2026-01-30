import { redis } from "@/lib/upstash";
import z from "@/lib/zod";

/**
 * Shared storage for "thank-you link" onboarding steps.
 *
 * Goal:
 * - Persist the selected thank-you link per workspace in Redis
 * - Keep the route handlers tiny and consistent across providers
 */

export const thankYouLinkBodySchema = z.object({
  linkId: z.string().min(1),
  key: z.string().min(1),
  shortLink: z.string().min(1),
  domain: z.string().min(1),
  destinationUrl: z.string().min(1),
});

export type ThankYouLinkBody = z.infer<typeof thankYouLinkBodySchema>;

export type StoredThankYouLink = ThankYouLinkBody & {
  savedAt: number;
};

export function thankYouRedisKey({
  workspaceId,
  providerKey,
}: {
  workspaceId: string;
  providerKey: string;
}) {
  return `onboarding:${providerKey}:thankyou:${workspaceId}`;
}

export async function getStoredThankYouLink({
  workspaceId,
  providerKey,
}: {
  workspaceId: string;
  providerKey: string;
}) {
  return await redis.get<StoredThankYouLink | null>(
    thankYouRedisKey({ workspaceId, providerKey }),
  );
}

export async function setStoredThankYouLink({
  workspaceId,
  providerKey,
  body,
}: {
  workspaceId: string;
  providerKey: string;
  body: ThankYouLinkBody;
}) {
  const value: StoredThankYouLink = { ...body, savedAt: Date.now() };
  await redis.set(thankYouRedisKey({ workspaceId, providerKey }), value);
  return value;
}

export async function deleteStoredThankYouLink({
  workspaceId,
  providerKey,
}: {
  workspaceId: string;
  providerKey: string;
}) {
  await redis.del(thankYouRedisKey({ workspaceId, providerKey }));
}

