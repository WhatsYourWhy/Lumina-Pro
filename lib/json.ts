/**
 * Safe JSON parsing utility that can handle model outputs containing markdown code fences
 * or other surrounding text wrappers.
 */
export const parseCleanJson = <T>(text: string | null | undefined, fallback: T): T => {
  if (!text) return fallback;
  
  const trimmed = text.trim();
  if (!trimmed) return fallback;

  // 1. Direct standard parse
  try {
    return JSON.parse(trimmed) as T;
  } catch (err) {
    console.warn("Direct JSON parsing failed, attempting extraction", err);
  }

  // 2. Extract JSON from markdown code blocks (e.g. ```json ... ``` or ``` ... ```)
  const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch && codeBlockMatch[1]) {
    try {
      return JSON.parse(codeBlockMatch[1].trim()) as T;
    } catch (e2) {
      console.warn("Failed to parse JSON from markdown code block", e2);
    }
  }

  // 3. Extract JSON object/array boundaries via regex matching
  const regexMatch = trimmed.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (regexMatch && regexMatch[0]) {
    try {
      return JSON.parse(regexMatch[0].trim()) as T;
    } catch (e3) {
      console.warn("Failed to parse regex-extracted JSON", e3);
    }
  }

  // 4. Return fallback if all extraction methods failed
  return fallback;
};
