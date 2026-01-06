"use client";

import { mutatePrefix } from "@/lib/swr/mutate";
import useWorkspace from "@/lib/swr/use-workspace";
import useWorkspaces from "@/lib/swr/use-workspaces";
import { SimpleLinkProps } from "@/lib/types";
import { useAcceptInviteModal } from "@/ui/modals/accept-invite-modal";
import { useAddEditDomainModal } from "@/ui/modals/add-edit-domain-modal";
import { useAddWorkspaceModal } from "@/ui/modals/add-workspace-modal";
import { useImportBitlyModal } from "@/ui/modals/import-bitly-modal";
import { useImportCsvModal } from "@/ui/modals/import-csv-modal";
import { useImportShortModal } from "@/ui/modals/import-short-modal";
import { useCookies } from "@dub/ui";
import { DEFAULT_LINK_PROPS, getUrlFromString } from "@dub/utils";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import {
  Dispatch,
  ReactNode,
  SetStateAction,
  Suspense,
  createContext,
  useEffect,
  useMemo,
} from "react";
import { toast } from "sonner";
import { useAddEditTagModal } from "./add-edit-tag-modal";
import { useImportRebrandlyModal } from "./import-rebrandly-modal";
import { useLinkBuilder } from "./link-builder";
import { useConversionOnboardingModal } from "@/ui/layout/sidebar/conversions/conversions-onboarding-modal";
import { usePaywallModal } from "@/ui/modals/paywall-modal";

export const ModalContext = createContext<{
  setShowAddWorkspaceModal: Dispatch<SetStateAction<boolean>>;
  setShowAddEditDomainModal: Dispatch<SetStateAction<boolean>>;
  setShowLinkBuilder: Dispatch<SetStateAction<boolean>>;
  setShowConversionOnboardingModal: Dispatch<SetStateAction<boolean>>;
  setShowAddEditTagModal: Dispatch<SetStateAction<boolean>>;
  setShowImportBitlyModal: Dispatch<SetStateAction<boolean>>;
  setShowImportShortModal: Dispatch<SetStateAction<boolean>>;
  setShowImportRebrandlyModal: Dispatch<SetStateAction<boolean>>;
  setShowImportCsvModal: Dispatch<SetStateAction<boolean>>;
  setShowPaywallModal: Dispatch<SetStateAction<boolean>>;
}>({
  setShowAddWorkspaceModal: () => {},
  setShowAddEditDomainModal: () => {},
  setShowLinkBuilder: () => {},
  setShowConversionOnboardingModal: () => {},
  setShowAddEditTagModal: () => {},
  setShowImportBitlyModal: () => {},
  setShowImportShortModal: () => {},
  setShowImportRebrandlyModal: () => {},
  setShowImportCsvModal: () => {},
  setShowPaywallModal: () => {},
});

export function ModalProvider({ children }: { children: ReactNode }) {
  return (
    <Suspense>
      <ModalProviderClient>{children}</ModalProviderClient>
    </Suspense>
  );
}

function ModalProviderClient({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const leadMagnet = searchParams.get("leadMagnet") === "1";
  const newLinkValues = useMemo(() => {
    const newLink = searchParams.get("newLink");
    if (newLink && getUrlFromString(newLink)) {
      return {
        url: getUrlFromString(newLink),
        domain: searchParams.get("newLinkDomain"),
      };
    } else {
      return null;
    }
  }, [searchParams]);

  const { AddWorkspaceModal, setShowAddWorkspaceModal } =
    useAddWorkspaceModal();
  const { AcceptInviteModal, setShowAcceptInviteModal } =
    useAcceptInviteModal();
  const { setShowAddEditDomainModal, AddEditDomainModal } =
    useAddEditDomainModal();
  const { setShowLinkBuilder, LinkBuilder } = useLinkBuilder(
    newLinkValues?.url
      ? {
          duplicateProps: {
            ...DEFAULT_LINK_PROPS,
            ...(newLinkValues.domain && { domain: newLinkValues.domain }),
            url: newLinkValues.url === "true" ? "" : newLinkValues.url,
            ...(leadMagnet && {
              leadMagnetEnabled: true,
              trackConversion: true,
            }),
          },
        }
      : {},
  );
  const { setShowConversionOnboardingModal, ConversionOnboardingModal } =
    useConversionOnboardingModal();
  const { setShowAddEditTagModal, AddEditTagModal } = useAddEditTagModal();
  const { setShowImportBitlyModal, ImportBitlyModal } = useImportBitlyModal();
  const { setShowImportShortModal, ImportShortModal } = useImportShortModal();
  const { setShowImportRebrandlyModal, ImportRebrandlyModal } =
    useImportRebrandlyModal();
  const { setShowImportCsvModal, ImportCsvModal } = useImportCsvModal();
  const { setShowPaywallModal, PaywallModal } = usePaywallModal();

  const [hashes, setHashes] = useCookies<SimpleLinkProps[]>(
    "hashes__pimms",
    [],
    {
      domain: !!process.env.NEXT_PUBLIC_VERCEL_URL ? ".pimms.io" : undefined,
    },
  );

  const { id: workspaceId, error } = useWorkspace();

  useEffect(() => {
    if (hashes.length > 0 && workspaceId) {
      toast.promise(
        fetch(`/api/links/sync?workspaceId=${workspaceId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(hashes),
        }).then(async (res) => {
          if (res.status === 200) {
            await mutatePrefix("/api/links");
            setHashes([]);
          }
        }),
        {
          loading: "Importing links...",
          success: "Links imported successfully!",
          error: "Something went wrong while importing links.",
        },
      );
    }
  }, [hashes, workspaceId, setHashes]);

  // handle invite and oauth modals
  useEffect(() => {
    if (error && (error.status === 409 || error.status === 410)) {
      setShowAcceptInviteModal(true);
    }
  }, [error, setShowAcceptInviteModal]);

  // handle ?newWorkspace and ?newLink query params
  useEffect(() => {
    if (searchParams.has("newWorkspace")) {
      setShowAddWorkspaceModal(true);
    }
    if (searchParams.has("newLink")) {
      setShowLinkBuilder(true);
    }
  }, [
    searchParams,
    setShowAddWorkspaceModal,
    setShowLinkBuilder,
  ]);

  const { data: session, update } = useSession();
  const { workspaces } = useWorkspaces();

  // if user has workspaces but no defaultWorkspace, refresh to get defaultWorkspace
  useEffect(() => {
    if (
      workspaces &&
      workspaces.length > 0 &&
      session?.user &&
      !session.user["defaultWorkspace"]
    ) {
      fetch("/api/user", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          defaultWorkspace: workspaces[0].slug,
        }),
      }).then(() => update());
    }
  }, [session, update, workspaces]);

  return (
    <ModalContext.Provider
      value={{
        setShowAddWorkspaceModal,
        setShowAddEditDomainModal,
        setShowLinkBuilder,
        setShowConversionOnboardingModal,
        setShowAddEditTagModal,
        setShowImportBitlyModal,
        setShowImportShortModal,
        setShowImportRebrandlyModal,
        setShowImportCsvModal,
          setShowPaywallModal,
      }}
    >
      <AddWorkspaceModal />
      <AcceptInviteModal />
      <AddEditDomainModal />
      <LinkBuilder />
      <ConversionOnboardingModal />
      <AddEditTagModal />
      <ImportBitlyModal />
      <ImportShortModal />
      <ImportRebrandlyModal />
      <ImportCsvModal />
      <PaywallModal />
      {children}
    </ModalContext.Provider>
  );
}
