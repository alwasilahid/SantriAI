import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getPrayerTimes, getCityName } from '../services/prayerService';
import { TranslationResult, PrayerData } from '../types';
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
  ArrowRight
} from 'lucide-react';
import HistoryScreen from './HistoryScreen';

interface HomeScreenProps {
  fontSize: number;
  history: TranslationResult[];
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
  // Fallbacks for common API variations
  "Rabi al-Awwal": "Rabiul Awal",
  "Rabi al-Thani": "Rabiul Akhir",
  "Jumada al-Awwal": "Jumadil Awal",
  "Jumada al-Thani": "Jumadil Akhir",
  "Dhul Qidah": "Dzulkaidah",
  "Dhul Hijjah": "Dzulhijjah"
};

const HomeScreen: React.FC<HomeScreenProps> = ({ fontSize, history }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const historyRef = useRef<HTMLDivElement>(null);

  // Prayer State
  const [prayerData, setPrayerData] = useState<PrayerData | null>(null);
  const [locationName, setLocationName] = useState('Jakarta');
  const [nextPrayer, setNextPrayer] = useState<{ name: string, time: string, diff: number } | null>(null);
  const [countdown, setCountdown] = useState('');

  // Handle incoming navigation state (Scroll to history)
  useEffect(() => {
    if (location.state && (location.state as any).tab === 'history') {
      setTimeout(() => {
        historyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

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
          setCountdown("00:00:00");
          return;
      }

      const diffH = Math.floor(diffMs / (1000 * 60 * 60));
      const diffM = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const diffS = Math.floor((diffMs % (1000 * 60)) / 1000);

      // Removed extra spaces around colons
      setCountdown(`${diffH.toString().padStart(2, '0')}:${diffM.toString().padStart(2, '0')}:${diffS.toString().padStart(2, '0')}`);

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
                  <div key={i} className={`py-3 flex flex-col items-center justify-center transition-colors ${isNext ? 'bg-santri-gold text-santri-green' : ''}`}>
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
            <div className="bg-santri-green-dark dark:bg-black/20 px-4 py-2 flex items-center border-t border-white/10 gap-2">
                <div className="flex items-center gap-2 flex-none">
                  <div className="text-santri-gold animate-pulse">
                    <Activity size={16} /> 
                  </div>
                  <span className="text-xs font-bold tracking-widest uppercase text-white/90 whitespace-nowrap">
                      MENUJU {nextPrayer?.name || 'SHOLAT'}
                  </span>
                </div>
                
                {/* Timer centered in remaining space */}
                <div className="flex items-center justify-center gap-2 flex-1">
                  <span className="font-mono text-lg font-bold text-santri-gold tracking-wider">
                    {countdown || "00:00:00"}
                  </span>
                  <span className="bg-white/20 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">WIB</span>
                </div>
            </div>
          </div>
      </div>

      <div className="px-4 pt-6">
        <div className="animate-in fade-in slide-in-from-left-4 duration-300">
          
          {/* Input Trigger (Redirects to Input Screen) */}
          <button
             onClick={() => navigate('/input')}
             className="w-full bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between group hover:border-santri-green transition-all mb-6"
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
            <div className="mb-6 grid grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
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
              Riwayat Terjemahan
            </h3>
            <HistoryScreen history={history} />
          </div>

        </div>
      </div>
    </div>
  );
};

export default HomeScreen;
