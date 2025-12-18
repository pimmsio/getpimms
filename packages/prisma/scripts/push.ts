import { spawn } from "node:child_process";

function sanitizeDatabaseUrl(rawUrl: string): string {
  // Prisma/MySQL URLs are valid WHATWG URLs (e.g. mysql://user:pass@host/db?sslaccept=strict)
  // PlanetScale requires SSL/TLS. MySQL2 (used by Prisma tooling in some commands) ignores
  // `sslaccept`, so enforce TLS using an `ssl` profile object instead of a boolean.
  try {
    const url = new URL(rawUrl);
    const protocol = url.protocol.toLowerCase();
    const isMySql = protocol === "mysql:" || protocol === "mysql2:";
    const hasSslMode = Array.from(url.searchParams.keys()).some(
      (k) => k.toLowerCase() === "ssl-mode" || k.toLowerCase() === "sslmode",
    );
    const hasSsl = Array.from(url.searchParams.keys()).some(
      (k) => k.toLowerCase() === "ssl",
    );

    if (isMySql) {
      // Remove `sslaccept` if present (MySQL2 warns and ignores it).
      for (const key of Array.from(url.searchParams.keys())) {
        if (key.toLowerCase() === "sslaccept") url.searchParams.delete(key);
      }

      // If no SSL indicator is present, force it on.
      if (!hasSsl && !hasSslMode) {
        // MySQL2 expects `ssl` to be an object, not a boolean.
        // URLSearchParams will percent-encode the JSON string automatically.
        url.searchParams.set(
          "ssl",
          JSON.stringify({ rejectUnauthorized: true }),
        );
      }
    }
    return url.toString();
  } catch {
    // If it's not parseable, return as-is.
    // (We don't want to accidentally strip TLS params from a working URL.)
    return rawUrl;
  }
}

const rawUrl =
  process.env.DATABASE_URL ?? process.env.PLANETSCALE_DATABASE_URL ?? "";
if (!rawUrl) {
  console.error(
    "Missing DATABASE_URL/PLANETSCALE_DATABASE_URL. Prisma db push requires a database URL env var to be set (both are currently empty).",
  );
  process.exit(1);
}

const sanitizedUrl = sanitizeDatabaseUrl(rawUrl);
try {
  const u = new URL(sanitizedUrl);
  const qp = Array.from(u.searchParams.keys()).map((k) => k.toLowerCase());
  const hasTlsHint =
    qp.includes("sslaccept") ||
    qp.includes("ssl-mode") ||
    qp.includes("sslmode") ||
    qp.includes("ssl");
  // Secret-safe: don't print credentials or full query values.
  console.log(
    `[prisma:push] DB: ${u.protocol}//${u.host}${u.pathname} (tlsParams=${hasTlsHint})`,
  );
} catch {
  // ignore
}

// Forward any args passed to `pnpm ... push -- <args>`
const forwardedArgs = process.argv.slice(2);

const child = spawn(
  "pnpm",
  [
    "exec",
    "prisma",
    "db",
    "push",
    "--config=./prisma.config.ts",
    "--schema=./schema",
    `--url=${sanitizedUrl}`,
    ...forwardedArgs,
  ],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      // Keep env consistent with the passed `--url`, in case Prisma reads it too.
      DATABASE_URL: sanitizedUrl,
      PLANETSCALE_DATABASE_URL: sanitizedUrl,
    },
  },
);

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
