import { createApp } from 'vue';
import App from './App.vue';

// Load Google Maps API dynamically
const loadGoogleMapsAPI = () => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.error('VITE_GOOGLE_MAPS_API_KEY is not defined in environment variables');
    return;
  }

  // Check if script already exists
  if (document.querySelector(`script[src*="maps.googleapis.com"]`)) {
    return;
  }

  const script = document.createElement('script');
  script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
  script.async = true;
  script.defer = true;
  script.onerror = () => {
    console.error('Failed to load Google Maps API');
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

