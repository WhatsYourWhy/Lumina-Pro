import { GoogleGenAI } from "@google/genai";
import { supabase } from "./supabase";

let runtimeApiKey: string | null = null;
let currentSessionToken: string | null = null;

// Track auth state changes to dynamically append Bearer token to proxy calls
if (typeof window !== 'undefined') {
  // Retrieve initial session token
  supabase.auth.getSession().then(({ data: { session } }) => {
    currentSessionToken = session?.access_token ?? null;
    updateAiClient();
  }).catch((err) => {
    console.warn("Failed to fetch initial Supabase session", err);
  });

  supabase.auth.onAuthStateChange((_event, session) => {
    currentSessionToken = session?.access_token ?? null;
    updateAiClient();
  });
}

// Retrieves an in-memory key if running in the client browser.
// Falls back to the proxy key when no custom key is set.
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
  
  const headers: Record<string, string> = {};
  if (currentSessionToken) {
    headers['Authorization'] = `Bearer ${currentSessionToken}`;
  }

  // Otherwise, route through the local Express proxy backend.
  return {
    baseUrl: typeof window !== 'undefined' ? `${window.location.origin}/api` : 'http://localhost:3001',
    headers
  };
};

export const createAiClient = () => new GoogleGenAI({
  apiKey: getClientApiKey(),
  httpOptions: getHttpOptions()
});

export let ai = createAiClient();

export const updateAiClient = () => {
  ai = createAiClient();
};

// Saves the key only for the active runtime and re-instantiates the SDK.
export const setClientApiKey = (newKey: string) => {
  runtimeApiKey = newKey.trim() ? newKey.trim() : null;
  updateAiClient();
};

