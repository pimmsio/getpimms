import { geistMono, inter, jakarta } from "@/styles/fonts";
import "@/styles/globals.css";
import { cn, constructMetadata } from "@dub/utils";
import Script from "next/script";
import RootProviders from "./providers";

export const metadata = constructMetadata();

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={cn(inter.variable, jakarta.variable, geistMono.variable)}
    >
      <body className="font-inter antialiased">
        <RootProviders>{children}</RootProviders>

        <Script id="set-theme" strategy="beforeInteractive">
          {`
          (() => {
            // Only run on referrals embed page for now
            if (window.location.pathname !== '/embed/referrals') return;

            const urlParams = new URLSearchParams(window.location.search);
            const theme = urlParams.get('theme');

            if (theme === 'dark' || (theme === 'system' && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
              document.body.classList.add("dark");
            } else {
              document.body.classList.remove("dark");
            }
          })();
        `}
        </Script>

        <Script
          src="https://assets.calendly.com/assets/external/widget.js"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
