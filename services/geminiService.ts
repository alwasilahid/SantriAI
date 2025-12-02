
import { GoogleGenAI } from "@google/genai";
import { GEMINI_MODEL, SYSTEM_INSTRUCTION } from "../constants";
import { QuizQuestion, EssayQuestion } from "../types";
import { checkAiCache, saveAiCache } from "./supabaseService";

// Helper for cleaning JSON string
const cleanJson = (text: string) => {
  let cleaned = text.replace(/```json\s*([\s\S]*?)\s*```/g, '$1');
  cleaned = cleaned.replace(/```\s*([\s\S]*?)\s*```/g, '$1');

  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  const firstBracket = cleaned.indexOf('[');
  const lastBracket = cleaned.lastIndexOf(']');

  let start = -1;
  let end = -1;

  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
      start = firstBrace;
      end = lastBrace;
  } else if (firstBracket !== -1) {
      start = firstBracket;
      end = lastBracket;
  }

  if (start !== -1 && end !== -1) {
    cleaned = cleaned.substring(start, end + 1);
  }
  
  return cleaned;
};

const parseJsonSafely = (text: string) => {
  try {
    return JSON.parse(text);
  } catch (e) {
    let fixed = text.replace(/,\s*([\]}])/g, '$1');
    try { return JSON.parse(fixed); } catch (e2) {}
    throw e;
  }
};

// --- KEY ROTATION LOGIC ---

const getApiKeys = (): string[] => {
  // Prioritize VITE_API_KEY for Vite/Client env, fallback to process.env.API_KEY
  const envKey = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_KEY) 
                 || process.env.API_KEY 
                 || "";
  // Split by comma if user provided multiple keys like "Key1,Key2,Key3"
  return envKey.split(',').map(k => k.trim()).filter(k => k.length > 0);
};

let currentKeyIndex = 0;

const getRotatingClient = () => {
  const keys = getApiKeys();
  if (keys.length === 0) throw new Error("API Key not found");
  
  // Use current index
  const key = keys[currentKeyIndex % keys.length];
  return new GoogleGenAI({ apiKey: key });
};

const rotateKey = () => {
  const keys = getApiKeys();
  if (keys.length > 1) {
    currentKeyIndex = (currentKeyIndex + 1) % keys.length;
    console.log(`Switched to API Key #${currentKeyIndex + 1}`);
  }
};

// Retry Logic with Key Rotation
const callWithRetry = async <T>(fn: (client: GoogleGenAI) => Promise<T>, retries = 3, delay = 2000): Promise<T> => {
  try {
    const client = getRotatingClient();
    return await fn(client);
  } catch (error: any) {
    const isRateLimit = error?.message?.includes('429') || error?.status === 429 || error?.code === 429 || error?.message?.includes('RESOURCE_EXHAUSTED');
    const isServerBusy = error?.message?.includes('503') || error?.status === 503;

    if (retries > 0 && (isRateLimit || isServerBusy)) {
      console.warn(`API Error. Retrying in ${delay}ms... (${retries} left). Rotating key...`);
      rotateKey(); // Switch key before retry
      await new Promise(resolve => setTimeout(resolve, delay));
      return callWithRetry(fn, retries - 1, delay * 1.5);
    }
    throw error;
  }
};

// --- PUBLIC FUNCTIONS ---

export const translateText = async (text: string): Promise<any> => {
  // 1. Check Cache
  const cacheKey = `TRANS:${text}`;
  const cached = await checkAiCache(cacheKey);
  if (cached) return cached;

  // 2. Call AI
  const result = await callWithRetry(async (ai) => {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [{ role: 'user', parts: [{ text: text }] }],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json"
      }
    });

    if (!response.text) throw new Error("No response text");
    return parseJsonSafely(cleanJson(response.text));
  });

  // 3. Save Cache
  await saveAiCache(cacheKey, result, GEMINI_MODEL);
  return result;
};

export const scanImage = async (base64Data: string, mimeType: string): Promise<string> => {
  // Images are hard to cache by hash efficiently without heavy computation, 
  // so we skip caching for OCR or implement hash of base64 string if needed.
  // For now, direct call.
  return callWithRetry(async (ai) => {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          parts: [
            { inlineData: { mimeType, data: base64Data } },
            { text: "Extract text from this image exactly as is. If it contains Arabic, capture the Arabic text accurately. If it contains Indonesian, capture that too. Just return the raw text extracted." }
          ]
        }
      ]
    });
    return response.text || "";
  });
};

export const generateJson = async (prompt: string, systemInstruction?: string): Promise<any> => {
  // 1. Check Cache
  const cacheKey = `JSON:${prompt}`;
  const cached = await checkAiCache(cacheKey);
  if (cached) return cached;

  // 2. Call AI
  const result = await callWithRetry(async (ai) => {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        systemInstruction: systemInstruction || "You are a helpful assistant. Output strictly JSON.",
        responseMimeType: "application/json"
      }
    });

    if (!response.text) throw new Error("No response text");
    return parseJsonSafely(cleanJson(response.text));
  });

  // 3. Save Cache
  await saveAiCache(cacheKey, result, GEMINI_MODEL);
  return result;
};

export const askReligiousQuery = async (topic: string, query: string): Promise<string> => {
  // 1. Check Cache
  const cacheKey = `QUERY:${topic}:${query}`;
  const cached = await checkAiCache(cacheKey);
  if (cached) return cached.text; // Cached response structure

  // 2. Call AI
  const resultText = await callWithRetry(async (ai) => {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [{ role: 'user', parts: [{ text: query }] }],
      config: {
        systemInstruction: `You are an expert Islamic scholar specializing in ${topic} (Fiqh, Hadith, Tafsir, etc). Provide accurate, respectful, and well-referenced answers based on Quran, Hadith, and Kitab Kuning (Turath). Use Indonesian language. Focus on providing knowledge.`
      }
    });
    return response.text || "Maaf, tidak ada jawaban.";
  });

  // 3. Save Cache (Wrap string in object for consistency with jsonb column)
  await saveAiCache(cacheKey, { text: resultText }, GEMINI_MODEL);
  return resultText;
};

export const generateQuizQuestion = async (topic: string, difficulty: string): Promise<QuizQuestion> => {
  // Tambahkan random seed agar tidak terkena cache dan selalu generate soal baru
  const seed = Math.floor(Math.random() * 100000) + Date.now();
  
  const prompt = `
    Buatlah 1 soal cerdas cermat agama Islam pilihan ganda yang UNIK dan BERBEDA.
    Topik: ${topic}
    Tingkat Kesulitan: ${difficulty}
    Seed Acak: ${seed}

    Format Output JSON (wajib):
    {
      "question": "Pertanyaan...",
      "options": ["Pilihan A", "Pilihan B", "Pilihan C", "Pilihan D"],
      "correctIndex": 0, // Index array jawaban benar (0-3)
      "explanation": "Penjelasan singkat kenapa jawaban itu benar..."
    }
  `;
  return generateJson(prompt, "Anda adalah pembuat soal cerdas cermat Islam yang ahli.");
};

export const generateEssayQuestion = async (topic: string, difficulty: string): Promise<EssayQuestion> => {
  // Tambahkan random seed agar tidak terkena cache
  const seed = Math.floor(Math.random() * 100000) + Date.now();

  const prompt = `
    Buatlah 1 soal tantangan/esai singkat agama Islam yang UNIK.
    Topik: ${topic}
    Tingkat Kesulitan: ${difficulty}
    Seed Acak: ${seed}

    Pilih jenis soal secara acak dari: TEBAK_TOKOH, SAMBUNG_AYAT, SEJARAH, atau HUKUM_FIQIH.

    Format Output JSON (wajib):
    {
      "type": "JENIS_SOAL",
      "question": "Pertanyaan...",
      "clue": "Petunjuk singkat (opsional, jika sulit)",
      "answerKey": "Jawaban inti yang benar",
      "explanation": "Penjelasan detail..."
    }
  `;
  return generateJson(prompt, "Anda adalah pembuat soal tantangan santri yang ahli.");
};

export const checkEssayAnswer = async (question: string, key: string, userAnswer: string): Promise<{isCorrect: boolean, feedback: string}> => {
  const prompt = `
    Bertindaklah sebagai Guru Agama Islam yang bijak dan teliti.
    
    Tugas Anda: Mengoreksi jawaban siswa.
    
    Pertanyaan: "${question}"
    Kunci Jawaban: "${key}"
    Jawaban Siswa: "${userAnswer}"
    
    Instruksi Penilaian:
    1. Bandingkan makna jawaban siswa dengan kunci jawaban.
    2. Toleransi kesalahan ejaan kecil (typo) atau perbedaan susunan kata ASALKAN maknanya tetap benar secara syariat/sejarah.
    3. Jika jawaban siswa benar-benar salah atau melenceng jauh, tandai sebagai salah.
    4. Berikan feedback singkat yang menyemangati (jika benar) atau mengoreksi (jika salah).

    Format Output JSON (Wajib):
    {
      "isCorrect": boolean, // true jika benar/mendekati benar, false jika salah
      "feedback": "Komentar singkat anda tentang jawaban siswa..."
    }
  `;
  
  return generateJson(prompt, "Anda adalah guru penilai otomatis.");
};
