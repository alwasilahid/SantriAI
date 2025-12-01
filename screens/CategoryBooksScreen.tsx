
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { generateJson } from '../services/geminiService';
import { 
  ArrowLeft, 
  Search, 
  Loader2, 
  RefreshCw, 
  Trash2, 
  Book,
  Save,
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

const CategoryBooksScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id, label, books: initialBooks } = (location.state as { id: string, label: string, books?: BookItem[] }) || {};

  const [books, setBooks] = useState<BookItem[]>(initialBooks || []);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');

  // Auto-fetch if no books provided (Dynamic Category)
  useEffect(() => {
    const fetchBooks = async () => {
      // Check session cache first (except for Saved collection)
      const cacheKey = `santriai_cat_${id}`;
      const cached = sessionStorage.getItem(cacheKey);
      
      if (initialBooks && initialBooks.length > 0) {
          // Already provided (e.g. Saved Books passed via state)
          return;
      }

      if (id === 'saved') {
          // If 'saved' but no books passed, try load from localstorage
          const savedRaw = localStorage.getItem('santriai_saved_books');
          if (savedRaw) setBooks(JSON.parse(savedRaw));
          return;
      }

      if (cached) {
          setBooks(JSON.parse(cached));
          return;
      }

      setLoading(true);
      try {
        const prompt = `
          Sebutkan 15-20 Kitab Kuning (Turath) yang paling populer, muktabar (otoritatif), dan banyak dipelajari di pesantren untuk kategori: "${label}".
          
          Berikan Output JSON murni:
          [
            {
              "name": "Nama Kitab (Arab/Latin)",
              "desc": "Deskripsi singkat (1 kalimat tentang isi)",
              "author": "Nama Pengarang"
            },
            ...
          ]
        `;
        
        const result = await generateJson(prompt, "Anda adalah pustakawan ahli kitab kuning.");
        
        if (Array.isArray(result)) {
          const mappedBooks = result.map((b: any) => ({
             ...b,
             id: `ai-list-${b.name.replace(/\s+/g, '-').toLowerCase()}`,
             isAiGenerated: true
          }));
          setBooks(mappedBooks);
          sessionStorage.setItem(cacheKey, JSON.stringify(mappedBooks));
        }
      } catch (e) {
        console.error("Failed to fetch category books", e);
        // Fail silently - UI will show empty state / retry button
      } finally {
        setLoading(false);
      }
    };

    if (id) {
        fetchBooks();
    }
  }, [id, label, initialBooks]);

  const handleBookClick = (book: BookItem) => {
    navigate('/book-detail', { state: { book } });
  };

  const deleteSavedBook = (bookId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Hapus kitab ini dari koleksi tersimpan?")) {
      const newBooks = books.filter(b => b.id !== bookId);
      setBooks(newBooks);
      localStorage.setItem('santriai_saved_books', JSON.stringify(newBooks));
    }
  };

  const filteredBooks = books.filter(b => 
    b.name.toLowerCase().includes(query.toLowerCase()) || 
    b.author?.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24 font-sans">
      
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shadow-sm px-4 py-3 flex items-center gap-3 transition-colors">
        <button 
          onClick={() => navigate(-1)} 
          className="p-2 -ml-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="flex-1">
            <h2 className="font-bold text-slate-800 dark:text-slate-100 text-lg">{label || 'Daftar Kitab'}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Koleksi Kitab</p>
        </div>
      </div>

      <div className="px-4 pt-4">
        
        {/* Search */}
        <div className="bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex gap-2 mb-6 sticky top-[70px] z-20">
            <div className="flex-1 flex items-center px-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <Search size={18} className="text-slate-400 mr-2" />
                <input 
                    type="text" 
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Filter judul kitab..."
                    className="flex-1 bg-transparent py-2.5 outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400 text-sm"
                />
            </div>
        </div>

        {/* List */}
        {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 size={32} className="text-santri-green animate-spin mb-4" />
                <p className="text-slate-400 text-sm">Memuat daftar kitab...</p>
            </div>
        ) : filteredBooks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                    <BookOpen size={24} className="text-slate-400" />
                </div>
                <p className="text-slate-400 text-sm italic mb-4">Tidak ada kitab ditemukan.</p>
                {id !== 'saved' && (
                    <button 
                        onClick={() => { sessionStorage.removeItem(`santriai_cat_${id}`); window.location.reload(); }}
                        className="text-santri-green font-bold text-sm flex items-center gap-2 bg-green-50 px-4 py-2 rounded-lg"
                    >
                        <RefreshCw size={14} /> Coba Muat Ulang
                    </button>
                )}
            </div>
        ) : (
            <div className="grid gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {filteredBooks.map((book, idx) => (
                    <div key={idx} className="relative group">
                        <button
                            onClick={() => handleBookClick(book)}
                            className="w-full flex items-start gap-4 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm hover:border-santri-green/50 dark:hover:border-santri-gold/50 transition-all text-left"
                        >
                            <div className="w-12 h-14 rounded-lg bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0 border border-orange-100 dark:border-orange-900/30">
                                <Book size={24} />
                            </div>
                            <div className="flex-1 pr-6">
                                <h4 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1 leading-snug">
                                    {book.name}
                                </h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-2">
                                    {book.desc}
                                </p>
                                {book.author && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-santri-green bg-green-50 dark:bg-green-900/20 dark:text-green-400 px-2 py-0.5 rounded">
                                        {book.author}
                                    </span>
                                )}
                            </div>
                        </button>
                        
                        {/* Delete button only for saved category */}
                        {id === 'saved' && book.id && (
                            <button 
                                onClick={(e) => deleteSavedBook(book.id!, e)}
                                className="absolute right-3 top-3 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                            >
                                <Trash2 size={16} />
                            </button>
                        )}
                    </div>
                ))}
            </div>
        )}

      </div>
    </div>
  );
};

export default CategoryBooksScreen;
