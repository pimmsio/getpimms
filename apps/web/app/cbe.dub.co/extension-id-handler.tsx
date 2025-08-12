"use client";

import { useEffect } from "react";

/**
 * Client-side component that handles extension ID persistence across CBE pages
 * Should be included in the CBE layout to ensure extension ID is captured and stored
 */
export default function ExtensionIdHandler() {
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    const urlParams = new URLSearchParams(window.location.search);
    const extensionId = urlParams.get('extension_id');

    console.log('[CBE] Extension ID:', extensionId, urlParams);

    if (extensionId) {
      // Store extension ID in local storage for persistence across sessions
      localStorage.setItem('cbe_extension_id', extensionId);
      console.log('[CBE] Extension ID stored:', extensionId);
    }
  }, []);

  return null; // This component doesn't render anything
}

/**
 * Utility function to get the stored extension ID
 * Can be used by any CBE page that needs the extension ID
 */
export function getStoredExtensionId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('cbe_extension_id');
}