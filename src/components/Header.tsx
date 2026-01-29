import React from 'react';
import { Language, AppTab } from '../../types.ts';

interface HeaderProps {
    language: Language;
    setLanguage: (l: Language) => void;
    isAdmin: boolean;
    onAdminClick: () => void;
    onLogout?: () => void;
    darkMode: boolean;
    setDarkMode: (d: boolean) => void;
    t: (key: string) => string;
    currentTab: AppTab;
    setTab: (t: AppTab) => void;
    viewMode?: 'map' | 'list';
    setViewMode?: (mode: 'map' | 'list') => void;
}

const Header: React.FC<HeaderProps> = ({ 
    language, 
    setLanguage, 
    isAdmin,
    onAdminClick,
    onLogout,
    darkMode, 
    setDarkMode, 
    t, 
    currentTab, 
    setTab, 
    viewMode, 
    setViewMode 
}) => {
    // Relative path for the logo from root where index.html is
    const logoUrl = "assets/green-G.svg";

    return (
        <header className={`sticky top-0 z-[60] ${darkMode ? 'bg-gray-900/95' : 'bg-white/95'} backdrop-blur-md border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'} shadow-sm`}>
            <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-4 md:gap-8">
                    <div className="flex items-center gap-2.5 cursor-pointer group" onClick={() => setTab('explore')}>
                        <div className="w-10 h-10 transition-transform duration-300 group-hover:rotate-12 group-active:scale-90 flex items-center justify-center">
                            {/* <img 
                                src={logoUrl} 
                                className="w-full h-full object-contain" 
                                alt="The Ground Logo" 
                                onError={(_e: any) => {
                                    console.error("Logo file could not be found or loaded at " + logoUrl);
                                }}
                            /> */}
                        </div>
                        <h1 className="hidden sm:block text-[20px] font-[900] tracking-tighter text-[#007a67]">THE GROUND</h1>
                    </div>
                    
                    <nav className="flex items-center gap-3 md:gap-6">
                        <button onClick={() => setTab('explore')} className={`hidden md:block text-[14px] font-[700] transition-all ${currentTab === 'explore' ? 'text-[#007a67]' : 'text-gray-400 hover:text-gray-600'}`}>EXPLORE</button>
                        <button onClick={() => setTab('saved')} className={`hidden md:block text-[14px] font-[700] transition-all ${currentTab === 'saved' ? 'text-red-500' : 'text-gray-400 hover:text-gray-600'}`}>SAVED</button>
                        <button onClick={() => setTab('admin')} className={`text-[11px] md:text-[14px] font-[900] tracking-widest transition-all ${currentTab === 'admin' ? 'text-blue-500' : 'text-gray-400 hover:text-gray-600'}`}>ADMIN</button>
                    </nav>
                </div>
                
                <div className="flex items-center gap-2 md:gap-4">
                    <button onClick={() => setDarkMode(!darkMode)} className={`p-2 rounded-[8px] transition-all ${darkMode ? 'bg-gray-800 text-yellow-400' : 'bg-gray-100 text-gray-700'}`}>
                        {darkMode ? '☀️' : '🌙'}
                    </button>

                    <div className={`flex ${darkMode ? 'bg-gray-800' : 'bg-white' } rounded-[8px] p-1 border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                        <button onClick={() => setLanguage('en')} className={`px-2 md:px-3 py-1 text-[10px] md:text-[11px] font-[900] rounded-[6px] ${language === 'en' ? 'bg-[#007a67] text-white shadow' : 'text-gray-400'}`}>EN</button>
                        <button onClick={() => setLanguage('zh')} className={`px-2 md:px-3 py-1 text-[10px] md:text-[11px] font-[900] rounded-[6px] ${language === 'zh' ? 'bg-[#007a67] text-white shadow' : 'text-gray-400'}`}>中文</button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;