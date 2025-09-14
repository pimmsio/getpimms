import { BlurImage } from "@dub/ui";
import { cn, getGoogleFavicon } from "@dub/utils";
import { Link2 } from "lucide-react";
import { getBestDomainForLogo } from "@/lib/analytics/utils";

export default function RefererIcon({
  display,
  className,
}: {
  display: string;
  className?: string;
}) {
  return display === "(direct)" ? (
    <Link2 className={cn("h-4 w-4", className)} />
  ) : (
    <BlurImage
      src={getGoogleFavicon(getBestDomainForLogo(display), false)}
      alt={display}
      width={20}
      height={20}
      className={cn("h-4 w-4 rounded-full", className)}
    />
  );
}
