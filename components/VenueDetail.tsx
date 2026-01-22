
import React from 'react';
import { Venue, Language } from '../types.ts';
import ImageCarousel from './ImageCarousel.tsx';

interface VenueDetailProps {
    venue: Venue;
    onBack: () => void;
    language: Language;
    t: (key: string) => string;
    darkMode: boolean;
    savedVenues: number[];
    toggleSave: (id: number) => void;
    isAdmin: boolean;
    onEdit: () => void;
}

const VenueDetail: React.FC<VenueDetailProps> = ({ venue, onBack, language, t, darkMode, savedVenues, toggleSave, isAdmin, onEdit }) => {
    const isSaved = savedVenues.includes(venue.id);

    const handleWhatsApp = () => {
        const message = encodeURIComponent(
            language === 'en' 
                ? `Hi, I'm interested in booking ${venue.name}.`
                : `你好，我想預訂${venue.name}。`
        );
        window.open(`https://wa.me/${venue.whatsapp.replace(/[^0-9]/g, '')}?text=${message}`, '_blank');
    };

    const openGoogleMaps = () => {
        const encodedAddress = encodeURIComponent(venue.address);
        window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
    };

    return (
        <div className={`min-h-screen pb-20 animate-in fade-in duration-300 ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
            <div className={`sticky top-0 z-[70] px-4 py-3 flex items-center justify-between border-b backdrop-blur-md ${darkMode ? 'bg-gray-900/90 border-gray-800 text-white' : 'bg-white/90 border-gray-100 text-gray-900'}`}>
                <button onClick={onBack} className="p-2 rounded-full">←</button>
                <h1 className="text-lg font-black truncate max-w-[200px] md:max-w-md">{venue.name}</h1>
                <div className="flex gap-2">
                    {isAdmin && (
                        <button onClick={onEdit} className="p-2 bg-blue-500 text-white rounded-full">✏️</button>
                    )}
                    <button onClick={() => toggleSave(venue.id)} className={`p-2 rounded-full ${isSaved ? 'bg-red-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
                        {isSaved ? '❤️' : '🤍'}
                    </button>
                </div>
            </div>

            <div className="container mx-auto px-4 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <ImageCarousel images={venue.images} />
                        <div className="space-y-6">
                            <h2 className={`text-4xl font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>{venue.name}</h2>
                            <div className={`flex flex-wrap items-center gap-x-4 gap-y-2 text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                <span>🚇 {venue.mtrStation} ({venue.mtrExit})</span>
                                <span>{venue.walkingDistance} {t('min')} {t('walk')}</span>
                                <span>{venue.ceilingHeight}m {t('ceilingHeight')}</span>
                            </div>
                            {venue.description && <div className={`text-lg leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{venue.description}</div>}
                            <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-gray-50 border-gray-100 text-gray-700'}`}>
                                <h3 className="font-bold mb-2 opacity-60 text-sm uppercase tracking-wider">Location</h3>
                                <p className="text-lg mb-4">{venue.address}</p>
                                <button onClick={openGoogleMaps} className="px-4 py-2 rounded-xl bg-[#00e911] text-white font-bold">📍 Open in Google Maps</button>
                            </div>
                            <div className="space-y-4">
                                <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{t('pricing')}</h2>
                                {venue.pricing.type === 'text' ? (
                                    <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-gray-50 border-gray-100 text-gray-700'}`}>{venue.pricing.content}</div>
                                ) : (
                                    <div className="rounded-2xl overflow-hidden border dark:border-gray-700"><img src={venue.pricing.imageUrl} className="w-full" /></div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="lg:col-span-1">
                        {/* Fix: use React template literal for dynamic classes instead of Vue-style :class */}
                        <div className={`sticky top-24 p-8 rounded-3xl shadow-2xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                            <span className="text-sm uppercase tracking-widest font-bold opacity-50 block mb-1">Starting from</span>
                            <div className="flex items-baseline gap-1 mb-6">
                                <span className="text-4xl font-black text-[#00e911]">${venue.startingPrice}</span>
                                <span className="text-lg opacity-60">/hr</span>
                            </div>
                            <button onClick={handleWhatsApp} className="w-full py-5 rounded-2xl text-white font-black text-xl bg-[#00e911]">💬 {t('bookNow')}</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VenueDetail;
