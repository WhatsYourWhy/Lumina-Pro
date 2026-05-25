import { GoogleGenAI } from "@google/genai";

// Keeps a user-provided API key only in memory for the current runtime.
// Falls back to the proxy key when no custom key is set.
let clientApiKeyOverride: string | null = null;

export const getClientApiKey = (): string => {
  if (clientApiKeyOverride) {
    return clientApiKeyOverride;
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

// Saves the key in memory for the active runtime and re-instantiates the SDK.
export const setClientApiKey = (newKey: string) => {
  const trimmed = newKey.trim();
  clientApiKeyOverride = trimmed || null;
  ai = createAiClient();
};

