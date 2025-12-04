import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Toast from '../components/Toast';
import { 
  ArrowLeft, 
  Sparkles, 
  Loader2, 
  BookOpen, 
  Lightbulb, 
  List, 
  AlignLeft, 
  Quote, 
  Share2, 
  Copy, 
  Check,
  Search,
  AlertCircle
} from 'lucide-react';
import { askReligiousQuery } from '../services/geminiService';

interface ExplanationData {
  title: string;
  summary: string;
  points: string[];
  analysis: string;
  dalil?: string;
  source?: string;
}

const ExplanationScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { query } = (location.state as { query: string }) || {};

  const [data, setData] = useState<ExplanationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [rawText, setRawText] = useState('');
  const [copied, setCopied] = useState(false);
  const isSharing = useRef(false);

  // Toast State
  const [toast, setToast] = useState({ show: false, message: '' });
  const showToast = (message: string) => setToast({ show: true, message });

  useEffect(() => {
    if (!query) {
      navigate('/kitab');
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      
      const prompt = `
        Bertindaklah sebagai ahli Kitab Kuning dan Ulama yang mendalam ilmunya.
        Analisis pertanyaan/topik berikut: "${query}"
        
        Sajikan jawaban dalam format JSON valid (tanpa markdown \`\`\`) dengan struktur:
        {
          "title": "Judul Topik/Bab yang Relevan (Singkat Padat)",
          "summary": "Ringkasan inti dari penjelasan (1-2 kalimat)",
          "points": ["Poin utama 1", "Poin utama 2", "Poin utama 3", "dst..."],
          "analysis": "Penjelasan mendalam dan komprehensif (paragraf panjang, boleh ada line break)",
          "dalil": "Teks Arab/Ibarah Kitab yang relevan (jika ada, jika tidak kosongkan)",
          "source": "Nama Kitab / Referensi Rujukan"
        }
      `;

      try {
        const result = await askReligiousQuery('kitab', prompt);
        setRawText(result);

        // Clean JSON formatting
        const cleanJson = result.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');
        
        try {
            const parsed = JSON.parse(cleanJson);
            setData(parsed);
        } catch (parseError) {
            console.error("JSON Parse Error", parseError);
            // Fallback: Create structured data from raw text if JSON fails
            setData({
                title: "Analisis Kitab",
                summary: "Berikut adalah penjelasan yang ditemukan.",
                points: [],
                analysis: result,
                source: "Analisis AI Santri"
            });
        }
      } catch (error) {
        console.error("AI Error", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [query, navigate]);

  const handleCopy = () => {
    const text = data 
      ? `*${data.title}*\n\n${data.summary}\n\n${data.analysis}\n\nSumber: ${data.source}`
      : rawText;
    navigator.clipboard.writeText(text);
    setCopied(true);
    showToast("Teks disalin ke clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (isSharing.current) return;
    isSharing.current = true;

    const text = data 
      ? `*${data.title}*\n\n${data.summary}\n\n${data.analysis}\n\nSumber: ${data.source}`
      : rawText;

    if (navigator.share) {
      try {
        await navigator.share({
          title: data?.title || 'Penjelasan Kitab',
          text: text,
        });
      } catch (err: any) {
        if (err.name !== 'AbortError') {
           handleCopy();
        }
      } finally {
        isSharing.current = false;
      }
    } else {
      handleCopy();
      isSharing.current = false;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24 font-sans">
      <Toast message={toast.message} isVisible={toast.show} onClose={() => setToast(prev => ({ ...prev, show: false }))} />
      
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shadow-sm px-4 py-3 flex items-center justify-between transition-colors">
        <div className="flex items-center gap-3">
            <button 
                onClick={() => navigate(-1)} 
                className="p-2 -ml-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
            >
                <ArrowLeft size={24} />
            </button>
            <h2 className="font-bold text-slate-800 dark:text-slate-100 text-lg flex items-center gap-2">
                <Sparkles size={20} className="text-amber-500" />
                Penjelasan AI
            </h2>
        </div>
        {!loading && data && (
            <div className="flex gap-1">
                <button onClick={handleCopy} className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                    {copied ? <Check size={20} className="text-green-500" /> : <Copy size={20} />}
                </button>
                <button onClick={handleShare} className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                    <Share2 size={20} />
                </button>
            </div>
        )}
      </div>

      <div className="p-4 max-w-2xl mx-auto space-y-6">
        
        {loading ? (
             <div className="flex flex-col items-center justify-center py-32">
                <Loader2 size={48} className="text-santri-green animate-spin mb-4" />
                <p className="text-slate-500 text-sm animate-pulse font-medium">Sedang membedah kitab...</p>
                <p className="text-xs text-slate-400 mt-2 text-center max-w-xs truncate">"{query}"</p>
             </div>
        ) : data ? (
             <div className="space-y-5 animate-in slide-in-from-bottom-8 duration-500">
                
                {/* 1. TITLE CARD */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-amber-100 dark:border-amber-900/30 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <BookOpen size={100} className="text-amber-500" />
                    </div>
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider mb-2 block flex items-center gap-2">
                        <Search size={14} /> Topik Pembahasan
                    </span>
                    <h1 className="text-2xl font-serif font-bold text-slate-800 dark:text-slate-100 leading-tight mb-2 relative z-10">
                        {data.title}
                    </h1>
                    {data.source && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 relative z-10">
                            <BookOpen size={12} />
                            Rujukan: {data.source}
                        </div>
                    )}
                </div>

                {/* 2. SUMMARY CARD */}
                <div className="bg-amber-50 dark:bg-amber-900/10 p-5 rounded-2xl border border-amber-100 dark:border-amber-900/30">
                    <div className="flex items-center gap-3 mb-3">
                        <Lightbulb size={20} className="text-amber-600 dark:text-amber-500" />
                        <h3 className="font-bold text-slate-800 dark:text-slate-100">Intisari</h3>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-sm">
                        {data.summary}
                    </p>
                </div>

                {/* 3. DALIL CARD (Optional) */}
                {data.dalil && (
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <Quote size={20} className="text-santri-green" />
                            <h3 className="font-bold text-slate-800 dark:text-slate-100">Ibarah / Dalil</h3>
                        </div>
                        <p className="font-arabic text-2xl leading-loose text-right text-slate-800 dark:text-slate-200" dir="rtl">
                            {data.dalil}
                        </p>
                    </div>
                )}

                {/* 4. KEY POINTS */}
                {data.points && data.points.length > 0 && (
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <List size={20} className="text-blue-600 dark:text-blue-400" />
                            <h3 className="font-bold text-slate-800 dark:text-slate-100">Poin Penting</h3>
                        </div>
                        <ul className="space-y-3">
                            {data.points.map((point, idx) => (
                                <li key={idx} className="flex gap-3 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                                        {idx + 1}
                                    </span>
                                    <span>{point}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* 5. DETAILED ANALYSIS */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <AlignLeft size={20} className="text-slate-500" />
                        <h3 className="font-bold text-slate-800 dark:text-slate-100">Analisis Mendalam</h3>
                    </div>
                    <div className="prose prose-sm max-w-none text-slate-600 dark:text-slate-300 leading-relaxed text-justify whitespace-pre-line">
                        {data.analysis}
                    </div>
                </div>

             </div>
        ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
               <AlertCircle size={48} className="text-slate-300 mb-4" />
               <p className="text-slate-500 dark:text-slate-400 mb-4">Gagal memuat data.</p>
               <button onClick={() => navigate(-1)} className="text-santri-green font-bold">Kembali</button>
            </div>
        )}

      </div>
    </div>
  );
};

export default ExplanationScreen;
