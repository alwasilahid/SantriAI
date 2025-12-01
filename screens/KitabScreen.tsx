import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  BookOpen, 
  Shield, 
  Scale, 
  Gavel, 
  Feather, 
  Heart, 
  Clock,
  Book,
  Save,
  ChevronRight,
  Scroll,
  ArrowRight
} from 'lucide-react';

type CategoryItem = { id: string; label: string; icon: any; desc: string };

const STATIC_CATEGORIES: CategoryItem[] = [
  { id: 'tafsir', label: 'Tafsir Al-Quran', icon: BookOpen, desc: 'Tafsir Jalalain, Ibnu Katsir, dll' },
  { id: 'hadits', label: 'Hadits', icon: Scroll, desc: 'Arba\'in Nawawi, Riyadhus Shalihin' },
  { id: 'akidah', label: 'Akidah (Tauhid)', icon: Shield, desc: 'Aqidatul Awam, Jauharatut Tauhid' },
  { id: 'fiqh', label: 'Fiqih', icon: Scale, desc: 'Fathul Qorib, Safinatun Najah' },
  { id: 'ushul_fiqh', label: 'Ushul Fiqih', icon: Gavel, desc: 'Al-Waraqat, Lathaiful Isyarat' },
  { id: 'nahwu', label: 'Nahwu & Shorof', icon: Feather, desc: 'Al-Jurumiyah, Imriti, Alfiyah' },
  { id: 'tasawuf', label: 'Akhlaq & Tasawuf', icon: Heart, desc: 'Ta\'lim Muta\'allim, Ihya Ulumuddin' },
  { id: 'tarikh', label: 'Tarikh (Sejarah)', icon: Clock, desc: 'Khulashoh Nurul Yaqin, Sirah Nabawiyah' }
];

const KitabScreen: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [savedBooks, setSavedBooks] = useState<any[]>([]);

  // Load Saved Books on Mount to show count or enable button
  useEffect(() => {
    const saved = localStorage.getItem('santriai_saved_books');
    if (saved) {
      setSavedBooks(JSON.parse(saved));
    }
  }, []);

  const handleSearch = () => {
    if (!query.trim()) return;
    // Direct search -> Go to Book Detail (let it fetch via AI based on query)
    navigate('/book-detail', { state: { query: query } });
  };

  const openCategory = (cat: CategoryItem) => {
    navigate('/category-books', { state: { id: cat.id, label: cat.label } });
  };

  const openSaved = () => {
    navigate('/category-books', { state: { id: 'saved', label: 'Koleksi Tersimpan', books: savedBooks } });
  };

  return (
    <div className="pb-24 pt-6 px-4 min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Book className="text-santri-green dark:text-santri-gold" />
          Pustaka Kitab
        </h2>
      </div>

      {/* Search Input */}
      <div className="bg-white dark:bg-slate-900 p-2 rounded-xl border border-green-100 dark:border-green-900/30 shadow-sm flex gap-2 mb-8 sticky top-4 z-20 transition-colors">
        <div className="flex-1 flex items-center px-3 bg-slate-50 dark:bg-slate-800 rounded-lg transition-colors">
           <Search size={18} className="text-slate-400 dark:text-slate-500 mr-2" />
           <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari judul kitab..."
            className="flex-1 bg-transparent py-3 outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm"
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <button 
          onClick={handleSearch}
          disabled={!query}
          className="bg-santri-green text-white px-5 rounded-lg font-semibold text-sm disabled:opacity-50 active:scale-95 transition-transform shadow-sm shadow-green-200 dark:shadow-green-900/30 flex items-center justify-center min-w-[70px]"
        >
          Cari
        </button>
      </div>

      {/* Categories Grid */}
      <div className="animate-in fade-in duration-500 space-y-4">
          
          {/* Saved Collection Button */}
          {savedBooks.length > 0 && (
            <button
                onClick={openSaved}
                className="w-full flex items-center justify-between p-5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl shadow-lg shadow-blue-200 dark:shadow-blue-900/30 hover:scale-[1.02] transition-transform text-left group mb-6"
            >
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-white/20">
                        <Save size={24} className="text-white" />
                    </div>
                    <div>
                        <span className="font-bold text-base block">Koleksi Tersimpan</span>
                        <span className="text-xs text-blue-100">{savedBooks.length} Kitab telah dibedah</span>
                    </div>
                </div>
                <ArrowRight size={20} className="text-white/80 group-hover:translate-x-1 transition-transform" />
            </button>
          )}

          <div className="flex justify-between items-end px-1">
             <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
               <BookOpen size={14} className="text-santri-gold" />
               Kategori Kitab
             </h3>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {STATIC_CATEGORIES.map((category) => {
              const Icon = category.icon;
              return (
                <button 
                  key={category.id} 
                  onClick={() => openCategory(category)}
                  className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-santri-gold/50 transition-all text-left group active:scale-[0.98]"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 group-hover:bg-santri-green group-hover:text-white dark:group-hover:bg-santri-gold dark:group-hover:text-santri-green transition-colors">
                      <Icon size={24} strokeWidth={1.5} />
                    </div>
                    <div>
                        <span className="font-bold text-base text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors block mb-0.5">
                        {category.label}
                        </span>
                        <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                            {category.desc}
                        </span>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-slate-300 dark:text-slate-600 group-hover:text-santri-green dark:group-hover:text-santri-gold transition-colors" />
                </button>
              );
            })}
          </div>
      </div>
    </div>
  );
};

export default KitabScreen;