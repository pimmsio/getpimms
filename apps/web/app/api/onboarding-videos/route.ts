import { withSession } from "@/lib/auth";
import { redis } from "@/lib/upstash";
import { NextResponse } from "next/server";

const KEY_PREFIX = "onboarding-videos:";

export const GET = withSession(async ({ session }) => {
  const key = `${KEY_PREFIX}${session.user.id}`;
  const stored = await redis.get<string[] | null>(key);

  return NextResponse.json({ watched: stored ?? [] });
});

export const POST = withSession(async ({ req, session }) => {
  const body = await req.json().catch(() => null);
  const videoId = body?.videoId as string | undefined;

  if (!videoId) {
    return NextResponse.json({ error: "Missing videoId" }, { status: 400 });
  }

  const key = `${KEY_PREFIX}${session.user.id}`;
  const existing = (await redis.get<string[] | null>(key)) ?? [];

  if (!existing.includes(videoId)) {
    existing.push(videoId);
    await redis.set(key, existing);
  }

  return NextResponse.json({ watched: existing });
});


