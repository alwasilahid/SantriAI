
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar';
import MiniPlayer from './components/MiniPlayer';
import { AudioProvider } from './contexts/AudioContext';
import { HistoryProvider } from './contexts/HistoryContext';
import HomeScreen from './screens/HomeScreen';
import InputScreen from './screens/InputScreen'; 
import KitabScreen from './screens/KitabScreen';
import QuranScreen from './screens/QuranScreen';
import HadisScreen from './screens/HadisScreen';
import SettingsScreen from './screens/SettingsScreen';
import ResultScreen from './screens/ResultScreen';
import ResultDetailScreen from './screens/ResultDetailScreen'; 
import CalendarScreen from './screens/CalendarScreen';
import ZakatScreen from './screens/ZakatScreen';
import WarisScreen from './screens/WarisScreen';
import TasbihScreen from './screens/TasbihScreen';
import DoaScreen from './screens/DoaScreen';
import CerdasCermatScreen from './screens/CerdasCermatScreen';
import LatihanBacaScreen from './screens/LatihanBacaScreen';
import QiblaScreen from './screens/QiblaScreen';
import PrayerTimesScreen from './screens/PrayerTimesScreen';
import BiographyScreen from './screens/BiographyScreen';
import ExplanationScreen from './screens/ExplanationScreen';
import CategoryBooksScreen from './screens/CategoryBooksScreen';
import BookDetailScreen from './screens/BookDetailScreen';
import InfoScreen from './screens/InfoScreen';
import { AppSettings } from './types';
import { DEFAULT_SETTINGS } from './constants';
import { initSupabase } from './services/supabaseService';

const App: React.FC = () => {
  // State initialization
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('santriai_settings');
    const parsed = saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
    
    // Always enforce the hardcoded Supabase config from DEFAULT_SETTINGS
    // This ensures credentials are up to date even if user has old localStorage data
    return { 
      ...DEFAULT_SETTINGS, 
      ...parsed,
      supabaseConfig: {
        ...parsed.supabaseConfig,
        url: DEFAULT_SETTINGS.supabaseConfig.url,
        anonKey: DEFAULT_SETTINGS.supabaseConfig.anonKey,
        enabled: true // Enforce Sync ON automatically
      }
    };
  });

  // Apply Theme
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [settings.theme]);

  // Apply Arabic Font Globally
  useEffect(() => {
    const body = document.body;
    body.classList.remove('font-style-amiri', 'font-style-scheherazade', 'font-style-noto');
    body.classList.add(`font-style-${settings.arabicFont}`);
  }, [settings.arabicFont]);

  // Init Supabase
  useEffect(() => {
    initSupabase(settings.supabaseConfig);
  }, [settings.supabaseConfig]);

  // Persist State
  useEffect(() => {
    localStorage.setItem('santriai_settings', JSON.stringify(settings));
  }, [settings]);

  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    initSupabase(newSettings.supabaseConfig);
  };

  return (
    <HistoryProvider>
      <AudioProvider>
        <Router>
          <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300">
            
            <Routes>
              <Route 
                path="/" 
                element={
                  <HomeScreen 
                    fontSize={settings.fontSize}
                  />
                } 
              />
              <Route 
                path="/input" 
                element={
                  <InputScreen 
                    fontSize={settings.fontSize}
                  />
                } 
              />
              <Route 
                path="/result" 
                element={
                  <ResultScreen fontSize={settings.fontSize} />
                }
              />
              <Route 
                path="/result-detail" 
                element={
                  <ResultDetailScreen fontSize={settings.fontSize} />
                }
              />
              <Route path="/kitab" element={<KitabScreen />} />
              <Route path="/category-books" element={<CategoryBooksScreen />} />
              <Route path="/book-detail" element={<BookDetailScreen />} />
              
              <Route path="/quran" element={<QuranScreen />} />
              <Route path="/hadis" element={<HadisScreen />} />
              
              {/* Feature Routes */}
              <Route path="/calendar" element={<CalendarScreen />} />
              <Route path="/zakat" element={<ZakatScreen />} />
              <Route path="/waris" element={<WarisScreen />} />
              <Route path="/tasbih" element={<TasbihScreen />} />
              <Route path="/doa" element={<DoaScreen />} />
              <Route path="/quiz" element={<CerdasCermatScreen />} />
              <Route path="/latihan" element={<LatihanBacaScreen />} />
              <Route path="/qibla" element={<QiblaScreen />} />
              <Route path="/sholat" element={<PrayerTimesScreen />} />
              <Route path="/biography" element={<BiographyScreen />} />
              <Route path="/explanation" element={<ExplanationScreen />} />
              
              {/* Info Routes */}
              <Route path="/info/:slug" element={<InfoScreen />} />

              <Route 
                path="/settings" 
                element={
                  <SettingsScreen 
                    settings={settings} 
                    onSaveSettings={handleSaveSettings} 
                  />
                } 
              />
            </Routes>

            <MiniPlayer />
            <NavBar />
          </div>
        </Router>
      </AudioProvider>
    </HistoryProvider>
  );
};

export default App;
