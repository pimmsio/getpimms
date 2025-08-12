import { useEffect, useRef, useState } from "react";
import { AuthStatus } from "../../lib/storage";

export interface AuthState {
  status: AuthStatus;
  error?: string;
  isConnectionError?: boolean;
}

export default function useAuth(): AuthState {
  const [authState, setAuthState] = useState<AuthState>({ status: "unknown" });
  const intervalRef = useRef<number | null>(null);
  
  const checkAuth = async () => {
    try {
      const requestId = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
      
      const authResult = await new Promise<{isLoggedIn: boolean, error?: string, isConnectionError?: boolean, hadStorageData?: boolean}>((resolve) => {
        const timeout = setTimeout(() => {
          cleanup();
          resolve({ isLoggedIn: false, error: "Request timeout", isConnectionError: true });
        }, 5000); // 5 second timeout

        const onMsg = (msg: any, sender: any, sendResponse: any) => {
          if (msg?.type === 'CHECK_AUTH_RESULT' && msg.requestId === requestId) {
            cleanup();
            resolve({ 
              isLoggedIn: !!msg.ok, 
              error: msg.error,
              isConnectionError: msg.isConnectionError,
              hadStorageData: msg.hadStorageData
            });
            // Send response to prevent port closed error
            if (sendResponse) sendResponse({ received: true });
            return true;
          }
        };

        const cleanup = () => {
          clearTimeout(timeout);
          try { chrome.runtime.onMessage.removeListener(onMsg as any); } catch {}
        };
        
        try {
          chrome.runtime.onMessage.addListener(onMsg as any);
          chrome.runtime.sendMessage({ type: 'CHECK_AUTH', requestId });
        } catch (error) {
          cleanup();
          resolve({ isLoggedIn: false, error: String(error), isConnectionError: true });
        }
      });

      if (authResult.isConnectionError) {
        // Connection error
        console.log('[AUTH] Connection error:', authResult);
        if (authResult.hadStorageData) {
          // We had storage data, so assume user is logged in
          setAuthState({ 
            status: "in",
            error: authResult.error,
            isConnectionError: true 
          });
        } else {
          // No storage data, preserve previous state but add error flag  
          setAuthState(prevState => ({ 
            ...prevState, 
            error: authResult.error,
            isConnectionError: true 
          }));
        }
      } else {
        // Normal auth check result - clear any previous connection errors
        const newStatus: AuthStatus = authResult.isLoggedIn ? "in" : "out";
        console.log('[AUTH] Normal auth result:', { newStatus, authResult });
        setAuthState({ 
          status: newStatus, 
          error: undefined, 
          isConnectionError: false 
        });
      }
    } catch (error) {
      setAuthState({ 
        status: "unknown", 
        error: String(error), 
        isConnectionError: true 
      });
    }
  };

  useEffect(() => {
    // Initial check
    checkAuth();
    
    // Periodic validation every 2 minutes (reduced frequency)
    intervalRef.current = window.setInterval(checkAuth, 120000);
    
    // Listen for auth status changes from background script
      const onAuthStatusChanged = (message: any) => {
    if (message.type === 'PIMMS_AUTH_STATUS_CHANGED') {
      if (message.status === 'authenticated') {
        setAuthState({ status: "in", error: undefined, isConnectionError: false });
      } else if (message.status === 'unauthenticated') {
        setAuthState({ status: "out", error: undefined, isConnectionError: false });
      }
      // Still run checkAuth as a backup, but don't rely on it for immediate updates
      checkAuth();
    }
  };
    
    chrome.runtime.onMessage.addListener(onAuthStatusChanged);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      try {
        chrome.runtime.onMessage.removeListener(onAuthStatusChanged);
      } catch {}
    };
  }, []);

      return authState;
}