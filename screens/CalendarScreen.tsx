
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Info, MapPin } from 'lucide-react';

// --- HELPER CONSTANTS & FUNCTIONS ---

const DAYS_ID = ["Ahad", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const MONTHS_ID = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

// Indonesian Hijri Mapping
const HIJRI_MONTHS_ID: Record<string, string> = {
  "Muharram": "Muharram",
  "Safar": "Safar",
  "Rabi' al-Awwal": "Rabiul Awal",
  "Rabi' al-Thani": "Rabiul Akhir",
  "Jumada al-Ula": "Jumadil Awal",
  "Jumada al-Akhirah": "Jumadil Akhir",
  "Rajab": "Rajab",
  "Sha'ban": "Sya'ban",
  "Ramadan": "Ramadhan",
  "Shawwal": "Syawal",
  "Dhu al-Qi'dah": "Dzulkaidah",
  "Dhu al-Hijjah": "Dzulhijjah",
  // Fallbacks
  "Rabi al-Awwal": "Rabiul Awal",
  "Rabi al-Thani": "Rabiul Akhir",
  "Jumada al-Awwal": "Jumadil Awal",
  "Jumada al-Thani": "Jumadil Akhir",
  "Dhul Qidah": "Dzulkaidah",
  "Dhul Hijjah": "Dzulhijjah",
  "Rabiʻ I": "Rabiul Awal",
  "Rabiʻ II": "Rabiul Akhir",
};

// Pasaran Jawa: Legi, Pahing, Pon, Wage, Kliwon
const PASARAN = ["Legi", "Pahing", "Pon", "Wage", "Kliwon"];

// Anchor known date for Pasaran calculation: 
// 1 Januari 2024 was Senin Pahing.
const ANCHOR_DATE = new Date(2024, 0, 1); 
ANCHOR_DATE.setHours(0,0,0,0); // Normalize anchor

const ANCHOR_PASARAN_INDEX = 1; // Pahing

const getPasaran = (date: Date) => {
  const d = new Date(date);
  d.setHours(0,0,0,0); // Normalize target

  // Calculate difference in days
  const oneDay = 24 * 60 * 60 * 1000;
  const diffDays = Math.round((d.getTime() - ANCHOR_DATE.getTime()) / oneDay);
  
  // Calculate modulo (handle negative dates correctly)
  let resultIndex = (ANCHOR_PASARAN_INDEX + diffDays) % 5;
  if (resultIndex < 0) resultIndex += 5;
  
  return PASARAN[resultIndex];
};

const toArabicNumerals = (n: number | string) => {
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return n.toString().replace(/\d/g, (d) => arabicDigits[parseInt(d)]);
};

// Simulasi Data Libur (Seharusnya dari API/Database)
const HOLIDAYS: Record<string, string[]> = {
  "1-1": ["Tahun Baru Masehi"],
  "17-8": ["Hari Kemerdekaan RI"],
  "25-12": ["Hari Raya Natal"],
  "1-5": ["Hari Buruh Internasional"],
  "1-6": ["Hari Lahir Pancasila"],
  // Contoh libur dinamis (Manual entry for demo)
  "10-11": ["Hari Pahlawan"], 
  "29-11": ["Maulid Nabi (Simulasi)"] // Contoh agar sesuai screenshot
};

const getHolidays = (date: Date) => {
  const key = `${date.getDate()}-${date.getMonth() + 1}`;
  return HOLIDAYS[key] || [];
};

const normalizeHijriMonth = (name: string) => {
    // Remove "al-" prefix if exists for easier matching
    const cleanName = name.replace(/^al-/, '').trim();
    // Check direct mapping
    if (HIJRI_MONTHS_ID[name]) return HIJRI_MONTHS_ID[name];
    if (HIJRI_MONTHS_ID[cleanName]) return HIJRI_MONTHS_ID[cleanName];
    
    // Fuzzy check
    if (name.includes("Rabi") && name.includes("I") && !name.includes("II")) return "Rabiul Awal";
    if (name.includes("Rabi") && name.includes("II")) return "Rabiul Akhir";
    
    return name;
};

const CalendarScreen: React.FC = () => {
  const navigate = useNavigate();
  const [viewDate, setViewDate] = useState(new Date()); // Month being viewed
  const [selectedDate, setSelectedDate] = useState(new Date()); // Specific day selected

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  // --- CALENDAR LOGIC ---
  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay(); // 0 = Sunday

  const handlePrevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setViewDate(new Date(year, month + 1, 1));

  // Hijri Formatter
  const getHijriDate = (d: Date) => {
    try {
      // Use 'en' locale first to get standard parts, then map them
      // This is often more reliable than 'id' locale which might output inconsistent arabic text
      const parts = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }).formatToParts(d);
      
      const day = parts.find(p => p.type === 'day')?.value || '';
      let monthRaw = parts.find(p => p.type === 'month')?.value || '';
      const yearStr = parts.find(p => p.type === 'year')?.value || '';
      
      const monthName = normalizeHijriMonth(monthRaw);
      
      return { day, monthName, yearStr };
    } catch (e) {
      return { day: '', monthName: '', yearStr: '' };
    }
  };

  // Get Hijri Range for Header (e.g., Jumadal Ula - Jumadal Akhirah 1447)
  const getHijriMonthRange = () => {
    const start = getHijriDate(new Date(year, month, 1));
    const end = getHijriDate(new Date(year, month, getDaysInMonth(year, month)));
    
    if (start.monthName === end.monthName) {
      return `${start.monthName} ${start.yearStr}`;
    }
    if (start.yearStr === end.yearStr) {
      return `${start.monthName} - ${end.monthName} ${start.yearStr}`;
    }
    return `${start.monthName} ${start.yearStr} - ${end.monthName} ${end.yearStr}`;
  };

  // Generate Grid Data
  const daysInMonth = getDaysInMonth(year, month);
  const startDay = getFirstDayOfMonth(year, month);
  
  // Previous month filler
  const prevMonthDays = getDaysInMonth(year, month - 1);
  const blanks = Array.from({ length: startDay }, (_, i) => {
     const d = prevMonthDays - startDay + i + 1;
     return { day: d, type: 'prev' };
  });

  // Current month days
  const days = Array.from({ length: daysInMonth }, (_, i) => {
    return { day: i + 1, type: 'current' };
  });

  // Next month filler to complete the 35 or 42 grid
  const totalSlots = blanks.length + days.length;
  const nextMonthFiller = Array.from({ length: (totalSlots > 35 ? 42 : 35) - totalSlots }, (_, i) => {
    return { day: i + 1, type: 'next' };
  });

  const allCalendarDays = [...blanks, ...days, ...nextMonthFiller];

  // Selected Date Info
  const selectedHijri = getHijriDate(selectedDate);
  const selectedPasaran = getPasaran(selectedDate);
  const selectedDayName = DAYS_ID[selectedDate.getDay()];
  const selectedHolidays = getHolidays(selectedDate);

  // Holidays in current month list
  const holidaysInMonth = days.reduce((acc, { day }) => {
     const date = new Date(year, month, day);
     const h = getHolidays(date);
     if (h.length > 0) {
       acc.push({ date, names: h });
     }
     return acc;
  }, [] as { date: Date, names: string[] }[]);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 pb-24 font-sans">
      
      {/* Header Info Block */}
      <div className="bg-santri-green dark:bg-santri-green-dark text-white pt-6 pb-12 px-5 rounded-b-[2rem] shadow-lg relative z-10">
         <div className="flex justify-between items-start mb-4">
            <button onClick={() => navigate(-1)} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
              <ArrowLeft size={20} />
            </button>
            <div className="flex gap-2">
               <button className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                  <CalendarIcon size={20} />
               </button>
            </div>
         </div>
         
         <div className="mt-2">
            <h1 className="text-xl font-bold leading-tight">
               {selectedDayName} {selectedPasaran}, {selectedDate.getDate()} {MONTHS_ID[selectedDate.getMonth()]} {selectedDate.getFullYear()}
            </h1>
            <h2 className="text-green-100 text-sm mt-1 font-medium opacity-90">
               {selectedHijri.day} {selectedHijri.monthName} {selectedHijri.yearStr}
            </h2>
         </div>
      </div>

      {/* Calendar Card */}
      <div className="px-4 -mt-8 relative z-20">
         <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
            
            {/* Navigation */}
            <div className="p-4 flex flex-col items-center border-b border-slate-100 dark:border-slate-800">
               <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                 {MONTHS_ID[month]} {year}
               </h3>
               <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                 {getHijriMonthRange()}
               </p>
               
               <div className="flex items-center justify-between w-full mt-4">
                  <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500">
                    <ChevronLeft size={24} />
                  </button>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">GESER</span>
                  <button onClick={handleNextMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500">
                    <ChevronRight size={24} />
                  </button>
               </div>
            </div>

            {/* Day Names */}
            <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
               {DAYS_ID.map((d, i) => (
                 <div key={d} className={`py-3 text-center text-xs font-bold ${i === 0 ? 'text-red-500' : 'text-slate-500 dark:text-slate-400'}`}>
                   {d}
                 </div>
               ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-7">
               {allCalendarDays.map((item, index) => {
                 let dateObj: Date;
                 let isToday = false;
                 let isSelected = false;
                 let isSunday = (index % 7) === 0;

                 if (item.type === 'current') {
                    dateObj = new Date(year, month, item.day);
                 } else if (item.type === 'prev') {
                    dateObj = new Date(year, month - 1, item.day);
                 } else {
                    dateObj = new Date(year, month + 1, item.day);
                 }

                 const hijri = getHijriDate(dateObj);
                 const pasaran = getPasaran(dateObj);
                 const holidays = getHolidays(dateObj);
                 const isRedDate = isSunday || holidays.length > 0;
                 
                 isToday = dateObj.toDateString() === new Date().toDateString();
                 isSelected = dateObj.toDateString() === selectedDate.toDateString();

                 return (
                   <button
                     key={index}
                     onClick={() => {
                        if (item.type === 'current') setSelectedDate(dateObj);
                        else if (item.type === 'prev') { handlePrevMonth(); setSelectedDate(dateObj); }
                        else { handleNextMonth(); setSelectedDate(dateObj); }
                     }}
                     className={`
                       relative h-24 border-b border-r border-slate-100 dark:border-slate-800 flex flex-col items-center justify-between py-2 transition-all
                       ${item.type !== 'current' ? 'bg-slate-50/50 dark:bg-slate-900/50 opacity-40' : 'bg-white dark:bg-slate-900'}
                       ${isSelected ? 'bg-green-50 dark:bg-green-900/10 ring-2 ring-inset ring-santri-green' : ''}
                       ${index % 7 === 6 ? 'border-r-0' : ''}
                     `}
                   >
                      {/* Hijri Date (Top Left) */}
                      <span className={`absolute top-1 left-2 text-[10px] font-arabic ${isRedDate ? 'text-red-500' : 'text-slate-800 dark:text-slate-200'}`}>
                         {toArabicNumerals(hijri.day)}
                      </span>

                      {/* Main Date (Center) */}
                      <span className="text-2xl font-bold mt-2" style={{color: isRedDate ? '#ef4444' : isToday ? '#008000' : 'inherit'}}>
                         {item.day}
                      </span>

                      {/* Pasaran (Bottom) */}
                      <span className={`text-[10px] font-medium ${isPasaranLegi(pasaran) ? 'text-blue-500' : 'text-slate-400 dark:text-slate-500'}`}>
                         {pasaran}
                      </span>
                      
                      {/* Dots for Today indicator */}
                      {isToday && (
                         <span className="w-1 h-1 rounded-full bg-santri-green absolute bottom-1"></span>
                      )}
                   </button>
                 );
               })}
            </div>
         </div>
      </div>

      {/* Holiday List */}
      <div className="px-4 mt-6">
         <div className="flex items-center gap-2 mb-3 px-1">
            <div className="w-1 h-5 bg-santri-green rounded-full"></div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100">Hari Besar & Libur Nasional</h3>
         </div>
         
         <div className="space-y-3">
            {holidaysInMonth.length === 0 ? (
               <div className="text-center py-6 text-slate-400 text-sm bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                  Tidak ada hari libur bulan ini
               </div>
            ) : (
              holidaysInMonth.map((h, idx) => (
                 <div key={idx} className="bg-white dark:bg-slate-900 p-4 rounded-xl border-l-4 border-l-red-500 border-y border-r border-slate-100 dark:border-slate-800 dark:border-r-slate-800 shadow-sm flex items-start gap-4">
                    <div className="text-center bg-red-50 dark:bg-red-900/10 px-3 py-1.5 rounded-lg min-w-[60px]">
                       <span className="block text-xs font-bold text-red-500 uppercase">{MONTHS_ID[h.date.getMonth()].substring(0, 3)}</span>
                       <span className="block text-xl font-bold text-red-600">{h.date.getDate()}</span>
                    </div>
                    <div>
                       {h.names.map((name, ni) => (
                          <h4 key={ni} className="font-bold text-slate-800 dark:text-slate-100 text-sm mb-0.5">{name}</h4>
                       ))}
                       <p className="text-xs text-slate-500 dark:text-slate-400">
                          {DAYS_ID[h.date.getDay()]} {getPasaran(h.date)} • {getHijriDate(h.date).day} {getHijriDate(h.date).monthName} {getHijriDate(h.date).yearStr}
                       </p>
                    </div>
                 </div>
              ))
            )}
         </div>

         {/* Selected Day Details (if has holiday) */}
         {selectedHolidays.length > 0 && (
             <div className="mt-6 bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-200 dark:border-green-800">
                <p className="text-xs font-bold text-green-700 dark:text-green-400 mb-1">Terpilih: {selectedDate.getDate()} {MONTHS_ID[selectedDate.getMonth()]}</p>
                <ul className="list-disc list-inside text-sm text-slate-700 dark:text-slate-300">
                   {selectedHolidays.map(h => <li key={h}>{h}</li>)}
                </ul>
             </div>
         )}
      </div>

    </div>
  );
};

// Helper for style
const isPasaranLegi = (p: string) => p === 'Legi'; // Example styling condition

export default CalendarScreen;