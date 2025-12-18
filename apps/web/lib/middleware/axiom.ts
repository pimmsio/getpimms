import { Logger } from "next-axiom";
import { NextRequest } from "next/server";

export default function AxiomMiddleware(
  req: NextRequest,
  waitUntil?: (promise: Promise<unknown>) => void,
) {
  const logger = new Logger({ source: "middleware" }); // traffic, request
  logger.middleware(req);
  const flushPromise = logger.flush();
  if (waitUntil) {
    waitUntil(flushPromise);
  } else {
    void flushPromise.catch(() => {});
  }
}
