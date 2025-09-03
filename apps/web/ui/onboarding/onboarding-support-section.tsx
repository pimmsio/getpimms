"use client";

import { Button } from "@dub/ui";
import Link from "next/link";

interface OnboardingSupportSectionProps {
  className?: string;
}

export function OnboardingSupportSection({
  className = "",
}: OnboardingSupportSectionProps) {
  return (
    <div className={`flex flex-col space-y-3 ${className}`}>
      <div>
        <p className="text-sm font-medium text-green-900">
          Contact us for onboarding support
        </p>
        <p className="text-sm text-green-800">
          Need help getting started? Alexandre Sarfati is here to help you make the most of Pimms.
        </p>
      </div>
      <div className="flex gap-3">
        <Link
          href="https://www.linkedin.com/in/alexandre-sarfati/"
          target="_blank"
          rel="noopener noreferrer"
          className="w-fit"
        >
          <Button
            variant="secondary"
            text="LinkedIn Profile"
            className="h-8 w-fit px-4 font-medium"
            type="button"
          />
        </Link>
      </div>
    </div>
  );
}
