export const COOKIE_CONSENT_KEY = 'dnz52:cookieConsent';
export const COOKIE_ACCEPTED_EVENT = 'dnz52:cookie-accepted';

export type CookieConsentValue = 'accepted' | 'declined' | null;

export function getCookieConsent(): CookieConsentValue {
  try {
    const v = localStorage.getItem(COOKIE_CONSENT_KEY);
    return v === 'accepted' || v === 'declined' ? v : null;
  } catch {
    return null;
  }
}

export function setCookieConsent(v: 'accepted' | 'declined') {
  try {
    localStorage.setItem(COOKIE_CONSENT_KEY, v);
  } catch {
    /* ignore */
  }
  if (v === 'accepted') window.dispatchEvent(new Event(COOKIE_ACCEPTED_EVENT));
}
