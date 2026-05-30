import { GoogleGenAI } from "@google/genai";

let runtimeApiKey: string | null = null;

// Retrieves an in-memory key if running in the client browser.
// Falls back to the proxy key when no runtime key is set.
export const getClientApiKey = (): string => {
  if (typeof window !== 'undefined' && runtimeApiKey) {
    return runtimeApiKey;
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

// Saves the key only for the active runtime and re-instantiates the SDK.
export const setClientApiKey = (newKey: string) => {
  runtimeApiKey = newKey.trim() ? newKey.trim() : null;
  ai = createAiClient();
};

