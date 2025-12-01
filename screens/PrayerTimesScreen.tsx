
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPrayerTimes, getCityName } from '../services/prayerService';
import { PrayerData } from '../types';
import { 
  ArrowLeft, 
  MapPin, 
  ChevronLeft, 
  ChevronRight, 
  Compass, 
  RefreshCw, 
  Bell, 
  BellOff, 
  Sunrise, 
  Sun, 
  Moon, 
  Cloud, 
  Sunset,
  Settings,
  Volume2,
  XCircle,
  Share2,
  Info,
  CloudMoon,
  CloudSun
} from 'lucide-react';

// URL Adzan Valid (Mishary Rashid Alafasy)
const ADZAN_URL_GENERAL = "https://cdn.islamdownload.net/wp-content/uploads-by-id/123801/adzan_by_mishari_rashid_al-afasy-2.mp3";
// Khusus Adzan Subuh (As-shalatu khairum minan naum)
const ADZAN_URL_SUBUH = "https://cdn.islamdownload.net/wp-content/uploads-by-id/123801/fajr_128_44.mp3?_=1";
// Khusus Imsak (Nada Alarm/Tarhim)
const ADZAN_URL_IMSAK = "https://blog-static.mamikos.com/wp-content/uploads/2025/11/Nada-Alarm-12.mp3";
// Khusus Terbit & Dhuha (Bunyi Notifikasi)
// Note: Menggunakan Direct Link Google Drive agar bisa diputar audio tag
const ADZAN_URL_SUNRISE = "https://drive.google.com/uc?export=download&id=10EW-zbnQ18WtFOME7m8l1IK8M7CEyJlw";

// Indonesian Mapping for Hijri Months
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

const PrayerTimesScreen: React.FC = () => {
  const navigate = useNavigate();
  
  // State
  const [date, setDate] = useState(new Date());
  const [prayerData, setPrayerData] = useState<PrayerData | null>(null);
  const [locationName, setLocationName] = useState('Mencari Lokasi...');
  const [loading, setLoading] = useState(true);
  
  // Adzan Logic State
  const [isAdzanPlaying, setIsAdzanPlaying] = useState(false);
  const [activePrayerName, setActivePrayerName] = useState('');
  const [nextPrayer, setNextPrayer] = useState<{ name: string, time: string } | null>(null);
  const [countdown, setCountdown] = useState('');
  
  // Audio Ref
  const adzanRef = useRef<HTMLAudioElement | null>(null);

  // Notification Toggles
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('santriai_prayer_notifs');
    return saved ? JSON.parse(saved) : {
      Imsak: false,
      Subuh: true,
      Terbit: false,
      Dhuha: false,
      Zuhur: true,
      Ashar: true,
      Maghrib: true,
      Isya: true
    };
  });

  useEffect(() => {
    localStorage.setItem('santriai_prayer_notifs', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    try {
      // Inisialisasi dengan URL umum terlebih dahulu
      adzanRef.current = new Audio(ADZAN_URL_GENERAL);
      adzanRef.current.preload = "auto";
      
      adzanRef.current.onerror = (e) => {
        console.warn("Audio source error, trying fallback...", e);
      };
    } catch (e) {
      console.error("Audio init error", e);
    }
    
    if ('mediaSession' in navigator) {
      try {
        navigator.mediaSession.setActionHandler('pause', stopAdzan);
        navigator.mediaSession.setActionHandler('stop', stopAdzan);
      } catch (e) {
        console.warn("Media Session warning", e);
      }
    }

    return () => {
      if (adzanRef.current) {
        adzanRef.current.pause();
        adzanRef.current = null;
      }
    };
  }, []);

  const toggleNotification = (key: string) => {
    setNotifications((prev: any) => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
  };

  // --- DATA FETCHING ---
  const fetchData = async () => {
    setLoading(true);
    let lat = -6.2088; // Default Jakarta
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
        console.log("Geolocation denied/error, using default");
        setLocationName("Jakarta (Default)");
      }
    }

    // Fetch with specific date
    try {
        const dateStr = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
        const response = await fetch(
          `https://api.aladhan.com/v1/timings/${dateStr}?latitude=${lat}&longitude=${lng}&method=20`
        );
        const json = await response.json();
        if(json.code === 200) setPrayerData(json.data);
    } catch(e) {
        console.error(e);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [date]);

  // --- COUNTDOWN & ADZAN TRIGGER LOGIC ---
  useEffect(() => {
    if (!prayerData) return;

    const interval = setInterval(() => {
      const now = new Date();
      const currentTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const currentSeconds = now.getSeconds();

      const schedule = [
        { key: 'Imsak', time: prayerData.timings.Imsak },
        { key: 'Subuh', time: prayerData.timings.Fajr },
        { key: 'Terbit', time: prayerData.timings.Sunrise },
        { key: 'Zuhur', time: prayerData.timings.Dhuhr },
        { key: 'Ashar', time: prayerData.timings.Asr },
        { key: 'Maghrib', time: prayerData.timings.Maghrib },
        { key: 'Isya', time: prayerData.timings.Isha },
      ];

      // Add Dhuha (approx 20m after sunrise)
      const sunriseTime = prayerData.timings.Sunrise.split(' ')[0];
      const [sH, sM] = sunriseTime.split(':').map(Number);
      const dhuhaDate = new Date();
      dhuhaDate.setHours(sH, sM + 20);
      const dhuhaTimeStr = `${dhuhaDate.getHours().toString().padStart(2, '0')}:${dhuhaDate.getMinutes().toString().padStart(2, '0')}`;
      schedule.push({ key: 'Dhuha', time: dhuhaTimeStr });

      // Sort by time
      schedule.sort((a, b) => a.time.localeCompare(b.time));

      // 1. Find Next Prayer
      const upcoming = schedule.find(p => p.time > currentTimeStr) || schedule[0];
      setNextPrayer({ name: upcoming.key, time: upcoming.time });

      // 2. Countdown
      const [hStr, mStr] = upcoming.time.split(':');
      const targetTime = new Date();
      targetTime.setHours(parseInt(hStr), parseInt(mStr), 0, 0);
      if (targetTime <= now) targetTime.setDate(targetTime.getDate() + 1);

      const diffMs = targetTime.getTime() - now.getTime();
      const diffH = Math.floor(diffMs / (1000 * 60 * 60));
      const diffM = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const diffS = Math.floor((diffMs % (1000 * 60)) / 1000);
      
      setCountdown(`${diffH.toString().padStart(2, '0')} : ${diffM.toString().padStart(2, '0')} : ${diffS.toString().padStart(2, '0')}`);

      // 3. Trigger Adzan (Only at 00 seconds)
      if (currentSeconds === 0) {
         schedule.forEach(item => {
            if (item.time === currentTimeStr) {
               const isEnabled = notifications[item.key as keyof typeof notifications];
               if (isEnabled && !isAdzanPlaying) {
                  playAdzan(item.key);
               }
            }
         });
      }

    }, 1000);

    return () => clearInterval(interval);
  }, [prayerData, notifications, isAdzanPlaying]);

  const playAdzan = (prayerName: string) => {
    if (adzanRef.current) {
      // Tentukan URL berdasarkan waktu
      let targetUrl = ADZAN_URL_GENERAL;
      
      if (prayerName === 'Subuh') {
        targetUrl = ADZAN_URL_SUBUH;
      } else if (prayerName === 'Imsak') {
        targetUrl = ADZAN_URL_IMSAK;
      } else if (prayerName === 'Terbit' || prayerName === 'Dhuha') {
        targetUrl = ADZAN_URL_SUNRISE;
      }
      
      // Update Source
      adzanRef.current.src = targetUrl;
      adzanRef.current.load();

      // IMPORTANT: Auto-close overlay when audio ends
      adzanRef.current.onended = () => {
        setIsAdzanPlaying(false);
      };

      adzanRef.current.currentTime = 0;
      adzanRef.current.play().then(() => {
        setIsAdzanPlaying(true);
        setActivePrayerName(prayerName);
        
        if ('mediaSession' in navigator && (window as any).MediaMetadata) {
          try {
            navigator.mediaSession.metadata = new (window as any).MediaMetadata({
              title: prayerName === 'Terbit' || prayerName === 'Dhuha' || prayerName === 'Imsak' 
                     ? `Pengingat ${prayerName}` 
                     : `Adzan ${prayerName}`,
              artist: "SantriAI",
              album: locationName,
              artwork: [{ src: 'https://cdn-icons-png.flaticon.com/512/2907/2907150.png', sizes: '512x512', type: 'image/png' }]
            });
          } catch(e) { console.error(e); }
        }
      }).catch((e) => {
          console.error("Playback failed", e);
      });
    }
  };

  const stopAdzan = () => {
    if (adzanRef.current) {
      adzanRef.current.pause();
      adzanRef.current.currentTime = 0;
    }
    setIsAdzanPlaying(false);
    if ('mediaSession' in navigator) navigator.mediaSession.metadata = null;
  };

  const handlePrevDay = () => {
    const newDate = new Date(date);
    newDate.setDate(date.getDate() - 1);
    setDate(newDate);
  };

  const handleNextDay = () => {
    const newDate = new Date(date);
    newDate.setDate(date.getDate() + 1);
    setDate(newDate);
  };

  // Helper for Dhuha time
  const getDisplayTime = (timeStr: string, offset = 0) => {
    if (!timeStr) return '--:--';
    const clean = timeStr.split(' ')[0];
    if (offset === 0) return clean;
    
    const [h, m] = clean.split(':').map(Number);
    const d = new Date();
    d.setHours(h, m + offset);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  const getIndoHijriMonth = (en: string) => HIJRI_MONTHS_ID[en] || en;

  // Config Icon & Label
  const prayerListConfig = [
    { key: 'Imsak', label: 'Imsak', icon: CloudMoon },
    { key: 'Subuh', label: 'Subuh', icon: CloudSun },
    { key: 'Terbit', label: 'Terbit', icon: Sunrise },
    { key: 'Dhuha', label: 'Dhuha', icon: Sun, offset: 20 },
    { key: 'Zuhur', label: 'Zuhur', icon: Sun },
    { key: 'Ashar', label: 'Ashar', icon: CloudSun },
    { key: 'Maghrib', label: 'Maghrib', icon: Sunset },
    { key: 'Isya', label: 'Isya', icon: Moon },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 relative font-sans">
      
      {/* ADZAN OVERLAY */}
      {isAdzanPlaying && (
        <div className="fixed inset-0 z-50 bg-santri-green/95 backdrop-blur-md flex flex-col items-center justify-center text-white animate-in fade-in duration-500">
           <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center mb-6 animate-pulse">
              <Volume2 size={48} />
           </div>
           <h2 className="text-3xl font-bold mb-2 tracking-wide">
             {activePrayerName === 'Imsak' || activePrayerName === 'Terbit' || activePrayerName === 'Dhuha' 
               ? `Waktu ${activePrayerName}` 
               : `Saatnya ${activePrayerName}`}
           </h2>
           <p className="text-white/80 mb-8">{locationName}</p>
           <button onClick={stopAdzan} className="px-8 py-3 bg-white text-santri-green rounded-full font-bold shadow-lg hover:scale-105 transition-transform flex items-center gap-2">
             <XCircle size={20} /> Matikan Suara
           </button>
        </div>
      )}

      {/* HERO SECTION (Updated to Green) */}
      <div className="bg-gradient-to-br from-santri-green to-santri-green-dark dark:from-green-900 dark:to-green-950 text-white pt-2 pb-16 relative overflow-hidden">
         {/* Background Decor */}
         <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')]"></div>
         <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/20 to-transparent"></div>

         {/* Header Bar */}
         <div className="relative z-10 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
               <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors">
                  <ArrowLeft size={24} />
               </button>
               <h1 className="text-xl font-bold">Jadwal Shalat</h1>
            </div>
            <div className="flex items-center gap-1">
               <button onClick={() => {}} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <Share2 size={20} />
               </button>
               <button onClick={() => {}} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <Info size={20} />
               </button>
               <button onClick={() => navigate('/settings')} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <Settings size={20} />
               </button>
            </div>
         </div>

         {/* Hero Info */}
         <div className="relative z-10 text-center mt-4 px-4">
            <div className="flex items-center justify-center gap-2 mb-2 text-green-50 font-medium text-sm drop-shadow-sm">
               <MapPin size={16} className="text-santri-gold fill-santri-gold" />
               <span>{locationName}</span>
            </div>
            
            <h2 className="text-3xl font-bold mb-2 drop-shadow-md tracking-tight">
               {nextPrayer ? `${nextPrayer.name} ${nextPrayer.time.split(' ')[0]} WIB` : '--:--'}
            </h2>
            <p className="text-sm font-medium opacity-90 mb-8 font-mono tracking-wide">
               - {countdown || "00 : 00 : 00"}
            </p>

            {/* Bottom Actions */}
            <div className="flex justify-between items-center px-2 text-xs font-medium text-green-50/90">
               <button onClick={fetchData} className="flex items-center gap-1.5 hover:text-white transition-colors">
                  <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Update
               </button>
               <button onClick={() => navigate('/qibla')} className="flex items-center gap-1.5 hover:text-white transition-colors">
                  <Compass size={14} /> Arah Kiblat
               </button>
            </div>
         </div>
      </div>

      {/* FLOATING DATE CARD */}
      <div className="px-4 -mt-8 relative z-20">
         <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-800 p-4 flex items-center justify-between">
            <button onClick={handlePrevDay} className="p-2 text-slate-400 hover:text-santri-green transition-colors">
               <ChevronLeft size={24} />
            </button>
            <div className="text-center">
               <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base md:text-lg">
                 {date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
               </h3>
               <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {prayerData ? `${prayerData.date.hijri.day} ${getIndoHijriMonth(prayerData.date.hijri.month.en)} ${prayerData.date.hijri.year}` : '...'}
               </p>
            </div>
            <button onClick={handleNextDay} className="p-2 text-slate-400 hover:text-santri-green transition-colors">
               <ChevronRight size={24} />
            </button>
         </div>
      </div>

      {/* PRAYER LIST */}
      <div className="px-4 mt-6 pb-8 space-y-2">
         {prayerData ? (
            prayerListConfig.map((item, idx) => {
               const Icon = item.icon;
               
               // Mapping to API Keys (English) because API returns Dhuhr, Asr, Isha
               const apiKeyMap: Record<string, string> = {
                 'Subuh': 'Fajr',
                 'Terbit': 'Sunrise',
                 'Zuhur': 'Dhuhr',
                 'Ashar': 'Asr',
                 'Isya': 'Isha'
               };
               const apiProperty = apiKeyMap[item.key] || item.key;

               const timeRaw = item.key === 'Dhuha' 
                  ? prayerData.timings.Sunrise 
                  : (prayerData.timings as any)[apiProperty];
               
               const displayTime = getDisplayTime(timeRaw, item.offset);
               const isActive = notifications[item.key as keyof typeof notifications];
               
               return (
                  <div key={idx} className="flex items-center justify-between py-3.5 px-2 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors group">
                     <div className="flex items-center gap-4">
                        <div className="text-slate-400 dark:text-slate-500 group-hover:text-santri-green dark:group-hover:text-santri-gold transition-colors">
                           <Icon size={22} />
                        </div>
                        <span className="font-medium text-slate-700 dark:text-slate-300 text-sm">
                           {item.label}
                        </span>
                     </div>
                     
                     <div className="flex items-center gap-4">
                        <span className="font-bold text-slate-800 dark:text-slate-100 text-sm font-mono">
                           {displayTime}
                        </span>
                        <button 
                          onClick={() => toggleNotification(item.key)}
                          className={`transition-colors ${isActive ? 'text-santri-green dark:text-santri-gold' : 'text-slate-300 dark:text-slate-600'}`}
                        >
                           {isActive ? <Bell size={18} fill="currentColor" className="opacity-80" /> : <BellOff size={18} />}
                        </button>
                     </div>
                  </div>
               );
            })
         ) : (
            <div className="text-center py-10 text-slate-400">Memuat jadwal...</div>
         )}
      </div>

    </div>
  );
};

export default PrayerTimesScreen;
