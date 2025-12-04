import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { askReligiousQuery } from '../services/geminiService';
import { TranslationResult } from '../types';
import { useHistory } from '../contexts/HistoryContext';
import Toast from '../components/Toast';
import { 
  ArrowLeft, Search, Copy, Check, Share2, 
  BookHeart, ChevronDown, ChevronUp, RefreshCw, AlertCircle, Quote, Sparkles, Loader2, Bookmark, Trash2
} from 'lucide-react';

interface DoaItem {
  id: string;
  title: string;
  arabic: string;
  latin: string;
  translation: string;
  category: string;
  source?: string | null;
}

interface RawDoaItem {
  nama: string;
  arab: string;
  latin: string;
  arti: string;
  riwayat: string;
}

const DoaScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { addToHistory } = useHistory();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const isSharing = useRef(false);
  
  // State untuk Data Fetching
  const [doaCollection, setDoaCollection] = useState<DoaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for AI analysis
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

  // State for Bookmarks
  const [bookmarks, setBookmarks] = useState<DoaItem[]>(() => {
    const saved = localStorage.getItem('santriai_doa_bookmarks');
    return saved ? JSON.parse(saved) : [];
  });

  // Toast State
  const [toast, setToast] = useState({ show: false, message: '' });
  const showToast = (message: string) => setToast({ show: true, message });

  // Handle incoming navigation state (e.g. from Settings)
  useEffect(() => {
    if (location.state && (location.state as any).tab === 'bookmark') {
      setSelectedCategory('Tersimpan');
    }
  }, [location]);

  // Persist Bookmarks
  useEffect(() => {
    localStorage.setItem('santriai_doa_bookmarks', JSON.stringify(bookmarks));
  }, [bookmarks]);

  const toggleBookmark = (item: DoaItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const exists = bookmarks.some(b => b.id === item.id);
    if (exists) {
      setBookmarks(prev => prev.filter(b => b.id !== item.id));
      showToast("Penanda dihapus");
    } else {
      setBookmarks(prev => [item, ...prev]);
      showToast("Doa disimpan");
    }
  };

  const isBookmarked = (id: string) => bookmarks.some(b => b.id === id);

  const formatTitle = (rawTitle: string): string => {
    if (!rawTitle) return "";
    let clean = rawTitle.replace(/^\d+\s*[\.-]?\s*/, '');
    const isAllUpper = clean === clean.toUpperCase();
    const isAllLower = clean === clean.toLowerCase();
    if (isAllUpper || isAllLower) {
      return clean.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
    }
    return clean;
  };

  const categorizeDoa = (title: string): string => {
    if (!title) return 'Harian Lainnya';
    const t = title.toLowerCase();
    if (t.includes('tidur') || t.includes('bangun')) return 'Tidur';
    if (t.includes('makan') || t.includes('puasa') || t.includes('berbuka')) return 'Makan & Minum';
    if (t.includes('masjid')) return 'Masjid';
    if (t.includes('rumah') || t.includes('keluar') || t.includes('masuk')) return 'Rumah';
    if (t.includes('pakaian') || t.includes('bercermin')) return 'Pakaian & Hiasan';
    if (t.includes('kamar mandi') || t.includes('wc') || t.includes('istinja')) return 'Toilet';
    if (t.includes('perjalanan') || t.includes('kendaraan')) return 'Perjalanan';
    if (t.includes('sakit') || t.includes('menjenguk')) return 'Kesehatan';
    if (t.includes('jenazah') || t.includes('kubur') || t.includes('takziah')) return 'Jenazah';
    if (t.includes('istri') || t.includes('suami') || t.includes('jimak') || t.includes('pengantin')) return 'Keluarga';
    return 'Harian Lainnya';
  };

  const fetchDoa = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('https://raw.githubusercontent.com/Kopeahku/hadisku/main/assets/file/doa-harian.json');
      if (!response.ok) throw new Error('Gagal mengambil data doa');
      const rawData: RawDoaItem[] = await response.json();
      const processedData: DoaItem[] = rawData.map((item, index) => {
        const rawTitle = item.nama || 'Doa Tanpa Judul';
        const cleanTitle = formatTitle(rawTitle);
        return {
          id: `doa-${index}`,
          title: cleanTitle,
          arabic: item.arab || '',
          latin: item.latin || '',
          translation: item.arti || '',
          category: categorizeDoa(cleanTitle),
          source: item.riwayat || null
        };
      });
      setDoaCollection(processedData);
    } catch (err) {
      console.error(err);
      setError('Gagal memuat kumpulan doa. Periksa koneksi internet Anda.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDoa();
  }, []);

  const categories = useMemo(() => {
    if (doaCollection.length === 0) return ['Semua', 'Tersimpan'];
    const cats = new Set(doaCollection.map(d => d.category));
    return ['Semua', 'Tersimpan', ...Array.from(cats).sort()];
  }, [doaCollection]);

  const filteredDoa = useMemo(() => {
    let sourceData = doaCollection;
    
    // If 'Tersimpan' category is selected, use bookmarks as source
    if (selectedCategory === 'Tersimpan') {
      sourceData = bookmarks;
    }

    return sourceData.filter(item => {
      const title = item.title || "";
      const translation = item.translation || "";
      const query = searchQuery.toLowerCase();
      const matchesSearch = title.toLowerCase().includes(query) || translation.toLowerCase().includes(query);
      
      // If 'Tersimpan' is active, we already filtered sourceData to bookmarks, so just check search
      // Otherwise, check if item matches the selected category (or 'Semua')
      const matchesCategory = selectedCategory === 'Tersimpan' 
        ? true 
        : (selectedCategory === 'Semua' || item.category === selectedCategory);

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory, doaCollection, bookmarks]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleShare = async (item: DoaItem) => {
    if (isSharing.current) return;
    isSharing.current = true;

    const text = `*${item.title}*\n\n${item.arabic}\n\n${item.latin}\n\n"${item.translation}"\n${item.source ? `(${item.source})` : ''}\n\n(Sumber: Aplikasi Bedah Kitab)`;
    if (navigator.share) {
      try {
        await navigator.share({ title: item.title, text: text });
      } catch (e) {
         console.error(e);
      } finally {
        isSharing.current = false;
      }
    } else {
      handleCopy(text, item.id);
      showToast("Teks disalin ke clipboard");
      isSharing.current = false;
    }
  };

  const toggleExpand = (id: string) => {
    const item = doaCollection.find(d => d.id === id);
    if (item && expandedId !== id) {
        // Add to history only on expand (viewing)
        addToHistory({
            id: item.id,
            type: 'doa',
            title: item.title,
            subtitle: item.category,
            timestamp: new Date().toISOString(),
            path: '/doa'
        });
    }
    setExpandedId(expandedId === id ? null : id);
  };

  const handleBedahDoa = async (item: DoaItem) => {
    setAnalyzingId(item.id);
    const prompt = `Bedah Doa: "${item.title}"\n\nTeks Arab: ${item.arabic}\n\nArti: "${item.translation}"\n\n${item.source ? `Riwayat: ${item.source}` : ''}\n\nMohon jelaskan kandungan makna, asbabul wurud (jika ada), dan faedah dari doa ini secara mendalam.`;
    
    try {
        const resultText = await askReligiousQuery('kitab', prompt);
        
        const translationResult: TranslationResult = {
            id: uuidv4(),
            originalText: item.arabic,
            maknaGandul: item.latin,
            modernTranslation: item.translation,
            aiExplanation: resultText,
            createdAt: new Date().toISOString(),
            synced: false
        };

        navigate('/result', { state: { result: translationResult } });
    } catch (e) {
        alert("Gagal menganalisis doa. Silakan coba lagi.");
    } finally {
        setAnalyzingId(null);
    }
  };

  const handleBack = () => navigate(-1);

  return (
    <div className="min-h-screen bg-[#FDFBF7] dark:bg-gray-950 pb-32 flex flex-col">
      <Toast message={toast.message} isVisible={toast.show} onClose={() => setToast(prev => ({ ...prev, show: false }))} />
      
      <div className="sticky top-0 z-30 bg-[#FDFBF7]/95 dark:bg-gray-950/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-4 py-4 shadow-sm">
         <div className="max-w-3xl mx-auto flex items-center gap-3">
            <button onClick={handleBack} className="p-2 -ml-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
               <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="flex-1">
               <h2 className="font-bold text-lg text-gray-800 dark:text-white flex items-center gap-2">
                  <BookHeart className="w-5 h-5 text-emerald-600" /> Doa-doa Harian
               </h2>
            </div>
            {isLoading && <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />}
         </div>
      </div>

      <div className="max-w-3xl mx-auto w-full px-4 py-6 flex-grow">
         <div className="space-y-3 mb-6">
            <div className="relative shadow-sm">
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari judul doa..."
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:text-white transition-all"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
               {categories.map(cat => {
                 const isSavedCategory = cat === 'Tersimpan';
                 const isActive = selectedCategory === cat;
                 
                 return (
                   <button
                     key={cat}
                     onClick={() => setSelectedCategory(cat)}
                     className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-1.5 ${
                       isActive 
                       ? 'bg-emerald-600 text-white border-emerald-600' 
                       : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-emerald-400'
                     }`}
                   >
                     {isSavedCategory && <Bookmark className="w-3 h-3 fill-current" />}
                     {cat}
                   </button>
                 );
               })}
            </div>
         </div>

         {isLoading ? (
            <div className="space-y-4">
               {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm animate-pulse flex items-center gap-4">
                     <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                     <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  </div>
               ))}
            </div>
         ) : error ? (
            <div className="text-center py-10 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-800 p-6">
               <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
               <p className="text-red-700 dark:text-red-300 font-medium mb-4">{error}</p>
               <button onClick={fetchDoa} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-bold">
                  Coba Lagi
               </button>
            </div>
         ) : (
            <div className="space-y-3 animate-slide-up">
               {filteredDoa.length > 0 ? (
                  filteredDoa.map((item, index) => {
                     const isExpanded = expandedId === item.id;
                     const displayNum = index + 1;
                     const isAnalyzing = analyzingId === item.id;
                     const bookmarked = isBookmarked(item.id);
                     
                     return (
                       <div key={item.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm transition-all hover:shadow-md">
                         <button 
                           onClick={() => toggleExpand(item.id)}
                           className={`w-full flex items-center justify-between p-4 text-left transition-colors ${
                              isExpanded ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'
                           }`}
                         >
                            <div className="flex items-center gap-4">
                               <div className={`w-8 h-8 shrink-0 flex items-center justify-center rounded-full text-xs font-bold transition-all ${
                                  isExpanded ? 'bg-emerald-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                               }`}>
                                  {displayNum}
                               </div>
                               <div>
                                  <h3 className={`font-bold text-base leading-snug ${isExpanded ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-800 dark:text-gray-200'}`}>
                                     {item.title}
                                  </h3>
                                  <p className="text-xs text-gray-400 mt-0.5 font-medium">{item.category}</p>
                               </div>
                            </div>
                            <div className="flex items-center gap-3 ml-2">
                               {bookmarked && !isExpanded && <Bookmark className="w-4 h-4 text-emerald-500 fill-emerald-500" />}
                               <div className="text-gray-400">
                                  {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                               </div>
                            </div>
                         </button>

                         {isExpanded && (
                           <div className="p-5 border-t border-gray-100 dark:border-gray-700 animate-slide-down bg-white dark:bg-gray-800">
                              <div className="text-right mb-6 pl-4">
                                 <p className="font-arabic text-3xl leading-[2.3] text-gray-800 dark:text-gray-100" dir="rtl">
                                    {item.arabic}
                                 </p>
                              </div>
                              <div className="mb-4">
                                 <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Latin</h4>
                                 <p className="text-emerald-700 dark:text-emerald-400 text-sm font-medium leading-relaxed">
                                    {item.latin}
                                 </p>
                              </div>
                              <div className="mb-6 relative">
                                 <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Arti</h4>
                                 <div className="pl-4 border-l-2 border-emerald-300 dark:border-emerald-700">
                                    <p className="text-gray-700 dark:text-gray-300 text-sm italic leading-relaxed">
                                       "{item.translation}"
                                    </p>
                                 </div>
                              </div>
                              {item.source && (
                                 <div className="mt-6 border-t border-gray-200 dark:border-gray-700/50 pt-4">
                                     <div className="flex items-start gap-3 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                                        <div className="mt-0.5 text-emerald-600 dark:text-emerald-400">
                                           <Quote className="w-3.5 h-3.5 fill-current" />
                                        </div>
                                        <div>
                                           <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-0.5">Riwayat / Dalil</span>
                                           <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{item.source}</span>
                                        </div>
                                     </div>
                                 </div>
                              )}
                              
                              {/* Actions Bar - Single Row Force */}
                              <div className="flex items-center gap-2 pt-6 mt-2 w-full overflow-x-auto no-scrollbar">
                                 <button 
                                   onClick={() => handleBedahDoa(item)}
                                   disabled={!!analyzingId}
                                   className="flex-1 whitespace-nowrap justify-center flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-300 dark:hover:bg-amber-900/30 transition-colors border border-amber-200 dark:border-amber-800 disabled:opacity-50"
                                 >
                                    {isAnalyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 shrink-0" />}
                                    {isAnalyzing ? 'Menganalisis...' : 'Bedah Doa'}
                                 </button>
                                 
                                 <button 
                                   onClick={(e) => toggleBookmark(item, e)}
                                   className={`flex-1 whitespace-nowrap justify-center flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors border ${
                                     bookmarked 
                                     ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800' 
                                     : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 dark:hover:bg-gray-700'
                                   }`}
                                 >
                                    <Bookmark className={`w-3.5 h-3.5 shrink-0 ${bookmarked ? 'fill-current' : ''}`} />
                                    {bookmarked ? 'Tersimpan' : 'Simpan'}
                                 </button>

                                 <button 
                                   onClick={() => handleCopy(item.arabic + "\n\n" + item.translation + (item.source ? `\n(${item.source})` : ''), item.id)}
                                   className="w-10 h-10 shrink-0 flex items-center justify-center rounded-xl bg-gray-50 text-gray-500 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 transition-colors"
                                 >
                                    {copiedId === item.id ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                 </button>
                                 
                                 <button 
                                   onClick={() => handleShare(item)}
                                   className="w-10 h-10 shrink-0 flex items-center justify-center rounded-xl bg-gray-50 text-gray-500 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 transition-colors"
                                 >
                                    <Share2 className="w-4 h-4" />
                                 </button>
                              </div>
                           </div>
                         )}
                       </div>
                     );
                  })
               ) : (
                  <div className="text-center py-20 text-gray-500">
                     <BookHeart className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                     <p>Tidak ditemukan doa dengan kata kunci tersebut.</p>
                     {selectedCategory === 'Tersimpan' && (
                       <button onClick={() => setSelectedCategory('Semua')} className="mt-4 text-emerald-600 font-bold text-sm hover:underline">
                         Lihat Semua Doa
                       </button>
                     )}
                  </div>
               )}
            </div>
         )}
      </div>
    </div>
  );
};

export default DoaScreen;
