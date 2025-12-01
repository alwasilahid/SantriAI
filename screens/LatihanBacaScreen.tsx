
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Volume2, 
  ChevronRight, 
  ChevronLeft, 
  RotateCcw, 
  GraduationCap, 
  BookOpen, 
  Star,
  Play,
  Scroll,
  Check
} from 'lucide-react';

// --- DATA ---

type LevelId = 'hijaiyah' | 'harakat' | 'tanwin' | 'kitab';

interface CardData {
  char: string;
  latin: string;
  desc?: string;
  voweled?: string; // Optional: For Kitab Kuning (Full Harakat version)
}

const LEVELS = [
  { 
    id: 'hijaiyah', 
    label: 'Huruf Hijaiyah', 
    desc: 'Pengenalan 28 huruf dasar', 
    color: 'bg-green-50 text-green-600 border-green-200',
    icon: BookOpen
  },
  { 
    id: 'harakat', 
    label: 'Tanda Baca (Harakat)', 
    desc: 'Fathah, Kasrah, Dhommah', 
    color: 'bg-blue-50 text-blue-600 border-blue-200',
    icon: Star
  },
  { 
    id: 'tanwin', 
    label: 'Tanwin', 
    desc: 'An, In, Un', 
    color: 'bg-purple-50 text-purple-600 border-purple-200',
    icon: GraduationCap
  },
  { 
    id: 'kitab', 
    label: 'Kitab Kuning (Gundul)', 
    desc: 'Latihan baca teks tanpa harakat', 
    color: 'bg-amber-50 text-amber-600 border-amber-200',
    icon: Scroll
  },
];

const DATA_HIJAIYAH: CardData[] = [
  { char: 'ا', latin: 'Alif' }, { char: 'ب', latin: 'Ba' }, { char: 'ت', latin: 'Ta' }, { char: 'ث', latin: 'Tsa' },
  { char: 'ج', latin: 'Jim' }, { char: 'ح', latin: 'Ha' }, { char: 'خ', latin: 'Kho' }, { char: 'د', latin: 'Dal' },
  { char: 'ذ', latin: 'Dzal' }, { char: 'ر', latin: 'Ro' }, { char: 'ز', latin: 'Zai' }, { char: 'س', latin: 'Sin' },
  { char: 'ش', latin: 'Syin' }, { char: 'ص', latin: 'Shad' }, { char: 'ض', latin: 'Dhad' }, { char: 'ط', latin: 'Tha' },
  { char: 'ظ', latin: 'Zha' }, { char: 'ع', latin: "'Ain" }, { char: 'غ', latin: "Ghain" }, { char: 'ف', latin: 'Fa' },
  { char: 'ق', latin: 'Qaf' }, { char: 'ك', latin: 'Kaf' }, { char: 'ل', latin: 'Lam' }, { char: 'م', latin: 'Mim' },
  { char: 'ن', latin: 'Nun' }, { char: 'و', latin: 'Wau' }, { char: 'ه', latin: 'Ha' }, { char: 'ي', latin: 'Ya' }
];

const DATA_HARAKAT: CardData[] = [
  { char: 'أَ', latin: 'A', desc: 'Fathah (Bunyi A)' }, 
  { char: 'إِ', latin: 'I', desc: 'Kasrah (Bunyi I)' }, 
  { char: 'أُ', latin: 'U', desc: 'Dhommah (Bunyi U)' },
  { char: 'بَ', latin: 'Ba', desc: 'Ba Fathah' }, 
  { char: 'بِ', latin: 'Bi', desc: 'Ba Kasrah' }, 
  { char: 'بُ', latin: 'Bu', desc: 'Ba Dhommah' },
  { char: 'تَ', latin: 'Ta', desc: 'Ta Fathah' }, 
  { char: 'تِ', latin: 'Ti', desc: 'Ta Kasrah' }, 
  { char: 'تُ', latin: 'Tu', desc: 'Ta Dhommah' },
];

const DATA_TANWIN: CardData[] = [
    { char: 'بً', latin: 'Ban', desc: 'Fathatain' }, 
    { char: 'بٍ', latin: 'Bin', desc: 'Kasratain' }, 
    { char: 'بٌ', latin: 'Bun', desc: 'Dhommatain' },
    { char: 'مً', latin: 'Man', desc: 'Fathatain' }, 
    { char: 'مٍ', latin: 'Min', desc: 'Kasratain' }, 
    { char: 'مٌ', latin: 'Mun', desc: 'Dhommatain' },
];

const DATA_KITAB: CardData[] = [
  { 
    char: 'العلم نافع', 
    voweled: 'اَلْعِلْمُ نَافِعٌ',
    latin: "Al-'ilmu naafi'un", 
    desc: 'Ilmu itu bermanfaat (Mubtada & Khobar)' 
  },
  { 
    char: 'طلب العلم فريضة', 
    voweled: 'طَلَبُ الْعِلْمِ فَرِيْضَةٌ',
    latin: "Tholabul 'ilmi fariidhotun", 
    desc: 'Mencari ilmu itu wajib' 
  },
  { 
    char: 'النية محلها القلب', 
    voweled: 'اَلنِّيَّةُ مَحَلُّهَا الْقَلْبُ',
    latin: "An-niyyatu mahalluhal qolbu", 
    desc: 'Niat itu tempatnya di dalam hati' 
  },
  { 
    char: 'الكلام هو اللفظ المركب', 
    voweled: 'اَلْكَلَامُ هُوَ اللَّفْظُ الْمُرَكَّبُ',
    latin: "Al-kalaamu huwal lafzhul murokkabu", 
    desc: 'Kalam adalah lafadz yang tersusun (Definisi Jurumiyah)' 
  },
  { 
    char: 'الصلاة عماد الدين', 
    voweled: 'اَلصَّلَاةُ عِمَادُ الدِّيْنِ',
    latin: "Ash-sholaatu 'imaadud diini", 
    desc: 'Shalat adalah tiang agama' 
  },
];

const LatihanBacaScreen: React.FC = () => {
  const navigate = useNavigate();
  
  const [activeLevel, setActiveLevel] = useState<LevelId | null>(null);
  const [cards, setCards] = useState<CardData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [completed, setCompleted] = useState(false);

  // --- LOGIC ---

  const startLevel = (levelId: LevelId) => {
    let data: CardData[] = [];
    if (levelId === 'hijaiyah') data = [...DATA_HIJAIYAH];
    else if (levelId === 'harakat') data = [...DATA_HARAKAT];
    else if (levelId === 'tanwin') data = [...DATA_TANWIN];
    else if (levelId === 'kitab') data = [...DATA_KITAB];

    setCards(data);
    setActiveLevel(levelId);
    setCurrentIndex(0);
    setIsFlipped(false);
    setCompleted(false);
  };

  const nextCard = () => {
    setIsFlipped(false);
    if (currentIndex < cards.length - 1) {
      setTimeout(() => setCurrentIndex(prev => prev + 1), 200);
    } else {
      setCompleted(true);
    }
  };

  const prevCard = () => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(prev => prev - 1), 200);
    }
  };

  const playAudio = (text: string) => {
    // Simple browser TTS
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ar-SA'; // Arabic Saudi Arabia
      utterance.rate = 0.8; // Sedikit lambat agar jelas
      window.speechSynthesis.speak(utterance);
    }
  };

  // --- RENDER ---

  // 1. MENU VIEW
  if (!activeLevel) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
        {/* Header */}
        <div className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shadow-sm px-4 py-3 flex items-center gap-3 transition-colors">
            <button 
                onClick={() => navigate(-1)} 
                className="p-2 -ml-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
            >
                <ArrowLeft size={24} />
            </button>
            <h2 className="font-bold text-slate-800 dark:text-slate-100 text-lg flex items-center gap-2">
                <GraduationCap size={20} className="text-green-600" />
                Latihan Baca
            </h2>
        </div>

        <div className="p-4 max-w-lg mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
           
           <div className="bg-green-600 text-white rounded-3xl p-6 mb-6 shadow-lg shadow-green-200 dark:shadow-green-900/20 relative overflow-hidden">
             <div className="relative z-10">
               <h1 className="font-bold text-2xl mb-2">Belajar Ngaji</h1>
               <p className="text-green-100 text-sm">Mulai dari mengenal huruf, tanda baca, hingga lancar membaca Kitab Kuning.</p>
             </div>
             <BookOpen size={100} className="absolute -right-4 -bottom-4 text-white/10 rotate-12" />
           </div>

           <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4">Pilih Tingkatan</h3>
           
           <div className="grid gap-4">
             {LEVELS.map((level) => {
               const Icon = level.icon;
               return (
                <button 
                  key={level.id}
                  onClick={() => startLevel(level.id as LevelId)}
                  className={`bg-white dark:bg-slate-900 rounded-2xl p-5 border shadow-sm hover:shadow-md transition-all text-left flex items-center gap-4 group ${level.color.replace('text-', 'border-').replace('bg-', 'hover:border-')}`}
                >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${level.color}`}>
                       <Icon size={24} />
                    </div>
                    <div className="flex-1">
                       <h4 className="font-bold text-slate-800 dark:text-slate-100 group-hover:text-green-600 transition-colors">{level.label}</h4>
                       <p className="text-xs text-slate-400 dark:text-slate-500">{level.desc}</p>
                    </div>
                    <ChevronRight size={20} className="text-slate-300 group-hover:text-green-500 transition-colors" />
                </button>
               );
             })}
           </div>
        </div>
      </div>
    );
  }

  // 2. FLASHCARD VIEW
  const currentCard = cards[currentIndex];
  const progress = ((currentIndex + 1) / cards.length) * 100;
  
  // Dynamic font size based on text length and level
  const isKitab = activeLevel === 'kitab';
  const fontSizeClass = isKitab 
     ? 'text-4xl leading-relaxed' 
     : 'text-[120px] leading-tight';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 flex flex-col">
       {/* Header */}
       <div className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shadow-sm px-4 py-3 flex items-center justify-between transition-colors">
            <button 
                onClick={() => setActiveLevel(null)} 
                className="p-2 -ml-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
            >
                <ArrowLeft size={24} />
            </button>
            
            <div className="flex-1 px-4">
               <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
               </div>
            </div>

            <span className="text-xs font-bold text-slate-400 font-mono w-12 text-right">
              {currentIndex + 1}/{cards.length}
            </span>
       </div>

       {/* Completed State */}
       {completed ? (
         <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95">
            <div className="w-24 h-24 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mb-6">
               <Star size={48} className="text-yellow-500 fill-yellow-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">Alhamdulillah!</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-8">Kamu telah menyelesaikan sesi ini.</p>
            
            <div className="flex gap-3 w-full max-w-xs">
                <button 
                  onClick={() => setActiveLevel(null)}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Menu Utama
                </button>
                <button 
                  onClick={() => startLevel(activeLevel)}
                  className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  <RotateCcw size={18} /> Ulangi
                </button>
            </div>
         </div>
       ) : (
         /* Card Area */
         <div className="flex-1 flex flex-col items-center justify-center p-6 w-full max-w-md mx-auto">
            
            <div className="relative w-full aspect-[4/5] perspective-1000 group cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
               <div className={`relative w-full h-full duration-500 preserve-3d transition-transform ${isFlipped ? 'rotate-y-180' : ''}`}>
                  
                  {/* FRONT */}
                  <div className="absolute inset-0 backface-hidden bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col items-center justify-center p-8 text-center">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest absolute top-6">
                        {isKitab ? 'BACA GUNDUL' : 'TEBAK HURUF'}
                      </span>
                      <p className={`font-arabic text-slate-800 dark:text-slate-100 mb-8 ${fontSizeClass}`} dir="rtl">
                         {currentCard.char}
                      </p>
                      <p className="text-sm text-slate-400 animate-pulse">Ketuk untuk melihat jawaban</p>
                  </div>

                  {/* BACK */}
                  <div className="absolute inset-0 backface-hidden rotate-y-180 bg-green-50 dark:bg-slate-800 rounded-3xl border-2 border-green-500 dark:border-green-600 shadow-xl flex flex-col items-center justify-center p-8 text-center">
                      <span className="text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-widest absolute top-6">JAWABAN</span>
                      
                      {/* Show Voweled Text if available, else standard char */}
                      <p className={`font-arabic text-slate-800 dark:text-slate-100 mb-4 ${fontSizeClass}`} dir="rtl">
                         {currentCard.voweled || currentCard.char}
                      </p>
                      
                      <h2 className="text-2xl font-bold text-green-700 dark:text-green-400 mb-2">{currentCard.latin}</h2>
                      {currentCard.desc && <p className="text-sm text-slate-500 dark:text-slate-400 italic">{currentCard.desc}</p>}
                      
                      <button 
                         onClick={(e) => { e.stopPropagation(); playAudio(currentCard.voweled || currentCard.char); }}
                         className="mt-8 w-14 h-14 rounded-full bg-white dark:bg-slate-700 shadow-md flex items-center justify-center text-green-600 dark:text-green-400 hover:scale-110 transition-transform"
                      >
                         <Volume2 size={28} />
                      </button>
                  </div>
               </div>
            </div>

            {/* Navigation Controls */}
            <div className="flex items-center gap-6 mt-8 w-full">
               <button 
                 onClick={prevCard}
                 disabled={currentIndex === 0}
                 className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
               >
                 <ChevronLeft size={24} />
               </button>

               <button 
                 onClick={() => playAudio(currentCard.voweled || currentCard.char)}
                 className="flex-1 py-4 bg-green-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-green-200 dark:shadow-green-900/20 hover:bg-green-700 active:scale-95 transition-all flex items-center justify-center gap-2"
               >
                 <Play size={20} fill="currentColor" /> Putar Suara
               </button>

               <button 
                 onClick={nextCard}
                 className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
               >
                 <ChevronRight size={24} />
               </button>
            </div>

         </div>
       )}
    </div>
  );
};

export default LatihanBacaScreen;
