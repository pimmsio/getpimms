import useWorkspace from "@/lib/swr/use-workspace";
import { AppIconButton } from "@/ui/components/controls/app-icon-button";
import {
  LinkFormData,
  useLinkBuilderContext,
} from "@/ui/links/link-builder/link-builder-provider";
import { useOGModal } from "@/ui/modals/link-builder/og-modal";
import { FileUpload, Icon, useMediaQuery } from "@dub/ui";
import {
  Facebook,
  GlobePointer,
  LinkedIn,
  LoadingCircle,
  NucleoPhoto,
  Pen2,
  Refresh2,
  Twitter,
} from "@dub/ui/icons";
import { cn, getDomainWithoutWWW, resizeImage, SHORT_DOMAIN } from "@dub/utils";
import {
  ChangeEvent,
  ComponentType,
  memo,
  PropsWithChildren,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import { useFormContext, useWatch } from "react-hook-form";
import ReactTextareaAutosize from "react-textarea-autosize";
import { toast } from "sonner";
import { useDebounce } from "use-debounce";
import { HelpTooltip } from "@dub/ui";
import { useLinkBuilderKeyboardShortcut } from "./use-link-builder-keyboard-shortcut";
import { useMetatags } from "./use-metatags";

const tabs = ["default", "x", "linkedin", "facebook"] as const;
type Tab = (typeof tabs)[number];

const tabTitles: Record<Tab, string> = {
  default: "Default",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  x: "X/Twitter",
};

const tabIcons: Record<Tab, Icon> = {
  default: GlobePointer,
  x: Twitter,
  linkedin: LinkedIn,
  facebook: Facebook,
};

type OGPreviewProps = PropsWithChildren<{
  title: string | null;
  description: string | null;
  hostname: string | null;
  password: string | null;
}>;

const tabComponents: Record<Tab, ComponentType<OGPreviewProps>> = {
  default: DefaultOGPreview,
  x: XOGPreview,
  linkedin: LinkedInOGPreview,
  facebook: FacebookOGPreview,
};

export const LinkPreview = memo(() => {
  const { slug, plan } = useWorkspace();
  const { control, setValue } = useFormContext<LinkFormData>();
  const [proxy, doIndex, title, description, image, url, password] = useWatch({
    control,
    name: [
      "proxy",
      "doIndex",
      "title",
      "description",
      "image",
      "url",
      "password",
    ],
  });

  const [debouncedUrl] = useDebounce(url, 500);
  const hostname = useMemo(() => {
    if (password) return "pim.ms";
    return getDomainWithoutWWW(debouncedUrl) ?? null;
  }, [password, debouncedUrl]);

  const { OGModal, setShowOGModal } = useOGModal();
  const { generatingMetatags, refreshMetadata } = useMetatags();

  useLinkBuilderKeyboardShortcut("l", () => setShowOGModal(true));

  const [selectedTab, setSelectedTab] = useState<Tab>("default");

  const onImageChange = (image: string) => {
    if (doIndex) {
      return;
    }

    setValue("image", image, { shouldDirty: true });
    setValue("proxy", true);
  };

  const OGPreview = tabComponents[selectedTab];

  return (
    <div>
      <OGModal />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-medium text-neutral-700">
            Custom preview is {proxy ? "enabled" : "disabled"}
            {url && !doIndex && (
              <button
                type="button"
                onClick={() => refreshMetadata({ shouldDirty: true })}
                disabled={generatingMetatags}
                className={cn(
                  "ml-2 text-xs font-normal text-neutral-500 underline-offset-2 hover:text-neutral-700 hover:underline",
                  generatingMetatags && "cursor-not-allowed opacity-50",
                )}
              >
                {generatingMetatags ? "refreshing..." : "(refresh now)"}
              </button>
            )}
          </h2>
          <HelpTooltip
            label="Help: Custom preview"
            content="Customize the title, description and image shown when your link is shared."
          />
          {/* <InfoTooltip
            content={
              <SimpleTooltipContent
                title="Customize how your links look when shared on social media to improve click-through rates. When enabled, the preview settings below will be shown publicly (instead of the URL's original metatags)."
                cta="Learn more."
                href="https://dub.co/help/article/custom-link-previews"
              />
            }
          /> */}
        </div>
        {/* <Switch
          checked={proxy}
          fn={(checked) => setValue("proxy", checked, { shouldDirty: true })}
          // disabledTooltip={
          //   !url ? (
          //     "Enter a URL to enable custom link previews."
          //   ) : !plan || plan === "free" ? (
          //     <TooltipContent
          //       title="Custom Link Previews are only available on the Pro plan and above."
          //       cta="Upgrade to Pro"
          //       href={slug ? `/${slug}/upgrade` : "https://dub.co/pricing"}
          //       target="_blank"
          //     />
          //   ) : undefined
          // }
          // thumbIcon={
          //   !plan || plan === "free" ? (
          //     <CrownSmall className="size-full text-neutral-500" />
          //   ) : undefined
          // }
        /> */}
      </div>
      {/* <div className="mt-2.5 grid grid-cols-4 gap-2">
        {tabs.map((tab) => {
          const Icon = tabIcons[tab];
          return (
            <Button
              key={tab}
              variant="secondary"
              onClick={() => setSelectedTab(tab)}
              icon={
                <Icon className="size-4 text-current" fill="currentColor" />
              }
              className={cn(
                "h-7 text-neutral-800",
                tab === selectedTab
                  ? "border-neutral-400 bg-white drop-shadow-sm"
                  : "border-neutral-300 bg-transparent hover:bg-white",
              )}
              title={tabTitles[tab]}
            />
          );
        })}
      </div> */}
      <div className="relative z-0 mt-2">
        <div
          className={cn(
            "absolute top-2 right-2 z-10 flex gap-1",
            doIndex && "hidden",
          )}
        >
          <AppIconButton
            type="button"
            className="h-8 w-fit px-1.5"
            onClick={() => refreshMetadata({ shouldDirty: true })}
            disabled={!url || generatingMetatags}
            title="Refresh preview from URL"
          >
            <Refresh2
              className={cn("size-4", generatingMetatags && "animate-spin")}
            />
          </AppIconButton>
          <AppIconButton
            type="button"
            className="h-8 w-fit px-1.5"
            onClick={() => setShowOGModal(true)}
            title="Edit preview"
          >
            <Pen2 className="mx-px size-4" />
          </AppIconButton>
        </div>
        <OGPreview
          title={title}
          description={description}
          hostname={hostname}
          password={password}
        >
          <ImagePreview image={image} onImageChange={onImageChange} />
        </OGPreview>
      </div>
    </div>
  );
});

LinkPreview.displayName = "LinkPreview";

const ImagePreview = ({
  image,
  onImageChange,
}: {
  image: string | null;
  onImageChange: (image: string) => void;
}) => {
  const { isMobile } = useMediaQuery();

  const { generatingMetatags } = useLinkBuilderContext();

  const inputFileRef = useRef<HTMLInputElement>(null);

  const [resizing, setResizing] = useState(false);

  const onInputFileChange = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      if (file.size / 1024 / 1024 > 2) {
        toast.error(`File size too big (max 2 MB)`);
        return;
      }

      setResizing(true);

      const src = await resizeImage(file);
      onImageChange(src);

      // Delay to prevent flickering
      setTimeout(() => setResizing(false), 500);
    },
    [],
  );

  const previewImage = useMemo(() => {
    if (generatingMetatags || resizing) {
      return (
        <div className="flex aspect-[var(--aspect,1200/630)] w-full flex-col items-center justify-center bg-neutral-100">
          <LoadingCircle />
        </div>
      );
    }
    if (image) {
      return (
        <FileUpload
          accept="images"
          variant="plain"
          imageSrc={image}
          onChange={async ({ file }) => {
            setResizing(true);

            onImageChange(await resizeImage(file));

            // Delay to prevent flickering
            setTimeout(() => setResizing(false), 500);
          }}
          loading={generatingMetatags || resizing}
          clickToUpload={false}
          showHoverOverlay={false}
          accessibilityLabel="OG image upload"
        />
      );
    } else {
      return (
        <div className="relative aspect-[var(--aspect,1200/630)] w-full bg-white">
          <div className="absolute inset-0 opacity-0">
            <FileUpload
              accept="images"
              variant="plain"
              imageSrc={image}
              onChange={async ({ file }) => {
                setResizing(true);

                onImageChange(await resizeImage(file));

                // Delay to prevent flickering
                setTimeout(() => setResizing(false), 500);
              }}
              loading={generatingMetatags || resizing}
              clickToUpload={false}
              showHoverOverlay={false}
              accessibilityLabel="OG image upload"
            />
          </div>
          {/* {!isMobile && (
            <ShimmerDots className="pointer-events-none opacity-30" />
          )} */}
          <div className="pointer-events-none relative flex size-full flex-col items-center justify-center gap-2">
            <NucleoPhoto className="size-5 text-neutral-700" />
            <p className="max-w-32 text-center text-xs text-neutral-700">
              Enter a link to generate a preview
            </p>
          </div>
        </div>
      );
    }
  }, [image, generatingMetatags, resizing]);

  return (
    <>
      {previewImage}
      <input
        key={image}
        ref={inputFileRef}
        onChange={onInputFileChange}
        type="file"
        accept="image/png,image/jpeg"
        className="hidden"
      />
    </>
  );
};

function DefaultOGPreview({
  title,
  description,
  hostname,
  children,
}: OGPreviewProps) {
  const { watch, setValue } = useFormContext<LinkFormData>();
  const { proxy, doIndex } = watch();

  return (
    <div>
      <div className="group relative overflow-hidden rounded-xl bg-white ring-1 ring-neutral-200/60">
        {children}
      </div>
      <ReactTextareaAutosize
        className="text-md mt-4 line-clamp-2 w-full resize-none border-none bg-transparent p-0 font-medium text-neutral-700 outline-none focus:ring-0"
        value={title || "Add a title..."}
        maxRows={2}
        disabled={!!doIndex}
        onChange={(e) => {
          setValue("title", e.currentTarget.value, { shouldDirty: true });
          // if (plan && plan !== "free") {
          setValue("proxy", true, { shouldDirty: true });
          // }
        }}
      />
      <ReactTextareaAutosize
        className="mt-1.5 line-clamp-2 w-full resize-none border-none bg-transparent p-0 text-sm text-neutral-700/80 outline-none focus:ring-0"
        value={description || "Add a description..."}
        maxRows={2}
        disabled={!!doIndex}
        onChange={(e) => {
          setValue("description", e.currentTarget.value, {
            shouldDirty: true,
          });
          // if (plan && plan !== "free") {
          setValue("proxy", true, { shouldDirty: true });
          // }
        }}
      />
      {hostname && (
        <p className="mt-2 text-xs text-neutral-600">
          {proxy ? SHORT_DOMAIN : hostname || "domain.com"}
        </p>
      )}
    </div>
  );
}

function FacebookOGPreview({
  title,
  description,
  hostname,
  children,
}: OGPreviewProps) {
  const { watch, setValue } = useFormContext<LinkFormData>();
  const { proxy, doIndex } = watch();

  return (
    <div>
      <div className="relative overflow-hidden rounded-xl bg-white ring-1 ring-neutral-200/60">
        {children}
        {(hostname || title || description) && (
          <div className="grid gap-1 border-t border-neutral-200/70 bg-neutral-50 p-2">
            <input
              className="truncate border-none bg-transparent p-0 text-xs font-semibold text-neutral-900 outline-none focus:ring-0"
              value={title || "Add a title..."}
              disabled={!!doIndex}
              onChange={(e) => {
                setValue("title", e.currentTarget.value, {
                  shouldDirty: true,
                });
                // if (plan && plan !== "free") {
                setValue("proxy", true, { shouldDirty: true });
                // }
              }}
            />
            <ReactTextareaAutosize
              className="mb-1 line-clamp-2 w-full resize-none rounded border-none bg-transparent p-0 text-xs text-neutral-600 outline-none focus:ring-0"
              value={description || "Add a description..."}
              maxRows={2}
              disabled={!!doIndex}
              onChange={(e) => {
                setValue("description", e.currentTarget.value, {
                  shouldDirty: true,
                });
                // if (plan && plan !== "free") {
                setValue("proxy", true, { shouldDirty: true });
                // }
              }}
            />
            {hostname && (
              <p className="text-xs text-neutral-600 uppercase">
                {proxy ? SHORT_DOMAIN : hostname || "domain.com"}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function LinkedInOGPreview({ title, hostname, children }: OGPreviewProps) {
  const { watch, setValue } = useFormContext<LinkFormData>();
  const { proxy, doIndex } = watch();

  return (
    <div className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 ring-1 ring-neutral-200/60">
      <div
        className="relative w-32 shrink-0 overflow-hidden rounded"
        style={{ "--aspect": "128/72" } as any}
      >
        {children}
      </div>
      <div className="grid gap-2">
        <ReactTextareaAutosize
          className="line-clamp-2 w-full resize-none border-none p-0 text-sm text-neutral-900 outline-none focus:ring-0"
          value={title || "Add a title..."}
          maxRows={2}
          disabled={!!doIndex}
          onChange={(e) => {
            setValue("title", e.currentTarget.value, {
              shouldDirty: true,
            });
            // if (plan && plan !== "free") {
            setValue("proxy", true, { shouldDirty: true });
            // }
          }}
        />
        <p className="text-xs text-neutral-600">
          {proxy ? SHORT_DOMAIN : hostname || "domain.com"}
        </p>
      </div>
    </div>
  );
}

function XOGPreview({ title, hostname, children }: OGPreviewProps) {
  const { watch } = useFormContext<LinkFormData>();
  const { proxy } = watch();

  return (
    <div>
      <div className="group relative overflow-hidden rounded-xl bg-white ring-1 ring-neutral-200/60">
        {children}
        <div className="absolute bottom-2 left-0 w-full px-2">
          <div className="w-fit max-w-full rounded bg-black/[0.77] px-1.5 py-px">
            <span className="block max-w-sm truncate text-xs text-white">
              {title || "Add a title..."}
            </span>
          </div>
        </div>
      </div>
      {hostname && (
        <p className="mt-1 text-xs text-neutral-600">
          From {proxy ? SHORT_DOMAIN : hostname || "domain.com"}
        </p>
      )}
    </div>
  );
}
