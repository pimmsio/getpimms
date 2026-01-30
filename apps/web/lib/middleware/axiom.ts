import { Logger } from "next-axiom";
import type { NextFetchEvent } from "next/server";
import { NextRequest } from "next/server";

export default function AxiomMiddleware(
  req: NextRequest,
  event: NextFetchEvent,
) {
  const logger = new Logger({ source: "middleware" }); // traffic, request
  logger.middleware(req);
  const flushPromise = logger.flush();
  event.waitUntil(flushPromise);
}
