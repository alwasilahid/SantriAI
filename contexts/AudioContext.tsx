
import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { Surah, Ayah } from '../types';
import { getSurahDetail } from '../services/quranApiService';

interface AudioContextType {
  isPlaying: boolean;
  currentSurah: Surah | null;
  currentAyah: Ayah | null;
  playAyah: (surah: Surah, ayah: Ayah, playlist: Ayah[]) => void;
  togglePlay: () => void;
  nextAyah: () => void;
  prevAyah: () => void;
  stop: () => void;
  isLoading: boolean;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

// Stable Source for Bismillah (EveryAyah - Mishary Rashid Al-Afasy)
const AUDIO_BISMILLAH = "https://everyayah.com/data/Alafasy_128kbps/001001.mp3";

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // UI State (Trigger re-renders)
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSurah, setCurrentSurah] = useState<Surah | null>(null);
  const [currentAyah, setCurrentAyah] = useState<Ayah | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Logic Refs (Hold latest data without triggering re-renders inside callbacks)
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playlistRef = useRef<Ayah[]>([]);
  const currentSurahRef = useRef<Surah | null>(null);
  const currentIndexRef = useRef<number>(-1);
  const isBismillahPlayingRef = useRef(false);
  
  // Ref to store the latest playNext function to avoid stale closures in event listeners
  const playNextRef = useRef<() => void>(() => {});

  // --- INITIALIZATION ---
  useEffect(() => {
    // Create Audio instance only once
    const audio = new Audio();
    audioRef.current = audio;

    // --- EVENT HANDLERS ---
    
    const handleEnded = () => {
      if (isBismillahPlayingRef.current) {
         // Case: Bismillah just finished -> Play the actual verse
         // console.log("Bismillah ended, playing verse...");
         isBismillahPlayingRef.current = false;
         playCurrentIndex();
      } else {
         // Case: Verse finished -> Go to next using the Ref
         playNextRef.current();
      }
    };

    const handleError = (e: any) => {
       console.error("Audio playback error:", e);
       setIsLoading(false);
       
       // If Bismillah fails, skip it and try playing the verse directly
       if (isBismillahPlayingRef.current) {
          console.warn("Skipping broken Bismillah...");
          isBismillahPlayingRef.current = false;
          playCurrentIndex();
       } else {
          // If verse fails, stop to prevent infinite error loops
          // But maybe try next? For safety, we stop.
          setIsPlaying(false);
       }
    };

    // Sync UI state with actual Audio events
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleWaiting = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);

    // Attach Listeners
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('canplay', handleCanPlay);

    return () => {
      // Cleanup
      audio.pause();
      audio.src = "";
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('canplay', handleCanPlay);
      audioRef.current = null;
    };
  }, []); // Run once on mount

  // --- MEDIA SESSION API UPDATE ---
  useEffect(() => {
    if ('mediaSession' in navigator && currentSurah && currentAyah) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: `QS. ${currentSurah.name_latin}: ${currentAyah.number}`,
        artist: "Mishary Rashid Al-Afasy",
        album: "SantriAI Quran",
        artwork: [
          { src: 'https://cdn-icons-png.flaticon.com/512/3247/3247346.png', sizes: '512x512', type: 'image/png' }
        ]
      });

      navigator.mediaSession.setActionHandler('play', () => {
        if (audioRef.current) audioRef.current.play();
      });
      navigator.mediaSession.setActionHandler('pause', () => {
         if (audioRef.current) audioRef.current.pause();
      });
      navigator.mediaSession.setActionHandler('nexttrack', () => playNextRef.current());
      navigator.mediaSession.setActionHandler('previoustrack', playPrev);
    }
  }, [currentSurah, currentAyah]);


  // --- INTERNAL HELPERS ---

  // Play audio from URL safely
  const playSource = async (url: string) => {
    if (!audioRef.current) return;
    try {
      setIsLoading(true);
      audioRef.current.src = url;
      await audioRef.current.play();
    } catch (err) {
      console.error("Play failed:", err);
      setIsLoading(false);
    }
  };

  // Play the ayah at currentIndexRef
  const playCurrentIndex = () => {
    const list = playlistRef.current;
    const idx = currentIndexRef.current;

    if (idx < 0 || idx >= list.length) {
      // Logic handled in playNext for End of Playlist
      stop();
      return;
    }

    const ayah = list[idx];
    
    // Update UI
    setCurrentAyah(ayah);
    
    // Play
    playSource(ayah.audio);
  };

  const playPrev = () => {
    if (currentIndexRef.current > 0) {
      currentIndexRef.current -= 1;
      playCurrentIndex();
    }
  };

  // --- PUBLIC API ---

  const playAyah = useCallback((surah: Surah, ayah: Ayah, playlistData: Ayah[]) => {
    if (!audioRef.current) return;

    // 1. Update Refs (Source of Truth)
    currentSurahRef.current = surah;
    playlistRef.current = playlistData;
    
    const idx = playlistData.findIndex(a => a.id === ayah.id);
    currentIndexRef.current = idx !== -1 ? idx : 0;

    // 2. Update UI
    setCurrentSurah(surah);
    setCurrentAyah(ayah);

    // 3. Logic Bismillah
    const isVerseOne = ayah.number === 1;
    const isAtTaubah = surah.number === 9;
    const isAlFatihah = surah.number === 1;

    // Only play Bismillah if it's Verse 1 AND not Surah 9 or 1
    if (isVerseOne && !isAtTaubah && !isAlFatihah) {
      // console.log("Playing Bismillah first...");
      isBismillahPlayingRef.current = true;
      playSource(AUDIO_BISMILLAH);
    } else {
      isBismillahPlayingRef.current = false;
      playCurrentIndex();
    }
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setIsLoading(false);
    isBismillahPlayingRef.current = false;
  }, []);

  // Complex playNext logic (Move to next ayah OR next surah)
  const playNext = useCallback(async () => {
    const list = playlistRef.current;
    
    // 1. If not at the end of current list, just go next
    if (currentIndexRef.current < list.length - 1) {
      currentIndexRef.current += 1;
      playCurrentIndex();
      return;
    }

    // 2. If at the end, try to load next Surah
    const currentSurahNum = currentSurahRef.current?.number;
    
    // Check if valid surah and not the last one (114)
    if (currentSurahNum && currentSurahNum < 114) {
      setIsLoading(true);
      try {
        const nextSurahNum = currentSurahNum + 1;
        // Fetch detail for next surah
        const nextSurah = await getSurahDetail(nextSurahNum);
        
        if (nextSurah && nextSurah.ayahs && nextSurah.ayahs.length > 0) {
           // Successfully fetched, play first ayah
           playAyah(nextSurah, nextSurah.ayahs[0], nextSurah.ayahs);
        } else {
           console.log("No ayahs found for next surah");
           stop();
        }
      } catch (e) {
        console.error("Failed to auto-load next surah", e);
        stop();
      }
    } else {
      // End of Quran
      stop();
    }
  }, [playAyah, stop]);

  // Keep the ref updated with the latest playNext function
  useEffect(() => {
    playNextRef.current = playNext;
  }, [playNext]);

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    
    if (!audioRef.current.paused) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(e => console.error("Resume failed", e));
    }
  }, []);

  return (
    <AudioContext.Provider value={{ 
      isPlaying, 
      currentSurah, 
      currentAyah, 
      playAyah, 
      togglePlay, 
      nextAyah: playNext, 
      prevAyah: playPrev,
      stop,
      isLoading 
    }}>
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};
