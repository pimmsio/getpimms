import React, { useEffect, useMemo, useState } from "react";
import { LinkData } from "../types";
import useHighlightOverlay from "./hooks/useHighlightOverlay";

import Launcher from "./components/Launcher";
import OnboardingModal from "./components/OnboardingModal";
import Panel from "./components/Panel";
import useAuth from "./hooks/useAuth";
import useDomains from "./hooks/useDomains";
import useHighlightSync from "./hooks/useHighlightSync";
import useLoadingState from "./hooks/useLoadingState";
import usePanelApi from "./hooks/usePanelApi";
import usePanelState from "./hooks/usePanelState";
import useRootSelectorVisibility from "./hooks/useRootSelectorVisibility";
import useShortenActions from "./hooks/useShortenActions";
import useShortenedLinksCache from "./hooks/useShortenedLinksCache";
import useUserData from "./hooks/useUserData";

// Connection Error State Component
const ConnectionErrorState: React.FC<{ error?: string }> = ({ error }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 5000); // Auto-dismiss after 5 seconds

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: "20px",
        right: "20px",
        zIndex: 2147483647,
        background: "#fee2e2",
        border: "1px solid #fecaca",
        borderRadius: "8px",
        padding: "12px 16px",
        maxWidth: "320px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        fontSize: "14px",
        color: "#dc2626",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "8px",
        }}
      >
        <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
            clipRule="evenodd"
          />
        </svg>
        <strong>Connection Error</strong>
      </div>
      <div style={{ color: "#991b1b", marginBottom: "8px" }}>
        Cannot connect to PIMMS. Please check your connection and reload the
        page.
      </div>
      {error && (
        <div
          style={{
            fontSize: "12px",
            color: "#7f1d1d",
            fontFamily: "monospace",
          }}
        >
          {error}
        </div>
      )}
      <button
        onClick={() => window.location.reload()}
        style={{
          marginTop: "8px",
          background: "#dc2626",
          color: "white",
          border: "none",
          borderRadius: "4px",
          padding: "6px 12px",
          fontSize: "12px",
          cursor: "pointer",
          fontWeight: "500",
        }}
      >
        Reload Page
      </button>
    </div>
  );
};

const PanelApp: React.FC = () => {
  const overlay = useHighlightOverlay();

  const {
    links,
    panelState,
    hoveredLink,
    isVisible,
    isShortening,
    shortenedById,
    setLinks,
    setPanelState,
    setHoveredLink,
    setIsVisible,
    setIsShortening,
    setShortenedById,
    closedUntilReloadRef,
    detailLockedRef,
    resetPanelState,
    removeShortenedLink,
  } = usePanelState(overlay);

  const [hoveredLinkPosition, setHoveredLinkPosition] = useState<number>(-1);

  const authState = useAuth();
  const isLoggedIn = authState.status === "in";
  const { user, workspace } = useUserData();

  // If user is authenticated but has no email, something is wrong - force logout
  useEffect(() => {
    if (isLoggedIn && user && !user.email) {
      console.error(
        "[PIMMS] User authenticated but no email found - forcing logout",
      );
      // Trigger proper logout by sending auth error to background
      chrome.runtime
        .sendMessage({
          type: "PIMMS_AUTH_ERROR",
          source: "invalid_user_email",
        })
        .catch(() => {
          // Fallback if message fails
          console.error("[PIMMS] Failed to send logout message to background");
        });
    }
  }, [isLoggedIn, user]);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const hasRootSelectors = useRootSelectorVisibility();
  const { getCachedShortenedUrl } = useShortenedLinksCache();
  const { isLoading: isDomainsLoading } = useDomains();

  // Panel is only active when user is logged in AND root selectors are present
  // During connection errors, also show panel if we have user data from cache
  const isPanelActive = Boolean(
    (isLoggedIn || (authState.isConnectionError && user)) && hasRootSelectors,
  );

  // Sync auth status with main content script
  useEffect(() => {
    if (authState.status !== "unknown") {
      const loggedIn = authState.status === "in";
      if (window.pimmsEnsureInit) {
        window.pimmsEnsureInit(loggedIn);
      }
    }
  }, [authState.status]);

  // Loading state for smooth UX during link detection
  const { isLoading, hasInitialLoad } = useLoadingState(links, isPanelActive);

  // Note: We don't automatically initialize shortened links from cache anymore
  // This prevents multiple links with the same URL from all showing "Shortened"
  // The cache is still used when user clicks "Use saved short link" or tries to shorten

  // Removed debug logs to reduce console spam

  // Manage onboarding visibility based on auth status
  useEffect(() => {
    if (authState.status === "in") {
      setShowOnboarding(false);
    } else if (authState.status === "out" && !authState.isConnectionError) {
      // Only show onboarding for true auth failures, not connection errors
      setShowOnboarding(true);
    } else if (authState.isConnectionError) {
      // For connection errors, don't show onboarding
      setShowOnboarding(false);
    }
    // Do nothing for "unknown" - wait for definitive status
  }, [authState.status, authState.isConnectionError]);

  // Handle panel activation/deactivation
  useEffect(() => {
    if (!isPanelActive) {
      // Clean up everything when panel becomes inactive
      if (window.pimmsPanelApp?.clearAll) {
        window.pimmsPanelApp.clearAll();
      }
    } else {
      // When panel becomes active, show it if it's not already visible and not manually closed
      if (!isVisible && !closedUntilReloadRef.current) {
        setIsVisible(true);
      }
    }
  }, [isPanelActive, isVisible, setIsVisible, closedUntilReloadRef]);

  // This is now handled by useCookieAuth hook via pimms-detector-refresh event

  // Memoize shorten actions config to prevent re-renders
  const shortenActionsConfig = useMemo(
    () => ({
      hoveredLink,
      isShortening,
      setIsShortening,
      setShortenedById,
      links,
    }),
    [hoveredLink, isShortening, setIsShortening, setShortenedById, links],
  );

  const { handleShortenClick, handleCopyShortened } =
    useShortenActions(shortenActionsConfig);

  // Memoize panel API config to prevent re-renders
  const panelApiConfig = useMemo(
    () => ({
      isVisible: isPanelActive ? isVisible : false,
      panelState,
      setLinks: isPanelActive ? setLinks : () => {},
      setIsVisible: isPanelActive ? setIsVisible : () => {},
      setHoveredLink: isPanelActive ? setHoveredLink : () => {},
      setPanelState: isPanelActive ? setPanelState : () => {},
      overlay,
      closedUntilReloadRef,
      detailLockedRef,
      userEmail: user?.email!,
    }),
    [
      isPanelActive,
      isVisible,
      panelState,
      setLinks,
      setIsVisible,
      setHoveredLink,
      setPanelState,
      overlay,
      closedUntilReloadRef,
      detailLockedRef,
      user?.email,
    ],
  );

  // Only setup panel API when panel is active (logged in + root selectors present)
  usePanelApi(panelApiConfig);

  // Memoize handlers to prevent re-renders
  const handlers = useMemo(
    () => ({
      close: () => {
        setIsVisible(false);
        resetPanelState();
        closedUntilReloadRef.current = true;
        window.pimmsPanelClosedUntilReload = true;
      },
      backToList: () => {
        resetPanelState();
        setPanelState("links");
      },
      linkHover: (link: LinkData) =>
        link.element && overlay.showFor(link.element),
      linkUnhover: () => overlay.hide(),
      linkClick: (link: LinkData, position: number) => {
        resetPanelState();
        setHoveredLink(link);
        setHoveredLinkPosition(position);
        setPanelState("hovered");
        detailLockedRef.current = true;
        if (link.element) {
          link.element.scrollIntoView({ behavior: "smooth", block: "center" });
          overlay.applyHighlight(link.element);
        }
      },
    }),
    [
      setIsVisible,
      resetPanelState,
      closedUntilReloadRef,
      setPanelState,
      overlay,
      setHoveredLink,
      detailLockedRef,
      setHoveredLinkPosition,
    ],
  );

  // Sync highlights with panel activation state
  useHighlightSync(
    panelState,
    hoveredLink,
    detailLockedRef,
    overlay,
    isPanelActive,
  );

  // Wait for definitive auth status before showing anything
  if (authState.status === "unknown") {
    return null;
  }

  // If not logged in: show onboarding/launcher
  if (authState.status === "out") {
    return (
      <>
        {showOnboarding && (
          <OnboardingModal onClose={() => setShowOnboarding(false)} />
        )}
        {!showOnboarding && (
          <Launcher onClick={() => setShowOnboarding(true)} />
        )}
      </>
    );
  }

  // If logged in but panel not active (no root selectors): show nothing
  if (!isPanelActive) {
    return null;
  }

  return (
    <>
      <Panel
        links={links}
        hoveredLink={hoveredLink}
        panelState={panelState}
        onClose={handlers.close}
        onLinkClick={handlers.linkClick}
        onLinkHover={handlers.linkHover}
        onLinkUnhover={handlers.linkUnhover}
        onBackToList={handlers.backToList}
        onShortenClick={handleShortenClick}
        isShortening={isShortening}
        shortenedById={shortenedById}
        isLoading={isLoading}
        isDomainsLoading={isDomainsLoading}
        isPanelActive={isPanelActive}
        isVisible={isVisible}
        onCopyShortened={handleCopyShortened}
        user={user}
        workspace={workspace}
        hoveredLinkPosition={hoveredLinkPosition}
      />
      {authState.isConnectionError && (
        <ConnectionErrorState error={authState.error} />
      )}
    </>
  );
};

export default PanelApp;
