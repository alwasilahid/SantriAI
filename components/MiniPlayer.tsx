
import React from 'react';
import { useAudio } from '../contexts/AudioContext';
import { Play, Pause, SkipForward, SkipBack, X, Disc } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const MiniPlayer: React.FC = () => {
  const { isPlaying, currentSurah, currentAyah, togglePlay, nextAyah, prevAyah, stop, isLoading } = useAudio();
  const navigate = useNavigate();
  const location = useLocation();

  // Logic: Player HANYA tampil jika berada di route '/quran'
  const isQuranScreen = location.pathname === '/quran';

  // Safety Check: Pastikan data ada DAN pengguna berada di halaman Al-Quran
  if (!currentSurah || !currentAyah || !isQuranScreen) return null;

  const handleOpenDetail = () => {
    // Navigate with state to force update/scroll in QuranScreen
    navigate('/quran', { state: { surahNumber: currentSurah.number } });
  };

  return (
    <div className="fixed bottom-[70px] left-4 right-4 z-40 animate-in slide-in-from-bottom-10 duration-300">
      <div className="bg-slate-900/90 dark:bg-slate-800/95 backdrop-blur-md text-white rounded-2xl p-3 shadow-2xl border border-white/10 flex items-center justify-between">
        
        {/* Info Area - Click to open */}
        <div className="flex items-center gap-3 flex-1 overflow-hidden cursor-pointer group" onClick={handleOpenDetail}>
           <div className={`w-10 h-10 rounded-full bg-santri-green/20 flex items-center justify-center shrink-0 border border-white/5 ${isPlaying ? 'animate-[spin_4s_linear_infinite]' : ''}`}>
              <Disc size={24} className="text-santri-green" />
           </div>
           <div className="min-w-0">
              <h4 className="font-bold text-sm truncate leading-tight text-white group-hover:text-santri-gold transition-colors">
                QS. {currentSurah.name_latin}
              </h4>
              <p className="text-xs text-slate-300 truncate">
                Ayat {currentAyah.number} • {currentSurah.meaning}
              </p>
           </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1">
           <button 
             onClick={(e) => { e.stopPropagation(); prevAyah(); }} 
             className="p-2 text-slate-300 hover:text-white transition-colors active:scale-95"
           >
              <SkipBack size={20} fill="currentColor" />
           </button>
           
           <button 
             onClick={(e) => { e.stopPropagation(); togglePlay(); }} 
             className="w-10 h-10 rounded-full bg-white text-slate-900 flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg mx-1"
           >
              {isLoading ? (
                 <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
              ) : isPlaying ? (
                 <Pause size={18} fill="currentColor" />
              ) : (
                 <Play size={18} fill="currentColor" className="ml-0.5" />
              )}
           </button>

           <button 
             onClick={(e) => { e.stopPropagation(); nextAyah(); }} 
             className="p-2 text-slate-300 hover:text-white transition-colors active:scale-95"
           >
              <SkipForward size={20} fill="currentColor" />
           </button>
           
           <div className="w-px h-6 bg-white/10 mx-1"></div>

           <button 
             onClick={(e) => { e.stopPropagation(); stop(); }} 
             className="p-2 text-red-400 hover:text-red-300 transition-colors active:scale-95"
           >
              <X size={18} />
           </button>
        </div>

      </div>
    </div>
  );
};

export default MiniPlayer;
