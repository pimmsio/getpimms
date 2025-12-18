import { Client } from "@planetscale/database";
import { PrismaPlanetScale } from "@prisma/adapter-planetscale";
import { PrismaClient } from "@prisma/client";

const client = new Client({
  url: process.env.PLANETSCALE_DATABASE_URL || process.env.DATABASE_URL,
});

const adapter: any = new PrismaPlanetScale(client);

// Prisma expects all driver adapters to expose `startTransaction`. Older
// versions of `@prisma/adapter-planetscale` don't implement it, but Prisma will
// still bind it during client initialization. Provide a stub so initialization
// doesn't crash (and so `$transaction` fails loudly instead of at import time).
if (typeof adapter.startTransaction !== "function") {
  adapter.startTransaction = async () => {
    throw new Error("PlanetScale adapter does not support transactions.");
  };
}

export const prismaEdge = new PrismaClient({
  // NOTE: In pnpm monorepos it's easy for `@prisma/*` package versions to drift
  // slightly, which can cause `DriverAdapter` type mismatches during Next.js
  // typechecking even when the runtime adapter works as expected.
  adapter: adapter as any,
});
