
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { TranslationResult } from '../types';
import { 
  Book, 
  GraduationCap, 
  Languages, 
  Feather, 
  Scale, 
  MessageSquareQuote, 
  Library,
  ArrowLeft,
  Sparkles,
  Copy,
  Check,
  Share2,
  Quote,
  FileText
} from 'lucide-react';
import { generateJson } from '../services/geminiService';

interface ResultScreenProps {
  fontSize: number;
}

// Unified Data Structure for UI
interface AnalysisData {
  originalText: string;
  modernTranslation: string;
  maknaGandul: string;
  nahwuShorof?: string;
  lughah?: string;
  balaghah?: string;
  ushulFiqh?: string;
  hikmah?: string;
  referensi?: string;
  aiExplanation?: string;
}

const RESULT_CARDS = [
  { id: 'modernTranslation', label: 'Terjemahan', sub: 'Bahasa Indonesia', icon: Book, 
    className: 'bg-emerald-50 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30' },
  { id: 'maknaGandul', label: 'Makna Gandul', sub: 'Makna Pesantren', icon: FileText, 
    className: 'bg-amber-50 dark:bg-amber-900/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/30' },
  { id: 'nahwuShorof', label: 'Nahwu & Shorof', sub: 'Analisis Gramatika', icon: GraduationCap, 
    className: 'bg-blue-50 dark:bg-blue-900/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/30' },
  { id: 'lughah', label: 'Lughah', sub: 'Mufradat Sulit', icon: Languages, 
    className: 'bg-orange-50 dark:bg-orange-900/10 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-900/30' },
  { id: 'balaghah', label: 'Balaghah', sub: 'Keindahan Bahasa', icon: Feather, 
    className: 'bg-rose-50 dark:bg-rose-900/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/30' },
  { id: 'ushulFiqh', label: 'Ushul Fiqih', sub: 'Istinbath Hukum', icon: Scale, 
    className: 'bg-indigo-50 dark:bg-indigo-900/10 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/30' },
  { id: 'hikmah', label: 'Hikmah', sub: 'Kesimpulan', icon: MessageSquareQuote, 
    className: 'bg-teal-50 dark:bg-teal-900/10 text-teal-700 dark:text-teal-400 border-teal-200 dark:border-teal-900/30' },
  { id: 'referensi', label: 'Referensi', sub: 'Kitab Serupa', icon: Library, 
    className: 'bg-violet-50 dark:bg-violet-900/10 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-900/30' },
  { id: 'aiExplanation', label: 'Penjelasan AI', sub: 'Analisis Mendalam', icon: Sparkles, 
    className: 'bg-fuchsia-50 dark:bg-fuchsia-900/10 text-fuchsia-700 dark:text-fuchsia-400 border-fuchsia-200 dark:border-fuchsia-900/30' },
];

const ensureString = (value: any): string => {
  if (value === null || value === undefined) return "";
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return value ? "Ya" : "Tidak";
  
  if (Array.isArray(value)) {
    return value.map(v => ensureString(v)).join('\n');
  }
  
  if (typeof value === 'object') {
    return Object.entries(value)
      .map(([k, v]) => {
         if (!isNaN(Number(k))) return ensureString(v);
         return `${k}: ${ensureString(v)}`;
      })
      .join('\n');
  }
  
  return String(value);
};

const ResultScreen: React.FC<ResultScreenProps> = ({ fontSize }) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Incoming State
  const state = location.state || {};
  const { result, mode, query, source, originalText } = state;

  const [data, setData] = useState<AnalysisData | null>(() => {
    if (state.data) return state.data;
    if (result) {
        return {
            originalText: ensureString(result.originalText),
            modernTranslation: ensureString(result.modernTranslation),
            maknaGandul: ensureString(result.maknaGandul),
            nahwuShorof: ensureString(result.nahwuShorof),
            lughah: ensureString(result.lughah),
            balaghah: ensureString(result.balaghah),
            ushulFiqh: ensureString(result.ushulFiqh),
            hikmah: ensureString(result.hikmah),
            referensi: ensureString(result.referensi),
            aiExplanation: ensureString(result.aiExplanation)
        };
    }
    return null;
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [textCopied, setTextCopied] = useState(false);

  // --- 1. INITIALIZE DATA ---
  useEffect(() => {
    if (data) return;

    if (mode === 'kitab' && query) {
      const generateKitabAnalysis = async () => {
        setLoading(true);
        setError(null);
        
        const contextText = originalText && originalText.includes(query) ? originalText : query;

        const systemInstruction = `
          Anda adalah ahli Turath/Kitab Kuning.
          Tugas Anda: Analisis permintaan user.
          Jika input adalah judul bab, buatkan contoh teks Arab (Ibarah) yang representatif.
          Lakukan analisis gramatika, makna gandul, dan penjelasan mendalam.
        `;

        const prompt = `
          Topik/Bab: "${query}" 
          Kitab: "${source || 'Umum'}"
          Konteks: "${contextText}"
          
          Format JSON Wajib (JANGAN GUNAKAN MARKDOWN):
          {
            "originalText": "Teks Arab (Ibarah) lengkap...",
            "modernTranslation": "Terjemahan Indonesia...",
            "maknaGandul": "Terjemahan Makna Gandul...",
            "nahwuShorof": "Analisis...",
            "lughah": "Kosa kata...",
            "balaghah": "Keindahan bahasa...",
            "ushulFiqh": "Hukum...",
            "hikmah": "Pelajaran...",
            "referensi": "Kitab lain...",
            "aiExplanation": "Penjelasan detail (maksimal 3 paragraf)..."
          }
        `;

        try {
          const parsed = await generateJson(prompt, systemInstruction);
          
          const sanitizedData: any = {};
          Object.keys(parsed).forEach(key => {
             sanitizedData[key] = ensureString(parsed[key]);
          });

          if (!sanitizedData.originalText && !sanitizedData.modernTranslation) {
             throw new Error("Data tidak lengkap");
          }

          setData(sanitizedData);
          
          navigate('.', { replace: true, state: { ...state, data: sanitizedData } });

        } catch (error: any) {
          console.error("AI Generation Failed", error);
          
          let friendlyError = "Gagal menganalisis teks. Silakan coba lagi.";
          if (error?.message?.includes('429') || error?.message?.includes('RESOURCE_EXHAUSTED')) {
             friendlyError = "Server sedang sibuk (Quota Exceeded). Mohon tunggu beberapa saat lagi.";
          }

          setError(friendlyError);
          const fallback = {
             originalText: ensureString(originalText || query || "Teks tidak tersedia"),
             modernTranslation: friendlyError,
             maknaGandul: "Gagal memuat.",
             nahwuShorof: "Periksa koneksi internet Anda.",
          };
          setData(fallback as any);
        } finally {
          setLoading(false);
        }
      };
      generateKitabAnalysis();
    }
  }, [result, mode, query, source, originalText, data, navigate, state]);

  const openDetail = (card: typeof RESULT_CARDS[0]) => {
    const content = data ? (data as any)[card.id] : '';
    navigate('/result-detail', { 
        state: { 
            id: card.id,
            label: card.label, 
            sub: card.sub, 
            content: ensureString(content) || "Data tidak tersedia.",
            className: card.className 
        } 
    });
  };

  const handleShare = async (title: string, text: string) => {
    const safeText = ensureString(text);
    if (navigator.share) {
      try {
        await navigator.share({ title, text: safeText });
      } catch (err: any) { 
        if (err.name !== 'AbortError') {
            navigator.clipboard.writeText(safeText);
            alert('Teks disalin ke clipboard.'); 
        }
      }
    } else {
      navigator.clipboard.writeText(safeText);
      alert('Teks disalin ke clipboard');
    }
  };

  const handleBack = () => {
    if (location.key !== "default") {
      navigate(-1);
    } else {
      navigate('/', { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24 font-sans">
        
        {/* Header */}
        <div className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shadow-sm px-4 py-3 flex items-center gap-3 transition-colors">
             <button 
               type="button"
               onClick={handleBack} 
               className="p-2 -ml-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
             >
                <ArrowLeft size={24} />
             </button>
             <h2 className="font-bold text-slate-800 dark:text-slate-100 text-lg flex items-center gap-2">
                <Sparkles size={18} className="text-santri-green dark:text-santri-gold" />
                Hasil Analisis
             </h2>
        </div>

        <div className="px-4 pt-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* Original Text Card */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors relative">
                  <div className="flex justify-between items-start mb-4">
                     <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                        TEKS ASLI
                     </p>
                     <div className="flex gap-1">
                        <button 
                          onClick={() => {
                             if(data?.originalText) {
                                navigator.clipboard.writeText(ensureString(data.originalText));
                                setTextCopied(true);
                                setTimeout(() => setTextCopied(false), 2000);
                             }
                          }}
                          className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                           {textCopied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                        </button>
                        <button 
                          onClick={() => handleShare("Teks Asli", data?.originalText || '')}
                          className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                           <Share2 size={16} />
                        </button>
                     </div>
                  </div>
                  
                  {loading ? (
                    <div className="space-y-3 animate-pulse py-4">
                        <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-full"></div>
                        <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-full"></div>
                        <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-3/4"></div>
                    </div>
                  ) : error ? (
                     <div className="py-4 text-center text-red-500 text-sm bg-red-50 dark:bg-red-900/10 rounded-lg">{error}</div>
                  ) : (
                    <p className="font-arabic text-2xl md:text-3xl text-center leading-[2.2] text-slate-800 dark:text-slate-200" dir="rtl">
                        {ensureString(data?.originalText || "...")}
                    </p>
                  )}
                  
                  {mode === 'kitab' && source && (
                     <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-2">
                        <Quote size={12} className="text-slate-400" />
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium italic">
                            Sumber: {source}
                        </span>
                     </div>
                  )}
              </div>

              {/* Grid Layout Cards */}
              {loading ? (
                 <div className="grid grid-cols-2 gap-4">
                    {[1,2,3,4,5,6].map(i => (
                        <div key={i} className="h-32 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 animate-pulse flex flex-col justify-between">
                            <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
                            <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-3/4"></div>
                        </div>
                    ))}
                 </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 pb-8">
                    {RESULT_CARDS.map((card) => (
                    <button
                        key={card.id}
                        onClick={() => openDetail(card)}
                        className={`rounded-2xl p-5 border shadow-sm hover:shadow-md transition-all text-left flex flex-col justify-between h-[140px] group active:scale-[0.98] ${card.className}`}
                    >
                        <div className="w-10 h-10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                           <card.icon size={28} strokeWidth={1.5} />
                        </div>
                        <div>
                           <h4 className="font-bold text-base leading-tight mb-1">
                              {card.label}
                           </h4>
                           <p className="text-[10px] opacity-80 font-medium uppercase tracking-wide">
                              {card.sub}
                           </p>
                        </div>
                    </button>
                    ))}
                </div>
              )}
        </div>
    </div>
  );
};

export default ResultScreen;
