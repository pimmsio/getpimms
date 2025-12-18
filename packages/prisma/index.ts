import { Client } from "@planetscale/database";
import { PrismaPlanetScale } from "@prisma/adapter-planetscale";
import { PrismaClient } from "@prisma/client";

type PrismaSingleton = PrismaClient<{ omit: { user: { passwordHash: true } } }>;

const createPrismaClient = () => {
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

  return new PrismaClient({
    adapter,
    omit: {
      user: { passwordHash: true },
    },
  });
};

let prismaSingleton: PrismaSingleton | undefined = global.prisma;

// Lazily instantiate Prisma so Next.js can evaluate modules during `next build`
// (for route segment config collection) without requiring a live DB connection
// or Prisma engine initialization.
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    if (!prismaSingleton) {
      prismaSingleton = createPrismaClient() as PrismaSingleton;
      if (process.env.NODE_ENV === "development")
        global.prisma = prismaSingleton;
    }

    const value = (prismaSingleton as any)[prop];
    return typeof value === "function" ? value.bind(prismaSingleton) : value;
  },
});

declare global {
  // eslint-disable-next-line no-var
  var prisma:
    | PrismaClient<{ omit: { user: { passwordHash: true } } }>
    | undefined;
}
