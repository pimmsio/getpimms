"use client";

import { PageContent } from "@/ui/layout/page-content";
import LayoutLoader from "@/ui/layout/layout-loader";
import dynamic from "next/dynamic";

const ConversionsClient = dynamic(
  () => import("./conversions-client.tsx"),
  {
    ssr: false,
    loading: () => <LayoutLoader />,
  },
);

export default function WorkspaceAnalyticsConversions() {
  return (
    <PageContent
      title="Leads"
      headerPlacement="content"
    >
      <ConversionsClient />
    </PageContent>
  );
}
