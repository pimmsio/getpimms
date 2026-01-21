"use client";

import { PageContent } from "@/ui/layout/page-content";
import LayoutLoader from "@/ui/layout/layout-loader";
import dynamic from "next/dynamic";

const TodayClient = dynamic(() => import("./today-client.tsx"), {
  ssr: false,
  loading: () => <LayoutLoader />,
});

export default function TodayPage() {
  return (
    <PageContent wrapChildren childrenWrapperClassName="py-4 sm:py-6">
      <TodayClient />
    </PageContent>
  );
}

