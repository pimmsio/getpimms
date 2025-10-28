import { LinkFormData } from "@/ui/links/link-builder/link-builder-provider";
import { UtmDetectionBanner } from "@/ui/links/link-builder/utm-detection-banner";
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

    return (
      <>
        <div className="flex w-full flex-col gap-6">
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
          <UtmDetectionBanner />
        </div>
      </>
    );
  }),
);

LinkBuilderDestinationUrlInput.displayName = "LinkBuilderDestinationUrlInput";
