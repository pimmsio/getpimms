// Chrome Extension Types for Web App
declare global {
  interface Window {
    chrome?: {
      runtime?: {
        sendMessage?: <M = any, R = any>(
          extensionId?: string | null,
          message?: M,
          responseCallback?: (response?: R) => void
        ) => void;
      };
    };
  }
}

export {};
