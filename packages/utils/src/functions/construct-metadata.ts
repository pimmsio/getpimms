import { Metadata } from "next";
import { HOME_DOMAIN } from "../constants";

export function constructMetadata({
  title,
  fullTitle,
  description = "PIMMS",
  image = "https://assets.pimms.io/thumbnail.jpg?v=3",
  video,
  icons = [
    {
      rel: "apple-touch-icon",
      sizes: "180x180",
      url: "https://assets.pimms.io/apple-icon.png?v=2",
    },
    {
      rel: "icon",
      type: "image/png",
      sizes: "32x32",
      url: "https://assets.pimms.io/favicon-32x32.png?v=2",
    },
    {
      rel: "icon",
      type: "image/png",
      sizes: "48x48",
      url: "https://assets.pimms.io/favicon-48x48.png?v=2",
    },
    {
      rel: "icon",
      type: "image/png",
      sizes: "96x96",
      url: "https://assets.pimms.io/favicon-96x96.png?v=2",
    },
    {
      rel: "icon",
      type: "image/png",
      sizes: "16x16",
      url: "https://assets.pimms.io/favicon-16x16.png?v=2",
    },
    {
      rel: "icon",
      type: "image/svg+xml",
      url: "https://assets.pimms.io/favicon.svg?v=2",
    },
    {
      rel: "icon",
      type: "image/ico",
      sizes: "16x16",
      url: "https://assets.pimms.io/favicon.ico?v=2",
    },
  ],
  url,
  canonicalUrl,
  noIndex = false,
  manifest,
}: {
  title?: string;
  fullTitle?: string;
  description?: string;
  image?: string | null;
  video?: string | null;
  icons?: Metadata["icons"];
  url?: string;
  canonicalUrl?: string;
  noIndex?: boolean;
  manifest?: string | URL | null;
} = {}): Metadata {
  return {
    title:
      fullTitle ||
      (title
        ? `${title} | PIMMS`
        : "PIMMS | Deep links that boost your conversions on social media"),
    description,
    openGraph: {
      title,
      description,
      ...(image && {
        images: image,
      }),
      url,
      ...(video && {
        videos: video,
      }),
    },
    twitter: {
      title,
      description,
      ...(image && {
        card: "summary_large_image",
        images: [image],
      }),
      ...(video && {
        player: video,
      }),
      // creator: "@pimmsio",
    },
    icons,
    metadataBase: new URL(HOME_DOMAIN),
    ...((url || canonicalUrl) && {
      alternates: {
        canonical: url || canonicalUrl,
      },
    }),
    ...(noIndex && {
      robots: {
        index: false,
        follow: false,
      },
    }),
    ...(manifest && {
      manifest,
    }),
  };
}
