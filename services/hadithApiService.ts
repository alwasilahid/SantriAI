import { HadithBook, HadithDetail } from '../types';

const HADITH_API_BASE = "https://api.hadith.gading.dev/books";

// Manually mapping descriptions/titles for better UI since API returns simple slugs
const BOOK_METADATA: { [key: string]: { label: string, color: string } } = {
  'bukhari': { label: "Shahih Bukhari", color: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" },
  'muslim': { label: "Shahih Muslim", color: "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400" },
  'abu-daud': { label: "Sunan Abu Daud", color: "bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400" },
  'tirmidzi': { label: "Sunan Tirmidzi", color: "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400" },
  'nasai': { label: "Sunan An-Nasa'i", color: "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400" },
  'ibnu-majah': { label: "Sunan Ibnu Majah", color: "bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400" },
  'ahmad': { label: "Musnad Ahmad", color: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400" },
  'malik': { label: "Muwatha' Malik", color: "bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400" },
  'darimi': { label: "Sunan Ad-Darimi", color: "bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400" },
};

export const getHadithBooks = async (): Promise<HadithBook[]> => {
  try {
    const response = await fetch(HADITH_API_BASE);
    const json = await response.json();
    
    // The API returns array of { name: "bukhari", available: 7008 }
    return json.data.map((item: any) => ({
      name: BOOK_METADATA[item.id]?.label || item.name,
      id: item.id,
      available: item.available
    })).filter((item: any) => item.id !== ''); // Filter out empty if any
  } catch (error) {
    console.error("Failed to fetch hadith books:", error);
    return [];
  }
};

export const getHadithRange = async (bookId: string, rangeStart: number, rangeEnd: number): Promise<HadithDetail[]> => {
  try {
    const response = await fetch(`${HADITH_API_BASE}/${bookId}?range=${rangeStart}-${rangeEnd}`);
    const json = await response.json();
    
    return json.data.hadiths.map((item: any) => ({
      number: item.number,
      arab: item.arab,
      id: item.id
    }));
  } catch (error) {
    console.error(`Failed to fetch hadith range for ${bookId}:`, error);
    return [];
  }
};