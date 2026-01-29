import React from 'react';
import { Venue, Language } from '../../types.ts';
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
                ? `你好，我係經TheGround.io嘅介紹嚟book場！Hi! Here to book a court, found you via TheGround.io`
                : `你好，我係經TheGround.io嘅介紹嚟book場！Hi! Here to book a court, found you via TheGround.io`
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
                <h1 className="text-lg font-[900] truncate max-w-[200px] md:max-w-md">{venue.name}</h1>
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
                            <h2 className={`text-[32px] md:text-[40px] font-[900] tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>{venue.name}</h2>
                            <div className={`flex flex-wrap items-center gap-x-4 gap-y-2 text-[16px] font-[400] ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                <span>🚇 {venue.mtrStation} ({venue.mtrExit})</span>
                                <span>{venue.walkingDistance} {t('min')} {t('walk')}</span>
                                <span>{venue.ceilingHeight}m {t('ceilingHeight')}</span>
                            </div>
                            {venue.description && <div className={`text-[16px] font-[400] leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{venue.description}</div>}
                            <div className={`p-6 rounded-[16px] border ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-gray-50 border-gray-100 text-gray-700'}`}>
                                <h3 className="font-bold mb-2 opacity-60 text-xs uppercase tracking-wider">Location</h3>
                                <p className="text-[16px] mb-4">{venue.address}</p>
                                <button onClick={openGoogleMaps} className="px-4 py-2 rounded-[8px] bg-[#007a67] text-white font-bold">📍 Open in Google Maps</button>
                            </div>
                            <div className="space-y-4">
                                <h2 className={`text-[24px] font-[900] ${darkMode ? 'text-white' : 'text-gray-900'}`}>{t('pricing')}</h2>
                                {venue.pricing.type === 'text' ? (
                                    <div className={`p-6 rounded-[16px] border ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-gray-50 border-gray-100 text-gray-700'}`}>{venue.pricing.content}</div>
                                ) : (
                                    <div className="rounded-[16px] overflow-hidden border dark:border-gray-700"><img src={venue.pricing.imageUrl} className="w-full" /></div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="lg:col-span-1">
                        <div className={`sticky top-24 p-8 rounded-[16px] shadow-2xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                            <span className="text-[12px] uppercase tracking-widest font-bold opacity-50 block mb-1">Starting from</span>
                            <div className="flex items-baseline gap-1 mb-6">
                                <span className="text-[32px] font-[900] text-[#007a67]">${venue.startingPrice}</span>
                                <span className="text-[14px] opacity-60">/hr</span>
                            </div>
                            <button onClick={handleWhatsApp} className="w-full py-5 rounded-[8px] text-white font-[900] text-xl bg-[#007a67]">💬 {t('bookNow')}</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VenueDetail;