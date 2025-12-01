import { PrayerData } from '../types';

const ALADHAN_API_BASE = "https://api.aladhan.com/v1";

export const getPrayerTimes = async (latitude: number, longitude: number): Promise<PrayerData | null> => {
  try {
    // Method 20 is Kemenag RI
    const date = new Date();
    const dateStr = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
    
    const response = await fetch(
      `${ALADHAN_API_BASE}/timings/${dateStr}?latitude=${latitude}&longitude=${longitude}&method=20`
    );
    
    const json = await response.json();
    
    if (json.code !== 200) throw new Error("Failed to fetch prayer times");
    
    return json.data;
  } catch (error) {
    console.error("Prayer API Error:", error);
    return null;
  }
};

export const getCityName = async (latitude: number, longitude: number): Promise<string> => {
  try {
    // Using BigDataCloud's free client-side API which is more reliable for browser requests than Nominatim
    // as it doesn't strictly require User-Agent headers and has better CORS support for this use case.
    const response = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=id`
    );
    const json = await response.json();
    
    // Check various fields for city name
    return json.city || json.locality || json.principalSubdivision || "Lokasi Anda";
  } catch (error) {
    console.warn("Geocoding failed, using default name.");
    return "Lokasi Anda";
  }
};