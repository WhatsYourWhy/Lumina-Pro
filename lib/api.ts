import { GoogleGenAI } from "@google/genai";

// Retrieves the key from sessionStorage if running in the client browser.
// Falls back to the proxy key when no custom key is set.
export const getClientApiKey = (): string => {
  if (typeof window !== 'undefined') {
    const sessionKey = sessionStorage.getItem('SHANK_GEMINI_API_KEY');
    if (sessionKey) {
      return sessionKey;
    }
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

export const createAiClient = () => new GoogleGenAI({
  apiKey: getClientApiKey(),
  httpOptions: getHttpOptions()
});

export let ai = createAiClient();

// Saves the key to sessionStorage for the active session and re-instantiates the SDK.
export const setClientApiKey = (newKey: string) => {
  if (typeof window !== 'undefined') {
    const trimmed = newKey.trim();
    if (trimmed) {
      sessionStorage.setItem('SHANK_GEMINI_API_KEY', trimmed);
    } else {
      sessionStorage.removeItem('SHANK_GEMINI_API_KEY');
    }
  }
  ai = createAiClient();
};

