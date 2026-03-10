import { geistMono, inter, jakarta } from "@/styles/fonts";
import "@/styles/globals.css";
import { cn, constructMetadata } from "@dub/utils";
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
      translate="no"
      className={cn(inter.variable, jakarta.variable, geistMono.variable)}
      suppressHydrationWarning
    >
      <body className="font-inter antialiased" suppressHydrationWarning>
        <div id="app-root">
          <RootProviders>{children}</RootProviders>
        </div>

      </body>
    </html>
  );
}
