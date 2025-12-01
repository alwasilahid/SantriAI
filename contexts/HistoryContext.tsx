
import React, { createContext, useContext, useState, useEffect } from 'react';
import { HistoryItem, TranslationResult } from '../types';
import { syncTranslationToCloud } from '../services/supabaseService';

interface HistoryContextType {
  history: HistoryItem[];
  addToHistory: (item: HistoryItem) => void;
  clearHistory: () => void;
}

const HistoryContext = createContext<HistoryContextType | undefined>(undefined);

export const HistoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    // Try to load new activity history format
    const savedActivity = localStorage.getItem('santriai_activity_history');
    if (savedActivity) {
      try {
        return JSON.parse(savedActivity);
      } catch (e) {
        console.error("Failed to parse history", e);
        return [];
      }
    }

    // Migration: Check for old translation history and convert
    const oldHistory = localStorage.getItem('santriai_history');
    if (oldHistory) {
      try {
        const parsedOld: TranslationResult[] = JSON.parse(oldHistory);
        const migrated: HistoryItem[] = parsedOld.map(t => ({
          id: t.id,
          type: 'translation',
          title: t.originalText,
          subtitle: t.modernTranslation,
          timestamp: t.createdAt,
          path: '/result',
          data: t
        }));
        return migrated;
      } catch (e) {
        console.error("Failed to migrate history", e);
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('santriai_activity_history', JSON.stringify(history));
  }, [history]);

  const addToHistory = (item: HistoryItem) => {
    // 1. Update State & Local Storage immediately
    setHistory(prev => {
      // Deduplication Logic
      const filtered = prev.filter(h => {
        if (h.type === item.type && h.title === item.title && h.path === item.path) {
            return false; 
        }
        return true;
      });
      return [item, ...filtered].slice(0, 50); // Limit to 50 items
    });

    // 2. Sync to Supabase in Background
    // Kita cek apakah tipe item adalah translation dan memiliki data lengkap
    if (item.type === 'translation' && item.data) {
      // Jalankan sync secara async tanpa memblokir UI
      syncTranslationToCloud(item.data as TranslationResult)
        .then(success => {
          if (success) console.log("Data synced to Supabase successfully");
        })
        .catch(err => console.error("Background sync failed", err));
    }
  };

  const clearHistory = () => {
    setHistory([]);
  };

  return (
    <HistoryContext.Provider value={{ history, addToHistory, clearHistory }}>
      {children}
    </HistoryContext.Provider>
  );
};

export const useHistory = () => {
  const context = useContext(HistoryContext);
  if (context === undefined) {
    throw new Error('useHistory must be used within a HistoryProvider');
  }
  return context;
};
