
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Coins, 
  Calculator, 
  Info, 
  Briefcase, 
  Wallet, 
  Users, 
  Store, 
  Sprout, 
  Tractor, 
  Fish, 
  Building2, 
  X,
  CheckCircle,
  XCircle,
  ChevronRight,
  HelpCircle
} from 'lucide-react';

// --- TYPES & MENU CONFIG ---

type ZakatType = 'profesi' | 'maal' | 'perdagangan' | 'pertanian' | 'peternakan' | 'perusahaan' | 'tambak' | 'fitrah';

// Custom Icon Components wrapper
function WheatIcon(props: any) {
  return <Sprout {...props} />;
}

interface ZakatMenuItem {
  id: ZakatType;
  title: string;
  icon: any;
  color: string;
  desc: string;
}

const ZAKAT_MENU: ZakatMenuItem[] = [
  { id: 'profesi', title: 'Zakat Profesi', icon: Briefcase, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20', desc: 'Gaji, Honor, & Penghasilan' },
  { id: 'maal', title: 'Simpanan & Emas', icon: Wallet, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20', desc: 'Tabungan, Emas, Perak' },
  { id: 'perdagangan', title: 'Zakat Perdagangan', icon: Store, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20', desc: 'Aset Usaha & Perniagaan' },
  { id: 'pertanian', title: 'Zakat Pertanian', icon: WheatIcon, color: 'text-green-600 bg-green-50 dark:bg-green-900/20', desc: 'Padi, Jagung, & Tanaman Pangan' },
  { id: 'peternakan', title: 'Zakat Peternakan', icon: Tractor, color: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20', desc: 'Sapi, Kambing, Kerbau' },
  { id: 'tambak', title: 'Zakat Tambak', icon: Fish, color: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-900/20', desc: 'Ikan, Udang, Hasil Laut' },
  { id: 'perusahaan', title: 'Zakat Perusahaan', icon: Building2, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20', desc: 'Saham & Aset Korporasi' },
  { id: 'fitrah', title: 'Zakat Fitrah', icon: Users, color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20', desc: 'Jiwa (Ramadhan)' },
];

// --- ZAKAT RULES DATA ---
const ZAKAT_DETAILS: Record<ZakatType, { nishab: string, kadar: string, haul: string, desc: string }> = {
  profesi: {
    nishab: "85 gram emas (setahun)",
    kadar: "2.5%",
    haul: "Saat menerima (Qiyas Pertanian) / Setahun",
    desc: "Zakat yang dikeluarkan dari penghasilan profesi (gaji, honor, jasa, dll) bila telah mencapai nishab."
  },
  maal: {
    nishab: "85 gram emas murni",
    kadar: "2.5%",
    haul: "1 Tahun (Hijriyah)",
    desc: "Zakat harta simpanan (tabungan, emas, perak, surat berharga) yang telah mengendap satu tahun."
  },
  perdagangan: {
    nishab: "Setara 85 gram emas",
    kadar: "2.5%",
    haul: "1 Tahun",
    desc: "Zakat dari aset perniagaan (modal putar + laba + piutang lancar - hutang jatuh tempo)."
  },
  pertanian: {
    nishab: "5 Wasaq (±653 kg Gabah)",
    kadar: "5% (Biaya) / 10% (Alami)",
    haul: "Setiap Panen",
    desc: "Zakat hasil pertanian tanaman pokok (padi, jagung, gandum, dll) yang dikeluarkan saat panen."
  },
  peternakan: {
    nishab: "40 Ekor (Kambing), 30 (Sapi)",
    kadar: "Sesuai jumlah hewan",
    haul: "1 Tahun",
    desc: "Zakat hewan ternak (Sapi, Kambing, Kerbau) yang digembalakan di padang rumput umum."
  },
  tambak: {
    nishab: "Setara 5 Wasaq / 85gr Emas",
    kadar: "2.5% atau 5-10%",
    haul: "Setiap Panen",
    desc: "Zakat hasil budidaya perikanan. Umumnya diqiyaskan dengan zakat pertanian atau perdagangan."
  },
  perusahaan: {
    nishab: "Setara 85 gram emas",
    kadar: "2.5%",
    haul: "1 Tahun",
    desc: "Zakat atas aset perusahaan (saham/ekuitas) yang dijalankan secara syariah."
  },
  fitrah: {
    nishab: "Kelebihan mak. pokok sehari",
    kadar: "2.5 kg / 3.5 Liter Beras",
    haul: "Bulan Ramadhan",
    desc: "Zakat wajib bagi setiap jiwa muslim (laki-laki/perempuan) yang menemui bulan Ramadhan."
  }
};

const ZakatScreen: React.FC = () => {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState<'menu' | ZakatType>('menu');
  
  // --- GLOBAL SETTINGS ---
  const [goldPrice, setGoldPrice] = useState(1300000); // Rp/gram
  const [ricePrice, setRicePrice] = useState(15000); // Rp/kg (untuk nishab pertanian ~653kg gabah setara beras)
  
  // --- FORM STATES ---
  // Profesi
  const [profesi, setProfesi] = useState({ income: '', bonus: '', debt: '' });
  // Maal
  const [maal, setMaal] = useState({ savings: '', gold: '', other: '', debt: '' });
  // Perdagangan & Perusahaan
  const [trade, setTrade] = useState({ modal: '', profit: '', receivables: '', debt: '' });
  // Pertanian & Tambak
  const [harvest, setHarvest] = useState({ result: '', cost: 'alami' as 'alami' | 'biaya' });
  // Peternakan
  const [livestock, setLivestock] = useState({ type: 'kambing' as 'kambing' | 'sapi', count: '' });
  // Fitrah
  const [fitrah, setFitrah] = useState({ persons: 1, price: 15000 });

  // --- RESULT STATE ---
  const [result, setResult] = useState<{ amount: number | string; wajib: boolean; nishab: number | string; note?: string } | null>(null);

  // Helper
  const parseRp = (val: string) => parseFloat(val.replace(/[^0-9]/g, '')) || 0;
  const formatRp = (val: number) => new Intl.NumberFormat('id-ID').format(val);
  const formatCurrency = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

  // Clear result on view change
  useEffect(() => {
    setResult(null);
  }, [activeView]);

  // --- CALCULATION LOGIC ---

  const calcProfesi = () => {
    const total = (parseRp(profesi.income) + parseRp(profesi.bonus)) - parseRp(profesi.debt);
    const nishab = (85 * goldPrice) / 12; // Nishab Emas per tahun dibagi 12 bulan
    const wajib = total >= nishab;
    setResult({ amount: wajib ? total * 0.025 : 0, wajib, nishab });
  };

  const calcMaal = () => {
    const total = (parseRp(maal.savings) + (parseRp(maal.gold) * goldPrice) + parseRp(maal.other)) - parseRp(maal.debt);
    const nishab = 85 * goldPrice;
    const wajib = total >= nishab;
    setResult({ amount: wajib ? total * 0.025 : 0, wajib, nishab });
  };

  const calcTrade = () => {
    // (Modal + Laba + Piutang) - Hutang Jatuh Tempo
    const total = (parseRp(trade.modal) + parseRp(trade.profit) + parseRp(trade.receivables)) - parseRp(trade.debt);
    const nishab = 85 * goldPrice;
    const wajib = total >= nishab;
    setResult({ amount: wajib ? total * 0.025 : 0, wajib, nishab });
  };

  const calcHarvest = () => {
    // Nishab 5 Wasaq setara approx 653kg Gabah Kering Giling.
    // Asumsi harga gabah/beras rata-rata untuk konversi nishab rupiah.
    const totalRp = parseRp(harvest.result);
    const nishabRp = 653 * ricePrice; 
    
    const wajib = totalRp >= nishabRp;
    const rate = harvest.cost === 'alami' ? 0.10 : 0.05; // 10% vs 5%
    
    setResult({ 
      amount: wajib ? totalRp * rate : 0, 
      wajib, 
      nishab: nishabRp,
      note: harvest.cost === 'alami' ? 'Tarif 10% (Tadah Hujan/Alami)' : 'Tarif 5% (Irigasi berbiaya)'
    });
  };

  const calcLivestock = () => {
    const qty = parseInt(livestock.count) || 0;
    let amountText = "";
    let wajib = false;
    let nishabDesc = "";

    if (livestock.type === 'kambing') {
      nishabDesc = "40 Ekor";
      if (qty >= 40 && qty <= 120) { amountText = "1 Ekor Kambing"; wajib = true; }
      else if (qty > 120 && qty <= 200) { amountText = "2 Ekor Kambing"; wajib = true; }
      else if (qty > 200 && qty <= 300) { amountText = "3 Ekor Kambing"; wajib = true; }
      else if (qty > 300) { 
        const hundreds = Math.floor(qty / 100);
        amountText = `${hundreds} Ekor Kambing`; 
        wajib = true; 
      }
    } else { // Sapi
      nishabDesc = "30 Ekor";
      if (qty >= 30 && qty <= 39) { amountText = "1 Ekor Sapi Tabi' (Jantan/Betina 1 th)"; wajib = true; }
      else if (qty >= 40 && qty <= 59) { amountText = "1 Ekor Sapi Musinnah (Betina 2 th)"; wajib = true; }
      else if (qty >= 60 && qty <= 69) { amountText = "2 Ekor Sapi Tabi'"; wajib = true; }
      else if (qty >= 70) { amountText = "1 Tabi' + 1 Musinnah (Rumus: Tiap 30=1 Tabi', Tiap 40=1 Musinnah)"; wajib = true; }
    }

    setResult({ amount: amountText, wajib, nishab: nishabDesc });
  };

  const calcFitrah = () => {
    const zakat = fitrah.persons * fitrah.price * 2.5;
    setResult({ amount: zakat, wajib: true, nishab: 0 });
  };

  // --- SUB COMPONENT: INFO CARD ---
  const ZakatInfoCard = ({ type }: { type: ZakatType }) => {
    const info = ZAKAT_DETAILS[type];
    return (
      <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-xl p-4 border border-emerald-100 dark:border-emerald-900/30 mb-6 shadow-sm">
        <div className="flex items-start gap-3">
          <HelpCircle size={20} className="text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
          <div className="space-y-3 w-full">
             <div>
                <h3 className="font-bold text-emerald-800 dark:text-emerald-300 text-sm mb-1">Ketentuan {ZAKAT_MENU.find(i => i.id === type)?.title}</h3>
                <p className="text-xs text-emerald-700/80 dark:text-emerald-400/80 leading-relaxed">{info.desc}</p>
             </div>
             
             <div className="grid grid-cols-3 gap-2 border-t border-emerald-200 dark:border-emerald-800/50 pt-3">
                <div className="bg-white/50 dark:bg-slate-900/30 p-2 rounded-lg">
                   <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-500 uppercase block mb-0.5">Nishab</span>
                   <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block leading-tight">{info.nishab}</span>
                </div>
                <div className="bg-white/50 dark:bg-slate-900/30 p-2 rounded-lg">
                   <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-500 uppercase block mb-0.5">Kadar</span>
                   <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block leading-tight">{info.kadar}</span>
                </div>
                <div className="bg-white/50 dark:bg-slate-900/30 p-2 rounded-lg">
                   <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-500 uppercase block mb-0.5">Haul</span>
                   <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block leading-tight">{info.haul}</span>
                </div>
             </div>
          </div>
        </div>
      </div>
    );
  };

  // --- RENDER COMPONENT ---

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24">
      
      {/* HEADER */}
      <div className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shadow-sm px-4 py-3 flex items-center gap-3 transition-colors">
        <button 
          onClick={() => {
            if (activeView === 'menu') navigate(-1);
            else { setActiveView('menu'); setResult(null); }
          }} 
          className="p-2 -ml-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h2 className="font-bold text-slate-800 dark:text-slate-100 text-lg flex items-center gap-2">
          <Coins size={20} className="text-emerald-600" />
          {activeView === 'menu' ? 'Kalkulator Zakat' : ZAKAT_MENU.find(i => i.id === activeView)?.title}
        </h2>
      </div>

      <div className="p-4 max-w-lg mx-auto">

        {/* --- MENU VIEW --- */}
        {activeView === 'menu' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Config Bar */}
            <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-xl border border-amber-100 dark:border-amber-900/30 mb-6 flex items-center justify-between shadow-sm">
                <div>
                   <span className="text-xs font-bold text-amber-700 dark:text-amber-400 block mb-1">Harga Emas (per gram)</span>
                   <p className="text-[10px] text-slate-500 dark:text-slate-400">Acuan Nishab Mal</p>
                </div>
                <div className="flex items-center gap-1 bg-white dark:bg-slate-800 rounded-lg px-2 py-1.5 border border-amber-200 dark:border-amber-800/50">
                   <span className="text-xs font-medium text-slate-500">Rp</span>
                   <input 
                      type="text" 
                      value={formatRp(goldPrice)}
                      onChange={(e) => setGoldPrice(parseRp(e.target.value))}
                      className="w-24 bg-transparent text-right text-sm font-bold text-slate-800 dark:text-slate-200 outline-none"
                   />
                </div>
            </div>

            {/* Grid Menu */}
            <div className="grid grid-cols-2 gap-3">
              {ZAKAT_MENU.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveView(item.id)}
                    className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-800 transition-all text-left flex flex-col items-start gap-3 group relative overflow-hidden"
                  >
                    <div className={`w-10 h-10 rounded-xl ${item.color} flex items-center justify-center transition-transform group-hover:scale-110`}>
                      <Icon size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm leading-tight mb-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight">
                        {item.desc}
                      </p>
                    </div>
                    <ChevronRight size={16} className="absolute right-3 top-4 text-slate-200 dark:text-slate-700 group-hover:text-emerald-400 transition-colors" />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* --- CALCULATOR FORMS --- */}
        {activeView !== 'menu' && (
          <div className="animate-in slide-in-from-right-8 duration-300">
            
            {/* Info Card at Top */}
            <ZakatInfoCard type={activeView} />

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
              
              {/* PROFESI FORM */}
              {activeView === 'profesi' && (
                <>
                   <InputMoney label="Pendapatan Bulanan (Total)" value={profesi.income} onChange={v => setProfesi({...profesi, income: v})} />
                   <InputMoney label="Bonus / THR (Opsional)" value={profesi.bonus} onChange={v => setProfesi({...profesi, bonus: v})} />
                   <InputMoney label="Hutang / Cicilan (Pengurang)" value={profesi.debt} onChange={v => setProfesi({...profesi, debt: v})} isDeduction />
                   <CalculateButton onClick={calcProfesi} />
                </>
              )}

              {/* MAAL FORM */}
              {activeView === 'maal' && (
                <>
                   <InputMoney label="Total Tabungan / Deposito" value={maal.savings} onChange={v => setMaal({...maal, savings: v})} />
                   <InputWithUnit label="Berat Emas (Gram)" value={maal.gold} unit="Gram" onChange={v => setMaal({...maal, gold: v})} />
                   <InputMoney label="Aset Lain (Surat Berharga)" value={maal.other} onChange={v => setMaal({...maal, other: v})} />
                   <InputMoney label="Hutang Jatuh Tempo" value={maal.debt} onChange={v => setMaal({...maal, debt: v})} isDeduction />
                   <CalculateButton onClick={calcMaal} />
                </>
              )}

              {/* PERDAGANGAN & PERUSAHAAN FORM */}
              {(activeView === 'perdagangan' || activeView === 'perusahaan') && (
                <>
                   <InputMoney label="Modal / Aset Lancar / Stok" value={trade.modal} onChange={v => setTrade({...trade, modal: v})} />
                   <InputMoney label="Keuntungan (Laba Ditahan)" value={trade.profit} onChange={v => setTrade({...trade, profit: v})} />
                   <InputMoney label="Piutang (Dapat Dicairkan)" value={trade.receivables} onChange={v => setTrade({...trade, receivables: v})} />
                   <InputMoney label="Hutang Jatuh Tempo" value={trade.debt} onChange={v => setTrade({...trade, debt: v})} isDeduction />
                   <CalculateButton onClick={calcTrade} />
                </>
              )}

              {/* PERTANIAN & TAMBAK FORM */}
              {(activeView === 'pertanian' || activeView === 'tambak') && (
                 <>
                   <InputMoney label="Total Nilai Hasil Panen" value={harvest.result} onChange={v => setHarvest({...harvest, result: v})} />
                   
                   <div>
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-2">Sistem Pengairan / Pemeliharaan</label>
                      <div className="grid grid-cols-2 gap-3">
                         <button 
                           onClick={() => setHarvest({...harvest, cost: 'alami'})}
                           className={`p-3 rounded-xl border text-sm font-semibold transition-all ${harvest.cost === 'alami' ? 'bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700 text-slate-500'}`}
                         >
                           Alami / Tadah Hujan (10%)
                         </button>
                         <button 
                           onClick={() => setHarvest({...harvest, cost: 'biaya'})}
                           className={`p-3 rounded-xl border text-sm font-semibold transition-all ${harvest.cost === 'biaya' ? 'bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700 text-slate-500'}`}
                         >
                           Irigasi / Berbiaya (5%)
                         </button>
                      </div>
                   </div>

                   <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                      <InputMoney label="Acuan Harga Beras/Gabah (Per Kg)" value={formatRp(ricePrice)} onChange={v => setRicePrice(parseRp(v))} />
                   </div>

                   <CalculateButton onClick={calcHarvest} />
                 </>
              )}

              {/* PETERNAKAN FORM */}
              {activeView === 'peternakan' && (
                 <>
                   <div>
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-2">Jenis Hewan</label>
                      <div className="grid grid-cols-2 gap-3">
                         <button 
                           onClick={() => setLivestock({...livestock, type: 'kambing'})}
                           className={`p-3 rounded-xl border text-sm font-semibold transition-all ${livestock.type === 'kambing' ? 'bg-orange-50 border-orange-500 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400' : 'bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700 text-slate-500'}`}
                         >
                           Kambing / Domba
                         </button>
                         <button 
                           onClick={() => setLivestock({...livestock, type: 'sapi'})}
                           className={`p-3 rounded-xl border text-sm font-semibold transition-all ${livestock.type === 'sapi' ? 'bg-orange-50 border-orange-500 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400' : 'bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700 text-slate-500'}`}
                         >
                           Sapi / Kerbau
                         </button>
                      </div>
                   </div>
                   <InputWithUnit label="Jumlah Hewan" value={livestock.count} unit="Ekor" onChange={v => setLivestock({...livestock, count: v})} />
                   <CalculateButton onClick={calcLivestock} />
                 </>
              )}

              {/* FITRAH FORM */}
              {activeView === 'fitrah' && (
                 <>
                   <InputMoney label="Harga Beras (Per Kg)" value={formatRp(fitrah.price)} onChange={v => setFitrah({...fitrah, price: parseRp(v)})} />
                   <div>
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-2">Jumlah Orang</label>
                      <div className="flex items-center gap-4">
                          <button onClick={() => setFitrah({...fitrah, persons: Math.max(1, fitrah.persons - 1)})} className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold text-slate-600">-</button>
                          <span className="text-xl font-bold text-slate-800 dark:text-slate-100">{fitrah.persons}</span>
                          <button onClick={() => setFitrah({...fitrah, persons: fitrah.persons + 1})} className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold text-slate-600">+</button>
                      </div>
                   </div>
                   <CalculateButton onClick={calcFitrah} />
                 </>
              )}

            </div>

            {/* --- RESULT CARD --- */}
            {result && (
              <div className={`mt-6 p-6 rounded-2xl border flex flex-col items-center text-center animate-in zoom-in-95 duration-300 shadow-sm ${
                result.wajib 
                  ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-900/30' 
                  : 'bg-slate-100 border-slate-200 dark:bg-slate-800 dark:border-slate-700'
              }`}>
                  <div className="mb-4">
                    {result.wajib ? (
                        <div className="flex flex-col items-center">
                          <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-2">
                              <CheckCircle size={24} />
                          </div>
                          <h4 className="font-bold text-emerald-700 dark:text-emerald-400 text-lg">Wajib Zakat</h4>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center">
                          <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400 mb-2">
                              <XCircle size={24} />
                          </div>
                          <h4 className="font-bold text-slate-600 dark:text-slate-300 text-lg">Belum Wajib Zakat</h4>
                        </div>
                    )}
                  </div>

                  <div className="w-full h-px bg-slate-200 dark:bg-slate-700/50 mb-4"></div>

                  {/* Nishab Info */}
                  {result.nishab !== 0 && (
                     <div className="w-full flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 mb-4 bg-white dark:bg-slate-900/50 p-2 rounded-lg">
                        <span>Nishab (Batas Minimal):</span>
                        <span className="font-bold">{typeof result.nishab === 'number' ? formatCurrency(result.nishab) : result.nishab}</span>
                     </div>
                  )}

                  {/* Note */}
                  {result.note && (
                     <p className="text-xs text-slate-500 mb-4 italic">{result.note}</p>
                  )}

                  {/* Amount Display */}
                  {result.wajib && (
                      <div className="bg-white dark:bg-slate-900 rounded-xl p-4 w-full shadow-sm border border-emerald-100 dark:border-emerald-900/20">
                        <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Yang Harus Dikeluarkan</p>
                        <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">
                           {typeof result.amount === 'number' ? formatCurrency(result.amount) : result.amount}
                        </p>
                      </div>
                  )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// --- SUB COMPONENTS ---

const InputMoney = ({ label, value, onChange, isDeduction = false }: { label: string, value: string, onChange: (v: string) => void, isDeduction?: boolean }) => {
  const format = (val: string) => {
    const num = parseInt(val.replace(/[^0-9]/g, ''));
    return isNaN(num) ? '' : new Intl.NumberFormat('id-ID').format(num);
  };

  return (
    <div>
      <label className={`text-xs font-bold block mb-1.5 ${isDeduction ? 'text-red-500' : 'text-slate-500 dark:text-slate-400'}`}>
        {label}
      </label>
      <div className={`flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border rounded-xl px-3 py-3 transition-colors ${isDeduction ? 'border-red-100 dark:border-red-900/30 focus-within:border-red-500' : 'border-slate-200 dark:border-slate-700 focus-within:border-emerald-500'}`}>
         <span className={`text-sm font-bold ${isDeduction ? 'text-red-500' : 'text-slate-400'}`}>Rp</span>
         <input 
           type="text" 
           value={format(value)}
           onChange={(e) => onChange(e.target.value)}
           placeholder="0"
           className="w-full bg-transparent outline-none font-mono text-slate-800 dark:text-slate-200 text-lg"
         />
      </div>
    </div>
  );
};

const InputWithUnit = ({ label, value, unit, onChange }: { label: string, value: string, unit: string, onChange: (v: string) => void }) => {
   return (
    <div>
      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1.5">{label}</label>
      <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-3 focus-within:border-emerald-500 transition-colors">
         <input 
           type="number" 
           value={value}
           onChange={(e) => onChange(e.target.value)}
           placeholder="0"
           className="w-full bg-transparent outline-none font-mono text-slate-800 dark:text-slate-200 text-lg"
         />
         <span className="text-xs font-bold text-slate-400 uppercase">{unit}</span>
      </div>
    </div>
   );
};

const CalculateButton = ({ onClick }: { onClick: () => void }) => (
  <button 
    onClick={onClick} 
    className="w-full mt-4 py-3.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 dark:shadow-emerald-900/20 active:scale-95"
  >
    <Calculator size={20} /> Hitung Zakat
  </button>
);

export default ZakatScreen;