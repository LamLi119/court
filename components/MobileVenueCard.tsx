
import React from 'react';
import { Venue, Language } from '../types';

interface MobileVenueCardProps {
    venue: Venue;
    language: Language;
    t: (key: string) => string;
    darkMode: boolean;
    isSaved: boolean;
    onToggleSave: () => void;
    onViewDetails: () => void;
}

const MobileVenueCard: React.FC<MobileVenueCardProps> = ({ venue, language, t, darkMode, isSaved, onToggleSave, onViewDetails }) => {
    const handleWhatsApp = () => {
        const message = encodeURIComponent(
            language === 'en' 
                ? `Hi, I'm interested in booking ${venue.name}. Could you please let me know about availability?`
                : `你好，我想預訂${venue.name}，請問有時間嗎？`
        );
        window.open(`https://wa.me/${venue.whatsapp.replace(/[^0-9]/g, '')}?text=${message}`, '_blank');
    };

    return (
        <div className="p-5 pt-0">
            {/* Header: Name and Price positioned to avoid close button overlap */}
            <div className="mb-4 pr-14">
                <h2 className={`text-xl font-black leading-tight mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {venue.name}
                </h2>
                <div className="flex flex-col gap-1">
                    <div className={`text-[11px] font-bold ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        🚇 {venue.mtrStation}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xl font-black text-[#00e911]">
                            ${venue.startingPrice}
                        </span>
                        <span className="text-[10px] font-bold opacity-60 uppercase">
                            /{language === 'en' ? 'hr' : '小時'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Action Buttons: View Details is now ABOVE Book Now */}
            <div className="flex flex-col gap-3 mb-6">
                <button 
                    onClick={onViewDetails} 
                    className={`w-full px-4 py-3.5 border-2 rounded-2xl font-black text-sm shadow-sm transition-all active:scale-[0.98] ${darkMode ? 'bg-gray-800 border-gray-700 text-white active:bg-gray-700' : 'bg-white border-gray-100 text-gray-900 active:bg-gray-50'}`}
                >
                    {t('viewDetails')}
                </button>
                <button 
                    onClick={handleWhatsApp} 
                    className="w-full px-4 py-3.5 rounded-2xl text-white font-black text-sm shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2" 
                    style={{ background: '#00e911' }}
                >
                    <span>💬</span> {t('bookNow')}
                </button>
            </div>

            {/* Expanded Content */}
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="relative overflow-hidden rounded-2xl shadow-lg border dark:border-gray-800">
                    <img src={venue.images[0]} alt={venue.name} className="w-full h-48 object-cover" />
                    <button 
                        onClick={(e) => { e.stopPropagation(); onToggleSave(); }} 
                        className={`absolute top-3 right-3 p-2.5 rounded-full shadow-lg transition-all active:scale-90 ${isSaved ? 'bg-red-500 text-white' : 'bg-white/90 text-gray-500'}`}
                    >
                        {isSaved ? '❤️' : '🤍'}
                    </button>
                </div>

                <div className={`text-sm leading-relaxed px-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {venue.description || "Perfect venue for competitive or casual pickleball sessions. Fully equipped and conveniently located near the MTR."}
                </div>
                
                <div className={`p-4 rounded-xl border text-xs font-bold flex justify-between items-center ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-400' : 'bg-gray-50 border-gray-100 text-gray-500'}`}>
                    <span className="flex items-center gap-1">🚶 {venue.walkingDistance} {t('min')} {t('walk')}</span>
                    <span className="flex items-center gap-1">🏢 {t('ceilingHeight')}: {venue.ceilingHeight}m</span>
                </div>
            </div>
        </div>
    );
};

export default MobileVenueCard;
