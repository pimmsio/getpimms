"use client";

import { ModalProvider } from "@/ui/modals/modal-provider";
import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <AppLayoutProviders>{children}</AppLayoutProviders>
    </SessionProvider>
  );
}

function AppLayoutProviders({ children }: { children: ReactNode }) {
  return <ModalProvider>{children}</ModalProvider>;
}
