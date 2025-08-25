import useWorkspace from "@/lib/swr/use-workspace";
import { LinkFormData } from "@/ui/links/link-builder/link-builder-provider";
import { useABTestingModal } from "@/ui/modals/link-builder/ab-testing-modal";
import { useTargetingModal } from "@/ui/modals/link-builder/targeting-modal";
import { useUTMModal } from "@/ui/modals/link-builder/utm-modal";
import { constructURLFromUTMParams } from "@dub/utils";
import { forwardRef, memo } from "react";
import {
  Controller,
  useFormContext,
  useFormState,
  useWatch,
} from "react-hook-form";
import { DestinationUrlInput } from "../../destination-url-input";
import { useAvailableDomains } from "../../use-available-domains";


/**
 * Wraps the DestinationUrlInput component with link-builder-specific context & logic
 * @see DestinationUrlInput
 */
export const LinkBuilderDestinationUrlInput = memo(
  forwardRef<HTMLInputElement>((_, ref) => {
    const { control, setValue, clearErrors } = useFormContext<LinkFormData>();

    const { errors } = useFormState({ control, name: ["url"] });
    const [domain, key, url] = useWatch({
      control,
      name: ["domain", "key", "url", "title", "description"],
    });

    const { domains } = useAvailableDomains({
      currentDomain: domain,
    });

    const { UTMModal, UTMButton } = useUTMModal({
      onLoad: (params) => {
        setValue("url", constructURLFromUTMParams(url, params), {
          shouldDirty: true,
        });
      },
    });
    const { TargetingButton, TargetingModal } = useTargetingModal();
    const { ABTestingModal, ABTestingButton } = useABTestingModal();

    const { flags } = useWorkspace();

    return (
      <>
        <UTMModal />
        <TargetingModal />
        {flags?.abTesting && <ABTestingModal />}

        <div className="flex w-full flex-col gap-2">
          <Controller
            name="url"
            control={control}
            render={({ field }) => (
              <DestinationUrlInput
                ref={ref}
                domain={domain}
                _key={key}
                value={field.value}
                domains={domains}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  clearErrors("url");
                  field.onChange(e.target.value);
                }}
                required={key !== "_root"}
                error={errors.url?.message || undefined}
              />
            )}
          />
          <div className="flex w-fit flex-row gap-2 mt-1">
            <UTMButton />
            <TargetingButton />
            {flags?.abTesting && <ABTestingButton />}
          </div>
        </div>
      </>
    );
  }),
);

LinkBuilderDestinationUrlInput.displayName = "LinkBuilderDestinationUrlInput";
