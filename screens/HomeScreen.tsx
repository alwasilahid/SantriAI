import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useHistory } from '../contexts/HistoryContext';
import { 
  Sparkles, 
  History as HistoryIcon, 
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
  Clock,
  Tv
} from 'lucide-react';
import HistoryScreen from './HistoryScreen';

interface HomeScreenProps {
  fontSize: number;
}

const FEATURE_MENU = [
  { icon: Calendar, label: "Kalender", color: "bg-orange-100 text-orange-600 border-orange-200", path: "/calendar" },
  { icon: Coins, label: "Hitung Zakat", color: "bg-indigo-100 text-indigo-600 border-indigo-200", path: "/zakat" },
  { icon: Calculator, label: "Waris", color: "bg-pink-100 text-pink-600 border-pink-200", path: "/waris" },
  { icon: Activity, label: "Tasbih", color: "bg-teal-100 text-teal-600 border-teal-200", path: "/tasbih" },
  { icon: HeartHandshake, label: "Doa-doa", color: "bg-cyan-100 text-cyan-600 border-cyan-200", path: "/doa" },
  { icon: Brain, label: "Cerdas Cermat", color: "bg-purple-100 text-purple-600 border-purple-200", path: "/quiz" },
  { icon: GraduationCap, label: "Latihan Baca", color: "bg-green-100 text-green-600 border-green-200", path: "/latihan" },
  { icon: Compass, label: "Arah Kiblat", color: "bg-blue-100 text-blue-600 border-blue-200", path: "/qibla" },
  { icon: Tv, label: "TV Mekkah", color: "bg-red-100 text-red-600 border-red-200", path: "/tv-mekkah" },
];

// Expanded list for Search
const SEARCHABLE_FEATURES = [
  ...FEATURE_MENU,
  { icon: Book, label: "Kitab Kuning", color: "bg-amber-100 text-amber-600 border-amber-200", path: "/kitab" },
  { icon: BookOpen, label: "Al-Quran", color: "bg-emerald-100 text-emerald-600 border-emerald-200", path: "/quran" },
  { icon: Scroll, label: "Hadis", color: "bg-blue-100 text-blue-600 border-blue-200", path: "/hadis" },
  { icon: Clock, label: "Jadwal Sholat", color: "bg-green-100 text-green-600 border-green-200", path: "/sholat" },
  { icon: User, label: "Biografi Ulama", color: "bg-slate-100 text-slate-600 border-slate-200", path: "/biography" },
  { icon: Settings, label: "Pengaturan", color: "bg-slate-100 text-slate-600 border-slate-200", path: "/settings" },
];

const HomeScreen: React.FC<HomeScreenProps> = ({ fontSize }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const historyRef = useRef<HTMLDivElement>(null);
  
  // Use History Context
  const { history } = useHistory();
  
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
      
      {/* Main Content */}
      <div className="px-4 pt-6">
        <div className="animate-in fade-in slide-in-from-left-4 duration-300">
          
          {/* Search Bar */}
          <div className="mb-6 relative group z-50">
            <div className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-santri-green transition-colors">
                <Search size={22} strokeWidth={3} />
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
              className="w-full pl-12 pr-10 py-3.5 bg-white dark:bg-slate-900 rounded-2xl border-2 border-santri-green/60 dark:border-santri-gold focus:outline-none focus:border-santri-green dark:focus:border-santri-gold focus:ring-4 focus:ring-santri-green/10 dark:focus:ring-santri-gold/10 transition-all shadow-sm text-sm font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
            />
            {searchQuery && (
              <button 
                onClick={() => { setSearchQuery(''); setIsSearching(false); }}
                className="absolute right-3 top-3.5 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-full transition-colors"
              >
                <X size={16} strokeWidth={3} />
              </button>
            )}

            {/* Dropdown Results */}
            {isSearching && searchQuery && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border-2 border-slate-100 dark:border-slate-800 overflow-hidden max-h-[60vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                    
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
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${f.color.replace('text-', 'bg-opacity-20 bg-').replace('border-', 'border-opacity-0 ')}`}>
                                            <Icon size={18} strokeWidth={3} className={f.color.split(' ')[1]} />
                                        </div>
                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{f.label}</span>
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
                                        <HistoryIcon size={18} strokeWidth={3} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{h.title}</p>
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
                                <Sparkles size={18} strokeWidth={3} />
                            </div>
                            <div className="flex-1">
                                <span className="text-sm font-bold text-slate-800 dark:text-slate-100 block">Tanya AI (Penjelasan)</span>
                                <span className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">"{searchQuery}"</span>
                            </div>
                            <ArrowRight size={18} strokeWidth={3} className="text-slate-400 group-hover:text-santri-green" />
                        </button>
                    </div>
                </div>
            )}
          </div>

          {/* Input Trigger (Redirects to Input Screen) */}
          <button
             onClick={() => navigate('/input')}
             className="w-full bg-white dark:bg-slate-900 rounded-2xl p-4 border-2 border-santri-green/60 dark:border-santri-gold shadow-sm flex items-center justify-between group hover:border-santri-green dark:hover:border-santri-gold transition-all mb-6 relative z-10"
          >
             <div className="flex items-center gap-3">
               <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 group-hover:bg-santri-green group-hover:text-white transition-colors">
                  <Keyboard size={24} strokeWidth={3} />
               </div>
               <div className="text-left">
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm group-hover:text-santri-green dark:group-hover:text-santri-gold transition-colors">Mulai Menerjemahkan</h3>
                  <p className="text-xs text-slate-400 font-medium">Ketuk untuk mengetik Arab atau Indonesia</p>
               </div>
             </div>
             
             <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-700">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Input</span>
                <Sparkles size={16} strokeWidth={3} className="text-santri-gold" />
             </div>
          </button>

            {/* FEATURE GRID (ICONS) */}
            <div className="mb-6 grid grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500 relative z-0">
              {FEATURE_MENU.map((item, idx) => {
                const Icon = item.icon;
                // Parse color string to extract border class
                const parts = item.color.split(' ');
                const borderClass = parts.find(c => c.startsWith('border-')) || 'border-transparent';
                const bgTextClass = item.color.replace(borderClass, '').trim();

                return (
                  <button key={idx} className="flex flex-col items-center gap-2 group" onClick={() => handleFeatureClick(item)}>
                    <div className={`w-14 h-14 rounded-2xl border-2 ${borderClass} ${bgTextClass.replace('bg-', 'bg-opacity-20 bg-').replace('text-', 'dark:bg-opacity-10 dark:text-')} flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform ${bgTextClass.split(' ')[0]} dark:bg-slate-800`}>
                        <Icon size={26} strokeWidth={3} className={bgTextClass.split(' ')[1]} />
                    </div>
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 text-center leading-tight">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>

          {/* HISTORY SECTION (Moved to Bottom) */}
          <div ref={historyRef} className="mt-8 mb-8 border-t-2 border-slate-100 dark:border-slate-800 pt-6">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-lg mb-4 flex items-center gap-2">
              <HistoryIcon size={22} strokeWidth={3} className="text-santri-green dark:text-santri-gold" /> 
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
