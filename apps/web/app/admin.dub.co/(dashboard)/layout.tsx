import { constructMetadata } from "@dub/utils";
import { ReactNode } from "react";
import AdminSidebar from "./components/admin-sidebar";

export const metadata = constructMetadata({ noIndex: true });

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen md:grid md:grid-cols-[240px_minmax(0,1fr)]">
      <AdminSidebar />
      <div className="bg-zinc-100 md:pt-[10px]">
        <div className="relative overflow-hidden min-h-full bg-[#fafafa] pt-px md:rounded-tl-3xl md:border md:border-b-0 md:border-r-0 md:border-neutral-200 md:bg-white shadow-sm">
          {children}
        </div>
      </div>
    </div>
  );
}
