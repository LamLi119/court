/**
 * Injects the Maps JavaScript API (with places). Idempotent.
 * Dispatches `google-maps-ready` / `google-maps-auth-error`.
 * Late callers still get an event if Maps already loaded (or already failed).
 */

type MapsLoadState = 'idle' | 'loading' | 'ready' | 'error';

declare global {
  interface Window {
    __onGoogleMapsLoaded?: () => void;
    gm_authFailure?: () => void;
    __courtsMapsLoadState?: MapsLoadState;
  }
}

function getState(): MapsLoadState {
  if (typeof window === 'undefined') return 'idle';
  return window.__courtsMapsLoadState || 'idle';
}

function setState(state: MapsLoadState): void {
  if (typeof window === 'undefined') return;
  window.__courtsMapsLoadState = state;
}

function mapsApiPresent(): boolean {
  return typeof google !== 'undefined' && !!(google as any)?.maps;
}

function placesApiPresent(): boolean {
  return mapsApiPresent() && !!(google as any)?.maps?.places;
}

function dispatchReady(): void {
  setState('ready');
  window.dispatchEvent(new Event('google-maps-ready'));
}

function dispatchError(): void {
  setState('error');
  window.dispatchEvent(new Event('google-maps-auth-error'));
}

/**
 * Ensure Maps + Places are available. Safe to call from multiple components.
 */
export function loadGoogleMapsScript(): void {
  if (typeof window === 'undefined') return;

  const logError = (...args: unknown[]) => {
    if (import.meta.env.DEV) console.error(...args);
  };

  // Already usable (e.g. explore map loaded first, then admin form opens).
  if (placesApiPresent() || (getState() === 'ready' && mapsApiPresent())) {
    dispatchReady();
    return;
  }

  if (getState() === 'error') {
    dispatchError();
    return;
  }

  const apiKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined)?.trim();
  if (!apiKey) {
    logError('VITE_GOOGLE_MAPS_API_KEY is not defined in .env');
    dispatchError();
    return;
  }

  // Google calls this global when the key is invalid / restricted.
  window.gm_authFailure = () => {
    logError('Google Maps authentication failure (check API key restrictions / billing)');
    dispatchError();
  };

  window.__onGoogleMapsLoaded = () => {
    if (placesApiPresent() || mapsApiPresent()) {
      dispatchReady();
    } else {
      logError('Google Maps loaded but places library missing');
      dispatchError();
    }
  };

  const existing = document.querySelector('script[src*="maps.googleapis.com"]');
  if (existing) {
    // Script tag present: either still loading (callback will fire) or loaded without our state.
    if (placesApiPresent() || mapsApiPresent()) {
      dispatchReady();
    } else if (getState() !== 'loading') {
      setState('loading');
    }
    return;
  }

  setState('loading');
  const script = document.createElement('script');
  script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places&callback=__onGoogleMapsLoaded`;
  script.async = true;
  script.defer = true;
  script.onerror = () => {
    logError('Failed to load Google Maps API');
    dispatchError();
  };
  document.head.appendChild(script);
}

/** True when Maps JS + Places are ready for Autocomplete / Geocoder. */
export function isGoogleMapsReady(): boolean {
  return placesApiPresent() || getState() === 'ready';
}
