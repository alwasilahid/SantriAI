
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppSettings, ArabicFont } from '../types';
import { Save, Type, Moon, Sun, History, Bookmark, Scroll, ChevronRight, Activity, Check, HeartHandshake, Clock, Info, BookOpen, FileText, Shield, AlertTriangle, Phone } from 'lucide-react';

interface SettingsScreenProps {
  settings: AppSettings;
  onSaveSettings: (newSettings: AppSettings) => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ settings, onSaveSettings }) => {
  const navigate = useNavigate();
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [isDirty, setIsDirty] = useState(false);

  const handleChange = (key: keyof AppSettings, value: any) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const handleSave = () => {
    onSaveSettings(localSettings);
    setIsDirty(false);
  };

  const FONTS: { id: ArabicFont, name: string, family: string }[] = [
    { id: 'amiri', name: 'Amiri (Klasik)', family: "'Amiri', serif" },
    { id: 'scheherazade', name: 'Scheherazade (Naskh)', family: "'Scheherazade New', serif" },
    { id: 'noto', name: 'Noto Naskh (Modern)', family: "'Noto Naskh Arabic', serif" },
  ];

  const InfoItem = ({ icon: Icon, label, path }: { icon: any, label: string, path: string }) => (
    <button 
      onClick={() => navigate(path)} 
      className="w-full flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors group"
    >
        <div className="flex items-center gap-3">
            <div className="text-slate-400 group-hover:text-santri-green transition-colors">
                <Icon size={18} />
            </div>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
        </div>
        <ChevronRight size={16} className="text-slate-300 dark:text-slate-600" />
    </button>
  );

  return (
    <div className="pb-24 pt-6 px-4 space-y-6">

      {/* Data & Aktivitas Section */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors animate-in fade-in slide-in-from-top-2 duration-300">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg text-orange-600 dark:text-orange-400">
             <Activity size={20} />
          </div>
          <h2 className="font-semibold text-slate-800 dark:text-slate-100">Data & Aktivitas</h2>
        </div>

        <div className="space-y-1">
            <button 
              onClick={() => navigate('onNavigateToPrayerTimes')} 
              className="w-full flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors group"
            >
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-santri-green group-hover:bg-santri-green group-hover:text-white transition-colors">
                        <Clock size={16} />
                    </div>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Jadwal Sholat & Adzan</span>
                </div>
                <ChevronRight size={16} className="text-slate-300 dark:text-slate-600" />
            </button>

            <button 
              onClick={() => navigate('/', { state: { tab: 'history' } })} 
              className="w-full flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors group"
            >
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                        <History size={16} />
                    </div>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Riwayat Ngaji</span>
                </div>
                <ChevronRight size={16} className="text-slate-300 dark:text-slate-600" />
            </button>

            <button 
              onClick={() => navigate('/quran', { state: { tab: 'bookmark' } })} 
              className="w-full flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors group"
            >
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-santri-green group-hover:bg-santri-green group-hover:text-white transition-colors">
                        <Bookmark size={16} />
                    </div>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Penanda Al-Qur'an</span>
                </div>
                <ChevronRight size={16} className="text-slate-300 dark:text-slate-600" />
            </button>

            <button 
              onClick={() => navigate('/hadis', { state: { tab: 'bookmark' } })} 
              className="w-full flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors group"
            >
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <Scroll size={16} />
                    </div>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Penanda Hadis</span>
                </div>
                <ChevronRight size={16} className="text-slate-300 dark:text-slate-600" />
            </button>

            <button 
              onClick={() => navigate('/doa', { state: { tab: 'bookmark' } })} 
              className="w-full flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors group"
            >
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-cyan-50 dark:bg-cyan-900/20 flex items-center justify-center text-cyan-600 group-hover:bg-cyan-600 group-hover:text-white transition-colors">
                        <HeartHandshake size={16} />
                    </div>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Penanda Doa</span>
                </div>
                <ChevronRight size={16} className="text-slate-300 dark:text-slate-600" />
            </button>
        </div>
      </div>
      
      {/* Theme & Appearance */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
             {localSettings.theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
          </div>
          <h2 className="font-semibold text-slate-800 dark:text-slate-100">Tampilan</h2>
        </div>
        
        {/* Dark Mode Toggle */}
        <div className="grid grid-cols-2 gap-3 mb-6">
           <button 
             onClick={() => handleChange('theme', 'light')}
             className={`p-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${
               localSettings.theme === 'light'
                 ? 'bg-green-50 border-santri-green text-santri-green'
                 : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
             }`}
           >
              <Sun size={18} /> Light
           </button>
           <button 
             onClick={() => handleChange('theme', 'dark')}
             className={`p-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${
               localSettings.theme === 'dark'
                 ? 'bg-slate-800 border-santri-green text-santri-gold'
                 : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700'
             }`}
           >
              <Moon size={18} /> Dark
           </button>
        </div>

        {/* Font Selector */}
        <div className="mb-6">
           <label className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2 block flex items-center gap-2">
             <Type size={16} /> Jenis Font Arab
           </label>
           <div className="space-y-2">
              {FONTS.map(font => (
                <button
                  key={font.id}
                  onClick={() => handleChange('arabicFont', font.id)}
                  className={`w-full p-3 rounded-xl border flex items-center justify-between transition-all ${
                    localSettings.arabicFont === font.id
                    ? 'bg-green-50 dark:bg-green-900/20 border-santri-green text-santri-green dark:text-santri-gold'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                   <div className="text-left">
                      <span className="text-xs font-semibold block mb-1">{font.name}</span>
                      <span className="text-xl" style={{ fontFamily: font.family }}>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</span>
                   </div>
                   {localSettings.arabicFont === font.id && <Check size={18} />}
                </button>
              ))}
           </div>
        </div>

        <div>
           <label className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2 block">Ukuran Font ({localSettings.fontSize}px)</label>
           <input 
             type="range" 
             min="12" 
             max="32" 
             step="1"
             value={localSettings.fontSize}
             onChange={(e) => handleChange('fontSize', parseInt(e.target.value))}
             className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-santri-green"
           />
         </div>
      </div>

      {/* Informasi & Bantuan */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
        <div className="flex items-center gap-3 mb-4">
           <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400">
            <Info size={20} />
          </div>
          <h2 className="font-semibold text-slate-800 dark:text-slate-100">Informasi & Bantuan</h2>
        </div>

        <div className="space-y-1">
           <InfoItem icon={Info} label="Tentang Aplikasi" path="/info/about" />
           <InfoItem icon={BookOpen} label="Panduan Penggunaan" path="/info/guide" />
           <InfoItem icon={FileText} label="Syarat & Ketentuan" path="/info/terms" />
           <InfoItem icon={Shield} label="Kebijakan Privasi" path="/info/privacy" />
           <InfoItem icon={AlertTriangle} label="Disclaimer" path="/info/disclaimer" />
           <InfoItem icon={Phone} label="Hubungi Kami" path="/info/contact" />
        </div>
      </div>

      <button
        disabled={!isDirty}
        onClick={handleSave}
        className={`w-full py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
          isDirty 
            ? 'bg-santri-green text-white shadow-lg shadow-green-200 dark:shadow-green-900/30 active:scale-[0.98]' 
            : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
        }`}
      >
        <Save size={20} />
        Simpan Pengaturan
      </button>

    </div>
  );
};

export default SettingsScreen;
