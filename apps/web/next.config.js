const { PrismaPlugin } = require("@prisma/nextjs-monorepo-workaround-plugin");
const { withAxiom } = require("next-axiom");

const REDIRECT_SEGMENTS = [
  "pricing",
  "blog",
  "help",
  "changelog",
  "tools",
  "_static",
];

/** @type {import('next').NextConfig} */
module.exports = withAxiom({
  reactStrictMode: false,
  transpilePackages: [
    "shiki",
    "@dub/prisma",
    "@dub/email",
    "@boxyhq/saml-jackson",
  ],
  ...(process.env.NODE_ENV === "production" && {
    experimental: {
      esmExternals: "loose",
    },
  }),
  webpack: (config, { webpack, isServer }) => {
    if (isServer) {
      config.plugins.push(
        // mute errors for unused typeorm deps
        new webpack.IgnorePlugin({
          resourceRegExp:
            /(^@google-cloud\/spanner|^@mongodb-js\/zstd|^aws-crt|^aws4$|^pg-native$|^mongodb-client-encryption$|^@sap\/hana-client$|^@sap\/hana-client\/extension\/Stream$|^snappy$|^react-native-sqlite-storage$|^bson-ext$|^cardinal$|^kerberos$|^hdb-pool$|^sql.js$|^sqlite3$|^better-sqlite3$|^ioredis$|^typeorm-aurora-data-api-driver$|^pg-query-stream$|^oracledb$|^mysql$|^snappy\/package\.json$|^cloudflare:sockets$)/,
        }),
      );

      config.plugins = [...config.plugins, new PrismaPlugin()];
    }

    config.module = {
      ...config.module,
      exprContextCritical: false,
    };

    return config;
  },
  images: {
    remotePatterns: [
      {
        hostname: "assets.dub.co", // for Dub's static assets
      },
      {
        hostname: "assets.pimms.io", // for PIMMS's static assets
      },
      {
        hostname: "www.google.com",
      },
      {
        hostname: "avatar.vercel.sh",
      },
      {
        hostname: "faisalman.github.io",
      },
      {
        hostname: "api.dicebear.com",
      },
      {
        hostname: "pbs.twimg.com",
      },
      {
        hostname: "lh3.googleusercontent.com",
      },
      {
        hostname: "avatars.githubusercontent.com",
      },
      {
        hostname: "media.cleanshot.cloud", // only for staging purposes
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Referrer-Policy",
            value: "no-referrer-when-downgrade",
          },
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
        ],
      },
      {
        source: "/embed/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors *",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/",
        has: [
          {
            type: "host",
            value: "app.pim.ms",
          },
        ],
        destination: "https://app.pimms.io",
        permanent: true,
        statusCode: 301,
      },
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "app.pim.ms",
          },
        ],
        destination: "https://app.pimms.io/:path*",
        permanent: true,
        statusCode: 301,
      },
      ...REDIRECT_SEGMENTS.map(
        (segment) => (
          {
            source: `/${segment}`,
            has: [
              {
                type: "host",
                value: "pim.ms",
              },
            ],
            destination: `https://pimms.io/${segment}`,
            permanent: true,
            statusCode: 301,
          },
          {
            source: `/${segment}/:path*`,
            has: [
              {
                type: "host",
                value: "pim.ms",
              },
            ],
            destination: `https://pimms.io/${segment}/:path*`,
            permanent: true,
            statusCode: 301,
          }
        ),
      ),
      {
        source: "/metatags",
        has: [
          {
            type: "host",
            value: "pim.ms",
          },
        ],
        destination: "https://pimms.io/tools/metatags",
        permanent: true,
        statusCode: 301,
      },
      {
        source: "/metatags",
        has: [
          {
            type: "host",
            value: "pimms.io",
          },
        ],
        destination: "/tools/metatags",
        permanent: true,
        statusCode: 301,
      },
      {
        source: "/",
        has: [
          {
            type: "host",
            value: "staging.pim.ms",
          },
        ],
        destination: "https://pimms.io",
        permanent: true,
        statusCode: 301,
      },
      {
        source: "/",
        has: [
          {
            type: "host",
            value: "preview.pim.ms",
          },
        ],
        destination: "https://preview.pimms.io",
        permanent: true,
        statusCode: 301,
      },
      {
        source: "/",
        has: [
          {
            type: "host",
            value: "admin.pim.ms",
          },
        ],
        destination: "https://admin.pimms.io",
        permanent: true,
        statusCode: 301,
      },
    ];
  },
  async rewrites() {
    return [
      // for dub proxy
      {
        source: "/_proxy/pimms/track/click",
        destination: "https://api.pimms.io/track/click",
      },
      // for posthog proxy
      {
        source: "/_proxy/posthog/ingest/static/:path*",
        destination: "https://eu-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/_proxy/posthog/ingest/:path*",
        destination: "https://eu.i.posthog.com/:path*",
      },
      // for plausible proxy
      {
        source: "/_proxy/plausible/script.js",
        destination: "https://plausible.io/js/script.js",
      },
      {
        source: "/_proxy/plausible/event",
        destination: "https://plausible.io/api/event",
      },
    ];
  },
});
