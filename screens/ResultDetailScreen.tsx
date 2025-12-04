import React, { useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Toast from '../components/Toast';
import { 
  ArrowLeft, 
  Copy, 
  Share2, 
  Check, 
  Book, 
  FileText, 
  GraduationCap, 
  Languages, 
  Feather, 
  Scale, 
  MessageSquareQuote, 
  Library, 
  Sparkles 
} from 'lucide-react';

interface ResultDetailProps {
  fontSize: number;
}

const ICONS: Record<string, any> = {
  modernTranslation: Book,
  maknaGandul: FileText,
  nahwuShorof: GraduationCap,
  lughah: Languages,
  balaghah: Feather,
  ushulFiqh: Scale,
  hikmah: MessageSquareQuote,
  referensi: Library,
  aiExplanation: Sparkles
};

const ResultDetailScreen: React.FC<ResultDetailProps> = ({ fontSize }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id, label, sub, content, className } = location.state || {};

  const [copied, setCopied] = useState(false);
  const isSharing = useRef(false);

  // Toast State
  const [toast, setToast] = useState({ show: false, message: '' });
  const showToast = (message: string) => setToast({ show: true, message });

  if (!content) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <p className="text-slate-500 mb-4">Data tidak ditemukan</p>
          <button onClick={() => navigate(-1)} className="text-santri-green font-bold">Kembali</button>
        </div>
      </div>
    );
  }

  const Icon = ICONS[id] || Book;

  // Extract color classes for theming the header
  const bgClass = className?.split(' ').find((c: string) => c.startsWith('bg-')) || 'bg-slate-50';
  const textClass = className?.split(' ').find((c: string) => c.startsWith('text-')) || 'text-slate-700';
  const borderClass = className?.split(' ').find((c: string) => c.startsWith('border-')) || 'border-slate-200';

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (isSharing.current) return;
    isSharing.current = true;

    if (navigator.share) {
      try {
        await navigator.share({
          title: label,
          text: content,
        });
      } catch (err: any) {
        if (err.name !== 'AbortError') {
           handleCopy();
           showToast('Teks disalin ke clipboard.');
        }
      } finally {
        isSharing.current = false;
      }
    } else {
      handleCopy();
      showToast('Teks disalin ke clipboard.');
      isSharing.current = false;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24 font-sans flex flex-col">
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
            <h2 className={`font-bold text-lg ${textClass.replace('700', '600')}`}>
              {label}
            </h2>
        </div>
        <div className="flex gap-1">
            <button onClick={handleCopy} className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                {copied ? <Check size={20} className="text-green-500" /> : <Copy size={20} />}
            </button>
            <button onClick={handleShare} className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                <Share2 size={20} />
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Hero Card */}
        <div className={`p-6 pb-8 ${bgClass} ${borderClass} border-b mb-6 transition-colors`}>
           <div className="flex flex-col items-center text-center animate-in slide-in-from-top-4 duration-500">
              <div className={`w-16 h-16 rounded-2xl bg-white dark:bg-slate-900/50 flex items-center justify-center mb-4 shadow-sm ${textClass}`}>
                 <Icon size={32} />
              </div>
              <h1 className={`text-2xl font-bold mb-1 ${textClass}`}>{label}</h1>
              <p className="text-sm font-bold uppercase tracking-wider text-santri-gold">{sub}</p>
           </div>
        </div>

        {/* Content */}
        <div className="px-5 pb-8 max-w-2xl mx-auto animate-in fade-in duration-500 delay-100">
           <div 
             className="prose prose-lg max-w-none text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line text-justify font-serif"
             style={{ fontSize: `${fontSize}px`, lineHeight: 1.8 }}
           >
             {content}
           </div>
        </div>
      </div>

    </div>
  );
};

export default ResultDetailScreen;
