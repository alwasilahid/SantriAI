
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SupabaseConfig, TranslationResult } from '../types';

let supabase: SupabaseClient | null = null;

export const initSupabase = (config: SupabaseConfig) => {
  if (config.enabled && config.url && config.anonKey) {
    try {
      supabase = createClient(config.url, config.anonKey);
    } catch (e) {
      console.error("Failed to init Supabase", e);
      supabase = null;
    }
  } else {
    supabase = null;
  }
};

export const syncTranslationToCloud = async (translation: TranslationResult): Promise<boolean> => {
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from('translations')
      .upsert({
        id: translation.id,
        original_text: translation.originalText,
        makna_gandul: translation.maknaGandul,
        modern_translation: translation.modernTranslation,
        nahwu_shorof: translation.nahwuShorof,
        lughah: translation.lughah,
        balaghah: translation.balaghah,
        ushul_fiqh: translation.ushulFiqh,
        hikmah: translation.hikmah,
        referensi: translation.referensi,
        created_at: translation.createdAt
      });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Supabase Sync Error:", error);
    return false;
  }
};

export const fetchHistoryFromCloud = async (): Promise<TranslationResult[] | null> => {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('translations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map((item: any) => ({
      id: item.id,
      originalText: item.original_text,
      maknaGandul: item.makna_gandul,
      modernTranslation: item.modern_translation,
      nahwuShorof: item.nahwu_shorof,
      lughah: item.lughah,
      balaghah: item.balaghah,
      ushulFiqh: item.ushul_fiqh,
      hikmah: item.hikmah,
      referensi: item.referensi,
      createdAt: item.created_at,
      synced: true
    }));
  } catch (error) {
    console.error("Supabase Fetch Error:", error);
    return null;
  }
};

// --- AI CACHING FUNCTIONS ---

// Simple string hash function for indexing
const generateHash = (str: string): string => {
  let hash = 0, i, chr;
  if (str.length === 0) return hash.toString();
  for (i = 0; i < str.length; i++) {
    chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash.toString();
};

export const checkAiCache = async (prompt: string): Promise<any | null> => {
  if (!supabase) return null;
  
  const hash = generateHash(prompt);

  try {
    const { data, error } = await supabase
      .from('ai_cache')
      .select('response_json')
      .eq('prompt_hash', hash)
      .limit(1)
      .single();

    if (error || !data) return null;
    console.log("⚡ Cache Hit! Using saved AI response.");
    return data.response_json;
  } catch (e) {
    return null;
  }
};

export const saveAiCache = async (prompt: string, response: any, model: string) => {
  if (!supabase) return;

  const hash = generateHash(prompt);

  try {
    // Fire and forget (don't await strictly)
    supabase
      .from('ai_cache')
      .insert({
        prompt_hash: hash,
        prompt_text: prompt, // Store for auditing
        response_json: response,
        model: model
      })
      .then(({ error }) => {
        if (error) console.warn("Failed to save cache", error);
      });
  } catch (e) {
    console.warn("Cache save error", e);
  }
};
