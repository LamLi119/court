
import React from 'react';
import { Language, AppTab } from '../types';

interface HeaderProps {
    language: Language;
    setLanguage: (l: Language) => void;
    isAdmin: boolean;
    onAdminClick: () => void;
    onLogout: () => void;
    darkMode: boolean;
    setDarkMode: (d: boolean) => void;
    t: (key: string) => string;
    currentTab: AppTab;
    setTab: (t: AppTab) => void;
}

const Header: React.FC<HeaderProps> = ({ language, setLanguage, isAdmin, onAdminClick, onLogout, darkMode, setDarkMode, t, currentTab, setTab }) => {
    return (
        <header className={`sticky top-0 z-[60] ${darkMode ? 'bg-gray-900/95' : 'bg-white/95'} backdrop-blur-md border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'} shadow-sm`}>
            <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-4 md:gap-8">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => setTab('explore')}>
                        <span className="text-2xl">🎾</span>
                        <h1 className="hidden sm:block text-xl font-black tracking-tighter text-[#00e911]">HK PICKLEBALL</h1>
                    </div>
                    
                    <nav className="flex items-center gap-3 md:gap-6">
                        {/* Hidden on mobile, shown on desktop */}
                        <button onClick={() => setTab('explore')} className={`hidden md:block text-sm font-bold transition-all ${currentTab === 'explore' ? 'text-[#00e911]' : 'text-gray-400 hover:text-gray-600'}`}>EXPLORE</button>
                        <button onClick={() => setTab('saved')} className={`hidden md:block text-sm font-bold transition-all ${currentTab === 'saved' ? 'text-red-500' : 'text-gray-400 hover:text-gray-600'}`}>SAVED</button>
                        
                        {/* Always shown or primary on mobile */}
                        <button onClick={() => setTab('admin')} className={`text-[11px] md:text-sm font-black tracking-widest transition-all ${currentTab === 'admin' ? 'text-blue-500' : 'text-gray-400 hover:text-gray-600'}`}>ADMIN</button>
                    </nav>
                </div>
                
                <div className="flex items-center gap-2 md:gap-4">
                    <button onClick={() => setDarkMode(!darkMode)} className={`p-2 rounded-xl transition-all ${darkMode ? 'bg-gray-800 text-yellow-400' : 'bg-gray-100 text-gray-700'}`}>
                        {darkMode ? '☀️' : '🌙'}
                    </button>

                    <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
                        <button onClick={() => setLanguage('en')} className={`px-2 md:px-3 py-1 text-[10px] md:text-xs font-black rounded-lg ${language === 'en' ? 'bg-[#00e911] text-white shadow' : 'text-gray-400'}`}>EN</button>
                        <button onClick={() => setLanguage('zh')} className={`px-2 md:px-3 py-1 text-[10px] md:text-xs font-black rounded-lg ${language === 'zh' ? 'bg-[#00e911] text-white shadow' : 'text-gray-400'}`}>中文</button>
                    </div>

                    {isAdmin && (
                        <button onClick={onLogout} className="hidden sm:block px-4 py-2 bg-red-500 text-white rounded-xl font-bold text-xs shadow-lg">
                            {t('logout')}
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
