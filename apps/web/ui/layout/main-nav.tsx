"use client";

import { borders, radius, surface } from "@/ui/design/tokens";
import { useMediaQuery } from "@dub/ui";
import { cn } from "@dub/utils";
import { usePathname } from "next/navigation";
import {
  ComponentType,
  createContext,
  Dispatch,
  PropsWithChildren,
  ReactNode,
  SetStateAction,
  useEffect,
  useState,
} from "react";

type SideNavContext = {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
};

export const SideNavContext = createContext<SideNavContext>({
  isOpen: false,
  setIsOpen: () => {},
});

export function MainNav({
  children,
  sidebar: Sidebar,
  toolContent,
  newsContent,
}: PropsWithChildren<{
  sidebar: ComponentType<{
    toolContent?: ReactNode;
    newsContent?: ReactNode;
  }>;
  toolContent?: ReactNode;
  newsContent?: ReactNode;
}>) {
  const pathname = usePathname();

  const { isMobile } = useMediaQuery();
  const [isOpen, setIsOpen] = useState(false);

  // Prevent body scroll when side nav is open
  useEffect(() => {
    document.body.style.overflow = isOpen && isMobile ? "hidden" : "auto";
  }, [isOpen, isMobile]);

  // Close side nav when pathname changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <div
      className={cn(
        surface.shell,
        "min-h-screen md:grid md:grid-cols-[240px_minmax(0,1fr)]",
      )}
    >
      {/* Side nav backdrop */}
      <div
        className={cn(
          "fixed left-0 top-0 z-50 h-dvh w-screen transition-all duration-300 md:sticky md:z-auto md:w-full",
          isOpen
            ? "bg-black/40 backdrop-blur-sm"
            : "bg-transparent backdrop-blur-0 max-md:pointer-events-none",
        )}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            e.stopPropagation();
            setIsOpen(false);
          }
        }}
      >
        {/* Side nav */}
        <div
          className={cn(
            "relative left-[8px] top-[8px] h-[calc(100dvh-16px)] w-[280px] max-w-[calc(100vw-32px)] transition-all duration-300 ease-out sm:h-[calc(100vh-20px)] sm:w-[220px] md:left-[10px] md:top-[10px] md:h-[calc(100vh-20px)] md:translate-x-0 md:rounded-3xl",
            borders.hairline,
            surface.sidebar,
            radius.xl,
            !isOpen && "-translate-x-[calc(100%+24px)]",
          )}
        >
          {/* <div className="absolute inset-0 overflow-hidden">
            <div
              className={cn(
                "pointer-events-none absolute -left-2/3 bottom-0 aspect-square w-[140%] translate-y-1/4 rounded-full opacity-15 blur-[75px]",
                "bg-[conic-gradient(from_32deg_at_center,#855AFC_0deg,#3A8BFD_72deg,#00FFF9_144deg,#5CFF80_198deg,#EAB308_261deg,#f00_360deg)]",
              )}
            />
          </div> */}
          <Sidebar toolContent={toolContent} newsContent={newsContent} />
        </div>
      </div>
      <div
        className={cn(
          surface.shell,
          "md:pb-[10px] md:pl-[10px] md:pr-[10px] md:pt-[10px]",
        )}
      >
        <div
          className={cn(
            "relative min-h-full overflow-hidden pt-px md:rounded-tl-3xl",
            surface.shell,
          )}
        >
          <SideNavContext.Provider value={{ isOpen, setIsOpen }}>
            {children}
          </SideNavContext.Provider>
        </div>
      </div>
    </div>
  );
}
