"use client";

import { Background } from "@dub/ui";
import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";
import ExtensionIdHandler from "./extension-id-handler";

export default function CbeLayout({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ExtensionIdHandler />
      <div className="flex h-screen w-screen justify-center">
        <Background />
        <div className="z-10 flex w-full max-w-md flex-col justify-center px-4">
          {children}
        </div>
      </div>
    </SessionProvider>
  );
}
