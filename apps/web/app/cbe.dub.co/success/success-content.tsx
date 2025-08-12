"use client";

import { Logo } from "@dub/ui";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

// Types for extension communication
interface Message {
  type: string;
  [key: string]: any;
}

interface Response {
  success: boolean;
  error?: string;
}

// Extension communication function
const sendMessageToCbe = (
  extensionId: string | null | undefined,
  message: Message,
  responseCallback: (response: Response | undefined) => void
) => {
  if (!window.chrome?.runtime?.sendMessage) {
    responseCallback({ success: false, error: 'Cross-browser extension is not supported' });
    return;
  }

  console.log('[CBE] Message', message);

  window.chrome.runtime.sendMessage<Message, Response>(
    extensionId,
    message,
    responseCallback
  );
};

export default function CbeSuccessContent() {
  const { data: session, status } = useSession();
  const [communicationStatus, setCommunicationStatus] = useState<'pending' | 'success' | 'error' | 'no-extension'>('pending');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      // User not authenticated, redirect to login
      window.location.href = '/login';
      return;
    }

    // Try to communicate with extension
    const attemptExtensionCommunication = async () => {
      console.log('[CBE] Attempting extension communication');
      
      try {
        // Get extension auth token from API
        console.log('[CBE] Fetching extension auth token...');
        const response = await fetch('/api/extension/auth', {
          method: 'GET',
          credentials: 'include',
        });
        
        if (!response.ok) {
          throw new Error(`Failed to get auth token: ${response.status}`);
        }
        
        const authData = await response.json();
        console.log('[CBE] Received auth data:', authData);

        // Get extension ID from URL search params
        const extensionId = window.location.search.split('extensionId=')[1];
        
        // Send to extension
        sendMessageToCbe(
          process.env.NEXT_PUBLIC_CHROME_EXTENSION_ID || extensionId,
          {
            type: 'PIMMS_AUTH_SUCCESS',
            user: authData.user,
            sessionCookie: authData.sessionCookie,
            timestamp: Date.now(),
          },
          (response) => {
            console.log('[CBE] Extension communication response', response);
            if (response?.success) {
              setCommunicationStatus('success');
            } else {
              console.log('[CBE] Extension communication failed', response);
              setCommunicationStatus('error');
              setErrorMessage(response?.error || 'Unknown error occurred');
            }
          }
        );
      } catch (error) {
        console.error('[CBE] Failed to get auth token:', error);
        setCommunicationStatus('error');
        setErrorMessage('Failed to get authentication token');
      }
    };

    // Wait a bit for the page to fully load and extension to be ready
    const timer = setTimeout(attemptExtensionCommunication, 2000);
    return () => clearTimeout(timer);
  }, [session, status]);

  // Don't render anything during SSR or while loading
  if (typeof window === 'undefined' || status === 'loading') {
    return (
      <div className="mx-auto w-full max-w-md">
        <div className="flex flex-col items-center justify-center space-y-6">
          <Logo className="h-8" />
          <div className="w-full rounded-xl border border-gray-200 bg-white px-6 py-8 shadow-lg text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  const getStatusContent = () => {
    switch (communicationStatus) {
      case 'pending':
        return {
          icon: '⏳',
          title: 'Connecting to Extension...',
          description: 'Please wait while we establish connection with your browser extension.',
          action: null,
        };
      
      case 'success':
        return {
          icon: '✅',
          title: 'Success!',
          description: 'Your browser extension is now connected and ready to use.',
          action: (
            <button
              onClick={() => window.close()}
              className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Close this tab
            </button>
          ),
        };
      
      case 'error':
        return {
          icon: '❌',
          title: 'Connection Failed',
          description: `Failed to connect to your browser extension. ${errorMessage}`,
          action: (
            <div className="mt-4 space-y-2">
              <a
                href="https://chromewebstore.google.com/detail/pimms-link-shortener/your-extension-id"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full rounded-lg bg-blue-600 px-4 py-2 text-center text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Install Extension
              </a>
              <button
                onClick={() => setCommunicationStatus('pending')}
                className="w-full rounded-lg bg-gray-600 px-4 py-2 text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Retry Connection
              </button>
            </div>
          ),
        };
      
      case 'no-extension':
        return {
          icon: '🔌',
          title: 'Extension Not Found',
          description: 'Please install the PIMMS browser extension to continue.',
          action: (
            <div className="mt-4 space-y-2">
              <a
                href="https://chromewebstore.google.com/detail/pimms-link-shortener/your-extension-id"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full rounded-lg bg-blue-600 px-4 py-2 text-center text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Install Extension
              </a>
              <button
                onClick={() => setCommunicationStatus('pending')}
                className="w-full rounded-lg bg-gray-600 px-4 py-2 text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Retry Connection
              </button>
            </div>
          ),
        };
      
      default:
        return {
          icon: '❓',
          title: 'Unknown Status',
          description: 'Something unexpected happened.',
          action: null,
        };
    }
  };

  const content = getStatusContent();

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="flex flex-col items-center justify-center space-y-6">
        <Logo className="h-8" />
        <div className="w-full rounded-xl border border-gray-200 bg-white px-6 py-8 shadow-lg text-center">
          <div className="mb-4 text-4xl">{content.icon}</div>
          <h1 className="mb-2 text-2xl font-semibold text-gray-900">
            {content.title}
          </h1>
          <p className="mb-6 text-sm text-gray-600">
            {content.description}
          </p>
          {content.action}
        </div>
        
        {session && (
          <div className="w-full rounded-lg bg-gray-50 px-4 py-3 text-center">
            <p className="text-sm text-gray-600">
              Signed in as <strong>{session.user?.email}</strong>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
