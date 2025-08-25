"use client";

import { ReactNode } from "react";

export default function AnalyticsClient({
  children,
  eventsPage,
  adminPage,
}: {
  children: ReactNode;
  eventsPage?: boolean;
  adminPage?: boolean;
}) {
  // For admin page, we don't need workspace checks or limitations
  return children;
}
