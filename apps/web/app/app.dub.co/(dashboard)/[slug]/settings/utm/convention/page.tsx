import { Suspense } from "react";
import UtmConventionClient from "./page-client";

export default function UtmConventionPage() {
  return (
    <Suspense>
      <UtmConventionClient />
    </Suspense>
  );
}
