import React from 'react';
import { Language } from '../../types.ts';

interface AdminLoginProps {
    password: string;
    setPassword: (val: string) => void;
    onLogin: () => void;
    onClose: () => void;
    language: Language;
    t: (key: string) => string;
    darkMode: boolean;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ password, setPassword, onLogin, onClose, language, t, darkMode }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex items-center justify-center p-4">
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-[16px] p-6 max-w-md w-full shadow-2xl transition-all`}>
                <h2 className={`text-[24px] font-[900] mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{t('admin')} {t('login')}</h2>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && onLogin()}
                    placeholder={language === 'en' ? 'Enter password' : '輸入密碼'}
                    className={`w-full px-4 py-2 border rounded-[8px] mb-4 focus:ring-2 focus:ring-[#007a67] focus:outline-none transition-all ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                    autoFocus
                />
                <div className="flex gap-2">
                    <button
                        onClick={onLogin}
                        className="flex-1 px-4 py-2 bg-[#007a67] text-white rounded-[8px] font-[900] hover:brightness-110 active:scale-95 transition-all"
                    >
                        {t('login')}
                    </button>
                    <button
                        onClick={onClose}
                        className={`flex-1 px-4 py-2 rounded-[8px] font-[700] transition-all ${darkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                    >
                        {t('cancel')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;