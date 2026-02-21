/**
 * Converts any string to a URL-safe slug.
 * Removes accents, replaces spaces/special chars with hyphens, collapses duplicates.
 * Single shared function used by both job slugs and org slugs.
 *
 * @param input - The string to convert
 * @param maxLength - Maximum slug length (default 60)
 * @returns URL-safe slug or empty string
 */
export function toSlug(input: string, maxLength: number = 60): string {
  if (!input) return "";

  return input
    .toLowerCase()
    .trim()
    // Remove accents/diacritics
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    // Replace spaces and special chars with hyphens
    .replace(/[^a-z0-9]+/g, "-")
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, "")
    // Collapse multiple consecutive hyphens
    .replace(/-+/g, "-")
    // Limit length
    .substring(0, maxLength);
}

/**
 * Generates a URL-safe slug from a job title ONLY.
 *
 * IMPORTANT: Public job URLs must NOT include company/client slugs
 * to prevent leaking client relationships in URLs.
 */
export function generateJobSlug(title: string): string {
  return toSlug(title, 60);
}

/**
 * Generates a URL-safe slug from an organization name.
 * Max length 50 to match DB constraint.
 */
export function generateOrgSlug(name: string): string {
  return toSlug(name, 50);
}

/**
 * Generates the canonical public job URL.
 * Format: /:tenantSlug/public/vaga/<jobSlug>--<jobId>
 *
 * The slug is based on title ONLY to prevent leaking client relationships.
 */
export function generatePublicJobUrl(
  tenantSlug: string,
  jobId: string,
  title: string
): string {
  const slug = generateJobSlug(title);
  return `/${tenantSlug}/public/vaga/${slug}--${jobId}`;
}

/**
 * Parses the jobId from a public job URL segment.
 * Expected format: vaga/<slug>--<jobId> or the segment <slug>--<jobId>
 * Returns null if parsing fails.
 */
export function parsePublicJobId(segment: string): string | null {
  // Remove "vaga-" or "vaga/" prefix if present (for backward compatibility)
  let cleanSegment = segment;
  if (cleanSegment.startsWith("vaga-")) {
    cleanSegment = cleanSegment.substring(5);
  } else if (cleanSegment.startsWith("vaga/")) {
    cleanSegment = cleanSegment.substring(5);
  }

  // Find the "--" delimiter (last occurrence to handle slugs with dashes)
  const delimiterIndex = cleanSegment.lastIndexOf("--");
  if (delimiterIndex === -1) {
    return null;
  }

  const jobId = cleanSegment.substring(delimiterIndex + 2);

  // Validate UUID format
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(jobId)) {
    return null;
  }

  return jobId;
}
