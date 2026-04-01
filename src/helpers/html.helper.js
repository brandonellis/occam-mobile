/**
 * Check if an HTML string is effectively empty (no visible text content).
 * Strips tags, decodes common HTML entities, and trims whitespace.
 */
export const isHtmlEmpty = (html) => {
  if (!html) return true;
  const text = html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#?\w+;/g, '')
    .trim();
  return !text;
};
