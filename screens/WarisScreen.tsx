
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calculator, Sparkles, Loader2, Info } from 'lucide-react';
import { askReligiousQuery } from '../services/geminiService';

const WarisScreen: React.FC = () => {
  const navigate = useNavigate();
  const [totalWealth, setTotalWealth] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  // Heirs State
  const [heirs, setHeirs] = useState({
    husband: false,
    wife: false,
    father: false,
    mother: false,
    son: 0,
    daughter: 0,
    brother: 0,
    sister: 0
  });

  const handleHeirChange = (key: keyof typeof heirs, val: any) => {
    setHeirs(prev => ({ ...prev, [key]: val }));
  };

  const handleWealthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove non-numeric characters
    const rawValue = e.target.value.replace(/\D/g, '');
    
    if (!rawValue) {
      setTotalWealth('');
      return;
    }

    // Format with dots (Indonesian locale)
    const formatted = new Intl.NumberFormat('id-ID').format(parseInt(rawValue));
    setTotalWealth(formatted);
  };

  const calculateWaris = async () => {
    if (!totalWealth) {
      alert("Masukkan total harta warisan");
      return;
    }

    setLoading(true);
    setResult('');

    // Construct Prompt
    const heirList = [];
    if (heirs.husband) heirList.push("Suami");
    if (heirs.wife) heirList.push("Istri");
    if (heirs.father) heirList.push("Ayah");
    if (heirs.mother) heirList.push("Ibu");
    if (heirs.son > 0) heirList.push(`${heirs.son} Anak Laki-laki`);
    if (heirs.daughter > 0) heirList.push(`${heirs.daughter} Anak Perempuan`);
    if (heirs.brother > 0) heirList.push(`${heirs.brother} Saudara Laki-laki`);
    if (heirs.sister > 0) heirList.push(`${heirs.sister} Saudara Perempuan`);

    const prompt = `
      Bertindaklah sebagai ahli Faraid (Hukum Waris Islam). 
      Hitung pembagian waris dengan detail:
      
      Total Harta: Rp ${totalWealth}
      Ahli Waris: ${heirList.join(', ')}

      Berikan output:
      1. Penjelasan siapa yang mendapat bagian (Ashabul Furudh / Ashabah) dan siapa yang terhalang (Mahjub).
      2. Rincian perhitungan pecahan (1/2, 1/4, 1/8, dll).
      3. Nominal Rupiah yang diterima setiap ahli waris.
      4. Dasar hukum singkat (Dalil).
    `;

    try {
      const response = await askReligiousQuery('kitab', prompt); // Reusing 'kitab' topic for general scholar query
      setResult(response);
    } catch (e) {
      setResult("Maaf, gagal menghitung. Periksa koneksi internet.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shadow-sm px-4 py-3 flex items-center gap-3 transition-colors">
        <button 
          onClick={() => navigate(-1)} 
          className="p-2 -ml-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h2 className="font-bold text-slate-800 dark:text-slate-100 text-lg flex items-center gap-2">
          <Calculator size={20} className="text-pink-600" />
          Kalkulator Waris
        </h2>
      </div>

      <div className="p-4 space-y-6">
        
        {/* Info Box */}
        <div className="bg-pink-50 dark:bg-pink-900/10 p-4 rounded-xl border border-pink-100 dark:border-pink-900/30 flex gap-3 items-start">
             <Info size={20} className="text-pink-600 shrink-0 mt-0.5" />
             <p className="text-xs text-pink-700 dark:text-pink-300 leading-relaxed">
               Perhitungan ini dibantu oleh AI berdasarkan kaidah Faraid. Hasil ini sebagai rujukan awal, sebaiknya konsultasikan kembali dengan Ulama atau Kyai setempat untuk kasus yang kompleks.
             </p>
        </div>

        {/* Input Harta */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
             <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Total Harta Warisan (Rp)</label>
             <input 
               type="text" 
               value={totalWealth}
               onChange={handleWealthChange}
               placeholder="Contoh: 100.000.000"
               className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-pink-500 font-mono text-lg"
             />
        </div>

        {/* Ahli Waris Selector */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
           <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">Ahli Waris Utama</h3>
           
           <div className="grid grid-cols-2 gap-4 mb-4">
              <label className="flex items-center gap-2 cursor-pointer p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-transparent hover:border-pink-200">
                  <input type="checkbox" checked={heirs.husband} onChange={(e) => handleHeirChange('husband', e.target.checked)} className="w-5 h-5 accent-pink-600" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Suami</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-transparent hover:border-pink-200">
                  <input type="checkbox" checked={heirs.wife} onChange={(e) => handleHeirChange('wife', e.target.checked)} className="w-5 h-5 accent-pink-600" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Istri</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-transparent hover:border-pink-200">
                  <input type="checkbox" checked={heirs.father} onChange={(e) => handleHeirChange('father', e.target.checked)} className="w-5 h-5 accent-pink-600" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Ayah</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-transparent hover:border-pink-200">
                  <input type="checkbox" checked={heirs.mother} onChange={(e) => handleHeirChange('mother', e.target.checked)} className="w-5 h-5 accent-pink-600" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Ibu</span>
              </label>
           </div>

           <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">Anak & Saudara</h3>
           <div className="space-y-3">
              <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Anak Laki-laki</span>
                  <div className="flex items-center gap-3">
                     <button onClick={() => handleHeirChange('son', Math.max(0, heirs.son - 1))} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-600">-</button>
                     <span className="w-4 text-center text-slate-800 dark:text-slate-200 font-bold">{heirs.son}</span>
                     <button onClick={() => handleHeirChange('son', heirs.son + 1)} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-600">+</button>
                  </div>
              </div>
              <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Anak Perempuan</span>
                  <div className="flex items-center gap-3">
                     <button onClick={() => handleHeirChange('daughter', Math.max(0, heirs.daughter - 1))} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-600">-</button>
                     <span className="w-4 text-center text-slate-800 dark:text-slate-200 font-bold">{heirs.daughter}</span>
                     <button onClick={() => handleHeirChange('daughter', heirs.daughter + 1)} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-600">+</button>
                  </div>
              </div>
           </div>
        </div>

        <button 
           onClick={calculateWaris}
           disabled={loading}
           className="w-full py-4 bg-pink-600 text-white rounded-xl font-bold hover:bg-pink-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-pink-200 dark:shadow-pink-900/20"
        >
            {loading ? (
                <>
                   <Loader2 size={20} className="animate-spin" />
                   Sedang Menghitung...
                </>
            ) : (
                <>
                   <Sparkles size={20} className="text-pink-200" />
                   Hitung Pembagian Waris
                </>
            )}
        </button>

        {/* Result Area */}
        {result && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-pink-100 dark:border-pink-900/30 shadow-sm animate-in fade-in slide-in-from-bottom-8">
                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                    <Calculator size={20} className="text-pink-600" />
                    Hasil Perhitungan
                </h3>
                <div className="prose prose-sm max-w-none text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {result}
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

export default WarisScreen;