import { LinkFormData } from "@/ui/links/link-builder/link-builder-provider";
import { useTargetingModal } from "@/ui/modals/link-builder/targeting-modal";
import { useUTMModal } from "@/ui/modals/link-builder/utm-modal";
import { forwardRef, memo } from "react";
import {
  Controller,
  useFormContext,
  useFormState,
  useWatch,
} from "react-hook-form";
import { DestinationUrlInput } from "../../destination-url-input";
import { useAvailableDomains } from "../../use-available-domains";
import { constructURLFromUTMParams } from "@dub/utils";

/**
 * Wraps the DestinationUrlInput component with link-builder-specific context & logic
 * @see DestinationUrlInput
 */
export const LinkBuilderDestinationUrlInput = memo(
  forwardRef<HTMLInputElement>((_, ref) => {
    const { control, setValue, clearErrors } = useFormContext<LinkFormData>();
    0;

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

    return (
      <>
        <UTMModal />
        <TargetingModal />
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
              right={
                <div className="mb-1.5 flex h-6 items-center gap-2">
                  <UTMButton />
                  <TargetingButton />
                </div>
              }
            />
          )}
        />
      </>
    );
  }),
);

LinkBuilderDestinationUrlInput.displayName = "LinkBuilderDestinationUrlInput";
