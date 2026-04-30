/**
 * Extract and parse JSON content from model text responses.
 * Handles plain JSON, markdown code fences, and extra wrapper text.
 */
export function parseJSONFromText(rawText) {
  if (typeof rawText !== 'string') {
    throw new Error('Model response must be a string');
  }

  const trimmed = rawText.trim();
  if (!trimmed) {
    throw new Error('Model response is empty');
  }

  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const candidate = fencedMatch ? fencedMatch[1].trim() : trimmed;

  // Fast path: direct JSON payload
  try {
    return JSON.parse(candidate);
  } catch {
    // Continue to object/array extraction fallback.
  }

  const extracted = extractTopLevelJSON(candidate);
  if (!extracted) {
    throw new Error('No valid JSON payload found in model response');
  }

  return JSON.parse(extracted);
}

function extractTopLevelJSON(text) {
  const starts = ['{', '['];
  for (const startChar of starts) {
    const startIndex = text.indexOf(startChar);
    if (startIndex === -1) continue;

    const endChar = startChar === '{' ? '}' : ']';
    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let i = startIndex; i < text.length; i++) {
      const ch = text[i];

      if (escaped) {
        escaped = false;
        continue;
      }

      if (ch === '\\') {
        escaped = true;
        continue;
      }

      if (ch === '"') {
        inString = !inString;
        continue;
      }

      if (inString) continue;

      if (ch === startChar) depth += 1;
      if (ch === endChar) depth -= 1;

      if (depth === 0) {
        return text.slice(startIndex, i + 1);
      }
    }
  }

  return null;
}
