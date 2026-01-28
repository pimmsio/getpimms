import { withSession } from "@/lib/auth";
import { redis } from "@/lib/upstash";
import { NextResponse } from "next/server";

const KEY_PREFIX = "getting-started-hidden:";

export const GET = withSession(async ({ session }) => {
  const key = `${KEY_PREFIX}${session.user.id}`;
  const stored = await redis.get<boolean | null>(key);

  return NextResponse.json({ hidden: stored ?? false });
});

export const POST = withSession(async ({ req, session }) => {
  const body = await req.json().catch(() => null);
  const hidden = body?.hidden as boolean | undefined;

  if (typeof hidden !== "boolean") {
    return NextResponse.json({ error: "Missing or invalid 'hidden' value" }, { status: 400 });
  }

  const key = `${KEY_PREFIX}${session.user.id}`;
  await redis.set(key, hidden);

  return NextResponse.json({ hidden });
});

