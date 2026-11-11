'use client';

type MetaEventName =
  | 'PageView'
  | 'ViewContent'
  | 'Lead'
  | 'InitiateCheckout'
  | 'Purchase'
  | 'Contact';

type MetaEventParams = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    fbq?: ((command: string, eventName: string, params?: MetaEventParams) => void) & {
      callMethod?: (...args: unknown[]) => void;
      queue?: unknown[];
      loaded?: boolean;
      version?: string;
      push?: unknown;
    };
    _fbq?: Window['fbq'];
  }
}

const TRACKING_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid'] as const;
const STORAGE_KEY = 'credittrust_meta_attribution';
const CONTACT_SELECTOR = [
  'a[href^="mailto:"]',
  'a[href^="tel:"]',
  'a[href*="wa.me"]',
  'a[href*="whatsapp"]',
  'a[href*="api.whatsapp.com"]',
  'a[href*="/contact"]',
  'button[data-meta-contact]',
  'a[data-meta-contact]',
].join(',');

export function getCreditTrustMetaPixelId() {
  const value = process.env.NEXT_PUBLIC_META_PIXEL_ID_CREDITTRUST?.trim();
  return value && value !== 'enter-your-value-here' ? value : '';
}

export function isMetaPixelEnabled() {
  return Boolean(getCreditTrustMetaPixelId());
}

function readAttribution(): MetaEventParams {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as MetaEventParams;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function persistMetaAttribution() {
  if (typeof window === 'undefined') return {};
  const url = new URL(window.location.href);
  const current: MetaEventParams = {};
  TRACKING_PARAMS.forEach((key) => {
    const value = url.searchParams.get(key);
    if (value) current[key] = value;
  });

  if (!Object.keys(current).length) return readAttribution();

  const next = { ...readAttribution(), ...current, landing_page: url.pathname, captured_at: new Date().toISOString() };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Attribution persistence is best-effort and must not affect page speed.
  }
  return next;
}

export function getMetaAttribution() {
  return readAttribution();
}

export function trackMetaEvent(eventName: MetaEventName, params: MetaEventParams = {}) {
  if (typeof window === 'undefined' || !window.fbq) return;
  window.fbq('track', eventName, {
    ...readAttribution(),
    ...params,
  });
}

export function bindMetaContactTracking() {
  if (typeof window === 'undefined') return () => undefined;

  const onClick = (event: MouseEvent) => {
    const target = event.target instanceof Element ? event.target.closest(CONTACT_SELECTOR) : null;
    if (!target) return;
    const href = target instanceof HTMLAnchorElement ? target.href : '';
    const label = target.textContent?.trim().slice(0, 80) || 'contact_cta';
    trackMetaEvent('Contact', {
      contact_target: href || label,
      content_name: label,
      page_path: window.location.pathname,
    });
  };

  document.addEventListener('click', onClick, { capture: true, passive: true });
  return () => document.removeEventListener('click', onClick, { capture: true });
}
