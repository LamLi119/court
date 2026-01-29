import React from 'react';
import { AppTab } from '../../types.ts';

interface MobileNavProps {
  currentTab: AppTab;
  setTab: (t: AppTab) => void;
  t: (key: string) => string;
  darkMode: boolean;
  isAdmin?: boolean;
}

const MobileNav: React.FC<MobileNavProps> = ({ currentTab, setTab, t, darkMode, isAdmin }) => {
  return (
    <div className={`fixed bottom-0 inset-x-0 z-[60] pb-safe border-t flex justify-around items-center px-4 py-3 backdrop-blur-lg ${darkMode ? 'bg-gray-900/90 border-gray-800' : 'bg-white/90 border-gray-100'} shadow-[0_-4px_10px_rgba(0,0,0,0.05)]`}>
      <button 
        onClick={() => setTab('explore')}
        className={`flex-1 flex flex-col items-center gap-1 transition-all ${currentTab === 'explore' ? 'text-[#007a67] scale-110' : 'text-gray-400'}`}
      >
        <span className="text-xl">📍</span>
        <span className="text-[10px] font-bold uppercase tracking-wider">{t('explore')}</span>
      </button>
      
      <button 
        onClick={() => setTab('saved')}
        className={`flex-1 flex flex-col items-center gap-1 transition-all ${currentTab === 'saved' ? 'text-red-500 scale-110' : 'text-gray-400'}`}
      >
        <span className="text-xl">❤️</span>
        <span className="text-[10px] font-bold uppercase tracking-wider">{t('saved')}</span>
      </button>

      {isAdmin && (
        <button 
          onClick={() => setTab('admin')}
          className={`flex-1 flex flex-col items-center gap-1 transition-all ${currentTab === 'admin' ? 'text-blue-500 scale-110' : 'text-gray-400'}`}
        >
          <span className="text-xl">⚙️</span>
          <span className="text-[10px] font-bold uppercase tracking-wider">{t('admin')}</span>
        </button>
      )}
    </div>
  );
};

export default MobileNav;