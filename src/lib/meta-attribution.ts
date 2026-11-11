const META_ATTRIBUTION_KEYS = new Set([
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'fbclid',
  'landing_page',
  'captured_at',
]);

export function sanitizeMetaAttribution(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const cleaned: Record<string, string> = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    if (!META_ATTRIBUTION_KEYS.has(key)) continue;
    const text = String(raw ?? '').trim();
    if (!text) continue;
    cleaned[key] = text.slice(0, key === 'fbclid' ? 512 : 180);
  }
  return Object.keys(cleaned).length ? cleaned : null;
}
