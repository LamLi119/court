/**
 * Convert venue name to URL-safe slug: lowercase, spaces to hyphens, strip non-alphanumeric.
 * Used for semantic URLs: /venues/the-grind-court-kwun-tong
 */
export function slugify(text: string): string {
  if (!text || typeof text !== 'string') return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}-]/gu, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
