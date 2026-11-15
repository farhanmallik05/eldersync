/**
 * ElderSync Input Sanitization Utility
 *
 * Provides defense-in-depth sanitization against Stored XSS, HTML Injection,
 * and malicious payload vectors in user-submitted strings.
 */

/**
 * Escapes HTML control characters to prevent cross-site scripting (XSS).
 *
 * @param str - The raw user input string
 * @returns Escaped, sanitized string safe for rendering or storage
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Strips dangerous HTML tags, javascript pseudo-protocols, and inline event handlers,
 * trims excess whitespace, and enforces maximum string bounds.
 *
 * @param input - The raw input to sanitize
 * @param maxLength - Optional maximum string length (default: 2000)
 * @returns Sanitized and bounded string
 */
export function sanitizeString(input: string, maxLength: number = 2000): string {
  if (typeof input !== 'string') {
    return '';
  }

  // 1. Remove control characters (except newline and carriage return)
  let cleaned = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // 2. Strip script, iframe, object, and embed tags
  cleaned = cleaned.replace(/<\s*(script|iframe|object|embed|style|meta|link)[^>]*>.*?<\s*\/\s*\1\s*>/gis, '');
  cleaned = cleaned.replace(/<\s*(script|iframe|object|embed|style|meta|link)[^>]*>/gis, '');

  // 3. Strip javascript: and data: pseudo-protocols
  cleaned = cleaned.replace(/(javascript|data|vbscript):/gi, '');

  // 4. Strip inline event handlers (e.g., onload=, onerror=, onclick=)
  cleaned = cleaned.replace(/on[a-z]+\s*=\s*(['"]).*?\1/gis, '');
  cleaned = cleaned.replace(/on[a-z]+\s*=[^\s>]+/gis, '');

  // 5. Trim leading and trailing whitespace
  cleaned = cleaned.trim();

  // 6. Enforce maximum string boundary
  if (cleaned.length > maxLength) {
    cleaned = cleaned.substring(0, maxLength);
  }

  return cleaned;
}

/**
 * Recursively sanitizes all string properties within an object.
 *
 * @param obj - Target object containing potentially untrusted user input
 * @returns Deeply sanitized clone of the input object
 */
export function sanitizeObject<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return sanitizeString(obj) as unknown as T;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item)) as unknown as T;
  }

  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = sanitizeObject(value);
    }
    return result as T;
  }

  return obj;
}
