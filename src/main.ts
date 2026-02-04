import { createApp } from 'vue';
import App from './App.vue';

// Load Google Maps API dynamically (callback fires when ready so map can init)
const loadGoogleMapsAPI = () => {
  const apiKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string)?.trim();
  if (!apiKey) {
    console.error('VITE_GOOGLE_MAPS_API_KEY is not defined in .env (use VITE_GOOGLE_MAPS_API_KEY=your_key with no spaces)');
    window.dispatchEvent(new Event('google-maps-auth-error'));
    return;
  }

  if (document.querySelector(`script[src*="maps.googleapis.com"]`)) {
    return;
  }

  (window as any).__onGoogleMapsLoaded = () => {
    window.dispatchEvent(new Event('google-maps-ready'));
  };

  const script = document.createElement('script');
  script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places&callback=__onGoogleMapsLoaded`;
  script.async = true;
  script.defer = true;
  script.onerror = () => {
    console.error('Failed to load Google Maps API (check key, enable Maps JavaScript API + Places API, and referrer restrictions)');
    window.dispatchEvent(new Event('google-maps-auth-error'));
  };
  document.head.appendChild(script);
};

// Load Google Maps API before mounting app
loadGoogleMapsAPI();

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

createApp(App).mount(rootElement);

