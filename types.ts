
export interface TranslationResult {
  id: string;
  originalText: string;
  maknaGandul: string;
  modernTranslation: string;
  nahwuShorof?: string;
  lughah?: string;
  balaghah?: string;
  ushulFiqh?: string;
  hikmah?: string;
  referensi?: string;
  aiExplanation?: string;
  createdAt: string; // ISO String
  synced: boolean;
}

export type HistoryType = 'translation' | 'quran' | 'hadis' | 'kitab' | 'doa' | 'sholat';

export interface HistoryItem {
  id: string;
  type: HistoryType;
  title: string;
  subtitle?: string;
  timestamp: string;
  path: string;
  data?: any; // Store specific data needed to restore (like TranslationResult)
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  enabled: boolean;
}

export type TranslationStyle = 'mixed' | 'modern_only' | 'gandul_only';
export type AppTheme = 'light' | 'dark';
export type ArabicFont = 'amiri' | 'scheherazade' | 'noto';

export interface AppSettings {
  supabaseConfig: SupabaseConfig;
  style: TranslationStyle;
  fontSize: number;
  theme: AppTheme;
  arabicFont: ArabicFont;
}

export interface Ayah {
  id: number; // Global ID if available, or constructed from surah:ayah
  surahNumber?: number; // Helper for bookmarks
  number: number; // Ayat number in Surah
  arab: string;
  latin: string;
  text: string; // Indonesian translation
  audio: string;
  tafsir?: string;
}

export interface Surah {
  number: number;
  name: string;
  name_latin: string;
  number_of_ayah: number;
  place: string; // Mekah/Madinah
  meaning: string;
  description: string;
  ayahs?: Ayah[]; // Optional details
  audioFull?: string;
}

export interface BookmarkItem {
  id: string; // unique key e.g. "surah-1-ayah-1"
  surahNumber: number;
  surahName: string;
  ayah: Ayah;
  savedAt: string;
}

// Hadith Types
export interface HadithBook {
  name: string;
  id: string; // slug for API e.g. "bukhari"
  available: number; // Total count
}

export interface HadithDetail {
  number: number;
  arab: string;
  id: string; // Indonesian text
}

// Prayer Times Types
export interface PrayerTimes {
  Fajr: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
  [key: string]: string;
}

export interface HijriDate {
  day: string;
  month: {
    en: string;
    ar: string;
  };
  year: string;
}

export interface PrayerData {
  timings: PrayerTimes;
  date: {
    readable: string;
    hijri: HijriDate;
  };
  meta: {
    timezone: string;
  };
}

// Quiz & Essay Types
export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface EssayQuestion {
  type: string;
  question: string;
  clue?: string;
  answerKey: string;
  explanation: string;
}
