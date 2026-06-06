export type CookieCategory = 'necessary' | 'analytics' | 'marketing' | 'preferences';

export interface CookiePreferences {
  necessary: boolean; // always true
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}

export const defaultPreferences: CookiePreferences = {
  necessary: true,
  analytics: false,
  marketing: false,
  preferences: false,
};

const COOKIE_CONSENT_KEY = 'ecobairro-cookie-consent';

export function getCookiePreferences(): CookiePreferences | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
  if (stored) {
    try {
      return JSON.parse(stored) as CookiePreferences;
    } catch {
      return null;
    }
  }
  return null;
}

export function saveCookiePreferences(preferences: CookiePreferences) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(preferences));
  updateGoogleConsentMode(preferences);
}

// Google Consent Mode v2 integration
declare global {
  interface Window {
    dataLayer: any[];
    gtag?: (...args: any[]) => void;
  }
}

export function initializeGoogleConsentMode() {
  if (typeof window === 'undefined') return;
  
  window.dataLayer = window.dataLayer || [];
  if (!window.gtag) {
    window.gtag = function () {
      window.dataLayer.push(arguments);
    };
  }
  
  // Default to denied
  window.gtag('consent', 'default', {
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    personalization_storage: 'denied',
    functionality_storage: 'granted',
    security_storage: 'granted',
  });

  const prefs = getCookiePreferences();
  if (prefs) {
    updateGoogleConsentMode(prefs);
  }
}

export function updateGoogleConsentMode(preferences: CookiePreferences) {
  if (typeof window === 'undefined' || !window.gtag) return;
  
  window.gtag('consent', 'update', {
    analytics_storage: preferences.analytics ? 'granted' : 'denied',
    ad_storage: preferences.marketing ? 'granted' : 'denied',
    ad_user_data: preferences.marketing ? 'granted' : 'denied',
    ad_personalization: preferences.marketing ? 'granted' : 'denied',
    personalization_storage: preferences.preferences ? 'granted' : 'denied',
  });
}
