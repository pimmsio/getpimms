import { NextRequest, NextResponse } from "next/server";

export default async function EmbedMiddleware(req: NextRequest) {
  // Legacy embeds removed; keep /embed/* from being a dead-end.
  return NextResponse.redirect(new URL("/", req.url));
}
