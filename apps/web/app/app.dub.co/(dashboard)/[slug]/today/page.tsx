import { PageContent } from "@/ui/layout/page-content";
import TodayClient from "./today-client";

export default function TodayPage() {
  return (
    <PageContent wrapChildren childrenWrapperClassName="py-4 sm:py-6">
      <TodayClient />
    </PageContent>
  );
}

