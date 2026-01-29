import React, { useEffect, useRef, useState } from 'react';
import { Venue, Language } from '../../types.ts';

declare var google: any;

interface MapViewProps {
    venues: Venue[];
    selectedVenue: Venue | null;
    onSelectVenue: (v: Venue) => void;
    language: Language;
    darkMode: boolean;
}

const PIN_COLOR = "#007a67";
const PIN_STROKE = "#ffffff";

const MAP_STYLES = [
    { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
    { featureType: "transit", elementType: "labels.icon", stylers: [{ visibility: "on" }] },
    { featureType: "transit.station", elementType: "labels.text", stylers: [{ visibility: "on" }] }
];

const DARK_MODE_STYLE = [
    ...MAP_STYLES,
    { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] }
];

const MapView: React.FC<MapViewProps> = ({ venues, selectedVenue, onSelectVenue, language, darkMode }) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const googleMap = useRef<any>(null);
    const markers = useRef<{ [key: number]: any }>({});
    const [mapError, setMapError] = useState<string | null>(null);

    useEffect(() => {
        const handleAuthError = () => {
            setMapError("API Restricted: Please enable 'Maps JavaScript API' and 'Places API' for this key in Google Cloud Console.");
        };

        window.addEventListener('google-maps-auth-error', handleAuthError);

        if (typeof google === 'undefined' || !google.maps) {
            setMapError("Google Maps failed to load. Please check your internet connection or API Key.");
            return () => window.removeEventListener('google-maps-auth-error', handleAuthError);
        }

        if (!mapRef.current || googleMap.current) return;

        try {
            googleMap.current = new google.maps.Map(mapRef.current, {
                center: { lat: 22.3193, lng: 114.1694 },
                zoom: 12,
                disableDefaultUI: false,
                zoomControl: true,
                mapTypeControl: false,
                streetViewControl: false,
                fullscreenControl: false,
                styles: darkMode ? DARK_MODE_STYLE : MAP_STYLES,
            });
        } catch (err) {
            console.error("Error initializing map:", err);
            setMapError("Error initializing Google Maps. This usually means the API Key is restricted.");
        }

        return () => window.removeEventListener('google-maps-auth-error', handleAuthError);
    }, []);

    useEffect(() => {
        if (googleMap.current) {
            googleMap.current.setOptions({
                styles: darkMode ? DARK_MODE_STYLE : MAP_STYLES,
            });
        }
    }, [darkMode]);

    useEffect(() => {
        if (!googleMap.current || typeof google === 'undefined') return;

        Object.keys(markers.current).forEach((id) => {
            const venueId = parseInt(id);
            if (!venues.find(v => v.id === venueId)) {
                markers.current[venueId].setMap(null);
                delete markers.current[venueId];
            }
        });

        const racquetPaths = `
            <path d="m44.5 86.219c-0.5 0-1-0.1875-1.375-0.5625l-2.75-2.75c-0.75-0.75-0.75-1.9688 0-2.7188l1.7188-1.7188c0.21875-0.21875 0.5-0.28125 0.78125-0.1875l7.125-7.125 4.9062 4.9062-7.1875 7.1875c0 0.21875 0 0.5625-0.21875 0.78125l-1.625 1.625c-0.375 0.375-0.875 0.5625-1.375 0.5625zm-1.8438-7.1875-1.7188 1.7188c-0.4375 0.4375-0.4375 1.1562 0 1.5938l2.75 2.75c0.4375 0.4375 1.1875 0.4375 1.625 0l1.625-1.625v-0.28125l-0.0625-0.21875 6.9375-6.9375-3.8125-3.8125-7.0625 7.0625-0.28125-0.28125z"/>
            <path d="m57.094 74.594c-0.375 0-0.75-0.15625-1.0312-0.4375l-4.1562-4.1562c-0.5625-0.5625-0.5625-1.5 0-2.0938l0.75-0.75s2.625-2.75 0.75-7.9062c-2.125-3.9062-1.4062-8.875 1.7812-12.094l12.875-12.875c4-4 10.5-3.9688 14.469 0l9.2188 9.2188c1.9375 1.9375 3 4.5 3 7.25s-1.0625 5.3125-3 7.25l-12.875 12.875c-3.1875 3.1875-8.1562 3.9062-12.094 1.7812-5.1562-1.875-7.8438 0.71875-7.875 0.75l-0.75 0.75c-0.28125 0.28125-0.65625 0.4375-1.0312 0.4375zm18.188-42.469c-2.4062 0-4.8438 0.90625-6.6875 2.75l-12.875 12.875c-2.9375 2.9375-3.625 7.5625-1.625 11.219 2.0625 5.6875-0.78125 8.625-0.90625 8.75l-0.75 0.75s-0.21875 0.3125-0.21875 0.5 0.0625 0.34375 0.21875 0.5l4.1562 4.1562c0.25 0.28125 0.71875 0.28125 0.96875 0l0.75-0.75s3.0625-2.9375 8.6562-0.9375h0.03125l0.09375 0.0625c3.6562 1.9688 8.25 1.3125 11.219-1.625l12.875-12.875c3.6875-3.6875 3.6875-9.6875 0-13.375l-9.2188-9.2188c-1.8438-1.8438-4.25-2.75-6.6875-2.75z"/>
            <path d="m55.5 86.219c-0.5 0-1-0.1875-1.375-0.5625l-1.625-1.625c-0.21875-0.21875-0.25-0.5625-0.21875-0.78125l-7.1875-7.1875 4.9062-4.9062 7.125 7.125c0.25-0.0625 0.5625 0 0.78125 0.1875l1.7188 1.7188c0.75 0.75 0.75 1.9688 0 2.7188l-2.75 2.75c-0.375 0.375-0.875 0.5625-1.375 0.5625zm-2.4062-2.7188 1.625 1.625c0.4375 0.4375 1.1875 0.4375 1.625 0l2.75-2.75c0.4375-0.4375 0.4375-1.1562 0-1.625l-1.7188-1.7188-0.28125 0.28125-7.0625-7.0625-3.8125 3.8125 6.9375 6.9375-0.0625 0.21875v0.28125z"/>
            <path d="m42.906 74.594c-0.375 0-0.75-0.15625-1.0312-0.4375l-0.75-0.75s-2.75-2.5938-7.875-0.75c-3.9688 2.125-8.9062 1.4062-12.094-1.7812l-12.875-12.875c-1.9375-1.9375-3-4.5-3-7.25s1.0625-5.3125 3-7.25l9.2188-9.2188c4-3.9688 10.469-4 14.469 0l12.875 12.875c3.1875 3.1875 3.9062 8.1875 1.75 12.125-1.8438 5.0938 0.65625 7.7188 0.78125 7.8438l0.75 0.75c0.5625 0.5625 0.5625 1.5 0 2.0938l-4.1562 4.1562c-0.28125 0.28125-0.65625 0.4375-1.0312 0.4375zm-6.0625-3.375c3.0938 0 4.7188 1.5625 4.8125 1.6562l0.75 0.75c0.25 0.25 0.71875 0.28125 0.96875 0l4.1562-4.1562s0.21875-0.3125 0.21875-0.5-0.0625-0.375-0.21875-0.5l-0.75-0.75s-2.9688-3.0938-0.9375-8.7188c2.0312-3.7188 1.3438-8.3125-1.5938-11.25l-12.875-12.875c-3.7188-3.7188-9.6875-3.7188-13.375 0l-9.2188 9.2188c-3.7188 3.7188-3.7188 9.6875 0 13.375l12.875 12.875c2.9375 2.9375 7.5625 3.625 11.219 1.625l0.125-0.0625c1.4375-0.53125 2.7188-0.71875 3.8125-0.71875z"/>
        `;

        const compositeSvg = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" 
                      fill="${PIN_COLOR}" 
                      stroke="${PIN_STROKE}" 
                      stroke-width="1" />
                <g transform="translate(8.4, 5.4) scale(0.065)" fill="${PIN_STROKE}" stroke="${PIN_STROKE}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round">
                    ${racquetPaths}
                </g>
            </svg>`)}`;

        venues.forEach(venue => {
            if (!markers.current[venue.id]) {
                const marker = new google.maps.Marker({
                    position: venue.coordinates,
                    map: googleMap.current,
                    title: venue.name,
                    icon: {
                        url: compositeSvg,
                        scaledSize: new google.maps.Size(48, 48),
                        anchor: new google.maps.Point(24, 48)
                    },
                    animation: google.maps.Animation.DROP
                });

                marker.addListener('click', () => onSelectVenue(venue));
                markers.current[venue.id] = marker;
            }
        });
    }, [venues, onSelectVenue]);

    useEffect(() => {
        if (selectedVenue && googleMap.current && typeof google !== 'undefined') {
            googleMap.current.panTo(selectedVenue.coordinates);
            googleMap.current.setZoom(15);
            Object.values(markers.current).forEach(m => m.setAnimation(null));
            const selectedMarker = markers.current[selectedVenue.id];
            if (selectedMarker) {
                selectedMarker.setAnimation(google.maps.Animation.BOUNCE);
                setTimeout(() => selectedMarker.setAnimation(null), 1500);
            }
        }
    }, [selectedVenue]);

    if (mapError) {
        return (
            <div className={`w-full h-full flex flex-col items-center justify-center p-8 text-center transition-colors ${darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                <div className="text-6xl mb-6 opacity-30">🗺️</div>
                <h3 className="text-xl font-black mb-2">{language === 'en' ? 'Map Unavailable' : '地圖目前無法顯示'}</h3>
                <p className="text-sm max-w-xs mx-auto leading-relaxed">
                    {mapError}
                </p>
                <div className="mt-8 flex flex-col gap-2">
                    <button 
                        onClick={() => window.location.reload()}
                        className={`px-6 py-3 rounded-lg font-black text-xs transition-all active:scale-95 ${darkMode ? 'bg-gray-700 text-white' : 'bg-white shadow-md text-gray-900'}`}
                    >
                        {language === 'en' ? 'RETRY LOADING' : '重新整理'}
                    </button>
                    <a 
                        href="https://developers.google.com/maps/documentation/javascript/error-messages#api-target-blocked-map-error"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-bold underline opacity-50 hover:opacity-100"
                    >
                        {language === 'en' ? 'Learn more about this error' : '了解更多關於此錯誤'}
                    </a>
                </div>
            </div>
        );
    }

    return <div ref={mapRef} className="w-full h-full bg-gray-200" />;
};

export default MapView;