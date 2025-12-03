
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  BookOpen, 
  ChevronDown, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Smartphone, 
  Check, 
  X, 
  Star,
  Plus,
  Trash2,
  Save,
  History,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface WiridData {
  id: string;
  title: string;
  arab: string;
  latin: string;
  mean: string;
  defaultTarget: number;
  isCustom?: boolean;
}

interface TasbihHistoryItem {
  id: string;
  title: string;
  date: string;
  target: number;
}

// Data Wirid Preset
const WIRID_PRESETS: WiridData[] = [
  { 
    id: 'tasbih', 
    title: 'Tasbih', 
    arab: 'سُبْحَانَ اللهِ', 
    latin: 'Subhanallah', 
    mean: 'Maha Suci Allah', 
    defaultTarget: 33 
  },
  { 
    id: 'tahmid', 
    title: 'Tahmid', 
    arab: 'الْحَمْدُ لِلَّهِ', 
    latin: 'Alhamdulillah', 
    mean: 'Segala Puji Bagi Allah', 
    defaultTarget: 33 
  },
  { 
    id: 'takbir', 
    title: 'Takbir', 
    arab: 'اَللّٰهُ اَكْبَرُ', 
    latin: 'Allahu Akbar', 
    mean: 'Allah Maha Besar', 
    defaultTarget: 33 
  },
  { 
    id: 'tahlil', 
    title: 'Tahlil', 
    arab: 'لَا إِلَهَ إِلَّا اللهُ', 
    latin: 'Laa Ilaaha Illallah', 
    mean: 'Tiada Tuhan Selain Allah', 
    defaultTarget: 33 
  },
  { 
    id: 'istighfar', 
    title: 'Istighfar', 
    arab: 'أَسْتَغْفِرُ اللهَ', 
    latin: 'Astaghfirullah', 
    mean: 'Aku memohon ampun kepada Allah', 
    defaultTarget: 33 
  },
  { 
    id: 'sholawat', 
    title: 'Sholawat Nabi', 
    arab: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ', 
    latin: 'Allahumma Sholli \'ala Muhammad', 
    mean: 'Ya Allah, limpahkanlah rahmat kepada Nabi Muhammad', 
    defaultTarget: 33 
  }
];

const TasbihScreen: React.FC = () => {
  const navigate = useNavigate();
  
  // Load Session Logic
  const getSessionData = () => {
    try {
      const saved = localStorage.getItem('santriai_tasbih_session');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  };

  const sessionData = getSessionData();

  // State
  const [currentWirid, setCurrentWirid] = useState<WiridData>(sessionData?.currentWirid || WIRID_PRESETS[0]);
  const [customWirids, setCustomWirids] = useState<WiridData[]>(() => {
    const saved = localStorage.getItem('santriai_custom_wirids');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [history, setHistory] = useState<TasbihHistoryItem[]>(() => {
    const saved = localStorage.getItem('santriai_tasbih_history');
    return saved ? JSON.parse(saved) : [];
  });

  const [count, setCount] = useState(sessionData?.count || 0);
  const [target, setTarget] = useState(sessionData?.target || 33);
  
  const [vibration, setVibration] = useState(true);
  const [sound, setSound] = useState(false); 
  const [showSelector, setShowSelector] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  // Add Custom Wirid State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newWirid, setNewWirid] = useState({
    title: '',
    arab: '',
    latin: '',
    mean: '',
    target: '33'
  });

  // Persist Current Session (Count, Target, Wirid)
  useEffect(() => {
    const session = {
      count,
      target,
      currentWirid
    };
    localStorage.setItem('santriai_tasbih_session', JSON.stringify(session));
  }, [count, target, currentWirid]);

  // Persist Custom Wirids
  useEffect(() => {
    localStorage.setItem('santriai_custom_wirids', JSON.stringify(customWirids));
  }, [customWirids]);

  // Persist History
  useEffect(() => {
    localStorage.setItem('santriai_tasbih_history', JSON.stringify(history));
  }, [history]);

  // Constants for SVG Circle
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const progress = target > 0 ? (count / target) : 0;
  const strokeDashoffset = circumference - progress * circumference;

  // Haptic Feedback
  const triggerHaptic = (pattern: number | number[] = 15) => {
    if (vibration && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  };

  // Sound Feedback (Web Audio API)
  const playClickSound = () => {
    if (!sound) return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.1);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch (e) {
      console.error("Audio play failed", e);
    }
  };

  const addToHistory = () => {
    const newItem: TasbihHistoryItem = {
      id: uuidv4(),
      title: currentWirid.title,
      target: target,
      date: new Date().toISOString()
    };
    setHistory(prev => [newItem, ...prev]);
  };

  const handleTap = () => {
    if (showCompletionModal) return;

    const newCount = count + 1;
    
    if (newCount === target) {
      setCount(newCount);
      triggerHaptic([50, 50, 50]); // Success vibration
      playClickSound(); // Play sound on success too
      addToHistory(); // Save to history automatically
      setTimeout(() => setShowCompletionModal(true), 300); // Small delay for effect
    } else {
      setCount(newCount);
      triggerHaptic(15); // Light tick
      playClickSound();
    }
  };

  const handleReset = () => {
    setCount(0);
    triggerHaptic(30);
  };

  const handleWiridChange = (wirid: WiridData) => {
    setCurrentWirid(wirid);
    setTarget(wirid.defaultTarget);
    setCount(0);
    setShowSelector(false);
  };

  const handleContinue = () => {
    setShowCompletionModal(false);
    setCount(0); // Reset for next cycle
  };

  const handleSaveCustom = () => {
    if (!newWirid.title || !newWirid.latin) {
      alert("Judul dan bacaan Latin wajib diisi.");
      return;
    }

    const wiridToAdd: WiridData = {
      id: uuidv4(),
      title: newWirid.title,
      arab: newWirid.arab || '-',
      latin: newWirid.latin,
      mean: newWirid.mean || '-',
      defaultTarget: parseInt(newWirid.target) || 33,
      isCustom: true
    };

    setCustomWirids(prev => [...prev, wiridToAdd]);
    setCurrentWirid(wiridToAdd);
    setTarget(wiridToAdd.defaultTarget);
    setCount(0);
    
    // Reset Form
    setNewWirid({ title: '', arab: '', latin: '', mean: '', target: '33' });
    setShowAddForm(false);
    setShowSelector(false);
  };

  const handleDeleteCustom = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Hapus wirid ini?")) {
      setCustomWirids(prev => prev.filter(w => w.id !== id));
      if (currentWirid.id === id) {
        handleWiridChange(WIRID_PRESETS[0]);
      }
    }
  };

  const clearHistory = () => {
    if (confirmClear) {
      setHistory([]);
      setConfirmClear(false);
    } else {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24 flex flex-col relative overflow-hidden">
      
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shadow-sm px-4 py-3 flex items-center justify-between shrink-0">
        <button 
          onClick={() => navigate(-1)} 
          className="p-2 -ml-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
        >
          <ArrowLeft size={24} />
        </button>
        <h2 className="font-bold text-santri-green dark:text-santri-gold text-lg">
          Tasbih Digital
        </h2>
        <button 
          onClick={() => setShowHistory(true)} 
          className="p-2 -mr-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
        >
          <History size={24} />
        </button>
      </div>

      <div className="flex-1 flex flex-col px-6 py-4 items-center max-w-md mx-auto w-full h-full justify-between sm:justify-evenly">
        
        {/* Wirid Selector Card */}
        <div className="w-full shrink-0 mb-2 sm:mb-0">
          <button 
            onClick={() => setShowSelector(true)}
            className="w-full bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-800 flex items-center justify-between group active:scale-[0.98] transition-all"
          >
             <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-green-50 dark:bg-green-900/20 text-santri-green flex items-center justify-center">
                   <BookOpen size={20} />
                </div>
                <div className="text-left">
                   <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Wirid Saat Ini</span>
                   <span className="text-base font-bold text-slate-800 dark:text-slate-100 line-clamp-1">{currentWirid.title}</span>
                </div>
             </div>
             <ChevronDown size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Arabic Display */}
        <div className="text-center flex-1 flex flex-col justify-center items-center w-full min-h-[120px] max-h-[220px] animate-in fade-in slide-in-from-top-4 duration-500">
           <p className="font-arabic text-3xl sm:text-4xl leading-loose text-slate-800 dark:text-slate-100 mb-2 line-clamp-2 px-2" dir="rtl">
             {currentWirid.arab !== '-' ? currentWirid.arab : ''}
           </p>
           <p className="text-santri-green dark:text-santri-gold font-medium text-sm sm:text-base mb-1 px-4 line-clamp-2 leading-tight">{currentWirid.latin}</p>
           {currentWirid.mean !== '-' && (
             <p className="text-slate-500 dark:text-slate-400 text-xs italic px-4 line-clamp-2">"{currentWirid.mean}"</p>
           )}
        </div>

        {/* Circular Counter */}
        <div className="relative my-2 sm:my-6 shrink-0">
            {/* Responsive SVG Ring */}
            <div className="relative w-64 h-64 sm:w-80 sm:h-80 transition-all duration-300">
               <svg className="w-full h-full transform -rotate-90 drop-shadow-xl" viewBox="0 0 260 260">
                  {/* Gradient Definition */}
                  <defs>
                    <linearGradient id="tasbihGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#008000" />
                      <stop offset="100%" stopColor="#D4AF37" />
                    </linearGradient>
                  </defs>

                  {/* Background Circle */}
                  <circle
                    cx="130"
                    cy="130"
                    r={radius}
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="white"
                    className="text-slate-100 dark:text-slate-800 dark:fill-slate-900"
                  />
                  {/* Progress Circle with Gradient */}
                  <circle
                    cx="130"
                    cy="130"
                    r={radius}
                    stroke="url(#tasbihGradient)"
                    strokeWidth="12"
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className="transition-all duration-300 ease-out"
                  />
               </svg>
               
                {/* Clickable Area */}
               <button 
                  onClick={handleTap}
                  className="absolute inset-4 rounded-full bg-santri-green dark:bg-santri-green-dark shadow-[inset_0_4px_20px_rgba(0,0,0,0.2)] active:scale-95 transition-transform flex flex-col items-center justify-center text-white border-4 border-white dark:border-slate-800 z-10"
               >
                  <span className="text-8xl font-bold tracking-tighter drop-shadow-md">
                     {count}
                  </span>
                  <div className="flex flex-col items-center mt-2 opacity-90">
                     <span className="text-xs font-medium bg-white/20 px-3 py-1 rounded-full mb-1">Target: {target}</span>
                     <span className="text-[10px] tracking-widest uppercase font-bold text-white/60">TEKAN</span>
                  </div>
               </button>
            </div>
        </div>

        {/* Bottom Controls */}
        <div className="flex items-center gap-4 w-full justify-center shrink-0 mb-2 sm:mb-0">
            <button 
               onClick={() => setVibration(!vibration)}
               className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all ${
                  vibration 
                  ? 'bg-green-50 border-santri-green text-santri-green' 
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
               }`}
            >
               <Smartphone size={20} className={vibration ? 'animate-pulse' : ''} />
            </button>
            
            <button 
               onClick={() => setSound(!sound)}
               className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all ${
                  sound 
                  ? 'bg-green-50 border-santri-green text-santri-green' 
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
               }`}
            >
               {sound ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </button>

            <button 
               onClick={handleReset}
               className="flex-1 h-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95 transition-all"
            >
               <RotateCcw size={18} /> Reset
            </button>
        </div>
      </div>

      {/* MODAL: HISTORY */}
      {showHistory && (
         <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 pb-6 animate-in slide-in-from-bottom-full duration-300 flex flex-col max-h-[80vh]">
               <div className="flex justify-between items-center mb-4 shrink-0">
                  <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <History size={20} className="text-santri-green" />
                    Riwayat Dzikir
                  </h3>
                  <button onClick={() => setShowHistory(false)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500">
                     <X size={20} />
                  </button>
               </div>

               <div className="overflow-y-auto flex-1 min-h-0 no-scrollbar space-y-3 pb-8">
                  {history.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                       <Calendar size={40} className="mb-2 opacity-50" />
                       <p className="text-sm">Belum ada riwayat dzikir.</p>
                    </div>
                  ) : (
                    history.map((item) => (
                      <div key={item.id} className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 flex justify-between items-center shrink-0">
                         <div>
                            <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">{item.title}</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {new Date(item.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} • {new Date(item.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                         </div>
                         <div className="px-3 py-1 bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 text-xs font-bold text-santri-green dark:text-santri-gold">
                            {item.target}x
                         </div>
                      </div>
                    ))
                  )}
               </div>

               {history.length > 0 && (
                 <button 
                   onClick={clearHistory}
                   className={`mt-4 w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shrink-0 ${
                     confirmClear 
                       ? 'bg-red-600 text-white hover:bg-red-700' 
                       : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30'
                   }`}
                 >
                   <Trash2 size={18} /> {confirmClear ? "Tekan Sekali Lagi untuk Konfirmasi" : "Hapus Riwayat"}
                 </button>
               )}
            </div>
         </div>
      )}

      {/* MODAL: SELECTOR & ADD FORM (UPDATED TO PREVENT CUTOFF) */}
      {showSelector && (
         <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            {/* Overlay Click to Close */}
            <div className="absolute inset-0" onClick={() => { setShowSelector(false); setShowAddForm(false); }}></div>
            
            <div className="bg-white dark:bg-slate-900 w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl relative z-10 flex flex-col max-h-[85vh] animate-in slide-in-from-bottom-full duration-300">
               
               {/* Header - Fixed at Top of Modal */}
               <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
                  <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">
                    {showAddForm ? 'Tambah Wirid Baru' : 'Pilih Wirid'}
                  </h3>
                  <button onClick={() => { setShowSelector(false); setShowAddForm(false); }} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                     <X size={20} />
                  </button>
               </div>

               {/* Scrollable Content */}
               {showAddForm ? (
                 <div className="overflow-y-auto flex-1 p-5 space-y-4">
                    <div>
                       <label className="text-xs font-bold text-slate-500 block mb-1">Judul Wirid *</label>
                       <input 
                         type="text" 
                         className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:border-santri-green text-slate-800 dark:text-slate-200"
                         placeholder="Contoh: Sholawat Nariyah"
                         value={newWirid.title}
                         onChange={e => setNewWirid({...newWirid, title: e.target.value})}
                       />
                    </div>
                    <div>
                       <label className="text-xs font-bold text-slate-500 block mb-1">Target Hitungan</label>
                       <input 
                         type="number" 
                         className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:border-santri-green text-slate-800 dark:text-slate-200"
                         placeholder="33"
                         value={newWirid.target}
                         onChange={e => setNewWirid({...newWirid, target: e.target.value})}
                       />
                    </div>
                    <div>
                       <label className="text-xs font-bold text-slate-500 block mb-1">Teks Arab (Opsional)</label>
                       <textarea 
                         className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:border-santri-green font-arabic text-right text-slate-800 dark:text-slate-200"
                         placeholder="Ketik teks Arab..."
                         rows={2}
                         value={newWirid.arab}
                         onChange={e => setNewWirid({...newWirid, arab: e.target.value})}
                         dir="rtl"
                       />
                    </div>
                    <div>
                       <label className="text-xs font-bold text-slate-500 block mb-1">Teks Latin *</label>
                       <textarea 
                         className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:border-santri-green text-slate-800 dark:text-slate-200"
                         placeholder="Bacaan latin..."
                         rows={2}
                         value={newWirid.latin}
                         onChange={e => setNewWirid({...newWirid, latin: e.target.value})}
                       />
                    </div>
                    <div>
                       <label className="text-xs font-bold text-slate-500 block mb-1">Arti / Makna (Opsional)</label>
                       <textarea 
                         className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:border-santri-green text-slate-800 dark:text-slate-200"
                         placeholder="Terjemahan..."
                         rows={2}
                         value={newWirid.mean}
                         onChange={e => setNewWirid({...newWirid, mean: e.target.value})}
                       />
                    </div>

                    <div className="flex gap-3 pt-4 pb-2">
                       <button 
                         onClick={() => setShowAddForm(false)}
                         className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                       >
                         Batal
                       </button>
                       <button 
                         onClick={handleSaveCustom}
                         className="flex-1 py-3 bg-santri-green text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-green-700 transition-colors"
                       >
                         <Save size={18} /> Simpan
                       </button>
                    </div>
                 </div>
               ) : (
                 <div className="overflow-y-auto flex-1 p-5 space-y-5">
                    {/* Add Button */}
                    <button 
                      onClick={() => setShowAddForm(true)}
                      className="w-full py-4 border-2 border-dashed border-green-300 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10 rounded-xl flex items-center justify-center gap-2 text-green-700 dark:text-green-400 font-bold hover:bg-green-50 dark:hover:bg-green-900/20 transition-all active:scale-[0.98]"
                    >
                       <Plus size={20} /> Buat Wirid Sendiri
                    </button>

                    {/* Lists Container */}
                    <div>
                       <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 tracking-wider">Pustaka Wirid</h4>
                       <div className="space-y-3">
                          {/* Custom Wirids */}
                          {customWirids.map((item) => (
                             <button
                                key={item.id}
                                onClick={() => handleWiridChange(item)}
                                className={`w-full p-4 rounded-xl flex items-center justify-between border-2 transition-all group text-left ${
                                   currentWirid.id === item.id 
                                   ? 'bg-green-50 dark:bg-green-900/10 border-green-500' 
                                   : 'bg-slate-50 dark:bg-slate-800 border-transparent hover:bg-slate-100 dark:hover:bg-slate-700'
                                }`}
                             >
                                <div>
                                   <span className={`font-bold block text-sm mb-1 ${currentWirid.id === item.id ? 'text-green-700 dark:text-green-400' : 'text-slate-700 dark:text-slate-200'}`}>
                                      {item.title}
                                   </span>
                                   <span className="text-xs text-slate-500 dark:text-slate-400">Target: {item.defaultTarget}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                   {currentWirid.id === item.id && (
                                       <div className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center shadow-sm">
                                          <Check size={14} strokeWidth={3} />
                                       </div>
                                   )}
                                   <div 
                                     onClick={(e) => handleDeleteCustom(item.id, e)}
                                     className="p-2 rounded-full text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                   >
                                      <Trash2 size={16} />
                                   </div>
                                </div>
                             </button>
                          ))}

                          {/* Preset Wirids */}
                          {WIRID_PRESETS.map((item) => (
                             <button
                                key={item.id}
                                onClick={() => handleWiridChange(item)}
                                className={`w-full p-4 rounded-xl flex items-center justify-between border-2 transition-all text-left ${
                                   currentWirid.id === item.id 
                                   ? 'bg-green-50 dark:bg-green-900/10 border-green-500' 
                                   : 'bg-slate-50 dark:bg-slate-800 border-transparent hover:bg-slate-100 dark:hover:bg-slate-700'
                                }`}
                             >
                                <div>
                                   <span className={`font-bold block text-sm mb-1 ${currentWirid.id === item.id ? 'text-green-700 dark:text-green-400' : 'text-slate-700 dark:text-slate-200'}`}>
                                      {item.title}
                                   </span>
                                   <span className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{item.latin}</span>
                                </div>
                                {currentWirid.id === item.id && (
                                    <div className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center shadow-sm">
                                        <Check size={14} strokeWidth={3} />
                                    </div>
                                )}
                             </button>
                          ))}
                       </div>
                    </div>
                 </div>
               )}
            </div>
         </div>
      )}

      {/* MODAL: TARGET REACHED */}
      {showCompletionModal && (
         <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl relative animate-in zoom-in-95 duration-300 text-center border-t-4 border-santri-gold">
                
                {/* Success Icon */}
                <div className="w-20 h-20 bg-amber-50 dark:bg-amber-900/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                   <Star size={40} className="text-amber-400 fill-amber-400" />
                </div>

                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">Target Tercapai!</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Alhamdulillah, Anda telah menyelesaikan wirid.</p>

                {/* Doa Card */}
                <div className="bg-[#FFF9E6] dark:bg-amber-950/30 rounded-2xl p-5 border border-amber-100 dark:border-amber-900/30 mb-6">
                   <span className="text-xs font-bold text-amber-600 dark:text-amber-500 uppercase tracking-widest mb-3 block">Doa Penutup Majelis</span>
                   <p className="font-arabic text-xl leading-loose text-slate-800 dark:text-slate-100 text-center mb-3" dir="rtl">
                     سُبْحَانَكَ اللَّهُمَّ وَبِحَمْدِكَ، أَشْهَدُ أَنْ لَا إِلَهَ إِلَّا أَنْتَ، أَسْتَغْفِرُكَ وَأَتُوبُ إِلَيْكَ
                   </p>
                   <p className="text-xs text-amber-800/80 dark:text-amber-200/80 italic leading-relaxed">
                     "Maha Suci Engkau Ya Allah, dengan memuji-Mu, aku bersaksi bahwa tidak ada Tuhan selain Engkau, aku memohon ampunan dan bertaubat kepada-Mu."
                   </p>
                </div>

                <button 
                  onClick={handleContinue}
                  className="w-full py-3.5 bg-santri-green text-white rounded-xl font-bold shadow-lg shadow-green-200 dark:shadow-green-900/30 active:scale-95 transition-transform"
                >
                  Tutup & Lanjutkan
                </button>
            </div>
         </div>
      )}

    </div>
  );
};

export default TasbihScreen;
