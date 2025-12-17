import { AnimatedSizeContainer, ClientOnly, Icon, NavWordmark } from "@dub/ui";
import { cn } from "@dub/utils";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PropsWithChildren, ReactNode, useMemo } from "react";

export type NavItemCommon = {
  name: string;
  href: string;
  exact?: boolean;
};

export type NavSubItemType = NavItemCommon;

export type NavItemType = NavItemCommon & {
  icon: Icon;
  items?: NavSubItemType[];
};

export type SidebarNavAreas<T extends Record<any, any>> = Record<
  string,
  (args: T) => {
    title?: string;
    backHref?: string;
    showSwitcher?: boolean;
    showNews?: boolean;
    direction?: "left" | "right";
    content: {
      name?: string;
      items: NavItemType[];
    }[];
  }
>;

export function SidebarNav<T extends Record<any, any>>({
  areas,
  currentArea,
  data,
  toolContent,
  newsContent,
  switcher,
  bottom,
}: {
  areas: SidebarNavAreas<T>;
  currentArea: string;
  data: T;
  toolContent?: ReactNode;
  newsContent?: ReactNode;
  switcher?: ReactNode;
  bottom?: ReactNode;
}) {
  return (
    <ClientOnly className="scrollbar-hide relative flex h-full w-full flex-col overflow-y-auto overflow-x-hidden">
      <nav className="relative flex grow flex-col px-3 text-neutral-500 sm:py-3">
        <div className="relative mt-2 flex items-center justify-between gap-1">
          {Object.entries(areas).map(([area, areaConfig]) => {
            const { title, backHref } = areaConfig(data);

            return (
              <Link
                key={area}
                href={backHref ?? "/"}
                className={cn(
                  "rounded px-1 outline-none transition-opacity focus-visible:ring-0 focus-visible:ring-black/50",
                  area === currentArea
                    ? "relative opacity-100"
                    : "pointer-events-none absolute opacity-0",
                )}
                aria-hidden={area !== currentArea ? true : undefined}
                {...{ inert: area !== currentArea ? true : undefined }}
              >
                {title && backHref && (
                  <div className="py group -my-1 -ml-1 flex items-center gap-2 py-2 pr-1 text-sm font-medium text-neutral-900">
                    <ChevronLeft className="size-4 text-neutral-500 transition-transform duration-100 group-hover:-translate-x-0.5" />
                    {title}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
        <div className="relative w-full grow">
          {Object.entries(areas).map(([area, areaConfig]) => {
            const { content, showSwitcher, showNews, direction } =
              areaConfig(data);
            return (
              <Area
                key={area}
                visible={area === currentArea}
                direction={direction ?? "right"}
              >
                {showSwitcher && switcher && (
                  <div className="pt-2">{switcher}</div>
                )}

                <div className="flex flex-col gap-0 pt-3">
                  {content.map(({ name, items }, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "flex flex-col",
                        name ? "pt-3 first:pt-0" : "pt-0",
                        name === "Customize" &&
                          "mt-2 rounded-2xl border border-neutral-200/80 bg-neutral-50/70 p-2.5 pb-2",
                      )}
                    >
                      {name && (
                        <div
                          className={cn(
                            "mb-2 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-neutral-500",
                            name === "Customize" && "mb-2 px-1 text-neutral-600",
                          )}
                        >
                          <span>{name}</span>
                        </div>
                      )}
                      <div className="flex flex-col gap-0">
                        {items.map((item, itemIdx) => (
                          <NavItem
                            key={item.name}
                            item={item}
                            leading={
                              name === "Customize" ? `${itemIdx + 1}` : undefined
                            }
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* {currentArea === "default" && <CreateProgramCard />} */}

                <AnimatePresence>
                  {showNews && (
                    <motion.div
                      className="-mx-3 flex grow flex-col justify-end"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{
                        duration: 0.1,
                        ease: "easeInOut",
                      }}
                    >
                      {newsContent}
                    </motion.div>
                  )}
                </AnimatePresence>
              </Area>
            );
          })}
        </div>
      </nav>
      {bottom && currentArea === "default" && (
        <div className="relative mt-auto flex flex-col justify-end">{bottom}</div>
      )}
      <div className="relative mx-auto flex items-center justify-between gap-1 pb-2 pt-1">
        <NavWordmark className="h-6" isInApp />
      </div>
    </ClientOnly>
  );
}

function NavItem({
  item,
  leading,
}: {
  item: NavItemType | NavSubItemType;
  leading?: string;
}) {
  const { name, href, exact } = item;

  const Icon = "icon" in item ? item.icon : undefined;
  const items = "items" in item ? item.items : undefined;
  const enabled = "enabled" in item ? item.enabled : true;

  const pathname = usePathname();

  const isActive = useMemo(() => {
    const hrefWithoutQuery = href.split("?")[0];
    return exact
      ? pathname === hrefWithoutQuery
      : pathname.startsWith(hrefWithoutQuery);
  }, [pathname, href, exact]);

  if (!enabled) {
    return null;
  }

  return (
    <div>
      <Link
        href={href}
        data-active={isActive}
        className={cn(
          "group relative flex items-center gap-2 rounded-full px-2 py-1 text-sm font-medium leading-none text-neutral-700 transition-all duration-100 hover:bg-neutral-50 active:bg-neutral-100 sm:px-2.5 sm:py-1.5",
          "outline-none focus-visible:ring-2 focus-visible:ring-neutral-300",
          isActive &&
            !items &&
            "bg-zinc-700 font-semibold text-white shadow-sm hover:bg-zinc-600 active:bg-zinc-800",
        )}
      >
        {leading ? (
          <span
            className={cn(
              "flex size-7 shrink-0 items-center justify-center overflow-visible rounded-full bg-white p-1 text-[12px] font-semibold text-[#08272E] transition-all duration-100",
            )}
            aria-hidden="true"
          >
            {leading}
          </span>
        ) : (
          Icon && (
          <Icon
            className={cn(
              "size-7 shrink-0 overflow-visible rounded-full bg-white p-1 text-[#08272E] transition-all duration-100",
            )}
          />
          )
        )}
        <span className={cn(isActive && "tracking-tight")}>{name}</span>
        {items && (
          <div className="flex grow justify-end">
            {items ? (
              <ChevronDown className="size-3.5 text-neutral-500 transition-transform duration-75 group-data-[active=true]:rotate-180" />
            ) : null}
          </div>
        )}
      </Link>
      {items && (
        <AnimatedSizeContainer
          height
          transition={{ duration: 0.2, ease: "easeInOut" }}
        >
          <div
            className={cn(
              "transition-opacity duration-200",
              isActive ? "h-auto" : "h-0 opacity-0",
            )}
            aria-hidden={!isActive}
          >
            <div className="pl-px pt-1">
              <div className="pl-3.5">
                <div className="flex flex-col gap-0 border-l border-neutral-200 pl-2">
                  {items.map((item) => (
                    <NavItem key={item.name} item={item} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </AnimatedSizeContainer>
      )}
    </div>
  );
}

export function Area({
  visible,
  direction,
  children,
}: PropsWithChildren<{ visible: boolean; direction: "left" | "right" }>) {
  return (
    <div
      className={cn(
        "left-0 top-0 flex size-full flex-col md:transition-[opacity,transform] md:duration-300",
        visible
          ? "opacity-1 relative"
          : cn(
              "pointer-events-none absolute opacity-0",
              direction === "left" ? "-translate-x-full" : "translate-x-full",
            ),
      )}
      aria-hidden={!visible ? "true" : undefined}
      {...{ inert: !visible ? true : undefined }}
    >
      {children}
    </div>
  );
}
