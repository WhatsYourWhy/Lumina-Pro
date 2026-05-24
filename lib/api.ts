import { GoogleGenAI } from "@google/genai";

// Retrieves the key from localStorage if running in the client browser.
// Defaults to the proxy key if no key is entered.
export const getClientApiKey = (): string => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('SHANK_GEMINI_API_KEY') || 'proxy-secured-key';
  }
  return 'proxy-secured-key';
};

const getHttpOptions = () => {
  const key = getClientApiKey();
  // If the user entered their own API key, communicate directly with Google's API endpoints.
  if (key !== 'proxy-secured-key') {
    return undefined;
  }
  // Otherwise, route through the local Express proxy backend.
  return { 
    baseUrl: typeof window !== 'undefined' ? `${window.location.origin}/api` : 'http://localhost:3001'
  };
};

export const ai = new GoogleGenAI({
  apiKey: getClientApiKey(),
  httpOptions: getHttpOptions()
});

// Saves the new key to local storage and reloads the window to re-instantiate the SDK safely.
export const setClientApiKey = (newKey: string) => {
  if (typeof window !== 'undefined') {
    if (newKey.trim()) {
      localStorage.setItem('SHANK_GEMINI_API_KEY', newKey.trim());
    } else {
      localStorage.removeItem('SHANK_GEMINI_API_KEY');
    }
    window.location.reload();
  }
};
