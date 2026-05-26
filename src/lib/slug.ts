/**
 * Generates a 100% ASCII-safe, URL-friendly slug from a news article title.
 *
 * Strategy:
 *  1. Keep all ASCII letters (a-z) and digits (0-9) — these are URL-safe.
 *  2. Keep common English/Hindi transliteration characters already in ASCII.
 *  3. Replace ALL spaces, punctuation, and non-ASCII chars with hyphens.
 *  4. Collapse multiple hyphens, trim edges.
 *
 * For pure Hindi titles, the English portions (CRS, Report, BJP, etc.) are
 * preserved. Hindi-only words produce short/empty slugs — in that case we
 * fall back to a timestamp-based unique identifier suffix.
 *
 * This guarantees URLs are always 100% ASCII and work across all browsers,
 * CDNs, and SEO crawlers without encoding issues.
 */
export function generateSlug(title: string): string {
  return title
    .trim()
    .toLowerCase()
    // Replace every character that is NOT ASCII alphanumeric with a hyphen
    .replace(/[^a-z0-9]+/g, '-')
    // Collapse multiple hyphens into one
    .replace(/-{2,}/g, '-')
    // Trim leading/trailing hyphens
    .replace(/^-+|-+$/g, '');
}

/**
 * Generates a unique, guaranteed-ASCII slug.
 * Always appends a short unique suffix so that:
 *  - Two articles with identical English words get different slugs.
 *  - Pure Hindi titles (no ASCII content) still get a meaningful unique slug.
 *
 * Format: `{ascii-words-from-title}-{6-char-unique-suffix}`
 * Example: "अमेरिका की CRS Report में 42 Fighter Jets" → "crs-report-42-fighter-jets-k7m3p1"
 * Example: "पूरी हिंदी खबर" → "n-xq2p9r" (no ascii words, fallback prefix "n")
 */
export async function generateUniqueSlug(
  title: string,
  exists: (slug: string) => Promise<boolean>
): Promise<string> {
  const base = generateSlug(title);

  // Use "n" prefix if the title had no ASCII content (pure Hindi/non-latin)
  const safeBase = base.length >= 2 ? base : 'n';

  // Always include a 6-char random suffix for guaranteed uniqueness
  for (let i = 0; i < 30; i++) {
    const suffix = Math.random().toString(36).slice(2, 8);
    const candidate = `${safeBase}-${suffix}`;
    if (!(await exists(candidate))) {
      return candidate;
    }
  }

  // Final fallback: use timestamp
  return `${safeBase}-${Date.now()}`;
}
