import { cn } from "@dub/utils";
import { PropsWithChildren } from "react";
import { PageContent } from "./page-content";
import { spacing } from "@/ui/design/tokens";

export default function SettingsLayout({ children }: PropsWithChildren) {
  return (
    <PageContent
      wrapChildren
      childrenWrapperClassName={cn("grid grid-cols-1 pb-10 pt-3", spacing.sectionGap)}
    >
      {children}
    </PageContent>
  );
}
