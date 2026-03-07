import useWorkspace from "@/lib/swr/use-workspace";
import { UtmTemplateProps } from "@/lib/types";
import {
  Button,
  Modal,
  useKeyboardShortcut,
  useMediaQuery,
} from "@dub/ui";
import { UtmConventionOptions } from "@dub/utils";
import { UTMBuilderEnhanced } from "@/ui/links/link-builder/utm-builder-enhanced";
import posthog from "posthog-js";
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

function AddEditUtmTemplateModal({
  showAddEditUtmTemplateModal,
  setShowAddEditUtmTemplateModal,
  props,
  mutate,
  initialName,
  onCreated,
}: {
  showAddEditUtmTemplateModal: boolean;
  setShowAddEditUtmTemplateModal: Dispatch<SetStateAction<boolean>>;
  props?: UtmTemplateProps;
  mutate: () => Promise<any>;
  initialName?: string;
  onCreated?: (templateId: string) => void;
}) {
  const { id } = props || {};
  const workspace = useWorkspace();
  const { id: workspaceId } = workspace;
  const { isMobile } = useMediaQuery();

  const conventionOptions = useMemo<UtmConventionOptions>(
    () => ({
      spaceChar: workspace.utmSpaceChar ?? "-",
      prohibitedChars: workspace.utmProhibitedChars ?? "",
      forceLowercase: workspace.utmForceLowercase ?? true,
    }),
    [workspace.utmSpaceChar, workspace.utmProhibitedChars, workspace.utmForceLowercase],
  );

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    formState: { isSubmitting, isSubmitSuccessful, dirtyFields },
    watch,
  } = useForm<
    Pick<
      UtmTemplateProps,
      | "name"
      | "utm_campaign"
      | "utm_content"
      | "utm_medium"
      | "utm_source"
      | "utm_term"
      | "ref"
    >
  >({
    values: props,
  });

  // Pre-fill the name field from the combobox search text when creating a new
  // template. Using setValue with shouldDirty so the Save button is enabled.
  useEffect(() => {
    if (!props && initialName) {
      setValue("name", initialName, { shouldDirty: true });
    }
  }, [initialName, props, setValue]);

  const values = watch();

  const endpoint = useMemo(
    () =>
      id
        ? {
            method: "PATCH",
            url: `/api/utm/${id}?workspaceId=${workspaceId}`,
            successMessage: "Successfully updated template!",
          }
        : {
            method: "POST",
            url: `/api/utm?workspaceId=${workspaceId}`,
            successMessage: "Successfully added template!",
          },
    [id, workspaceId],
  );

  return (
    <Modal
      showModal={showAddEditUtmTemplateModal}
      setShowModal={setShowAddEditUtmTemplateModal}
    >
      <form
        onSubmit={(e) => {
          // Prevent submit from bubbling through the React portal tree and
          // accidentally triggering the parent link builder form.
          e.stopPropagation();
          handleSubmit(async (data) => {
            try {
              const res = await fetch(endpoint.url, {
                method: endpoint.method,
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
              });

              if (!res.ok) {
                const { error } = await res.json();
                toast.error(error.message);
                setError("root", { message: error.message });
                return;
              }

              const created = await res.json();

              posthog.capture(
                props ? "utm-template_edited" : "utm-template_created",
                {
                  utmTemplateId: id ?? created?.id,
                  utmTemplateName: data.name,
                },
              );

              await mutate();

              // Auto-select the newly created template in the parent selector.
              if (!props && created?.id) {
                onCreated?.(created.id);
              }

              toast.success(endpoint.successMessage);
              setShowAddEditUtmTemplateModal(false);
            } catch (e) {
              toast.error("Failed to save template");
              setError("root", { message: "Failed to save template" });
            }
          })(e);
        }}
        className="flex max-h-[85vh] flex-col"
      >
        <div className="shrink-0 border-b border-neutral-100 px-5 py-4">
          <h3 className="text-lg font-medium">
            {props ? "Edit UTM Template" : "Create UTM Template"}
          </h3>
        </div>

        <div className="scrollbar-hide flex-1 overflow-y-auto overflow-x-hidden px-5 py-4">
          <div>
            <label htmlFor="name">
              <span className="block text-sm font-medium text-neutral-700">
                Template Name
              </span>
              <div className="mt-2 flex rounded shadow-sm">
                <input
                  type="text"
                  autoFocus={!isMobile}
                  autoComplete="off"
                  className="block w-full rounded border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:border-neutral-500 focus:outline-none focus:ring-0 sm:text-sm"
                  placeholder="New Template"
                  {...register("name", { required: true })}
                />
              </div>
            </label>
          </div>

          <div className="mt-6">
            <span className="mb-2 block text-sm font-medium text-neutral-700">
              Parameters
            </span>
            <UTMBuilderEnhanced
              values={values}
              onChange={(key, value) => {
                setValue(key as any, value, { shouldDirty: true });
              }}
              conventionOptions={conventionOptions}
            />
          </div>
        </div>

        <div className="shrink-0 border-t border-neutral-100 px-5 py-4">
          <div className="flex justify-end">
            <Button
              // Check all dirty fields because `isDirty` doesn't seem to register for `ref`
              disabled={!Object.entries(dirtyFields).some(([_, dirty]) => dirty)}
              loading={isSubmitting || isSubmitSuccessful}
              text={props ? "Save changes" : "Create template"}
              className="h-9 w-fit"
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}

function AddUtmTemplateButton({
  setShowAddEditUtmTemplateModal,
}: {
  setShowAddEditUtmTemplateModal: Dispatch<SetStateAction<boolean>>;
}) {
  useKeyboardShortcut("c", () => setShowAddEditUtmTemplateModal(true));

  return (
    <div>
      <Button
        variant="primary"
        text="Create template"
        shortcut="C"
        className="h-9 rounded"
        onClick={() => setShowAddEditUtmTemplateModal(true)}
      />
    </div>
  );
}

export function useAddEditUtmTemplateModal({
  props,
  mutate,
  onCreated,
}: { 
  props?: UtmTemplateProps;
  mutate: () => Promise<any>;
  onCreated?: (templateId: string) => void;
}) {
  const [showAddEditUtmTemplateModal, setShowAddEditUtmTemplateModal] =
    useState(false);
  const [initialName, setInitialName] = useState<string | undefined>(undefined);

  const openWithName = useCallback((name?: string) => {
    setInitialName(name);
    setShowAddEditUtmTemplateModal(true);
  }, []);

  const AddEditUtmTemplateModalCallback = useCallback(() => {
    return (
      <AddEditUtmTemplateModal
        showAddEditUtmTemplateModal={showAddEditUtmTemplateModal}
        setShowAddEditUtmTemplateModal={setShowAddEditUtmTemplateModal}
        props={props}
        mutate={mutate}
        initialName={initialName}
        onCreated={onCreated}
      />
    );
  }, [showAddEditUtmTemplateModal, setShowAddEditUtmTemplateModal, props, mutate, initialName, onCreated]);

  const AddUtmTemplateButtonCallback = useCallback(() => {
    return (
      <AddUtmTemplateButton
        setShowAddEditUtmTemplateModal={setShowAddEditUtmTemplateModal}
      />
    );
  }, [setShowAddEditUtmTemplateModal]);

  return useMemo(
    () => ({
      setShowAddEditUtmTemplateModal,
      openWithName,
      AddEditUtmTemplateModal: AddEditUtmTemplateModalCallback,
      AddUtmTemplateButton: AddUtmTemplateButtonCallback,
    }),
    [
      setShowAddEditUtmTemplateModal,
      openWithName,
      AddEditUtmTemplateModalCallback,
      AddUtmTemplateButtonCallback,
    ],
  );
}
