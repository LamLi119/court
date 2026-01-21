
import React, { useState } from 'react';
import { Venue, Language } from '../types';

interface CourtCardProps {
    venue: Venue;
    onClick: () => void;
    language: Language;
    t: (key: string) => string;
    darkMode: boolean;
    isSaved: boolean;
    onToggleSave: () => void;
    isMobile?: boolean;
}

const CourtCard: React.FC<CourtCardProps> = ({ venue, onClick, language, t, darkMode, isSaved, onToggleSave, isMobile }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const toggleExpand = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsExpanded(!isExpanded);
    };

    if (isMobile) {
        return (
            <div className={`border rounded-2xl overflow-hidden mb-4 transition-all duration-300 shadow-sm ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                <div className="flex items-center p-4 cursor-pointer gap-4" onClick={onClick}>
                    <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                        <img src={venue.images[0] || 'https://via.placeholder.com/150'} className="w-full h-full object-cover" alt="" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className={`font-black text-sm md:text-base leading-tight truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>{venue.name}</h3>
                        <p className={`text-[10px] uppercase opacity-50 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>🚇 {venue.mtrStation}</p>
                    </div>
                    <button onClick={toggleExpand} className={`p-2 rounded-full transition-transform ${isExpanded ? 'rotate-180' : ''} ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>▼</button>
                </div>

                {isExpanded && (
                    <div className="px-4 pb-4 animate-in slide-in-from-top duration-200">
                        <div className={`flex items-center gap-3 text-[11px] mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            <span>🚶 {venue.walkingDistance} {t('min')}</span>
                            <span>⬆️ {venue.ceilingHeight}m</span>
                            <span className="ml-auto font-black text-[#00e911] text-sm">${venue.startingPrice}/hr</span>
                        </div>
                        <div className="flex gap-2">
                             <button onClick={(e) => { e.stopPropagation(); onToggleSave(); }} className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${isSaved ? 'bg-red-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>
                                {isSaved ? '❤️ Saved' : '🤍 Save'}
                            </button>
                            <button onClick={onClick} className="flex-[2] py-2.5 bg-[#00e911] text-white rounded-xl font-black text-xs shadow-md">{t('viewDetails')}</button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div onClick={onClick} className={`group cursor-pointer rounded-2xl overflow-hidden border transition-all duration-300 hover:shadow-2xl ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
            <div className="relative h-44 overflow-hidden">
                <img src={venue.images[0]} alt={venue.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute top-2 right-2">
                    <button onClick={(e) => { e.stopPropagation(); onToggleSave(); }} className={`p-2.5 rounded-full shadow-lg transition-all active:scale-90 ${isSaved ? 'bg-red-500 text-white' : 'bg-white/90 text-gray-500'}`}>
                        {isSaved ? '❤️' : '🤍'}
                    </button>
                </div>
            </div>
            
            <div className="p-4">
                <h3 className={`font-black text-lg leading-tight truncate mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{venue.name}</h3>
                <div className={`flex items-center gap-3 text-xs mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    <span>🚇 {venue.mtrStation}</span>
                    <span>🚶 {venue.walkingDistance} {t('min')}</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-xl font-black text-[#00e911]">${venue.startingPrice}</span>
                    <button className="px-4 py-2 bg-[#00e911] text-white rounded-xl font-bold text-sm shadow-md group-hover:brightness-110">{t('viewDetails')}</button>
                </div>
            </div>
        </div>
    );
};

export default CourtCard;
