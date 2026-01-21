
import React from 'react';
import { Venue, Language } from '../types';
import CourtCard from './CourtCard';
import MapView from './MapView';

interface DesktopViewProps {
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
    onAddVenue: () => void;
    onEditVenue: (id: number, v: any) => void;
    onDeleteVenue: (id: number) => void;
}

const DesktopView: React.FC<DesktopViewProps> = (props) => {
    const { venues, selectedVenue, onSelectVenue, searchQuery, setSearchQuery, mtrFilter, setMtrFilter, distanceFilter, setDistanceFilter, language, t, darkMode, savedVenues, toggleSave, isAdmin, onAddVenue } = props;

    return (
        <div className="flex h-[calc(100vh-64px)] overflow-hidden">
            {/* Sidebar */}
            <div className={`w-[400px] xl:w-[450px] flex-shrink-0 border-r transition-colors flex flex-col ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
                <div className={`p-6 space-y-4 shadow-sm z-10 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50">🔍</span>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={t('search')}
                            className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#00e911] focus:outline-none transition-all ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                        />
                    </div>
                    <div className="flex gap-2">
                        <select
                            value={mtrFilter}
                            onChange={(e) => setMtrFilter(e.target.value)}
                            className={`flex-1 px-3 py-2 border rounded-xl text-sm font-bold appearance-none transition-all ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                        >
                            <option value="">{t('allStations')}</option>
                            <option value="Kwun Tong">Kwun Tong</option>
                            <option value="Causeway Bay">Causeway Bay</option>
                            <option value="Tsim Sha Tsui">Tsim Sha Tsui</option>
                        </select>
                        <select
                            value={distanceFilter}
                            onChange={(e) => setDistanceFilter(e.target.value)}
                            className={`flex-1 px-3 py-2 border rounded-xl text-sm font-bold appearance-none transition-all ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                        >
                            <option value="">{t('allDistances')}</option>
                            <option value="5">{t('lessThan5')}</option>
                            <option value="10">{t('lessThan10')}</option>
                        </select>
                    </div>
                    {isAdmin && (
                        <button
                            onClick={onAddVenue}
                            className="w-full px-4 py-3 bg-[#00e911] text-white rounded-xl font-bold shadow-lg hover:brightness-110 active:scale-[0.98] transition-all"
                        >
                            ✨ {t('addVenue')}
                        </button>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    {venues.length === 0 ? (
                        <div className="text-center py-20 space-y-4">
                            <div className="text-6xl opacity-20">🏸</div>
                            <p className={`text-lg font-bold ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t('noVenues')}</p>
                        </div>
                    ) : (
                        venues.map(venue => (
                            <CourtCard
                                key={venue.id}
                                venue={venue}
                                onClick={() => onSelectVenue(venue)}
                                language={language}
                                t={t}
                                darkMode={darkMode}
                                isSaved={savedVenues.includes(venue.id)}
                                onToggleSave={() => toggleSave(venue.id)}
                            />
                        ))
                    )}
                </div>
            </div>

            {/* Map Area */}
            <div className="flex-1 relative">
                <MapView
                    venues={venues}
                    selectedVenue={selectedVenue}
                    onSelectVenue={onSelectVenue}
                    language={language}
                    darkMode={darkMode}
                />
            </div>
        </div>
    );
};

export default DesktopView;
