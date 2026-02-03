"use client";

import { NavWordmark } from "@dub/ui";
import { cn } from "@dub/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutSidebar } from "@dub/ui";
import { X } from "lucide-react";
import { AppIconButton } from "@/ui/components/controls/app-icon-button";

const adminNavItems = [
  {
    name: "Dashboard",
    href: "/",
  },
  {
    name: "Links",
    href: "/links",
  },
  {
    name: "Links Report",
    href: "/links-report",
  },
  {
    name: "User Reports",
    href: "/user-reports",
  },
  {
    name: "Analytics",
    href: "/analytics",
  },
  {
    name: "Contacts",
    href: "/leads",
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Close sidebar when pathname changes (mobile)
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Prevent body scroll when side nav is open on mobile
  useEffect(() => {
    if (typeof window !== "undefined") {
      document.body.style.overflow = isOpen ? "hidden" : "auto";
    }
  }, [isOpen]);

  return (
    <>
      {/* Mobile menu button */}
      <div className="sticky top-0 z-50 border-b border-neutral-100 bg-white/95 p-4 backdrop-blur md:hidden">
        <div className="flex items-center justify-between">
          <Link href="/">
            <NavWordmark className="h-6" />
          </Link>
          <AppIconButton
            type="button"
            onClick={() => setIsOpen(true)}
            className="app-icon-btn"
          >
            <LayoutSidebar className="size-4 text-neutral-600" />
          </AppIconButton>
        </div>
      </div>

      {/* Sidebar backdrop */}
      <div
        className={cn(
          "fixed left-0 top-0 z-50 h-dvh w-screen bg-neutral-50 md:sticky md:z-auto md:w-full",
          isOpen
            ? ""
            : "bg-transparent max-md:pointer-events-none",
        )}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            e.stopPropagation();
            setIsOpen(false);
          }
        }}
      >
        {/* Sidebar */}
        <div
          className={cn(
            "relative left-[10px] top-[10px] h-[calc(100%-20px)] w-[220px] max-w-full rounded-3xl bg-white md:bg-transparent sm:h-[calc(100vh-20px)] transition-transform md:translate-x-0",
            !isOpen && "-translate-x-[calc(100%+20px)]",
          )}
        >
          <nav className="flex h-full flex-col p-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-6">
              <Link href="/" className="flex items-center">
                <NavWordmark className="h-6" />
              </Link>
              <AppIconButton
                type="button"
                onClick={() => setIsOpen(false)}
                className="app-icon-btn md:hidden"
              >
                <X className="size-4" />
              </AppIconButton>
            </div>

            {/* Admin Badge */}
            <div className="mb-6">
              <div className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-800">
                Admin Panel
              </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 space-y-1">
              {adminNavItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-neutral-100 text-neutral-900"
                        : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                    )}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </div>

            {/* Footer */}
            <div className="border-t border-neutral-100 pt-6">
              <div className="text-xs text-neutral-500 text-center">
                PIMMS Admin v1.0
              </div>
            </div>
          </nav>
        </div>
      </div>
    </>
  );
}
