/**
 * Converts errors thrown by the Gemini SDK, the Express proxy, or the network
 * into a short message a consultant can act on.
 */
export const describeAiError = (err: unknown): string => {
  const anyErr = err as { status?: number; code?: number; message?: string } | null;
  const rawMessage = typeof anyErr?.message === 'string' ? anyErr.message : String(err ?? '');

  let status: number | undefined = anyErr?.status ?? anyErr?.code;
  let detail = rawMessage;

  // The SDK often wraps Google's JSON error body inside message.
  const jsonStart = rawMessage.indexOf('{');
  if (jsonStart >= 0) {
    try {
      const parsed = JSON.parse(rawMessage.slice(jsonStart));
      const inner = parsed?.error ?? parsed;
      if (typeof inner?.code === 'number') status = status ?? inner.code;
      if (typeof inner?.message === 'string') detail = inner.message;
    } catch {
      // Not JSON, keep the raw message.
    }
  }

  const lower = `${rawMessage} ${detail}`.toLowerCase();

  if (status === 401 || lower.includes('unauthorized') || lower.includes('missing authorization')) {
    return 'Not authorized for the AI proxy. Sign in with your account, or add a personal Gemini API key in Settings.';
  }
  if (status === 403 || lower.includes('permission_denied') || lower.includes('api key not valid')) {
    return 'The Gemini API key was rejected. Check GEMINI_API_KEY on the server or the key entered in Settings.';
  }
  if (status === 429 || lower.includes('too many requests') || lower.includes('resource_exhausted') || lower.includes('quota')) {
    return 'Rate limit or quota reached. Wait a minute and try again.';
  }
  if (status === 404 || (lower.includes('model') && lower.includes('not found'))) {
    return 'The configured AI model is not available. Update the model names in config.ts.';
  }
  if (status === 503 && lower.includes('missing gemini_api_key')) {
    return 'The proxy server has no GEMINI_API_KEY configured. Add it to .env.local and restart.';
  }
  if (
    status === 502 || status === 503 || status === 504 ||
    lower.includes('failed to fetch') || lower.includes('fetch failed') ||
    lower.includes('networkerror') || lower.includes('econnrefused') || lower.includes('load failed')
  ) {
    return 'Cannot reach the AI service. Confirm the proxy server is running (npm run dev) and you are online.';
  }
  if (lower.includes('safety') || lower.includes('blocked')) {
    return 'The model declined this request. Rephrase the prompt and try again.';
  }

  const trimmed = detail.trim();
  if (!trimmed) return 'The AI request failed. Please try again.';
  return trimmed.length > 180 ? `${trimmed.slice(0, 177)}...` : trimmed;
};
