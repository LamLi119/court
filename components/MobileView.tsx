
import React, { useState, useEffect, useRef } from 'react';
import { Venue, Language } from '../types';
import MapView from './MapView';
import MobileVenueCard from './MobileVenueCard';
import VenueDetail from './VenueDetail';

interface MobileViewProps {
    venues: Venue[];
    selectedVenue: Venue | null;
    onSelectVenue: (v: Venue | null) => void;
    searchQuery: string;
    setSearchQuery: (s: string) => void;
    mtrFilter: string;
    setMtrFilter: (s: string) => void;
    distanceFilter: string;
    setDistanceFilter: (s: string) => void;
    language: Language;
    t: (key: string) => string;
    darkMode: boolean;
    savedVenues: number[];
    toggleSave: (id: number) => void;
    isAdmin: boolean;
    onEditVenue: (id: number, v: any) => void;
}

type SheetState = 'hidden' | 'mini' | 'expanded';

const MobileView: React.FC<MobileViewProps> = (props) => {
    const { venues, selectedVenue, onSelectVenue, searchQuery, setSearchQuery, mtrFilter, setMtrFilter, distanceFilter, setDistanceFilter, language, t, darkMode, savedVenues, toggleSave, isAdmin, onEditVenue } = props;
    
    const [sheetState, setSheetState] = useState<SheetState>('hidden');
    const [showDetailPage, setShowDetailPage] = useState(false);
    
    // Gesture tracking
    const touchStartY = useRef<number | null>(null);
    const lastDeltaY = useRef<number>(0);

    useEffect(() => {
        if (selectedVenue) {
            setSheetState('mini');
        } else {
            setSheetState('hidden');
        }
    }, [selectedVenue]);

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (touchStartY.current === null) return;
        const currentY = e.touches[0].clientY;
        lastDeltaY.current = currentY - touchStartY.current;
    };

    const handleTouchEnd = () => {
        if (touchStartY.current === null) return;
        
        const delta = lastDeltaY.current;
        const threshold = 50; 

        if (delta < -threshold) {
            // Swiped Up
            setSheetState('expanded');
        } else if (delta > threshold) {
            // Swiped Down
            if (sheetState === 'expanded') {
                setSheetState('mini');
            } else if (sheetState === 'mini') {
                onSelectVenue(null);
            }
        }

        touchStartY.current = null;
        lastDeltaY.current = 0;
    };

    const toggleSheet = () => {
        setSheetState(prev => prev === 'mini' ? 'expanded' : 'mini');
    };

    if (showDetailPage && selectedVenue) {
        return (
            <VenueDetail 
                venue={selectedVenue} 
                onBack={() => setShowDetailPage(false)} 
                language={language} 
                t={t} 
                darkMode={darkMode} 
                savedVenues={savedVenues} 
                toggleSave={toggleSave} 
                isAdmin={isAdmin}
                onEdit={() => onEditVenue(selectedVenue.id, selectedVenue)}
            />
        );
    }

    // Increased mini state visibility to show both buttons (translate-y-[55%])
    const getTranslation = () => {
        switch(sheetState) {
            case 'expanded': return 'translate-y-[12%]';
            case 'mini': return 'translate-y-[55%]';
            case 'hidden': return 'translate-y-full';
            default: return 'translate-y-full';
        }
    };

    return (
        <div className="relative h-[calc(100vh-64px)] overflow-hidden">
            {/* Search/Filter UI - Fade out when expanded */}
            <div className={`absolute top-4 left-4 right-4 z-20 space-y-2 pointer-events-none transition-all duration-300 ${sheetState === 'expanded' ? 'opacity-0 -translate-y-4' : 'opacity-100 translate-y-0'}`}>
                <div className="pointer-events-auto">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t('search')}
                        className={`w-full px-6 py-4 border rounded-[20px] shadow-2xl focus:ring-2 focus:ring-[#00e911] focus:outline-none transition-all ${darkMode ? 'bg-gray-800/90 border-gray-700 text-white backdrop-blur' : 'bg-white/90 border-gray-100 text-gray-900 backdrop-blur'}`}
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 pointer-events-auto no-scrollbar">
                    <select
                        value={mtrFilter}
                        onChange={(e) => setMtrFilter(e.target.value)}
                        className={`px-4 py-2 border rounded-full text-xs font-black shadow-md appearance-none transition-all whitespace-nowrap ${darkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white border-gray-100'}`}
                    >
                        <option value="">{t('allStations')}</option>
                        <option value="Kwun Tong">Kwun Tong</option>
                        <option value="Causeway Bay">Causeway Bay</option>
                        <option value="Tsim Sha Tsui">Tsim Sha Tsui</option>
                    </select>
                    <select
                        value={distanceFilter}
                        onChange={(e) => setDistanceFilter(e.target.value)}
                        className={`px-4 py-2 border rounded-full text-xs font-black shadow-md appearance-none transition-all whitespace-nowrap ${darkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white border-gray-100'}`}
                    >
                        <option value="">{t('allDistances')}</option>
                        <option value="5">{t('lessThan5')}</option>
                        <option value="10">{t('lessThan10')}</option>
                    </select>
                </div>
            </div>

            <MapView
                venues={venues}
                selectedVenue={selectedVenue}
                onSelectVenue={onSelectVenue}
                language={language}
                darkMode={darkMode}
            />

            {/* Tap-to-dismiss backdrop */}
            {sheetState === 'expanded' && (
                <div 
                    className="fixed inset-0 bg-black/40 z-30 transition-opacity duration-500 animate-in fade-in"
                    onClick={() => setSheetState('mini')}
                />
            )}

            {/* The Draggable Bottom Sheet */}
            <div 
                className={`fixed inset-x-0 bottom-0 z-40 transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1) transform ${getTranslation()}`}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {selectedVenue && (
                    <div className={`rounded-t-[36px] shadow-[0_-12px_40px_rgba(0,0,0,0.15)] h-[90vh] flex flex-col ${darkMode ? 'bg-gray-900 text-white border-t border-gray-800' : 'bg-white text-gray-900 border-t border-gray-100'}`}>
                        {/* Interactive Handle Bar Area */}
                        <div 
                            className="w-full pt-3 pb-1 flex flex-col items-center cursor-pointer shrink-0"
                            onClick={toggleSheet}
                        >
                            <div className={`w-10 h-1 rounded-full mb-3 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                        </div>

                        {/* Always-visible close button - adjusted position */}
                        <button
                            onClick={(e) => { e.stopPropagation(); onSelectVenue(null); }}
                            className={`absolute top-3 right-4 w-11 h-11 rounded-full flex items-center justify-center text-3xl font-light z-50 transition-all active:scale-90 ${darkMode ? 'bg-gray-800 text-gray-500' : 'bg-gray-100 text-gray-400'}`}
                        >
                            ×
                        </button>
                        
                        {/* Scrollable Venue Data */}
                        <div className={`flex-1 overflow-y-auto ${sheetState === 'mini' ? 'overflow-hidden' : 'custom-scrollbar'}`}>
                            <MobileVenueCard
                                venue={selectedVenue}
                                language={language}
                                t={t}
                                darkMode={darkMode}
                                isSaved={savedVenues.includes(selectedVenue.id)}
                                onToggleSave={() => toggleSave(selectedVenue.id)}
                                onViewDetails={() => setShowDetailPage(true)}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MobileView;
