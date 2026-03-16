import { GoogleGenAI } from "@google/genai";

// We use a proxy to keep the true API key secure on the backend.
// The SDK requires an API key string, so we provide a placeholder.
export const ai = new GoogleGenAI({
  apiKey: "proxy-secured-key",
  httpOptions: { 
    baseUrl: typeof window !== 'undefined' ? `${window.location.origin}/api` : 'http://localhost:3001'
  }
});
