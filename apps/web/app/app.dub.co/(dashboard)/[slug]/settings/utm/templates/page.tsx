import { Suspense } from "react";
import WorkspaceUtmTemplatesClient from "../../library/utm/page-client";

export default function WorkspaceUtmTemplates() {
  return (
    <Suspense>
      <WorkspaceUtmTemplatesClient />
    </Suspense>
  );
}

