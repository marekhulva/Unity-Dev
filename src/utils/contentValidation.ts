/**
 * Content Validation Utility
 *
 * Filters out corrupted/base64/binary content that was incorrectly saved
 * by older versions of the app.
 */

/**
 * Validates text content to filter out base64/binary/corrupted data
 * Returns true if content is safe to display
 */
export function isValidContent(content: string | null | undefined): boolean {
  if (!content || typeof content !== 'string') return false;
  if (content.trim() === '' || content.trim() === '.') return false;

  // Detect binary/control characters
  const binaryPattern = /[\x00-\x08\x0B-\x0C\x0E-\x1F]/;
  if (binaryPattern.test(content)) {
    if (__DEV__) console.warn('🚫 [VALIDATION] Filtered binary content');
    return false;
  }

  // MORE AGGRESSIVE: Filter out suspiciously long content
  // If content is over 200 chars and has very little whitespace/punctuation, it's likely corrupted
  if (content.length > 200) {
    // Count alphanumeric vs total characters
    const alphanumericCount = (content.match(/[A-Za-z0-9+/=]/g) || []).length;
    const ratio = alphanumericCount / content.length;

    // If >85% is alphanumeric (base64-like), filter it
    if (ratio > 0.85) {
      if (__DEV__) console.warn('🚫 [VALIDATION] Filtered base64-like content (length:', content.length, 'ratio:', ratio.toFixed(2), ')');
      return false;
    }
  }

  // EVEN MORE AGGRESSIVE: Filter out very long strings with minimal spaces
  // If content is over 100 chars and has less than 5% spaces, it's likely corrupted
  if (content.length > 100) {
    const spaceCount = (content.match(/\s/g) || []).length;
    const spaceRatio = spaceCount / content.length;

    // If <5% is whitespace, filter it
    if (spaceRatio < 0.05) {
      if (__DEV__) console.warn('🚫 [VALIDATION] Filtered low-whitespace content (length:', content.length, 'spaces:', spaceCount, ')');
      return false;
    }
  }

  // Filter extremely long content (likely corrupted data)
  if (content.length > 1000) {
    if (__DEV__) console.warn('🚫 [VALIDATION] Filtered extremely long content:', content.length, 'chars');
    return false;
  }

  return true;
}

/**
 * Safely gets validated content, returns empty string if invalid
 */
export function safeContent(content: string | null | undefined): string {
  return isValidContent(content) ? content! : '';
}
