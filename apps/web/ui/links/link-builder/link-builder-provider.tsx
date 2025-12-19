import { ExpandedLinkProps } from "@/lib/types";
import { DEFAULT_LINK_PROPS, PLANS } from "@dub/utils";
import {
  createContext,
  Dispatch,
  PropsWithChildren,
  SetStateAction,
  useContext,
  useState,
} from "react";
import { FormProvider, useForm } from "react-hook-form";

export type LinkFormData = ExpandedLinkProps;

export type LinkBuilderProps = {
  props?: ExpandedLinkProps;
  duplicateProps?: ExpandedLinkProps;
  workspace: {
    id?: string;
    slug?: string;
    plan?: string;
    nextPlan?: (typeof PLANS)[number];
    conversionEnabled?: boolean;
  };
  modal: boolean;
};

export const LinkBuilderContext = createContext<
  | (LinkBuilderProps & {
      generatingMetatags: boolean;
      setGeneratingMetatags: Dispatch<SetStateAction<boolean>>;
    })
  | null
>(null);

export function useLinkBuilderContext() {
  const context = useContext(LinkBuilderContext);
  if (!context)
    throw new Error(
      "useLinkBuilderContext must be used within a LinkBuilderProvider",
    );

  return context;
}

export function LinkBuilderProvider({
  children,
  ...rest
}: PropsWithChildren<LinkBuilderProps>) {
  const [generatingMetatags, setGeneratingMetatags] = useState(
    Boolean(rest.props),
  );

  const form = useForm<LinkFormData>({
    defaultValues: rest.props ||
      rest.duplicateProps || {
        ...DEFAULT_LINK_PROPS,
        // Conversion tracking is enabled by default for all accounts.
        trackConversion: true,
      },
  });

  return (
    <LinkBuilderContext.Provider
      value={{ ...rest, generatingMetatags, setGeneratingMetatags }}
    >
      <FormProvider {...form}>{children}</FormProvider>
    </LinkBuilderContext.Provider>
  );
}
