"use client";

import { NavWordmark, Button, LayoutSidebar } from "@dub/ui";
import { cn } from "@dub/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { 
  BarChart3, 
  Link2, 
  Target, 
  Users,
  X
} from "lucide-react";

const adminNavItems = [
  {
    name: "Dashboard",
    href: "/",
    icon: BarChart3,
  },
  {
    name: "Links",
    href: "/links",
    icon: Link2,
  },
  {
    name: "Links Report",
    href: "/links-report",
    icon: BarChart3,
  },
  {
    name: "User Reports",
    href: "/user-reports",
    icon: Users,
  },
  {
    name: "Analytics",
    href: "/analytics",
    icon: BarChart3,
  },
  {
    name: "Leads",
    href: "/leads",
    icon: Target,
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
      <div className="sticky top-0 z-50 bg-white border-b border-neutral-200 p-4 md:hidden">
        <div className="flex items-center justify-between">
          <Link href="/">
            <NavWordmark className="h-6" />
          </Link>
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsOpen(true)}
            icon={<LayoutSidebar className="size-4 text-neutral-600" />}
            className="h-auto w-fit p-2 border border-neutral-600 rounded-full"
          />
        </div>
      </div>

      {/* Sidebar backdrop */}
      <div
        className={cn(
          "fixed left-0 top-0 z-50 h-dvh w-screen md:sticky md:z-auto md:w-full md:bg-zinc-100",
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
            "relative h-[calc(100%-20px)] sm:h-[calc(100vh-20px)] top-[10px] left-[10px] w-[220px] border border-zinc-300 bg-white shadow-sm md:border-0 md:shadow-none md:bg-transparent rounded-3xl max-w-full transition-transform md:translate-x-0",
            !isOpen && "-translate-x-[calc(100%+20px)]",
          )}
        >
          <nav className="flex h-full flex-col p-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-6">
              <Link href="/" className="flex items-center">
                <NavWordmark className="h-6" />
              </Link>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsOpen(false)}
                icon={<X className="size-4" />}
                className="md:hidden h-auto w-fit p-1 rounded-full"
              />
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
                const Icon = item.icon;
                
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
                    <Icon className="size-4" />
                    {item.name}
                  </Link>
                );
              })}
            </div>

            {/* Footer */}
            <div className="pt-6 border-t border-neutral-200">
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
