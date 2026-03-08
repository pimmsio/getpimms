import { MainNav } from "@/ui/layout/main-nav";
import { ProTrialWrapper } from "@/ui/layout/pro-trial-wrapper";
import { AppSidebarNav } from "@/ui/layout/sidebar/app-sidebar-nav";
import { HelpButtonRSC } from "@/ui/layout/sidebar/help-button-rsc";
import { NewsRSC } from "@/ui/layout/sidebar/news-rsc";
import Toolbar from "@/ui/layout/toolbar/toolbar";
import { constructMetadata } from "@dub/utils";
import { ReactNode } from "react";

export const dynamic = "force-static";
export const metadata = constructMetadata();

export default async function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="min-h-screen w-full">
        <MainNav
          sidebar={AppSidebarNav}
          // toolContent={
          //   <>
          //     <ReferButton />
          //     <HelpButtonRSC />
          //   </>
          // }
          // newsContent={<NewsRSC />}
        >
          <div className="mx-auto w-full max-w-screen-xl px-3 pb-2 pt-2 md:pt-0 lg:px-10">
            <ProTrialWrapper />
          </div>
          {children}
        </MainNav>
      </div>
      {/* <Toolbar show={["onboarding"]} /> */}
    </>
  );
}
