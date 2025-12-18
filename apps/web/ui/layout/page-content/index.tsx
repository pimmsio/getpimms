import { MaxWidthWrapper } from "@dub/ui";
import { cn } from "@dub/utils";
import { ChevronLeft } from "lucide-react";
import { PropsWithChildren, ReactNode } from "react";
import { NavButton } from "./nav-button";
import { layout, radius, spacing, surface, text } from "@/ui/design/tokens";
import { AppIconLink } from "@/ui/components/controls/app-icon-button";

export function PageContent({
  title,
  titleBackButtonLink,
  titleControls,
  description,
  hideReferButton,
  headerPlacement = "shell",
  variant = "panel",
  wrapChildren = false,
  className,
  contentWrapperClassName,
  childrenWrapperClassName,
  children,
}: PropsWithChildren<{
  title?: ReactNode;
  titleBackButtonLink?: string;
  titleControls?: ReactNode;
  description?: ReactNode;
  hideReferButton?: boolean;
  /**
   * `shell` (default): header is rendered above the content panel on the app shell.
   * `content`: header is rendered inside the content panel (Today-like).
   */
  headerPlacement?: "shell" | "content";
  /**
   * `panel` = primary content surface (default).
   * `flat` = no built-in surface/radius; page owns its own surfaces.
   */
  variant?: "panel" | "flat";
  /**
   * When true, wraps `children` in MaxWidthWrapper to avoid repeating wrappers in every page.
   * Keep false for pages that intentionally render full-bleed content (tables, charts, etc.).
   */
  wrapChildren?: boolean;
  className?: string;
  contentWrapperClassName?: string;
  childrenWrapperClassName?: string;
}>) {
  const hasTitle = title !== undefined;
  const hasDescription = description !== undefined;
  const isTextTitle = typeof title === "string" || typeof title === "number";
  const showShellHeader = headerPlacement === "shell" && (hasTitle || hasDescription);

  return (
    <div
      className={cn(
        spacing.pageTop,
        showShellHeader && "md:mt-5",
        className,
      )}
    >
      {headerPlacement === "shell" && (
        <MaxWidthWrapper>
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4">
              <NavButton />
              {(hasTitle || hasDescription) && (
                <div className="min-w-0">
                  {hasTitle && (
                    <div className="flex min-w-0 items-center gap-2">
                      {titleBackButtonLink && (
                        <AppIconLink href={titleBackButtonLink} className="app-icon-btn">
                          <ChevronLeft className="size-5" />
                        </AppIconLink>
                      )}
                      <div
                        className={cn(
                          isTextTitle ? text.pageTitle : "min-w-0",
                          isTextTitle && "truncate",
                        )}
                      >
                        {title}
                      </div>
                    </div>
                  )}
                  {hasDescription && (
                    <p className={cn("mt-1 hidden md:block", text.pageDescription)}>
                      {description}
                    </p>
                  )}
                </div>
              )}
            </div>
            {titleControls && <div className="hidden md:block">{titleControls}</div>}
            {/* <div className="flex items-center gap-4 md:hidden">
                {!hideReferButton && <ReferButton />}
                <HelpButtonRSC />
                <UserDropdown />
              </div> */}
          </div>
        </MaxWidthWrapper>
      )}
      <div
        className={cn(
          layout.contentPanel,
          variant === "panel" && surface.content,
          variant === "panel" && radius.xl,
          contentWrapperClassName,
        )}
      >
        {headerPlacement === "content" && (
          <div className="border-b border-neutral-100">
            <MaxWidthWrapper className="py-3">
              <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-4">
                  <NavButton />
                  {(hasTitle || hasDescription) && (
                    <div className="min-w-0">
                      {hasTitle && (
                        <div className="flex min-w-0 items-center gap-2">
                          {titleBackButtonLink && (
                            <AppIconLink href={titleBackButtonLink} className="app-icon-btn">
                              <ChevronLeft className="size-5" />
                            </AppIconLink>
                          )}
                          <div
                            className={cn(
                              isTextTitle ? text.pageTitle : "min-w-0",
                              isTextTitle && "truncate",
                            )}
                          >
                            {title}
                          </div>
                        </div>
                      )}
                      {hasDescription && (
                        <p className={cn("mt-1 hidden md:block", text.pageDescription)}>
                          {description}
                        </p>
                      )}
                    </div>
                  )}
                </div>
                {titleControls && <div className="hidden md:block">{titleControls}</div>}
              </div>
            </MaxWidthWrapper>
          </div>
        )}
        {hasDescription && (
          <MaxWidthWrapper>
            <p
              className={cn(
                "mb-3 mt-1 md:hidden",
                text.pageDescription,
              )}
            >
              {description}
            </p>
          </MaxWidthWrapper>
        )}
        {wrapChildren ? (
          <MaxWidthWrapper className={childrenWrapperClassName}>
            {children}
          </MaxWidthWrapper>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
