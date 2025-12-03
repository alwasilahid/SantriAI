
import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getPrayerTimes, getCityName } from '../services/prayerService';
import { PrayerData } from '../types';
import { useHistory } from '../contexts/HistoryContext';
import { 
  Sparkles, 
  History as HistoryIcon, 
  MapPin,
  GraduationCap,
  Brain,
  Activity, 
  Compass,
  Calendar,
  Coins,
  Calculator,
  HeartHandshake,
  Keyboard,
  ArrowRight,
  Search,
  X,
  Book,
  BookOpen,
  Scroll,
  Settings,
  User,
  Clock
} from 'lucide-react';
import HistoryScreen from './HistoryScreen';

interface HomeScreenProps {
  fontSize: number;
}

const FEATURE_MENU = [
  { icon: Calendar, label: "Kalender", color: "bg-orange-100 text-orange-600", path: "/calendar" },
  { icon: Coins, label: "Hitung Zakat", color: "bg-indigo-100 text-indigo-600", path: "/zakat" },
  { icon: Calculator, label: "Waris", color: "bg-pink-100 text-pink-600", path: "/waris" },
  { icon: Activity, label: "Tasbih", color: "bg-teal-100 text-teal-600", path: "/tasbih" },
  { icon: HeartHandshake, label: "Doa-doa", color: "bg-cyan-100 text-cyan-600", path: "/doa" },
  { icon: Brain, label: "Cerdas Cermat", color: "bg-purple-100 text-purple-600", path: "/quiz" },
  { icon: GraduationCap, label: "Latihan Baca", color: "bg-green-100 text-green-600", path: "/latihan" },
  { icon: Compass, label: "Arah Kiblat", color: "bg-blue-100 text-blue-600", path: "/qibla" },
  { icon: Activity, label: "Tasbih", color: "bg-teal-100 text-teal-600", path: "/tasbih" },
];

// Expanded list for Search
const SEARCHABLE_FEATURES = [
  ...FEATURE_MENU,
  { icon: Book, label: "Kitab Kuning", color: "bg-amber-100 text-amber-600", path: "/kitab" },
  { icon: BookOpen, label: "Al-Quran", color: "bg-emerald-100 text-emerald-600", path: "/quran" },
  { icon: Scroll, label: "Hadis", color: "bg-blue-100 text-blue-600", path: "/hadis" },
  { icon: Clock, label: "Jadwal Sholat", color: "bg-green-100 text-green-600", path: "/sholat" },
  { icon: User, label: "Biografi Ulama", color: "bg-slate-100 text-slate-600", path: "/biography" },
  { icon: Settings, label: "Pengaturan", color: "bg-slate-100 text-slate-600", path: "/settings" },
];

const HIJRI_MONTHS_ID: Record<string, string> = {
  "Muharram": "Muharram",
  "Safar": "Safar",
  "Rabi' al-Awwal": "Rabiul Awal",
  "Rabi' al-Thani": "Rabiul Akhir",
  "Jumada al-Ula": "Jumadil Awal",
  "Jumada al-Akhirah": "Jumadil Akhir",
  "Rajab": "Rajab",
  "Sha'ban": "Sya'ban",
  "Ramadan": "Ramadhan",
  "Shawwal": "Syawal",
  "Dhu al-Qi'dah": "Dzulkaidah",
  "Dhu al-Hijjah": "Dzulhijjah",
  // Fallbacks
  "Rabi al-Awwal": "Rabiul Awal",
  "Rabi al-Thani": "Rabiul Akhir",
  "Jumada al-Awwal": "Jumadil Awal",
  "Jumada al-Thani": "Jumadil Akhir",
  "Dhul Qidah": "Dzulkaidah",
  "Dhul Hijjah": "Dzulhijjah"
};

const HomeScreen: React.FC<HomeScreenProps> = ({ fontSize }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const historyRef = useRef<HTMLDivElement>(null);
  
  // Use History Context
  const { history } = useHistory();

  // Prayer State
  const [prayerData, setPrayerData] = useState<PrayerData | null>(null);
  const [locationName, setLocationName] = useState('Jakarta');
  const [nextPrayer, setNextPrayer] = useState<{ name: string, time: string, diff: number } | null>(null);
  const [countdown, setCountdown] = useState('');
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<{ features: any[], history: any[] }>({ features: [], history: [] });

  // Handle incoming navigation state (Scroll to history)
  useEffect(() => {
    if (location.state && (location.state as any).tab === 'history') {
      setTimeout(() => {
        historyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // --- Search Logic ---
  useEffect(() => {
    if (!searchQuery.trim()) {
        setIsSearching(false);
        return;
    }
    setIsSearching(true);
    
    const q = searchQuery.toLowerCase();
    
    // 1. Search Features
    const features = SEARCHABLE_FEATURES.filter(f => f.label.toLowerCase().includes(q));
    
    // 2. Search History
    const hist = history.filter(h => 
        h.title.toLowerCase().includes(q) || 
        (h.subtitle && h.subtitle.toLowerCase().includes(q))
    ).slice(0, 3);

    setSearchResults({ features, history: hist });

  }, [searchQuery, history]);

  const handleAiSearch = () => {
      if (!searchQuery.trim()) return;
      navigate('/explanation', { state: { query: searchQuery } });
      setSearchQuery('');
      setIsSearching(false);
  };

  // --- Prayer Data Fetching ---
  useEffect(() => {
    const initPrayerData = async () => {
      // Default Jakarta
      let lat = -6.2088;
      let lng = 106.8456;

      if ("geolocation" in navigator) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
          });
          lat = position.coords.latitude;
          lng = position.coords.longitude;
          const city = await getCityName(lat, lng);
          setLocationName(city);
        } catch (e) {
          console.log("Geolocation denied, using default");
        }
      }

      const data = await getPrayerTimes(lat, lng);
      setPrayerData(data);
    };

    initPrayerData();
  }, []);

  // --- Countdown Logic ---
  useEffect(() => {
    if (!prayerData) return;

    // Helper to clean time string "04:30 (WIB)" -> "04:30"
    const cleanTime = (t: string) => t.replace(/\s*\(.*?\)\s*/g, '').trim();

    const interval = setInterval(() => {
      const now = new Date();
      const currentTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      const prayers = [
        { name: 'SUBUH', time: cleanTime(prayerData.timings.Fajr) },
        { name: 'DZUHUR', time: cleanTime(prayerData.timings.Dhuhr) },
        { name: 'ASHAR', time: cleanTime(prayerData.timings.Asr) },
        { name: 'MAGHRIB', time: cleanTime(prayerData.timings.Maghrib) },
        { name: 'ISYA', time: cleanTime(prayerData.timings.Isha) },
      ];

      // Find next prayer
      let upcoming = prayers.find(p => p.time > currentTimeStr);
      
      // If no upcoming prayer today, it's Subuh tomorrow
      if (!upcoming) {
        upcoming = prayers[0]; 
      }

      setNextPrayer({ ...upcoming, diff: 0 }); 

      // Calculate Countdown string
      const [hStr, mStr] = upcoming.time.split(':');
      const h = parseInt(hStr, 10);
      const m = parseInt(mStr, 10);

      if (isNaN(h) || isNaN(m)) return;

      const target = new Date();
      target.setHours(h, m, 0, 0);
      
      // If target time is earlier than now, it means it's tomorrow's Subuh
      if (target <= now) {
         target.setDate(target.getDate() + 1);
      }

      const diffMs = target.getTime() - now.getTime();
      
      if (diffMs < 0) {
          setCountdown("00 : 00 : 00");
          return;
      }

      const diffH = Math.floor(diffMs / (1000 * 60 * 60));
      const diffM = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const diffS = Math.floor((diffMs % (1000 * 60)) / 1000);

      setCountdown(`${diffH.toString().padStart(2, '0')} : ${diffM.toString().padStart(2, '0')} : ${diffS.toString().padStart(2, '0')}`);

    }, 1000);

    return () => clearInterval(interval);
  }, [prayerData]);


  const handleFeatureClick = (item: typeof FEATURE_MENU[0]) => {
    if (item.path) {
      if (item.path.startsWith('http')) {
        window.open(item.path, '_blank');
      } else {
        navigate(item.path);
      }
    } else {
      alert('Fitur akan segera hadir!');
    }
  };

  const getIndoHijriMonth = (en: string) => HIJRI_MONTHS_ID[en] || en;

  // Filter history based on search query
  const filteredHistory = history.filter(item => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      (item.subtitle && item.subtitle.toLowerCase().includes(q))
    );
  });

  return (
    <div className="pb-24 pt-0 min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      
      <div className="animate-in fade-in slide-in-from-top-4 duration-500">
          {/* PRAYER DASHBOARD WIDGET */}
          <div 
            onClick={() => navigate('/sholat')}
            className="bg-santri-green dark:bg-santri-green-dark text-white shadow-lg mb-0 cursor-pointer active:opacity-90 transition-opacity"
          >
            
            {/* Prayer Times Row */}
            <div className="grid grid-cols-5 text-center border-b border-white/10">
              {[
                { label: 'SUBUH', time: prayerData?.timings.Fajr || '--:--' },
                { label: 'DZUHUR', time: prayerData?.timings.Dhuhr || '--:--' },
                { label: 'ASHAR', time: prayerData?.timings.Asr || '--:--' },
                { label: 'MAGHRIB', time: prayerData?.timings.Maghrib || '--:--' },
                { label: 'ISYA', time: prayerData?.timings.Isha || '--:--' },
              ].map((p, i) => {
                 // Clean display time
                 const displayTime = p.time.replace(/\s*\(.*?\)\s*/g, '');
                 const isNext = p.label === nextPrayer?.name;
                 
                 return (
                  <div key={i} className={`py-4 pt-10 flex flex-col items-center justify-center transition-colors ${isNext ? 'bg-santri-gold text-santri-green' : ''}`}>
                    <span className={`text-[10px] uppercase font-medium mb-0.5 ${isNext ? 'text-santri-green font-bold' : 'text-green-50 opacity-80'}`}>{p.label}</span>
                    <span className={`text-sm ${isNext ? 'font-black text-santri-green' : 'font-bold text-white'}`}>{displayTime}</span>
                  </div>
                );
              })}
            </div>

            {/* Info Row */}
            <div className="flex justify-between items-center px-4 py-3 bg-santri-green dark:bg-santri-green-dark">
                <div className="flex items-center gap-1.5 text-xs font-medium text-white">
                  <MapPin size={14} className="text-santri-gold" />
                  {locationName}
                </div>
                <div className="text-xs font-medium text-santri-gold flex items-center gap-1">
                  <span>
                    {prayerData?.date.hijri.day} {getIndoHijriMonth(prayerData?.date.hijri.month.en || '')} {prayerData?.date.hijri.year} H
                  </span>
                  <ArrowRight size={12} />
                </div>
            </div>

            {/* Countdown Bar */}
            <div className="bg-santri-green-dark dark:bg-black/20 px-4 py-2 flex justify-between items-center border-t border-white/10">
                <div className="flex items-center gap-2">
                  <div className="text-santri-gold animate-pulse">
                    <Activity size={16} /> 
                  </div>
                  <span className="text-xs font-bold tracking-widest uppercase text-white/90">
                      MENUJU {nextPrayer?.name || 'SHOLAT'}
                  </span>
                </div>
                <span className="font-mono text-lg font-bold text-santri-gold tracking-widest">
                  {countdown || "00 : 00 : 00"}
                </span>
                <span className="bg-white/20 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">WIB</span>
            </div>
          </div>
      </div>

      <div className="px-4 pt-6">
        <div className="animate-in fade-in slide-in-from-left-4 duration-300">
          
          {/* Search Bar */}
          <div className="mb-6 relative group z-50">
            <div className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-santri-green transition-colors">
                <Search size={20} />
            </div>
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                   handleAiSearch();
                }
              }}
              onFocus={() => setIsSearching(!!searchQuery)}
              placeholder="Cari fitur, riwayat, atau tanya AI..."
              className="w-full pl-11 pr-10 py-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-santri-green focus:ring-4 focus:ring-santri-green/10 transition-all shadow-sm text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
            />
            {searchQuery && (
              <button 
                onClick={() => { setSearchQuery(''); setIsSearching(false); }}
                className="absolute right-3 top-3.5 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-full transition-colors"
              >
                <X size={14} />
              </button>
            )}

            {/* Dropdown Results */}
            {isSearching && searchQuery && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden max-h-[60vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                    
                    {/* Features Section */}
                    {searchResults.features.length > 0 && (
                        <div className="p-2">
                            <h4 className="text-xs font-bold text-slate-400 px-2 py-1 uppercase tracking-wider">Fitur Aplikasi</h4>
                            {searchResults.features.map((f, i) => {
                                const Icon = f.icon;
                                return (
                                    <button 
                                        key={i}
                                        onClick={() => { navigate(f.path); setSearchQuery(''); setIsSearching(false); }}
                                        className="w-full flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors text-left"
                                    >
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${f.color.replace('text-', 'bg-opacity-20 bg-')}`}>
                                            <Icon size={16} className={f.color.split(' ')[1]} />
                                        </div>
                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{f.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* History Section */}
                    {searchResults.history.length > 0 && (
                        <div className="p-2 border-t border-slate-100 dark:border-slate-800">
                            <h4 className="text-xs font-bold text-slate-400 px-2 py-1 uppercase tracking-wider">Riwayat</h4>
                            {searchResults.history.map((h, i) => (
                                <button 
                                    key={h.id}
                                    onClick={() => { 
                                        navigate(h.path, { state: h.data ? { ...h.data } : undefined }); 
                                        setSearchQuery(''); 
                                        setIsSearching(false); 
                                    }}
                                    className="w-full flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors text-left"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 shrink-0">
                                        <HistoryIcon size={16} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{h.title}</p>
                                        <p className="text-xs text-slate-400 truncate">{h.subtitle}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* AI Fallback */}
                    <div className="p-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                        <button 
                            onClick={handleAiSearch}
                            className="w-full flex items-center gap-3 p-3 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-colors text-left border border-transparent hover:border-santri-gold/50 shadow-sm group"
                        >
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-santri-gold to-orange-400 flex items-center justify-center text-white shadow-sm">
                                <Sparkles size={16} />
                            </div>
                            <div className="flex-1">
                                <span className="text-sm font-bold text-slate-800 dark:text-slate-100 block">Tanya AI (Penjelasan)</span>
                                <span className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">"{searchQuery}"</span>
                            </div>
                            <ArrowRight size={16} className="text-slate-400 group-hover:text-santri-green" />
                        </button>
                    </div>
                </div>
            )}
          </div>

          {/* Input Trigger (Redirects to Input Screen) */}
          <button
             onClick={() => navigate('/input')}
             className="w-full bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between group hover:border-santri-green transition-all mb-6 relative z-10"
          >
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 group-hover:bg-santri-green group-hover:text-white transition-colors">
                  <Keyboard size={20} />
               </div>
               <div className="text-left">
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm group-hover:text-santri-green transition-colors">Mulai Menerjemahkan</h3>
                  <p className="text-xs text-slate-400">Ketuk untuk mengetik Arab atau Indonesia</p>
               </div>
             </div>
             
             <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-700">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Input</span>
                <Sparkles size={14} className="text-santri-gold" />
             </div>
          </button>

            {/* FEATURE GRID (ICONS) */}
            <div className="mb-6 grid grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500 relative z-0">
              {FEATURE_MENU.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <button key={idx} className="flex flex-col items-center gap-2 group" onClick={() => handleFeatureClick(item)}>
                    <div className={`w-14 h-14 rounded-2xl ${item.color.replace('bg-', 'bg-opacity-20 bg-').replace('text-', 'dark:bg-opacity-10 dark:text-')} flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform ${item.color.split(' ')[0]} dark:bg-slate-800`}>
                        <Icon size={24} className={item.color.split(' ')[1]} />
                    </div>
                    <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400 text-center leading-tight">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>

          {/* HISTORY SECTION (Moved to Bottom) */}
          <div ref={historyRef} className="mt-8 mb-8 border-t border-slate-100 dark:border-slate-800 pt-6">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-lg mb-4 flex items-center gap-2">
              <HistoryIcon className="text-santri-green dark:text-santri-gold" /> 
              Riwayat Aktivitas
            </h3>
            <HistoryScreen history={searchQuery ? filteredHistory : history} />
          </div>

        </div>
      </div>
    </div>
  );
};

export default HomeScreen;
