
import React from 'react';
import { HistoryItem } from '../types';
import { Clock, Book, BookOpen, Scroll, HeartHandshake, Languages } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface HistoryScreenProps {
  history: HistoryItem[];
}

const HistoryScreen: React.FC<HistoryScreenProps> = ({ history }) => {
  const navigate = useNavigate();

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-600 text-center">
        <Clock size={48} className="mb-4 opacity-50" />
        <p className="text-lg font-medium text-slate-600 dark:text-slate-400">Belum ada riwayat</p>
        <p className="text-sm mt-2">Aktivitas belajar Anda akan muncul di sini.</p>
      </div>
    );
  }

  const getIcon = (type: string) => {
    switch(type) {
      case 'translation': return <Languages size={18} />;
      case 'quran': return <BookOpen size={18} />;
      case 'kitab': return <Book size={18} />;
      case 'hadis': return <Scroll size={18} />;
      case 'doa': return <HeartHandshake size={18} />;
      default: return <Clock size={18} />;
    }
  };

  const getColor = (type: string) => {
    switch(type) {
      case 'translation': return 'text-orange-500 bg-orange-50 dark:bg-orange-900/20';
      case 'quran': return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20';
      case 'kitab': return 'text-amber-500 bg-amber-50 dark:bg-amber-900/20';
      case 'hadis': return 'text-blue-500 bg-blue-50 dark:bg-blue-900/20';
      case 'doa': return 'text-cyan-500 bg-cyan-50 dark:bg-cyan-900/20';
      default: return 'text-slate-500 bg-slate-50 dark:bg-slate-900/20';
    }
  };

  const handleItemClick = (item: HistoryItem) => {
    if (item.type === 'translation' && item.data) {
        navigate('/result', { state: { result: item.data } });
    } else if (item.path) {
        // For other types, navigate with data if available
        navigate(item.path, { state: item.data ? { ...item.data } : undefined });
    }
  };

  return (
    <div className="space-y-3 pb-8">
      {history.map((item) => (
        <button 
          key={item.id} 
          onClick={() => handleItemClick(item)}
          className="w-full text-left bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group flex items-start gap-4"
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${getColor(item.type)}`}>
             {getIcon(item.type)}
          </div>
          
          <div className="flex-1 min-w-0">
             <div className="flex justify-between items-start mb-1">
               <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded">
                 {item.type.toUpperCase()}
               </span>
               <span className="text-[10px] text-slate-400 dark:text-slate-500">
                 {new Date(item.timestamp).toLocaleDateString('id-ID', {
                   day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                 })}
               </span>
             </div>
             
             <h4 className={`font-bold text-slate-800 dark:text-slate-200 truncate leading-snug mb-1 ${item.type === 'translation' ? 'font-arabic text-lg' : 'text-sm'}`} dir={item.type === 'translation' ? 'rtl' : 'ltr'}>
                {item.title}
             </h4>
             <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                {item.subtitle}
             </p>
          </div>
        </button>
      ))}
    </div>
  );
};

export default HistoryScreen;
