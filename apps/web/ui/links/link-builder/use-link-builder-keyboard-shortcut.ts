import { useKeyboardShortcut } from "@dub/ui";
import { useContext } from "react";
import { LinkBuilderContext } from "./link-builder-provider";

export const useLinkBuilderKeyboardShortcut: typeof useKeyboardShortcut = (
  ...args
) => {
  // Gracefully handle when used outside of LinkBuilderProvider
  const context = useContext(LinkBuilderContext);
  const modal = context?.modal;

  useKeyboardShortcut(args[0], args[1], {
    modal,
    ...args[2],
  });
};
