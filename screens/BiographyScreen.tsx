import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Toast from '../components/Toast';
import { 
  ArrowLeft, 
  User, 
  Loader2, 
  Copy, 
  Share2, 
  Check, 
  BookOpen, 
  GraduationCap, 
  PenTool, 
  Star, 
  Clock, 
  MapPin, 
  Users, 
  Scroll,
  Calendar
} from 'lucide-react';
import { askReligiousQuery } from '../services/geminiService';

interface NarrativeSection {
  title: string;
  content: string;
}

interface BioData {
  fullName: string;
  titles: string;
  birthDeath: string;
  intro: string;
  teachers: string[];
  students: string[];
  works: string[];
  narrativeSections: NarrativeSection[];
}

const BiographyScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { author, book } = (location.state as { author: string, book: string }) || {};

  const [bioData, setBioData] = useState<BioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [rawText, setRawText] = useState('');
  const isSharing = useRef(false);

  // Toast State
  const [toast, setToast] = useState({ show: false, message: '' });
  const showToast = (message: string) => setToast({ show: true, message });

  useEffect(() => {
    if (!author) {
      navigate('/kitab');
      return;
    }

    const fetchBiography = async () => {
      setLoading(true);
      let result = '';
      
      const prompt = `
        Bertindaklah sebagai sejarawan Islam ahli Turath. Buatkan profil biografi lengkap dan terstruktur untuk: ${author} (Pengarang Kitab: ${book || 'terkenal'}).
        
        PENTING: Berikan output HANYA dalam format JSON valid tanpa markdown (backtick). Jangan ada teks pengantar diluar JSON.
        
        Format JSON:
        {
          "fullName": "Nama lengkap beliau dengan gelar (Arab/Latin)",
          "titles": "Gelar kehormatan (contoh: AL-IMAM, AL-ALLAMAH, MUFTI... - Pisahkan dengan koma, Kapital)",
          "birthDeath": "Lahir [Tahun H / M] - Wafat [Tahun H / M]",
          "intro": "Paragraf ringkas (2-3 kalimat) yang merangkum siapa beliau.",
          "teachers": ["Nama Guru 1", "Nama Guru 2 (ambil max 5 tokoh utama)"],
          "students": ["Nama Murid 1", "Nama Murid 2 (ambil max 5 tokoh utama)"],
          "works": ["Judul Kitab 1", "Judul Kitab 2", "Judul Kitab 3"],
          "narrativeSections": [
            { "title": "Kelahiran & Masa Kecil", "content": "..." },
            { "title": "Rihlah Ilmiah (Pendidikan)", "content": "..." },
            { "title": "Kontribusi & Perjuangan", "content": "..." },
            { "title": "Wafat & Makam", "content": "..." }
          ]
        }
      `;
      
      try {
        result = await askReligiousQuery('kitab', prompt);
        setRawText(result);

        // Clean JSON formatting
        const cleanJson = result.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');
        const parsed = JSON.parse(cleanJson);
        setBioData(parsed);
      } catch (error) {
        console.error("Failed to parse bio JSON", error);
        // Fallback dummy data if parsing fails to avoid white screen
        setBioData({
            fullName: author,
            titles: "ULAMA",
            birthDeath: "Data tidak tersedia",
            intro: "Gagal memuat format terstruktur. Menampilkan data mentah.",
            teachers: [],
            students: [],
            works: [],
            narrativeSections: [{ title: "Biografi (Raw)", content: result || "Gagal memuat data." }]
        });
      } finally {
        setLoading(false);
      }
    };

    fetchBiography();
  }, [author, book, navigate]);

  const handleCopy = () => {
    if (!bioData) return;
    const textToCopy = `*${bioData.fullName}*\n${bioData.titles}\n\n${bioData.intro}\n\nKarya: ${bioData.works?.join(', ') || '-'}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    showToast("Teks disalin ke clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!bioData) return;
    if (isSharing.current) return;
    isSharing.current = true;

    const textToShare = `*${bioData.fullName}*\n${bioData.titles}\n\n${bioData.intro}\n\nSelengkapnya di SantriAI.`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Biografi ${author}`,
          text: textToShare,
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
            <User size={20} className="text-santri-green" />
            Biografi Ulama
            </h2>
        </div>
        {!loading && bioData && (
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
                <p className="text-slate-500 text-sm animate-pulse font-medium">Sedang menelusuri kitab sejarah...</p>
             </div>
        ) : bioData ? (
             <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-500">
                
                {/* 1. HERO PROFILE CARD */}
                <div className="bg-white dark:bg-slate-900 rounded-[2rem] border-2 border-green-50 dark:border-green-900/20 shadow-xl overflow-hidden relative">
                    <div className="h-2 w-full bg-gradient-to-r from-santri-green to-santri-gold"></div>
                    <div className="p-8 flex flex-col items-center text-center relative z-10">
                        
                        {/* Name */}
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100 mb-4 font-serif leading-tight pt-2">
                            {bioData.fullName}
                        </h1>

                        {/* Titles Pill */}
                        <div className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider mb-6 border border-amber-200 dark:border-amber-800/50 shadow-sm">
                            {bioData.titles}
                        </div>

                        {/* Birth/Death */}
                        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700">
                            <Calendar size={14} />
                            {bioData.birthDeath}
                        </div>
                    </div>
                    {/* Background Pattern */}
                    <div className="absolute top-0 left-0 w-full h-full opacity-5 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] pointer-events-none"></div>
                </div>

                {/* 2. SUMMARY */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                            <MapPin size={20} />
                        </div>
                        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">Ringkasan</h3>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-justify text-sm">
                        {bioData.intro}
                    </p>
                </div>

                {/* 3. SANAD KEILMUAN (Guru & Murid) */}
                <div className="bg-blue-50/50 dark:bg-blue-900/10 p-6 rounded-3xl border border-blue-100 dark:border-blue-800/30">
                    <div className="flex items-center gap-3 mb-6">
                        <Users size={24} className="text-blue-600 dark:text-blue-400" />
                        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">Sanad Keilmuan</h3>
                    </div>

                    {/* Guru */}
                    <div className="mb-6">
                        <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <GraduationCap size={14} /> Guru-Guru Utama
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {bioData.teachers && bioData.teachers.length > 0 ? bioData.teachers.map((teacher, i) => (
                                <span key={i} className="bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700/50 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-lg text-xs font-medium shadow-sm">
                                    {teacher}
                                </span>
                            )) : <span className="text-xs text-slate-400 italic">Data tidak tersedia</span>}
                        </div>
                    </div>

                    {/* Murid */}
                    <div>
                        <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <Users size={14} /> Murid-Murid Utama
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {bioData.students && bioData.students.length > 0 ? bioData.students.map((student, i) => (
                                <span key={i} className="bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700/50 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-lg text-xs font-medium shadow-sm">
                                    {student}
                                </span>
                            )) : <span className="text-xs text-slate-400 italic">Data tidak tersedia</span>}
                        </div>
                    </div>
                </div>

                {/* 4. KARYA MONUMENTAL */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-50 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-santri-green/10 rounded-lg text-santri-green">
                                <Scroll size={20} />
                            </div>
                            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">Karya Monumental</h3>
                        </div>
                    </div>
                    <div className="p-4">
                        {bioData.works && bioData.works.length > 0 ? (
                            <div className="grid gap-3">
                                {bioData.works.map((work, i) => (
                                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-700">
                                        <BookOpen size={18} className="text-santri-gold shrink-0 mt-0.5" />
                                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 leading-snug">
                                            {work}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-slate-400 italic p-2">Data karya belum tersedia.</p>
                        )}
                    </div>
                </div>

                {/* 5. NARRATIVE SECTIONS */}
                {bioData.narrativeSections && bioData.narrativeSections.map((section, idx) => (
                    <div key={idx} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400">
                                {section.title.toLowerCase().includes('wafat') ? <Clock size={20} /> : <Star size={20} />}
                            </div>
                            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">
                                {section.title}
                            </h3>
                        </div>
                        <div className="prose prose-sm max-w-none text-slate-600 dark:text-slate-300 leading-relaxed text-justify whitespace-pre-line">
                            {section.content}
                        </div>
                    </div>
                ))}

             </div>
        ) : (
            <div className="text-center py-20 text-slate-400">Gagal memuat data.</div>
        )}

      </div>
    </div>
  );
};

export default BiographyScreen;
