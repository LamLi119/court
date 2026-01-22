import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Venue, Language, AppTab } from './types.ts';
import { translate } from './utils/translations.ts';
import { db } from './db.ts';
import Header from './components/Header.tsx';
import AdminLogin from './components/AdminLogin.tsx';
import DesktopView from './components/DesktopView.tsx';
import MobileView from './components/MobileView.tsx';
import MobileNav from './components/MobileNav.tsx';
import VenueDetail from './components/VenueDetail.tsx';
import VenueForm from './components/VenueForm.tsx';

function App() {
    const [language, setLanguage] = useState<Language>('en');
    const [currentTab, setCurrentTab] = useState<AppTab>('explore');
    const [isAdmin, setIsAdmin] = useState(false);
    const [adminPassword, setAdminPassword] = useState('');
    const [showAdminLogin, setShowAdminLogin] = useState(false);
    const [showVenueForm, setShowVenueForm] = useState(false);
    const [editingVenue, setEditingVenue] = useState<Venue | null>(null);
    const [venueToDelete, setVenueToDelete] = useState<Venue | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    
    const [venues, setVenues] = useState<Venue[]>([]);

    const [savedVenues, setSavedVenues] = useState<number[]>(() => {
        const saved = localStorage.getItem('pickleball_saved_ids');
        return saved ? JSON.parse(saved) : [];
    });

    const [savedDetails, setSavedDetails] = useState<Venue[]>(() => {
        const details = localStorage.getItem('pickleball_saved_details');
        return details ? JSON.parse(details) : [];
    });

    const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [mtrFilter, setMtrFilter] = useState('');
    const [distanceFilter, setDistanceFilter] = useState('');
    const [darkMode, setDarkMode] = useState(() => localStorage.getItem('pickleball_darkmode') === 'true');
    const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 1024 : false);

    useEffect(() => {
        const loadData = async () => {
            try {
                setIsLoading(true);
                const data = await db.getVenues();
                if (data && data.length > 0) {
                    setVenues(data);
                } else {
                    const local = localStorage.getItem('pickleball_venues');
                    if (local) setVenues(JSON.parse(local));
                }
            } catch (err) {
                console.warn('Could not connect to DB, using local data', err);
                const local = localStorage.getItem('pickleball_venues');
                if (local) setVenues(JSON.parse(local));
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    const availableStations = useMemo(() => {
        const stations = venues
            .map(v => v.mtrStation)
            .filter((station): station is string => !!station);
        return Array.from(new Set(stations)).sort();
    }, [venues]);

    useEffect(() => {
        localStorage.setItem('pickleball_saved_ids', JSON.stringify(savedVenues));
        localStorage.setItem('pickleball_saved_details', JSON.stringify(savedDetails));
    }, [savedVenues, savedDetails]);

    useEffect(() => localStorage.setItem('pickleball_venues', JSON.stringify(venues)), [venues]);
    
    useEffect(() => {
        localStorage.setItem('pickleball_darkmode', darkMode.toString());
        if (darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [darkMode]);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const t = useCallback((key: string) => translate(language, key), [language]);

    const handleAdminLogin = useCallback(() => {
        if (adminPassword === 'admin') {
            setIsAdmin(true);
            setShowAdminLogin(false);
            setAdminPassword('');
            setCurrentTab('admin');
        } else {
            alert('Incorrect password (Hint: admin)');
        }
    }, [adminPassword]);

    const filteredVenues = useMemo(() => {
        const source = currentTab === 'saved' ? savedDetails : venues;
        return source.filter(venue => {
            const query = searchQuery.toLowerCase();
            const nameMatch = venue.name.toLowerCase().includes(query) ||
                venue.mtrStation.toLowerCase().includes(query) ||
                venue.address.toLowerCase().includes(query);
            const mtrMatch = !mtrFilter || venue.mtrStation.toLowerCase().includes(mtrFilter.toLowerCase());
            const distanceMatch = !distanceFilter || venue.walkingDistance <= parseInt(distanceFilter);
            return nameMatch && mtrMatch && distanceMatch;
        });
    }, [venues, searchQuery, mtrFilter, distanceFilter, currentTab, savedDetails]);

    const toggleSaveVenue = useCallback((venueId: number) => {
        setSavedVenues(prev => {
            const isSaving = !prev.includes(venueId);
            if (isSaving) {
                const detail = venues.find(v => v.id === venueId);
                if (detail) {
                    setSavedDetails(prevDetails => [...prevDetails, detail]);
                }
                return [...prev, venueId];
            } else {
                setSavedDetails(prevDetails => prevDetails.filter(d => d.id !== venueId));
                return prev.filter(id => id !== venueId);
            }
        });
    }, [venues]);

    const confirmDeleteAction = useCallback(async () => {
        if (!venueToDelete) return;
        try {
            await db.deleteVenue(venueToDelete.id);
            setVenues(prev => prev.filter(v => v.id !== venueToDelete.id));
            setSavedVenues(prev => prev.filter(id => id !== venueToDelete.id));
            setSavedDetails(prev => prev.filter(d => d.id !== venueToDelete.id));
        } catch (err) {
            alert('Failed to delete venue.');
        } finally {
            setVenueToDelete(null);
            setShowVenueForm(false);
            setEditingVenue(null);
            setSelectedVenue(null);
        }
    }, [venueToDelete]);

    const handleSaveVenue = async (venueData: any) => {
        // Return promise so VenueForm can handle its own state
        const saved = await db.upsertVenue(venueData);
        if (editingVenue) {
            setVenues(prev => prev.map(old => old.id === saved.id ? saved : old));
            setSavedDetails(prev => prev.map(old => old.id === saved.id ? saved : old));
        } else {
            setVenues(prev => [...prev, saved]);
        }
        setShowVenueForm(false);
        setEditingVenue(null);
        setSelectedVenue(null);
    };

    const renderMain = () => {
        if (isLoading) {
            return (
                <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                    <div className="spinner"></div>
                    <p className="font-black text-sm tracking-widest opacity-50 uppercase">Syncing Courts...</p>
                </div>
            );
        }

        if (isMobile) {
            return (
                <MobileView
                    venues={filteredVenues}
                    selectedVenue={selectedVenue}
                    onSelectVenue={setSelectedVenue}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    mtrFilter={mtrFilter}
                    setMtrFilter={setMtrFilter}
                    distanceFilter={distanceFilter}
                    setDistanceFilter={setDistanceFilter}
                    language={language}
                    t={t}
                    darkMode={darkMode}
                    savedVenues={savedVenues}
                    toggleSave={toggleSaveVenue}
                    isAdmin={isAdmin}
                    onEditVenue={(id, v) => { setEditingVenue(v); setShowVenueForm(true); }}
                    availableStations={availableStations}
                />
            );
        }

        if (selectedVenue) {
            return (
                <VenueDetail
                    venue={selectedVenue}
                    onBack={() => setSelectedVenue(null)}
                    language={language}
                    t={t}
                    darkMode={darkMode}
                    savedVenues={savedVenues}
                    toggleSave={toggleSaveVenue}
                    isAdmin={isAdmin}
                    onEdit={() => { setEditingVenue(selectedVenue); setShowVenueForm(true); }}
                />
            );
        }

        return (
            <DesktopView
                venues={filteredVenues}
                selectedVenue={selectedVenue}
                onSelectVenue={setSelectedVenue}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                mtrFilter={mtrFilter}
                setMtrFilter={setMtrFilter}
                distanceFilter={distanceFilter}
                setDistanceFilter={setDistanceFilter}
                language={language}
                t={t}
                darkMode={darkMode}
                savedVenues={savedVenues}
                toggleSave={toggleSaveVenue}
                isAdmin={isAdmin}
                onAddVenue={() => { setEditingVenue(null); setShowVenueForm(true); }}
                onEditVenue={(id, v) => { setEditingVenue(v); setShowVenueForm(true); }}
                onDeleteVenue={(id) => {
                    const target = venues.find(v => v.id === id);
                    if (target) setVenueToDelete(target);
                }}
                availableStations={availableStations}
            />
        );
    };

    return (
        <div className={`min-h-screen pb-safe transition-colors ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
            <Header
                language={language}
                setLanguage={setLanguage}
                isAdmin={isAdmin}
                onAdminClick={() => { if (isAdmin) setCurrentTab('admin'); else setShowAdminLogin(true); }}
                onLogout={() => { setIsAdmin(false); setCurrentTab('explore'); }}
                darkMode={darkMode}
                setDarkMode={setDarkMode}
                t={t}
                currentTab={currentTab}
                setTab={(tab) => {
                    if (tab === 'admin' && !isAdmin) setShowAdminLogin(true);
                    else setCurrentTab(tab);
                    setSelectedVenue(null);
                }}
            />

            <main className="h-full">
                {currentTab === 'admin' && isAdmin && !selectedVenue ? (
                    <div className="container mx-auto p-4 md:p-8 pb-32 md:pb-8 space-y-8 animate-in fade-in duration-500">
                        <div className="flex justify-between items-center">
                            <h2 className="text-3xl md:text-4xl font-black tracking-tight">Manage Courts</h2>
                            <button 
                                onClick={() => { setEditingVenue(null); setShowVenueForm(true); }} 
                                className="px-4 py-3 md:px-6 md:py-3 bg-[#00e911] text-white rounded-2xl font-black shadow-xl hover:scale-105 active:scale-95 transition-all text-xs md:text-base"
                            >
                                + ADD NEW
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {venues.map(v => (
                                <div key={v.id} className={`p-4 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} border rounded-3xl shadow-md flex items-center justify-between group transition-all hover:shadow-xl`}>
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="w-16 h-16 rounded-xl overflow-hidden shadow-inner flex-shrink-0">
                                            <img src={v.images[0] || 'https://via.placeholder.com/150'} className="w-full h-full object-cover" alt="" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-black truncate">{v.name}</p>
                                            <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest">${v.startingPrice}/HR</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => { setEditingVenue(v); setShowVenueForm(true); }} className="p-3 bg-blue-500/10 text-blue-500 rounded-xl">✏️</button>
                                        <button 
                                            onClick={(e) => { 
                                                e.stopPropagation();
                                                setVenueToDelete(v);
                                            }} 
                                            className="p-3 bg-red-500/10 text-red-500 rounded-xl"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    renderMain()
                )}
            </main>

            {showAdminLogin && (
                <AdminLogin
                    password={adminPassword}
                    setPassword={setAdminPassword}
                    onLogin={handleAdminLogin}
                    onClose={() => setShowAdminLogin(false)}
                    language={language}
                    t={t}
                    darkMode={darkMode}
                />
            )}

            {showVenueForm && (
                <VenueForm
                    venue={editingVenue}
                    onSave={handleSaveVenue}
                    onCancel={() => {
                        setShowVenueForm(false);
                        setEditingVenue(null);
                    }}
                    onDelete={(id) => {
                        const target = venues.find(v => v.id === id);
                        if (target) setVenueToDelete(target);
                    }}
                    language={language}
                    t={t}
                    darkMode={darkMode}
                />
            )}

            {venueToDelete && (
                <div className="fixed inset-0 bg-black/90 z-[999] flex items-center justify-center p-4 backdrop-blur-md">
                    <div className={`w-full max-w-sm rounded-[32px] p-8 shadow-2xl animate-bounce-in ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
                        <div className="text-center space-y-4">
                            <div className="text-6xl mb-2">⚠️</div>
                            <h3 className="text-2xl font-black">
                                {language === 'en' ? 'Delete Court?' : '刪除場地？'}
                            </h3>
                            <p className={`text-sm font-bold px-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                {language === 'en' 
                                    ? `Are you sure you want to delete "${venueToDelete.name}"?` 
                                    : `確定要刪除「${venueToDelete.name}」嗎？`}
                            </p>
                            <div className="flex flex-col gap-3 pt-6">
                                <button 
                                    onClick={confirmDeleteAction}
                                    className="w-full py-4 bg-red-500 text-white rounded-2xl font-black"
                                >
                                    {language === 'en' ? 'YES, DELETE IT' : '確定刪除'}
                                </button>
                                <button 
                                    onClick={() => setVenueToDelete(null)}
                                    className={`w-full py-4 rounded-2xl font-black ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}
                                >
                                    {language === 'en' ? 'NO, CANCEL' : '取消'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {isMobile && (
                <MobileNav 
                    currentTab={currentTab} 
                    setTab={setCurrentTab} 
                    t={t} 
                    darkMode={darkMode} 
                    isAdmin={isAdmin}
                />
            )}
        </div>
    );
}

export default App;