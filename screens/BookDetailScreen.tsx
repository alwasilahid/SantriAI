
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { generateJson } from '../services/geminiService';
import { useHistory } from '../contexts/HistoryContext';
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  List, 
  Loader2, 
  Layers,
  BookOpen
} from 'lucide-react';

type BookItem = { 
  id?: string;
  name: string; 
  desc: string;
  author?: string;
  year?: string;
  longDesc?: string;
  chapters?: string[];
  isAiGenerated?: boolean;
};

const BookDetailScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { addToHistory } = useHistory();
  const state = location.state as { book?: BookItem, query?: string };
  
  const [book, setBook] = useState<BookItem | null>(state?.book || null);
  const [loading, setLoading] = useState(!state?.book?.chapters);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Record history on mount if book name is available
    if (book?.name) {
      addToHistory({
        id: `book-${book.name}`,
        type: 'kitab',
        title: book.name,
        subtitle: book.author || 'Kitab Kuning',
        timestamp: new Date().toISOString(),
        path: '/book-detail',
        data: { book }
      });
    }
  }, [book?.name]); // Only run when book name changes/loads

  useEffect(() => {
    const fetchDetail = async () => {
      // If we already have full details (chapters exist), don't fetch
      if (book?.chapters && book.chapters.length > 5) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const searchName = book?.name || state?.query;

      if (!searchName) {
          setError("Informasi tidak ditemukan.");
          setLoading(false);
          return;
      }

      try {
        const prompt = `
          Berikan informasi detail dan SANGAT LENGKAP untuk kitab: "${searchName}" ${book?.author ? `karya ${book.author}` : ''}.
          
          Output JSON:
          {
            "name": "${searchName}",
            "desc": "Deskripsi singkat (1 kalimat)",
            "author": "Nama Lengkap Pengarang & Gelar",
            "year": "Tahun/Abad Lahir/Wafat (Hijriyah & Masehi)",
            "longDesc": "Deskripsi mendalam tentang isi kitab, metode penulisan, keistimewaan, dan kedudukannya dalam mazhab/ilmu terkait (minimal 3 paragraf).",
            "chapters": [
               "Muqaddimah",
               "Bab 1: [Judul Bab]",
               "Bab 2: [Judul Bab]",
               ...
               "Khatimah"
            ] 
          }
          
          INSTRUKSI KHUSUS:
          1. "chapters" (Daftar Isi) harus SANGAT LENGKAP. Berikan minimal 20-30 poin daftar isi yang mencakup struktur kitab dari awal sampai akhir.
          2. Gunakan istilah Arab/Indonesia yang baku di pesantren (misal: Kitab Thaharah, Bab Wudhu, Fasal Rukun Shalat).
        `;

        const detail = await generateJson(prompt, "Anda adalah ahli bedah kitab kuning dan pustakawan Islam.");
        
        const fullBook: BookItem = {
          ...(book || {}),
          ...detail,
          id: book?.id || `ai-${Date.now()}`,
          isAiGenerated: true
        };

        setBook(fullBook);
        
        // Save to LocalStorage (Append/Update)
        const savedRaw = localStorage.getItem('santriai_saved_books');
        const savedBooks: BookItem[] = savedRaw ? JSON.parse(savedRaw) : [];
        const existingIdx = savedBooks.findIndex(b => b.name === fullBook.name);
        
        let newSavedBooks;
        if (existingIdx >= 0) {
            savedBooks[existingIdx] = fullBook;
            newSavedBooks = savedBooks;
        } else {
            newSavedBooks = [fullBook, ...savedBooks];
        }
        localStorage.setItem('santriai_saved_books', JSON.stringify(newSavedBooks));

      } catch (e: any) {
        console.error(e);
        const isQuota = e?.message?.includes('429') || e?.message?.includes('RESOURCE_EXHAUSTED');
        setError(isQuota ? "Server sibuk (Quota Exceeded). Mohon coba lagi nanti." : "Gagal memuat detail kitab.");
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, []); // Run once on mount

  const handleChapterClick = (chapter: string) => {
    if (!book) return;
    navigate('/result', { 
        state: { 
            mode: 'kitab', 
            query: chapter, 
            source: book.name,
            originalText: `${chapter} - ${book.name}`
        } 
    });
  };

  const handleBiography = () => {
    if (!book) return;
    navigate('/biography', { state: { author: book.author, book: book.name } });
  };

  if (error) {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <button onClick={() => navigate(-1)} className="text-santri-green font-bold">Kembali</button>
        </div>
      );
  }

  if (loading) {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
            <div className="relative">
               <div className="absolute inset-0 bg-green-200 rounded-full animate-ping opacity-20"></div>
               <div className="relative bg-white dark:bg-slate-900 p-4 rounded-full shadow-lg border border-slate-100 dark:border-slate-800">
                  <Loader2 size={40} className="text-santri-green animate-spin" />
               </div>
            </div>
            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mt-6 mb-2">Membedah Kitab...</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">
                AI sedang menyusun daftar isi lengkap dan informasi mendalam untuk Anda.
            </p>
        </div>
      );
  }

  return (
    <div className="pb-24 pt-0 min-h-screen bg-slate-50 dark:bg-slate-950">
        
        {/* Detail Header */}
        <div className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shadow-sm px-4 py-3 flex items-center gap-3 transition-colors">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 -ml-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div className="flex-1 overflow-hidden">
            <h2 className="font-bold text-slate-800 dark:text-slate-100 text-lg truncate">Detail Kitab</h2>
            <p className="text-xs text-santri-green dark:text-santri-gold font-medium truncate">{book?.name}</p>
          </div>
        </div>

        <div className="px-4 pt-6 space-y-6">
          
          {/* Book Info Card */}
          <div className="flex flex-col items-center text-center animate-in fade-in slide-in-from-top-4 duration-500">
             {book?.isAiGenerated && (
                <div className="mb-4 px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-wider rounded-full border border-blue-200 dark:border-blue-800 flex items-center gap-1">
                   <Layers size={12} /> Data AI Lengkap
                </div>
             )}
             
             <div className="w-20 h-24 mb-4 bg-orange-100 dark:bg-orange-900/20 rounded-lg border-2 border-orange-200 dark:border-orange-800 flex items-center justify-center shadow-sm">
                <BookOpen size={32} className="text-orange-600 dark:text-orange-400" />
             </div>

             <h1 className="font-serif text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2 leading-tight">{book?.name}</h1>
             <h2 className="text-santri-green dark:text-santri-gold font-bold text-sm mb-4 flex items-center gap-1">
                <User size={14} /> {book?.author}
             </h2>
             
             {book?.year && (
               <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full text-xs font-bold mb-6">
                  <Calendar size={14} />
                  {book.year}
               </div>
             )}

             <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm text-left w-full transition-colors">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Tentang Kitab</h3>
                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed text-justify whitespace-pre-line">
                  {book?.longDesc || book?.desc}
                </p>
                <button 
                    onClick={handleBiography}
                    className="mt-4 text-xs font-bold text-santri-green flex items-center gap-1 hover:underline"
                >
                   Baca Biografi Pengarang <ArrowLeft size={12} className="rotate-180" />
                </button>
             </div>
          </div>

          {/* Chapters List */}
          <div className="pb-12 animate-in slide-in-from-bottom-8 duration-700">
            <div className="flex items-center justify-between mb-4 px-1">
               <div className="flex items-center gap-2">
                  <List size={20} className="text-santri-green dark:text-santri-gold" />
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">Daftar Isi</h3>
               </div>
               <span className="text-xs text-slate-400 font-medium bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
                 {book?.chapters?.length || 0} Bab
               </span>
            </div>
            
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
               {book?.chapters && book.chapters.length > 0 ? (
                 book.chapters.map((chapter, index) => (
                   <button 
                     key={index}
                     onClick={() => handleChapterClick(chapter)}
                     className="w-full flex items-start gap-4 p-4 text-left hover:bg-green-50 dark:hover:bg-green-900/10 border-b border-slate-50 dark:border-slate-800 last:border-0 transition-colors group"
                   >
                      <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold text-xs flex items-center justify-center group-hover:bg-santri-green group-hover:text-white dark:group-hover:bg-santri-gold dark:group-hover:text-santri-green transition-colors mt-0.5 font-mono">
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <span className="font-medium text-slate-700 dark:text-slate-200 text-sm group-hover:text-santri-green dark:group-hover:text-santri-gold transition-colors leading-relaxed block">
                            {chapter}
                        </span>
                      </div>
                   </button>
                 ))
               ) : (
                 <div className="p-12 text-center text-slate-400 flex flex-col items-center">
                    <List size={48} className="mb-2 opacity-20" />
                    <p>Daftar isi tidak tersedia.</p>
                 </div>
               )}
            </div>
          </div>

        </div>
    </div>
  );
};

export default BookDetailScreen;
