
import { Surah, Ayah } from '../types';
import { QURAN_API_BASE } from '../constants';

export const getAllSurahs = async (): Promise<Surah[]> => {
  try {
    const response = await fetch(`${QURAN_API_BASE}/surat`);
    const json = await response.json();
    
    if (json.code !== 200) throw new Error("Failed to fetch surahs");

    return json.data.map((item: any) => ({
      number: item.nomor,
      name: item.nama,
      name_latin: item.namaLatin,
      number_of_ayah: item.jumlahAyat,
      place: item.tempatTurun,
      meaning: item.arti,
      description: item.deskripsi,
      audioFull: item.audioFull?.['05'] // Use Misyari Rashid Al-Afasy
    }));
  } catch (error) {
    console.error("API Error:", error);
    return [];
  }
};

export const getSurahDetail = async (surahNumber: number): Promise<Surah | null> => {
  try {
    const response = await fetch(`${QURAN_API_BASE}/surat/${surahNumber}`);
    const json = await response.json();

    if (json.code !== 200) throw new Error("Failed to fetch surah detail");

    const data = json.data;

    const ayahs: Ayah[] = data.ayat.map((item: any) => ({
      id: parseInt(`${surahNumber}${item.nomorAyat.toString().padStart(3, '0')}`), // Create Pseudo ID
      surahNumber: surahNumber,
      number: item.nomorAyat,
      arab: item.teksArab,
      latin: item.teksLatin,
      text: item.teksIndonesia,
      // Fallback audio sources if '05' is missing
      audio: item.audio['05'] || item.audio['03'] || item.audio['01'] || '' 
    }));

    return {
      number: data.nomor,
      name: data.nama,
      name_latin: data.namaLatin,
      number_of_ayah: data.jumlahAyat,
      place: data.tempatTurun,
      meaning: data.arti,
      description: data.deskripsi,
      ayahs: ayahs,
      audioFull: data.audioFull?.['05']
    };
  } catch (error) {
    console.error("API Error:", error);
    return null;
  }
};

export const getTafsir = async (surahNumber: number): Promise<any[]> => {
  try {
    const response = await fetch(`${QURAN_API_BASE}/tafsir/${surahNumber}`);
    const json = await response.json();

    if (json.code !== 200) throw new Error("Failed to fetch tafsir");

    // The API returns { data: { tafsir: [ { ayat: 1, teks: "..." } ] } }
    return json.data.tafsir || [];
  } catch (error) {
    console.error("API Tafsir Error:", error);
    return [];
  }
};