import { spawn } from "node:child_process";

function sanitizeDatabaseUrl(rawUrl: string): string {
  // Prisma/MySQL URLs are valid WHATWG URLs (e.g. mysql://user:pass@host/db?sslaccept=strict)
  // PlanetScale requires SSL/TLS. Prisma's schema engine understands `sslaccept=strict`
  // (and/or sslmode/ssl-mode). Do NOT strip these params; without them PlanetScale will reject
  // the connection as "insecure".
  try {
    const url = new URL(rawUrl);
    const protocol = url.protocol.toLowerCase();
    const isMySql = protocol === "mysql:" || protocol === "mysql2:";
    const qpKeys = Array.from(url.searchParams.keys()).map((k) => k.toLowerCase());
    const hasSslAccept = qpKeys.includes("sslaccept");
    const hasSslMode = qpKeys.includes("ssl-mode") || qpKeys.includes("sslmode");
    const hasSsl = qpKeys.includes("ssl");

    if (isMySql) {
      // If no SSL indicator is present, force it on.
      //
      // PlanetScale's recommended param is `sslaccept=strict`. We only add it when the URL
      // doesn't already include any TLS hints to avoid overriding explicit config.
      if (!hasSslAccept && !hasSslMode && !hasSsl) {
        url.searchParams.set("sslaccept", "strict");
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
