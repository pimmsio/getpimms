import useWorkspace from "@/lib/swr/use-workspace";
import { MoreDropdown } from "@/ui/links/link-builder/more-dropdown";
import { useABTestingModal } from "@/ui/modals/link-builder/ab-testing-modal";
import { useExpirationModal } from "@/ui/modals/link-builder/expiration-modal";
import { usePasswordModal } from "@/ui/modals/link-builder/password-modal";
import { useTargetingModal } from "@/ui/modals/link-builder/targeting-modal";
import { cn } from "@dub/utils";

export function LinkFeatureButtons({
  variant = "page",
  className,
}: {
  variant?: "page" | "modal";
  className?: string;
}) {
  const { flags } = useWorkspace();
  const { ExpirationModal, ExpirationButton } = useExpirationModal();
  const { TargetingModal, TargetingButton } = useTargetingModal();
  const { PasswordModal, PasswordButton } = usePasswordModal();
  const { ABTestingModal, ABTestingButton } = useABTestingModal();

  // ab testing only if search params include ab_testing=true
  const searchParams = new URLSearchParams(window.location.search);

  return (
    <>
      <PasswordModal />
      {/* <UTMModal />
      <TargetingModal /> */}
      <ExpirationModal />

      {/* {flags?.abTesting && <ABTestingModal />}
      {flags?.abTesting && <ABTestingButton />} */}

      {/* <div className={cn("flex min-w-0 items-center gap-2", className)}>
        <UTMButton />
        <div className="contents max-[380px]:hidden">
          <TargetingButton />
        </div>
        <div
          className={cn(
            "contents max-sm:hidden",
            variant === "page" && "max-[960px]:hidden",
          )}
        >
          {flags?.abTesting && <ABTestingButton />}
          <PasswordButton />
          <ExpirationButton />
        </div>
        <MoreDropdown />
      </div> */}
    </>
  );
}
