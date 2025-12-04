import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { askReligiousQuery } from '../services/geminiService';
import { getHadithBooks, getHadithRange } from '../services/hadithApiService';
import { HadithBook, HadithDetail } from '../types';
import Toast from '../components/Toast';
import { 
  Search, 
  Loader2, 
  Scroll, 
  Book, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles,
  X,
  BookOpen,
  ArrowRight,
  WifiOff,
  RefreshCw,
  Bookmark,
  Trash2,
  Copy,
  Share2,
  Check
} from 'lucide-react';

interface BookmarkHadith extends HadithDetail {
  bookName: string;
  bookId: string;
  savedAt: string;
}

const HadisScreen: React.FC = () => {
  const location = useLocation();
  
  // Navigation State
  const [activeBook, setActiveBook] = useState<HadithBook | null>(null);
  const [viewMode, setViewMode] = useState<'books' | 'bookmarks'>('books');
  
  // Data State
  const [books, setBooks] = useState<HadithBook[]>([]);
  const [hadiths, setHadiths] = useState<HadithDetail[]>([]);
  const [bookmarks, setBookmarks] = useState<BookmarkHadith[]>([]);
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [loadingHadiths, setLoadingHadiths] = useState(false);
  const [errorBooks, setErrorBooks] = useState(false);
  const [errorHadiths, setErrorHadiths] = useState(false);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;
  
  // AI State
  const [searchQuery, setSearchQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState('');
  const [modalTitle, setModalTitle] = useState('');

  // Local Search State (Inside Book)
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const isSharing = useRef(false);

  // Toast State
  const [toast, setToast] = useState({ show: false, message: '' });

  const showToast = (message: string) => {
    setToast({ show: true, message });
  };

  // Handle Navigation State from Settings
  useEffect(() => {
    if (location.state && (location.state as any).tab === 'bookmark') {
      setViewMode('bookmarks');
    }
  }, [location]);

  // Initial Load (Books & Bookmarks)
  const fetchBooks = async () => {
    setLoadingBooks(true);
    setErrorBooks(false);
    try {
      const data = await getHadithBooks();
      if (data && data.length > 0) {
        setBooks(data);
      } else {
        throw new Error("No data");
      }
    } catch (e) {
      setErrorBooks(true);
    } finally {
      setLoadingBooks(false);
    }
  };

  useEffect(() => {
    fetchBooks();
    
    // Load bookmarks
    const saved = localStorage.getItem('santriai_hadis_bookmarks');
    if (saved) {
      setBookmarks(JSON.parse(saved));
    }
  }, []);

  // Save Bookmarks to LocalStorage
  useEffect(() => {
    localStorage.setItem('santriai_hadis_bookmarks', JSON.stringify(bookmarks));
  }, [bookmarks]);

  // Fetch Hadiths when Book or Page changes
  useEffect(() => {
    if (activeBook) {
      const fetchRange = async () => {
        setLoadingHadiths(true);
        setErrorHadiths(false);
        const start = (currentPage - 1) * ITEMS_PER_PAGE + 1;
        const end = currentPage * ITEMS_PER_PAGE;
        // Ensure we don't exceed total
        const safeEnd = end > activeBook.available ? activeBook.available : end;
        
        try {
          if (start <= activeBook.available) {
            const data = await getHadithRange(activeBook.id, start, safeEnd);
            setHadiths(data);
          } else {
            setHadiths([]);
          }
        } catch (e) {
          setErrorHadiths(true);
        } finally {
          setLoadingHadiths(false);
          // Scroll to top of list
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      };
      fetchRange();
    }
  }, [activeBook, currentPage]);

  const handleBookSelect = (book: HadithBook) => {
    setActiveBook(book);
    setCurrentPage(1);
    setSearchQuery(''); // Clear AI search when browsing
    setAiResponse('');
    setLocalSearchQuery(''); // Reset local search
  };

  const handleBack = () => {
    setActiveBook(null);
    setHadiths([]);
    setLocalSearchQuery('');
  };

  const handleNextPage = () => {
    if (activeBook && currentPage * ITEMS_PER_PAGE < activeBook.available) {
      setCurrentPage(p => p + 1);
      setLocalSearchQuery(''); // Reset search on page change
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(p => p - 1);
      setLocalSearchQuery(''); // Reset search on page change
    }
  };

  // Bookmark Logic
  const isBookmarked = (bookId: string, hadithNumber: number) => {
    return bookmarks.some(b => b.bookId === bookId && b.number === hadithNumber);
  };

  const toggleBookmark = (hadith: HadithDetail, book: HadithBook) => {
    if (isBookmarked(book.id, hadith.number)) {
      setBookmarks(prev => prev.filter(b => !(b.bookId === book.id && b.number === hadith.number)));
      showToast("Penanda dihapus");
    } else {
      const newBookmark: BookmarkHadith = {
        ...hadith,
        bookName: book.name,
        bookId: book.id,
        savedAt: new Date().toISOString()
      };
      setBookmarks(prev => [newBookmark, ...prev]);
      showToast("Hadis disimpan");
    }
  };

  const deleteBookmark = (bookId: string, hadithNumber: number) => {
    setBookmarks(prev => prev.filter(b => !(b.bookId === bookId && b.number === hadithNumber)));
    showToast("Penanda dihapus");
  };

  // Copy & Share
  const handleCopy = (hadith: HadithDetail, bookName?: string) => {
    const name = bookName || activeBook?.name || "Hadis";
    const text = `${hadith.arab}\n\n${hadith.id}\n(${name} No. ${hadith.number})`;
    navigator.clipboard.writeText(text);
    const uniqueId = `${name}-${hadith.number}`;
    setCopiedId(uniqueId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleShare = async (hadith: HadithDetail, bookName?: string) => {
    if (isSharing.current) return;
    isSharing.current = true;

    const name = bookName || activeBook?.name || "Hadis";
    const text = `${hadith.arab}\n\n${hadith.id}\n(${name} No. ${hadith.number})`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${name} No. ${hadith.number}`,
          text: text
        });
      } catch (e: any) {
        if (e.name !== 'AbortError') {
           handleCopy(hadith, bookName);
           showToast("Teks disalin ke clipboard");
        }
      } finally {
        isSharing.current = false;
      }
    } else {
      handleCopy(hadith, bookName);
      showToast("Teks disalin ke clipboard");
      isSharing.current = false;
    }
  };

  // AI Search (Global)
  const handleAiSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsAiLoading(true);
    setAiResponse('');
    try {
      const result = await askReligiousQuery('hadis', searchQuery);
      setAiResponse(result);
    } catch (e) {
      setAiResponse("Maaf, terjadi kesalahan koneksi.");
    } finally {
      setIsAiLoading(false);
    }
  };

  // Bedah Hadis (Specific)
  const handleBedahHadis = async (hadith: HadithDetail, bookName?: string) => {
    const bName = bookName || activeBook?.name || "Kitab Hadis";
    setModalTitle(`Bedah Hadis No. ${hadith.number}`);
    setModalContent('');
    setModalOpen(true);
    
    const prompt = `Analisis hadis berikut dari kitab ${bName} nomor ${hadith.number}:\n\n"${hadith.arab}"\n\nArtinya: "${hadith.id}"\n\nJelaskan: 1. Status hadis (jika masyhur), 2. Asbabul Wurud (jika ada), 3. Istimbath Hukum / Pelajaran penting.`;
    
    try {
      const res = await askReligiousQuery('hadis', prompt);
      setModalContent(res);
    } catch (e) {
      setModalContent("Gagal memuat analisis AI.");
    }
  };

  // Filter Logic for Local Search
  const filteredHadiths = hadiths.filter(hadith => {
    if (!localSearchQuery) return true;
    const q = localSearchQuery.toLowerCase();
    return (
      hadith.number.toString().includes(q) ||
      hadith.id.toLowerCase().includes(q) || // Indonesian text
      hadith.arab.includes(q) // Arabic text
    );
  });

  // --- RENDER HOME (BOOK LIST OR BOOKMARKS) ---
  if (!activeBook) {
    return (
      <div className="pb-24 pt-6 px-4 min-h-screen bg-slate-50 dark:bg-slate-950">
        <Toast message={toast.message} isVisible={toast.show} onClose={() => setToast(prev => ({ ...prev, show: false }))} />
        
        {/* Header Section */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-2">
            <Scroll className="text-santri-green dark:text-santri-gold" />
            Pustaka Hadis
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Jelajahi Kutubut Tis'ah (9 Kitab Imam) dan tanya jawab dengan AI.
          </p>
        </div>

        {/* View Toggle (Books / Bookmarks) */}
        <div className="flex bg-white dark:bg-slate-900 rounded-xl p-1 mb-6 shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
          <button
            onClick={() => setViewMode('books')}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
              viewMode === 'books' 
                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            Daftar Kitab
          </button>
          <button
            onClick={() => setViewMode('bookmarks')}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
              viewMode === 'bookmarks' 
                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            Penanda
          </button>
        </div>

        {viewMode === 'books' ? (
          <>
            {/* AI Search Bar */}
            <div className="bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex gap-2 mb-8 transition-colors sticky top-4 z-20">
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tanya AI tentang topik hadis..."
                className="flex-1 bg-transparent px-3 py-2 outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm"
                onKeyDown={(e) => e.key === 'Enter' && handleAiSearch()}
              />
              <button 
                onClick={handleAiSearch}
                disabled={isAiLoading || !searchQuery}
                className="bg-santri-green text-white p-2.5 rounded-lg disabled:opacity-50 active:scale-95 transition-transform shadow-sm shadow-green-200 dark:shadow-green-900/30"
              >
                {isAiLoading ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} className="text-santri-gold" />}
              </button>
            </div>

            {/* AI Result Area */}
            {aiResponse && (
              <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
                 <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm flex items-center gap-2">
                       <Sparkles size={14} className="text-santri-gold" />
                       Jawaban AI
                    </h3>
                    <button onClick={() => setAiResponse('')} className="text-xs text-slate-400 hover:text-slate-600">Tutup</button>
                 </div>
                 <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-santri-gold/30 shadow-sm">
                    <div className="prose prose-sm max-w-none text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                      {aiResponse}
                    </div>
                 </div>
              </div>
            )}

            {/* Book Grid */}
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm mb-4 uppercase tracking-wider">Koleksi Kitab</h3>
            {loadingBooks ? (
               <div className="grid grid-cols-1 gap-4">
                 {[1,2,3,4].map(i => (
                   <div key={i} className="h-20 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse"></div>
                 ))}
               </div>
            ) : errorBooks ? (
                <div className="flex flex-col items-center justify-center py-10 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <WifiOff size={32} className="text-slate-300 dark:text-slate-600 mb-2" />
                    <p className="text-slate-500 text-sm mb-4">Gagal memuat daftar kitab.</p>
                    <button 
                      onClick={fetchBooks}
                      className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-slate-200"
                    >
                      <RefreshCw size={14} /> Coba Lagi
                    </button>
                </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {books.map((book) => (
                  <button
                    key={book.id}
                    onClick={() => handleBookSelect(book)}
                    className="group relative overflow-hidden bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-santri-green/30 dark:hover:border-santri-gold/30 transition-all text-left"
                  >
                     <div className="flex items-center justify-between z-10 relative">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 rounded-xl bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                              <Book size={24} />
                           </div>
                           <div>
                              <h4 className="font-bold text-slate-800 dark:text-slate-100 text-lg group-hover:text-santri-green dark:group-hover:text-santri-gold transition-colors">
                                {book.name}
                              </h4>
                              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                Total: {book.available.toLocaleString()} Hadis
                              </p>
                           </div>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-santri-green group-hover:text-white transition-all">
                           <ArrowRight size={16} />
                        </div>
                     </div>
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          /* BOOKMARKS VIEW */
          <div className="space-y-4 animate-in fade-in duration-300">
            {bookmarks.length === 0 ? (
              <div className="text-center py-20 text-slate-400 dark:text-slate-600">
                 <Bookmark size={48} className="mx-auto mb-4 opacity-30" />
                 <p>Belum ada hadis yang disimpan.</p>
              </div>
            ) : (
              bookmarks.map((hadith, idx) => (
                <div key={`${hadith.bookId}-${hadith.number}-${idx}`} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-5 transition-colors">
                   <div className="flex justify-between items-center mb-4">
                      <div className="flex flex-col">
                        <span className="text-xs text-slate-400 font-medium">{hadith.bookName}</span>
                        <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs font-bold rounded w-fit mt-1">
                          Hadis No. {hadith.number}
                        </span>
                      </div>
                      <div className="flex gap-2">
                         <button 
                            onClick={() => handleCopy(hadith, hadith.bookName)}
                            className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-slate-600"
                         >
                           {copiedId === `${hadith.bookName}-${hadith.number}` ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                         </button>
                         <button 
                            onClick={() => handleShare(hadith, hadith.bookName)}
                            className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-slate-600"
                         >
                           <Share2 size={16} />
                         </button>
                         <button 
                            onClick={() => handleBedahHadis(hadith, hadith.bookName)}
                            className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-amber-500 hover:bg-amber-50"
                         >
                           <Sparkles size={16} />
                         </button>
                         <button 
                            onClick={() => deleteBookmark(hadith.bookId, hadith.number)}
                            className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-red-400 hover:text-red-600 hover:bg-red-50"
                         >
                           <Trash2 size={16} />
                         </button>
                      </div>
                   </div>

                   <p className="text-right font-arabic text-xl leading-[2.2] text-slate-800 dark:text-slate-100 mb-4 line-clamp-3" dir="rtl">
                     {hadith.arab}
                   </p>

                   <div className="border-t border-slate-50 dark:border-slate-800 pt-3">
                     <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed text-justify line-clamp-3">
                       {hadith.id}
                     </p>
                   </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    );
  }

  // --- RENDER READER VIEW (HADITH LIST) ---
  return (
    <div className="pb-24 pt-0 min-h-screen bg-slate-50 dark:bg-slate-950 relative">
      <Toast message={toast.message} isVisible={toast.show} onClose={() => setToast(prev => ({ ...prev, show: false }))} />
      
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-santri-green text-white shadow-md pt-4 pb-14 px-4 transition-colors">
         <div className="flex items-center justify-between mb-4">
            <button onClick={handleBack} className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors">
              <ChevronLeft size={24} />
            </button>
            <h2 className="font-bold text-lg">{activeBook.name}</h2>
            <div className="w-10"></div> {/* Spacer */}
         </div>
         
         {/* Stats Card Overlay */}
         <div className="absolute -bottom-10 left-4 right-4 bg-white dark:bg-slate-900 rounded-xl p-3 shadow-lg border border-slate-100 dark:border-slate-800 flex items-center justify-between text-sm transition-colors">
            <div className="flex flex-col">
               <span className="text-xs text-slate-500 dark:text-slate-400">Total Hadis</span>
               <span className="font-bold text-slate-800 dark:text-slate-100">{activeBook.available}</span>
            </div>
            
            {/* Pagination Controls */}
            <div className="flex items-center gap-3">
               <button 
                 onClick={handlePrevPage} 
                 disabled={currentPage === 1}
                 className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center disabled:opacity-30 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
               >
                 <ChevronLeft size={16} />
               </button>
               <span className="font-mono font-bold text-santri-green dark:text-santri-gold">
                 Hal. {currentPage}
               </span>
               <button 
                 onClick={handleNextPage}
                 disabled={currentPage * ITEMS_PER_PAGE >= activeBook.available}
                 className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center disabled:opacity-30 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
               >
                 <ChevronRight size={16} />
               </button>
            </div>
         </div>
      </div>

      {/* List Content */}
      <div className="mt-14 px-4 space-y-6">
        
        {/* Local Search Bar */}
        {!loadingHadiths && !errorHadiths && (
           <div className="bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex gap-2">
              <div className="flex-1 flex items-center px-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <Search size={16} className="text-slate-400 dark:text-slate-500 mr-2" />
                <input 
                  type="text" 
                  value={localSearchQuery}
                  onChange={(e) => setLocalSearchQuery(e.target.value)}
                  placeholder="Cari nomor atau kata di halaman ini..."
                  className="flex-1 bg-transparent py-2.5 outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm"
                />
                {localSearchQuery && (
                  <button onClick={() => setLocalSearchQuery('')} className="ml-2 text-slate-400 hover:text-slate-600">
                    <X size={16} />
                  </button>
                )}
              </div>
           </div>
        )}

        {loadingHadiths ? (
          <div className="py-20 flex flex-col items-center">
             <Loader2 size={32} className="text-santri-green animate-spin mb-4" />
             <p className="text-slate-400">Memuat hadis...</p>
          </div>
        ) : errorHadiths ? (
            <div className="flex flex-col items-center justify-center py-10">
                <WifiOff size={32} className="text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-slate-500 text-sm mb-4">Gagal memuat hadis.</p>
                <button 
                  onClick={() => {
                     // Force re-trigger of effect
                     setActiveBook({...activeBook}); 
                  }}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-slate-200"
                >
                  <RefreshCw size={14} /> Coba Lagi
                </button>
            </div>
        ) : filteredHadiths.length === 0 && localSearchQuery ? (
             <div className="py-10 text-center text-slate-500 dark:text-slate-400">
                <p>Tidak ditemukan hadis yang cocok di halaman ini.</p>
             </div>
        ) : (
          filteredHadiths.map((hadith) => (
            <div key={hadith.number} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-5 transition-colors">
               <div className="flex justify-between items-center mb-4">
                  <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs font-bold rounded-lg">
                    Hadis No. {hadith.number}
                  </span>
                  <div className="flex gap-2">
                     <button 
                       onClick={() => toggleBookmark(hadith, activeBook)}
                       className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                         isBookmarked(activeBook.id, hadith.number)
                         ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                         : 'bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-slate-100'
                       }`}
                     >
                       <Bookmark size={16} fill={isBookmarked(activeBook.id, hadith.number) ? "currentColor" : "none"} />
                     </button>
                     <button 
                        onClick={() => handleCopy(hadith)}
                        className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-slate-600 flex items-center justify-center"
                     >
                       {copiedId === `${activeBook.name}-${hadith.number}` ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                     </button>
                     <button 
                        onClick={() => handleShare(hadith)}
                        className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-slate-600 flex items-center justify-center"
                     >
                       <Share2 size={16} />
                     </button>
                     <button 
                        onClick={() => handleBedahHadis(hadith)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-50 dark:bg-green-900/20 text-santri-green dark:text-santri-gold text-xs font-bold hover:bg-green-100 dark:hover:bg-green-900/40 border border-green-200 dark:border-green-800/50"
                     >
                       <Sparkles size={14} /> Bedah
                     </button>
                  </div>
               </div>

               <p className="text-right font-arabic text-2xl leading-[2.2] text-slate-800 dark:text-slate-100 mb-6" dir="rtl">
                 {hadith.arab}
               </p>

               <div className="border-t border-slate-50 dark:border-slate-800 pt-4">
                 <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed text-justify">
                   {hadith.id}
                 </p>
               </div>
            </div>
          ))
        )}
        
        {/* Bottom Pagination for convenience */}
        {!loadingHadiths && !errorHadiths && filteredHadiths.length > 0 && !localSearchQuery && (
           <div className="flex justify-center py-4">
              <button 
                onClick={handleNextPage}
                className="px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm"
              >
                Halaman Selanjutnya
              </button>
           </div>
        )}
      </div>

      {/* Bedah Hadis Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl flex flex-col max-h-[85vh] border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
                 <div className="flex items-center gap-3">
                   <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                      <Sparkles size={20} />
                   </div>
                   <h3 className="font-bold text-slate-800 dark:text-slate-100">{modalTitle}</h3>
                 </div>
                 <button onClick={() => setModalOpen(false)} className="p-2 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-400 hover:text-slate-600">
                   <X size={20} />
                 </button>
              </div>
              <div className="overflow-y-auto p-6 flex-1">
                {!modalContent ? (
                  <div className="flex flex-col items-center justify-center py-12">
                     <Loader2 size={32} className="text-santri-green animate-spin mb-4" />
                     <p className="text-slate-500 text-sm animate-pulse">Sedang menganalisis hadis...</p>
                  </div>
                ) : (
                  <div className="prose prose-sm max-w-none text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                    {modalContent}
                  </div>
                )}
              </div>
           </div>
        </div>
      )}

    </div>
  );
};

export default HadisScreen;
