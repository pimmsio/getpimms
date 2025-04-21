import useWorkspace from "@/lib/swr/use-workspace";
import { UtmTemplateProps } from "@/lib/types";
import { LinkFormData } from "@/ui/links/link-builder/link-builder-provider";
import { useLinkBuilderKeyboardShortcut } from "@/ui/links/link-builder/use-link-builder-keyboard-shortcut";
import { UTMTemplateList } from "@/ui/links/link-builder/utm-templates-button";
import {
  Button,
  DiamondTurnRight,
  LoadingSpinner,
  Modal,
  Tooltip,
  UTM_PARAMETERS,
  UTMBuilder,
} from "@dub/ui";
import {
  cn,
  constructURLFromUTMParams,
  fetcher,
  getParamsFromURL,
  getUrlFromStringIfValid,
} from "@dub/utils";
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useMemo,
  useState,
} from "react";
import { useForm, useFormContext } from "react-hook-form";
import useSWR from "swr";

type UTMModalProps = {
  showUTMModal: boolean;
  setShowUTMModal: Dispatch<SetStateAction<boolean>>;
  onLoad: (params: Record<string, string>) => void;
};

function UTMModal(props: UTMModalProps) {
  return (
    <Modal
      showModal={props.showUTMModal}
      setShowModal={props.setShowUTMModal}
      className="px-5 py-4 sm:max-w-md"
    >
      <UTMModalInner {...props} />
    </Modal>
  );
}

function UTMModalInner({ setShowUTMModal, onLoad }: UTMModalProps) {
  const { getValues: getValuesParent, setValue: setValueParent } =
    useFormContext<LinkFormData>();

  const form = useForm<
    Pick<
      LinkFormData,
      | "url"
      | "utm_source"
      | "utm_medium"
      | "utm_campaign"
      | "utm_term"
      | "utm_content"
    >
  >({
    values: {
      url: getValuesParent("url"),
      utm_source: getValuesParent("utm_source"),
      utm_medium: getValuesParent("utm_medium"),
      utm_campaign: getValuesParent("utm_campaign"),
      utm_term: getValuesParent("utm_term"),
      utm_content: getValuesParent("utm_content"),
    },
  });

  const {
    watch,
    setValue,
    reset,
    formState: { isDirty },
    handleSubmit,
  } = form;

  const url = watch("url");
  const isUrlValid = useMemo(() => !!getUrlFromStringIfValid(url), [url]);
  const enabledParams = useMemo(() => getParamsFromURL(url), [url]);

  // Update targeting URL params if they previously matched the same params of the destination URL
  const updateTargeting = useCallback(
    (
      data: Pick<
        LinkFormData,
        | "url"
        | "utm_source"
        | "utm_medium"
        | "utm_campaign"
        | "utm_term"
        | "utm_content"
      >,
    ) => {
      const [parentUrl, ios, android, geo] = getValuesParent([
        "url",
        "ios",
        "android",
        "geo",
      ]);

      const getNewParams = (targetURL: string) => {
        const parentParams = getParamsFromURL(parentUrl);
        const targetParams = getParamsFromURL(targetURL);

        const newParams = UTM_PARAMETERS.filter(
          ({ key }) => parentParams?.[key] === targetParams?.[key],
        ).map(({ key }) => [key, data[key] ?? ""]);

        return newParams.length ? Object.fromEntries(newParams) : null;
      };

      // Update iOS and Android URLs
      Object.entries({ ios, android }).forEach(([target, targetUrl]) => {
        if (!targetUrl) return;
        const newParams = getNewParams(targetUrl);
        if (newParams)
          setValueParent(
            target as "ios" | "android",
            constructURLFromUTMParams(targetUrl, newParams),
            {
              shouldDirty: true,
            },
          );
      });

      // Update geo targeting URLs
      if (geo && Object.keys(geo).length > 0) {
        const newGeo = Object.entries(geo).reduce((acc, [key, value]) => {
          if (!key?.trim() || !value?.trim()) return acc;

          const newParams = getNewParams(value);
          if (!newParams) return acc;

          return {
            ...acc,
            [key]: constructURLFromUTMParams(value, newParams),
          };
        }, {});

        if (Object.keys(newGeo).length > 0)
          setValueParent(
            "geo",
            { ...(geo as Record<string, string>), ...newGeo },
            { shouldDirty: true },
          );
      }
    },
    [],
  );

  const { id: workspaceId } = useWorkspace();

  const { data: utmData, isLoading: isUtmLoading } = useSWR<UtmTemplateProps[]>(
    workspaceId && `/api/utm?workspaceId=${workspaceId}`,
    fetcher,
    {
      dedupingInterval: 60000,
    },
  );

  return (
    <form
      onSubmit={(e) => {
        e.stopPropagation();
        handleSubmit((data) => {
          updateTargeting(data);

          setValueParent("url", data.url);
          UTM_PARAMETERS.filter((p) => p.key !== "ref").forEach((p) =>
            setValueParent(p.key as any, data[p.key], {
              shouldDirty: true,
            }),
          );

          setShowUTMModal(false);
        })(e);
      }}
    >
      <div className="flex items-center justify-between">
        {utmData ? (
          <div className="text-sm">
            <div className="max-w-64">
              <UTMTemplateList
                data={utmData}
                onLoad={(params) => {
                  onLoad(params);
                }}
              />
            </div>
          </div>
        ) : isUtmLoading ? (
          <div className="flex w-full items-center justify-center py-2 md:w-32">
            <LoadingSpinner className="size-4" />
          </div>
        ) : (
          <div className="flex w-full items-center justify-center p-2 text-center text-xs text-neutral-500 md:w-32">
            Failed to load templates
          </div>
        )}
        <div className="flex items-center gap-2">
          {/* <h3 className="text-lg font-medium">UTM Builder</h3> */}
          {/* <InfoTooltip
            content={
              <SimpleTooltipContent
                title="Add UTM parameters to your short links for conversion tracking."
                cta="Learn more."
                href="https://dub.co/help/article/utm-builder"
              />
            }
          /> */}
        </div>
        <div className="max-md:hidden">
          <Tooltip
            content={
              <div className="px-2 py-1 text-xs text-neutral-700">
                Press{" "}
                <strong className="font-medium text-neutral-950">U</strong> to
                open this quickly
              </div>
            }
            side="right"
          >
            <kbd className="flex size-6 cursor-default items-center justify-center rounded-xl border-[2px] border-neutral-100 font-sans text-xs text-neutral-950">
              U
            </kbd>
          </Tooltip>
        </div>
      </div>

      <div className="py-1">
        <UTMBuilder
          values={enabledParams}
          onChange={(key, value) => {
            if (key !== "ref") setValue(key, value, { shouldDirty: true });

            setValue(
              "url",
              constructURLFromUTMParams(url, {
                ...enabledParams,
                [key]: value,
              }),
              { shouldDirty: true },
            );
          }}
          disabledTooltip={
            isUrlValid
              ? undefined
              : "Enter a destination URL to add UTM parameters"
          }
          autoFocus
        />
      </div>

      {isUrlValid && (
        <div className="mt-4 grid gap-y-1">
          <span className="block text-sm font-medium text-neutral-700">
            URL Preview
          </span>
          <div className="scrollbar-hide mt-2 overflow-scroll break-words rounded-lg border-[6px] border-neutral-100 bg-neutral-50 px-2.5 py-2 font-mono text-xs text-neutral-500">
            {url}
          </div>
        </div>
      )}

      <div className="mt-6 flex items-center justify-between gap-2">
        {/* <div>
          <FormProvider {...form}>
            <UTMTemplatesCombo
              onLoad={(params) => {
                setValue("url", constructURLFromUTMParams(url, params), {
                  shouldDirty: true,
                });
              }}
              disabledTooltip={
                isUrlValid
                  ? undefined
                  : "Enter a destination URL to use UTM templates"
              }
            />
          </FormProvider>
        </div> */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            text="Cancel"
            className="h-9 w-fit"
            onClick={() => {
              reset();
              setShowUTMModal(false);
            }}
          />
          <Button
            type="submit"
            variant="secondary"
            text="Close"
            className="h-9 w-fit"
            // disabled={!isDirty}
          />
        </div>
      </div>
    </form>
  );
}

function UTMButton({
  setShowUTMModal,
}: {
  setShowUTMModal: Dispatch<SetStateAction<boolean>>;
}) {
  const { watch } = useFormContext<LinkFormData>();
  const url = watch("url");
  const enabled = useMemo(
    () =>
      Object.keys(getParamsFromURL(url)).some(
        (k) => UTM_PARAMETERS.findIndex((p) => p.key === k) !== -1,
      ),
    [url],
  );

  useLinkBuilderKeyboardShortcut("u", () => setShowUTMModal(true));

  return (
    <Button
      variant="secondary"
      text="UTM"
      icon={
        <DiamondTurnRight
          className={cn("size-4", enabled && "text-[#08272E]")}
        />
      }
      className="flex h-auto w-full items-center gap-2 rounded-md border-0 px-1 py-1 text-neutral-700 outline-none hover:bg-neutral-100 focus-visible:ring-2 focus-visible:ring-neutral-500 active:bg-neutral-200 group-hover:bg-neutral-100"
      onClick={() => setShowUTMModal(true)}
    />
  );
}

export function useUTMModal({
  onLoad,
}: {
  onLoad: (params: Record<string, string>) => void;
}) {
  const [showUTMModal, setShowUTMModal] = useState(false);

  const UTMModalCallback = useCallback(() => {
    return (
      <UTMModal
        showUTMModal={showUTMModal}
        setShowUTMModal={setShowUTMModal}
        onLoad={onLoad}
      />
    );
  }, [showUTMModal, setShowUTMModal]);

  const UTMButtonCallback = useCallback(() => {
    return <UTMButton setShowUTMModal={setShowUTMModal} />;
  }, [setShowUTMModal]);

  return useMemo(
    () => ({
      setShowUTMModal,
      UTMModal: UTMModalCallback,
      UTMButton: UTMButtonCallback,
    }),
    [setShowUTMModal, UTMModalCallback, UTMButtonCallback],
  );
}
