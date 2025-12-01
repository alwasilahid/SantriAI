
import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAudio } from '../contexts/AudioContext';
import { useHistory } from '../contexts/HistoryContext';
import { getAllSurahs, getSurahDetail, getTafsir } from '../services/quranApiService';
import { JUZ_MAPPING, JUZ_INFO } from '../constants';
import { 
  Search, 
  Loader2, 
  BookOpen, 
  ChevronLeft, 
  Play, 
  Pause, 
  MoreVertical, 
  Bookmark, 
  Copy, 
  Sparkles,
  AlignLeft,
  Trash2,
  Share2,
  Info,
  X,
  Layers,
  ToggleLeft,
  ToggleRight,
  Palette,
  Check
} from 'lucide-react';
import { Surah, Ayah, BookmarkItem } from '../types';

const QuranScreen: React.FC = () => {
  const location = useLocation();
  const { isPlaying, currentAyah, playAyah, togglePlay } = useAudio();
  const { addToHistory } = useHistory();

  // Navigation State
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);
  
  // Data State
  const [allSurahs, setAllSurahs] = useState<Surah[]>([]);
  const [surahDetail, setSurahDetail] = useState<Surah | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);

  // List View State
  const [activeTab, setActiveTab] = useState<'surah' | 'juz' | 'bookmark'>('surah');
  const [searchQuery, setSearchQuery] = useState('');

  // Detail View State
  const scrollToAyahRef = useRef<number | null>(null);
  const [isTajwidMode, setIsTajwidMode] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  
  // AI/Tafsir Modal State
  const [modalData, setModalData] = useState<{
    show: boolean, 
    title: string, 
    subtitle?: string,
    content: string, 
    loading: boolean,
    isAi: boolean
  }>({
    show: false, title: '', content: '', loading: false, isAi: false
  });

  // Handle incoming navigation state
  useEffect(() => {
    if (location.state) {
        const state = location.state as any;
        if (state.tab === 'bookmark') {
            setActiveTab('bookmark');
        } 
        // Logic to open specific Surah from MiniPlayer click or History
        else if (state.surahNumber && allSurahs.length > 0) {
            const surah = allSurahs.find(s => s.number === state.surahNumber);
            if (surah) handleSurahClick(surah);
        }
    }
  }, [location, allSurahs]); 

  // --- INITIALIZATION ---
  useEffect(() => {
    // Fetch Surah List
    const fetchList = async () => {
      setLoadingList(true);
      const data = await getAllSurahs();
      setAllSurahs(data);
      setLoadingList(false);
    };
    fetchList();

    // Load Bookmarks
    const saved = localStorage.getItem('santriai_quran_bookmarks');
    if (saved) {
      setBookmarks(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('santriai_quran_bookmarks', JSON.stringify(bookmarks));
  }, [bookmarks]);

  // Scroll to verse if requested (e.g. from Juz jump)
  useEffect(() => {
    if (!loadingDetail && surahDetail && scrollToAyahRef.current) {
      const timer = setTimeout(() => {
        const el = document.getElementById(`ayah-${scrollToAyahRef.current}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          scrollToAyahRef.current = null;
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [loadingDetail, surahDetail]);

  // Auto Scroll when audio changes to a new verse (IF we are viewing that surah)
  useEffect(() => {
      if (currentAyah && surahDetail && currentAyah.surahNumber === surahDetail.number) {
          const el = document.getElementById(`ayah-${currentAyah.id}`);
          if (el) {
             el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
      }
  }, [currentAyah, surahDetail]);

  // Filter Surahs
  const filteredSurahs = allSurahs.filter(s => 
    s.name_latin.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.meaning.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // --- ACTIONS ---

  const handleSurahClick = async (surah: Surah, targetAyah: number = 1) => {
    setView('detail');
    setLoadingDetail(true);
    setSurahDetail(surah); // Set shell first
    setSelectedSurah(surah);
    
    // Add to History
    addToHistory({
      id: `quran-${surah.number}`,
      type: 'quran',
      title: `QS. ${surah.name_latin}`,
      subtitle: `${surah.meaning} • ${surah.number_of_ayah} Ayat`,
      timestamp: new Date().toISOString(),
      path: '/quran',
      data: { surahNumber: surah.number }
    });

    const detail = await getSurahDetail(surah.number);
    if (detail) {
      setSurahDetail(detail);
      setSelectedSurah(detail);
    }
    
    if (targetAyah > 1) {
      scrollToAyahRef.current = targetAyah;
    } else {
      window.scrollTo(0, 0);
    }

    setLoadingDetail(false);
  };

  const handleJuzClick = (juzNumber: number) => {
    const mapping = JUZ_MAPPING[juzNumber];
    if (mapping) {
      const surah = allSurahs.find(s => s.number === mapping.surah);
      if (surah) {
        handleSurahClick(surah, mapping.ayah);
      }
    }
  };

  const handleBack = () => {
    setView('list');
    setSurahDetail(null);
  };

  const handleBookmark = (ayah: Ayah) => {
    if (!surahDetail) return;
    
    const id = `surah-${surahDetail.number}-ayah-${ayah.number}`;
    const exists = bookmarks.find(b => b.id === id);

    if (exists) {
      setBookmarks(prev => prev.filter(b => b.id !== id));
    } else {
      const newBookmark: BookmarkItem = {
        id,
        surahNumber: surahDetail.number,
        surahName: surahDetail.name_latin,
        ayah: { ...ayah, surahNumber: surahDetail.number },
        savedAt: new Date().toISOString()
      };
      setBookmarks(prev => [newBookmark, ...prev]);
    }
  };

  const isBookmarked = (surahNum: number, ayahNum: number) => {
    return bookmarks.some(b => b.id === `surah-${surahNum}-ayah-${ayahNum}`);
  };

  const handleDeleteBookmark = (id: string) => {
     setBookmarks(prev => prev.filter(b => b.id !== id));
  };

  const openBookmark = (item: BookmarkItem) => {
    const surah = allSurahs.find(s => s.number === item.surahNumber);
    if (surah) {
      handleSurahClick(surah, item.ayah.number);
    }
  };

  const handleCopy = (ayah: Ayah) => {
    const text = `${ayah.arab}\n\n${ayah.text}\n(QS. ${surahDetail?.name_latin}: ${ayah.number})`;
    navigator.clipboard.writeText(text);
    setCopiedId(ayah.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleShare = async (ayah: Ayah) => {
    const text = `${ayah.arab}\n\n${ayah.text}\n(QS. ${surahDetail?.name_latin}: ${ayah.number})`;
    const title = `QS. ${surahDetail?.name_latin}: ${ayah.number}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: text,
        });
      } catch (error: any) {
        if (error.name !== 'AbortError') {
           console.error('Share failed:', error);
           handleCopy(ayah);
           alert('Gagal membagikan, teks disalin ke clipboard.');
        }
      }
    } else {
      handleCopy(ayah);
      alert('Teks disalin ke clipboard');
    }
  };

  // --- TAJWID COLORING LOGIC ---
  const colorizeTajwid = (text: string) => {
    let colored = text;
    colored = colored.replace(/(اللَّهِ|اللَّهُ|اللَّهَ|لِلَّهِ|بِاللَّهِ)/g, '<span class="text-amber-500 font-bold">$1</span>');
    colored = colored.replace(/([ن|م]\u0651)/g, '<span class="text-red-600 font-bold">$1</span>');
    colored = colored.replace(/([ق|ط|ب|ج|د]\u0652)/g, '<span class="text-blue-600 font-bold">$1</span>');
    colored = colored.replace(/([\u0621-\u064A]\u0653)/g, '<span class="text-purple-600 font-bold">$1</span>');
    colored = colored.replace(/(\u06E2|\u06D8)/g, '<span class="text-teal-600 font-bold">$1</span>');
    colored = colored.replace(/([ل|ر]\u0651)/g, '<span class="text-yellow-500 font-bold">$1</span>');
    colored = colored.replace(/(\u064B|\u064C|\u064D)/g, '<span class="text-green-500 font-bold">$1</span>'); 
    colored = colored.replace(/([^\u0646\u0645\u0644\u0631]\u0651)/g, '<span class="text-fuchsia-500">$1</span>');
    return colored;
  };

  // --- AUDIO LOGIC ---
  const handlePlayAyah = (ayah: Ayah) => {
      // If clicking current playing ayah, just toggle
      if (currentAyah?.id === ayah.id) {
          togglePlay();
      } else {
          // Play new
          if (surahDetail && surahDetail.ayahs) {
              playAyah(surahDetail, ayah, surahDetail.ayahs);
          }
      }
  };

  // --- AI & TAFSIR TOOLS ---
  const handleTools = async (type: 'Tafsir' | 'Asbabun Nuzul' | 'Bedah AI' | 'Munasabah', ayah: Ayah) => {
    const subtitle = `QS. ${surahDetail?.name_latin} Ayat ${ayah.number}`;
    
    if (type === 'Tafsir') {
      setModalData({ 
        show: true, 
        title: 'Tafsir Kemenag', 
        subtitle, 
        content: '', 
        loading: true, 
        isAi: false 
      });

      try {
        if (!surahDetail) throw new Error("No surah selected");
        const tafsirData = await getTafsir(surahDetail.number);
        const ayatTafsir = tafsirData.find((t: any) => t.ayat === ayah.number);
        
        if (ayatTafsir) {
          setModalData(prev => ({ ...prev, content: ayatTafsir.teks, loading: false }));
        } else {
          setModalData(prev => ({ ...prev, content: "Tafsir tidak ditemukan untuk ayat ini.", loading: false }));
        }
      } catch (e) {
         setModalData(prev => ({ ...prev, content: "Gagal memuat Tafsir dari Kemenag.", loading: false }));
      }
      return;
    }

    setModalData({ 
      show: true, 
      title: type, 
      subtitle, 
      content: '', 
      loading: true, 
      isAi: true 
    });
    
    const context = `Surah ${surahDetail?.name_latin} Ayat ${ayah.number}: "${ayah.text}"`;
    let prompt = '';
    if (type === 'Asbabun Nuzul') prompt = `Jelaskan Asbabun Nuzul (sebab turunnya ayat) untuk ${context}`;
    if (type === 'Munasabah') prompt = `Jelaskan Munasabah (keterkaitan) ayat ini dengan ayat sebelumnya atau sesudahnya: ${context}`;
    if (type === 'Bedah AI') prompt = `Analisis tata bahasa (Nahwu/Shorof), balaghah (keindahan bahasa), dan kandungan hukum/hikmah dari ayat: "${ayah.arab}" (${context})`;

    // Dynamic import to avoid circular dependency
    const { askReligiousQuery } = await import('../services/geminiService');

    try {
      const result = await askReligiousQuery('quran', prompt);
      setModalData(prev => ({ ...prev, content: result, loading: false }));
    } catch (e) {
      setModalData(prev => ({ ...prev, content: "Gagal memuat data AI.", loading: false }));
    }
  };

  // --- RENDER LIST VIEW ---
  if (view === 'list') {
    return (
      <div className="pb-24 pt-6 px-4 min-h-screen bg-slate-50 dark:bg-slate-950">
        {/* Tabs */}
        <div className="flex bg-white dark:bg-slate-900 rounded-xl p-1 mb-6 shadow-sm border border-slate-100 dark:border-slate-800 sticky top-4 z-10 transition-colors">
          {['surah', 'juz', 'bookmark'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg capitalize transition-all ${
                activeTab === tab 
                  ? 'bg-santri-green/10 text-santri-green dark:text-santri-gold' 
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content based on Tab */}
        {activeTab === 'surah' && (
          <>
            <div className="bg-white dark:bg-slate-900 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3 mb-6 transition-colors">
              <Search size={20} className="text-slate-400" />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari surat..."
                className="flex-1 bg-transparent outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400 text-base"
              />
            </div>

            {loadingList ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 size={32} className="text-santri-green animate-spin mb-4" />
                <p className="text-slate-400">Memuat data Al-Quran...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredSurahs.map((surah) => (
                  <button 
                    key={surah.number}
                    onClick={() => handleSurahClick(surah)}
                    className="w-full bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-santri-green/30 dark:hover:border-santri-gold/30 transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-green-50 dark:bg-green-900/20 text-santri-green dark:text-santri-gold font-bold flex items-center justify-center text-sm group-hover:bg-santri-green group-hover:text-white transition-colors">
                        {surah.number}
                      </div>
                      <div className="text-left">
                        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">{surah.name_latin}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{surah.meaning} • {surah.number_of_ayah} Ayat</p>
                      </div>
                    </div>
                    <div className="text-santri-green dark:text-santri-gold font-arabic text-xl font-bold">
                      {surah.name}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'juz' && (
           <div className="space-y-3 animate-in fade-in duration-300">
             {JUZ_INFO.map((item) => (
               <button
                 key={item.id}
                 onClick={() => handleJuzClick(item.id)}
                 className="w-full bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm hover:border-santri-green dark:hover:border-santri-gold transition-all flex items-center justify-between group"
               >
                 <div>
                    <h3 className="text-left font-bold text-slate-800 dark:text-slate-100 text-lg">Juz {item.id}</h3>
                    <p className="text-left text-xs text-slate-500 dark:text-slate-400 mt-1">{item.range}</p>
                 </div>
                 <span className="font-arabic text-2xl text-santri-green dark:text-santri-gold group-hover:scale-110 transition-transform">
                   {item.start}
                 </span>
               </button>
             ))}
           </div>
        )}

        {activeTab === 'bookmark' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            {bookmarks.length === 0 ? (
              <div className="text-center py-20 text-slate-400 dark:text-slate-600">
                 <Bookmark size={48} className="mx-auto mb-4 opacity-30" />
                 <p>Belum ada ayat yang disimpan.</p>
              </div>
            ) : (
              bookmarks.map((item) => (
                <div key={item.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm relative">
                   <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-green-50 dark:bg-green-900/20 text-santri-green dark:text-santri-gold text-[10px] font-bold rounded">
                           {item.surahName} : {item.ayah.number}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(item.savedAt).toLocaleDateString('id-ID')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => {
                           const text = `${item.ayah.arab}\n\n${item.ayah.text}\n(QS. ${item.surahName}: ${item.ayah.number})`;
                           navigator.clipboard.writeText(text);
                           alert("Disalin");
                        }} className="text-slate-400 hover:text-slate-600">
                           <Copy size={16} />
                        </button>
                        <button onClick={() => handleDeleteBookmark(item.id)} className="text-red-300 hover:text-red-500">
                          <Trash2 size={16} />
                        </button>
                      </div>
                   </div>
                   <p className="font-arabic text-right text-xl text-slate-800 dark:text-slate-100 mb-2 truncate" dir="rtl">
                     {item.ayah.arab}
                   </p>
                   <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
                     {item.ayah.text}
                   </p>
                   <button 
                     onClick={() => openBookmark(item)}
                     className="w-full py-2 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700"
                   >
                     Buka Ayat
                   </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    );
  }

  // --- RENDER DETAIL VIEW ---
  return (
    <div className="pb-32 pt-0 min-h-screen bg-slate-50 dark:bg-slate-950 relative">
      
      {/* Sticky Detail Header */}
      <div className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shadow-sm px-4 py-3 flex items-center justify-between transition-colors">
        <div className="flex items-center gap-2">
           <button onClick={handleBack} className="p-2 -ml-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
             <ChevronLeft size={24} />
           </button>
           <div>
              <span className="text-[10px] font-bold text-santri-green dark:text-santri-gold uppercase tracking-wider block">
                 JUZ {JUZ_MAPPING && Object.entries(JUZ_MAPPING).find(([_, val]) => val.surah <= (surahDetail?.number || 0))?.[0] || '...'}
              </span>
              <h2 className="font-bold text-slate-800 dark:text-slate-100 leading-tight">
                 {surahDetail?.name_latin || selectedSurah?.name_latin}
              </h2>
           </div>
        </div>
        <button className="p-2 -mr-2 text-slate-600 dark:text-slate-300">
          <MoreVertical size={24} />
        </button>
      </div>

      <div className="px-4 pt-6">
        
        {/* Surah Header Card */}
        <div className="bg-santri-green text-white rounded-3xl p-6 mb-8 text-center relative overflow-hidden shadow-lg shadow-green-200 dark:shadow-green-900/30">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')]"></div>
            
            <div className="relative z-10">
                <h1 className="font-arabic text-4xl mb-2">
                    {surahDetail?.number !== 9 ? "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ" : "أعُوذُ بِاللهِ مِنَ الشَّيْطَانِ الرَّجِيمِ"}
                </h1>
                <h2 className="font-bold text-xl mb-1">{surahDetail?.name_latin}</h2>
                <p className="text-green-100 text-xs">{surahDetail?.meaning} • {surahDetail?.number_of_ayah} Ayat</p>
            </div>
        </div>

        {/* Tajwid Control Bar */}
        <div className="flex flex-col items-center mb-6">
           <button 
             onClick={() => setIsTajwidMode(!isTajwidMode)}
             className={`px-5 py-2.5 rounded-full flex items-center gap-3 transition-all border shadow-sm ${
               isTajwidMode 
               ? 'bg-green-50 border-santri-green text-santri-green dark:bg-green-900/20 dark:text-santri-gold' 
               : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500'
             }`}
           >
             <Palette size={18} />
             <span className="font-bold text-sm">Mode Tajwid: {isTajwidMode ? 'ON' : 'OFF'}</span>
             {isTajwidMode ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
           </button>

           {/* LEGEND */}
           {isTajwidMode && (
             <div className="mt-6 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm w-full animate-in slide-in-from-top-2 fade-in duration-300">
                <h3 className="text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">
                   KETERANGAN WARNA TAJWID
                </h3>
                
                <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                    {/* Left Column */}
                    <div className="space-y-3">
                       <div className="flex items-center gap-3">
                          <span className="w-3 h-3 rounded-full bg-red-600 shrink-0 shadow-sm"></span>
                          <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Ghunnah</span>
                       </div>
                       <div className="flex items-center gap-3">
                          <span className="w-3 h-3 rounded-full bg-green-500 shrink-0 shadow-sm"></span>
                          <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Ikhfa' Haqiqi</span>
                       </div>
                       <div className="flex items-center gap-3">
                          <span className="w-3 h-3 rounded-full bg-fuchsia-500 shrink-0 shadow-sm"></span>
                          <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Idgham Bighunnah</span>
                       </div>
                       <div className="flex items-center gap-3">
                          <span className="w-3 h-3 rounded-full bg-orange-500 shrink-0 shadow-sm"></span>
                          <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Izhar Halqi</span>
                       </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-3">
                       <div className="flex items-center gap-3">
                          <span className="w-3 h-3 rounded-full bg-blue-600 shrink-0 shadow-sm"></span>
                          <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Qalqalah</span>
                       </div>
                       <div className="flex items-center gap-3">
                          <span className="w-3 h-3 rounded-full bg-teal-500 shrink-0 shadow-sm"></span>
                          <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Iqlab</span>
                       </div>
                       <div className="flex items-center gap-3">
                          <span className="w-3 h-3 rounded-full bg-yellow-400 shrink-0 shadow-sm"></span>
                          <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Idgham Bilaghunnah</span>
                       </div>
                       <div className="flex items-center gap-3">
                          <span className="w-3 h-3 rounded-full bg-purple-600 shrink-0 shadow-sm"></span>
                          <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Mad</span>
                       </div>
                    </div>
                </div>
             </div>
           )}
        </div>

        {/* Verses List */}
        {loadingDetail ? (
           <div className="space-y-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse">
                   <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-full mb-4"></div>
                   <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4 mb-2"></div>
                   <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2"></div>
                </div>
              ))}
           </div>
        ) : (
          <div className="space-y-4">
            {surahDetail?.ayahs?.map((ayah) => {
              const isPlayingThis = currentAyah?.id === ayah.id && isPlaying;
              const isCopied = copiedId === ayah.id;

              return (
                <div 
                  key={ayah.id} 
                  id={`ayah-${ayah.id}`}
                  className={`scroll-mt-32 transition-all duration-500 rounded-2xl border p-5 shadow-sm mb-4 ${
                      currentAyah?.id === ayah.id
                      ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900/30 shadow-md ring-1 ring-green-100 dark:ring-green-900/20' 
                      : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'
                  }`}
                >
                  
                  {/* Verse Header (Number) */}
                  <div className="mb-4 flex justify-between items-center">
                    <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 text-santri-green dark:text-santri-gold flex items-center justify-center font-bold text-sm shadow-sm">
                       {ayah.number}
                    </div>
                  </div>

                  {/* Arabic Text (With Tajwid Logic) */}
                  <p 
                    className="text-right font-arabic text-3xl leading-[2.6] text-slate-800 dark:text-slate-100 mb-6 px-1" 
                    dir="rtl"
                    dangerouslySetInnerHTML={{ 
                      __html: isTajwidMode ? colorizeTajwid(ayah.arab) : ayah.arab 
                    }}
                  />

                  {/* Latin */}
                  <p className="text-santri-green dark:text-santri-gold font-medium text-sm mb-2 leading-relaxed text-left">
                    {ayah.latin}
                  </p>

                  {/* Translation */}
                  <p className="text-slate-600 dark:text-slate-300 text-sm mb-6 leading-relaxed text-justify">
                    {ayah.text}
                  </p>

                  {/* Actions Row 1 */}
                  <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-2">
                     <button 
                       onClick={() => handlePlayAyah(ayah)}
                       className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all shrink-0 ${
                          isPlayingThis
                          ? 'bg-santri-green border-santri-green text-white' 
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50'
                       }`}
                     >
                       {isPlayingThis ? <Pause size={18} fill="currentColor" /> : <Play size={18} className="ml-0.5" />}
                     </button>

                     <button 
                       onClick={() => handleBookmark(ayah)}
                       className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all shrink-0 ${
                          isBookmarked(surahDetail.number, ayah.number) 
                          ? 'bg-green-50 border-santri-green text-santri-green' 
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50'
                       }`}
                     >
                       <Bookmark size={18} fill={isBookmarked(surahDetail.number, ayah.number) ? "currentColor" : "none"} />
                     </button>
                     
                     <button 
                       onClick={() => handleCopy(ayah)}
                       className="w-10 h-10 rounded-full flex items-center justify-center border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-50 transition-all shrink-0"
                     >
                       {isCopied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                     </button>

                     <button 
                       onClick={() => handleShare(ayah)}
                       className="w-10 h-10 rounded-full flex items-center justify-center border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-50 transition-all shrink-0"
                     >
                       <Share2 size={18} />
                     </button>
                     
                     <button 
                       onClick={() => handleTools('Tafsir', ayah)}
                       className="px-4 h-10 rounded-full border border-blue-200 bg-blue-50 text-blue-600 text-xs font-bold flex items-center gap-1.5 whitespace-nowrap hover:bg-blue-100 transition-all"
                     >
                       <BookOpen size={14} /> Tafsir
                     </button>
                  </div>

                  {/* Actions Row 2 */}
                  <div className="flex items-center gap-2 mt-2 overflow-x-auto no-scrollbar pb-2">
                     <button onClick={() => handleTools('Asbabun Nuzul', ayah)} className="px-4 py-2 rounded-lg bg-red-50 text-red-600 text-xs font-bold border border-red-100 whitespace-nowrap">
                        Asbabun Nuzul
                     </button>
                     <button onClick={() => handleTools('Munasabah', ayah)} className="px-4 py-2 rounded-lg bg-teal-50 text-teal-600 text-xs font-bold border border-teal-100 whitespace-nowrap">
                        Munasabah
                     </button>
                     <button onClick={() => handleTools('Bedah AI', ayah)} className="px-4 py-2 rounded-lg bg-[#FFF9E6] text-amber-600 text-xs font-bold border border-amber-200 whitespace-nowrap flex items-center gap-1">
                        <Sparkles size={14} /> Bedah AI
                     </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Detail Modal (Tafsir/AI) */}
      {modalData.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl flex flex-col max-h-[85vh] border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200">
              
              {/* Modal Header (Fixed) */}
              <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
                 <div className="flex items-center gap-3">
                   <div className={`p-2 rounded-full ${modalData.isAi ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                      {modalData.isAi ? <Sparkles size={20} /> : <BookOpen size={20} />}
                   </div>
                   <div>
                      <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">{modalData.title}</h3>
                      {modalData.subtitle && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">{modalData.subtitle}</p>
                      )}
                   </div>
                 </div>
                 <button onClick={() => setModalData({ ...modalData, show: false })} className="p-2 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                   <X size={20} />
                 </button>
              </div>
              
              {/* Modal Content (Scrollable) */}
              <div className="overflow-y-auto p-6 flex-1">
                {modalData.loading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                     <Loader2 size={32} className="text-santri-green animate-spin mb-4" />
                     <p className="text-slate-500 dark:text-slate-400 text-sm animate-pulse">
                       {modalData.isAi ? "Sedang menganalisis ayat..." : "Memuat data..."}
                     </p>
                  </div>
                ) : (
                  <div className={`prose prose-sm max-w-none text-slate-700 dark:text-slate-300 leading-relaxed text-justify ${modalData.isAi ? 'whitespace-pre-line' : ''}`}>
                    {modalData.content}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="h-2 shrink-0"></div>
           </div>
        </div>
      )}

    </div>
  );
};

export default QuranScreen;
