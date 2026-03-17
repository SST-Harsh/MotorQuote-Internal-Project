'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import preferenceService from '@/services/preferenceService';
import { useAuth } from './AuthContext';

const PreferenceContext = createContext();

const PREF_STORAGE_KEY = 'user_preferences';

const DEFAULT_PREFERENCES = {
  items_per_page: 10,
  date_format: 'DD/MM/YYYY',
  theme: 'light',
  language: 'en',
  show_quick_stats: true,
  auto_save_quotes: true,
};

// Read cached preferences from localStorage (excluding theme to follow API-only rule)
const getCachedPreferences = () => {
  if (typeof window === 'undefined') return DEFAULT_PREFERENCES;
  try {
    const cached = localStorage.getItem(PREF_STORAGE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      return { ...DEFAULT_PREFERENCES, ...parsed };
    }
  } catch (_) {}
  return DEFAULT_PREFERENCES;
};

export const PreferenceProvider = ({ children }) => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState(getCachedPreferences);
  const [loading, setLoading] = useState(true);

  const fetchPreferences = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const data = await preferenceService.getPreferences();
      if (data) {
        // Sanitize values
        const sanitizedData = Object.entries(data).reduce((acc, [key, val]) => {
          acc[key] = typeof val === 'string' ? val.replace(/^"|"$/g, '') : val;
          return acc;
        }, {});

        const updatedPrefs = {
          ...DEFAULT_PREFERENCES,
          ...sanitizedData,
        };

        setPreferences(updatedPrefs);

        // Cache to localStorage for instant load on refresh
        localStorage.setItem(PREF_STORAGE_KEY, JSON.stringify(updatedPrefs));
      }
    } catch (error) {
      console.error('Failed to fetch preferences:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const updatePreference = async (key, value) => {
    // Optimistic update
    const updatedPrefs = { ...preferences, [key]: value };
    setPreferences(updatedPrefs);

    // Update cache
    localStorage.setItem(PREF_STORAGE_KEY, JSON.stringify(updatedPrefs));

    try {
      await preferenceService.updatePreferences({ [key]: value });
    } catch (error) {
      console.error(`Failed to update preference ${key}:`, error);
      fetchPreferences();
    }
  };

  const refreshPreferences = async () => {
    await fetchPreferences();
  };

  const value = {
    preferences,
    loading,
    refreshPreferences,
    updatePreference,
  };

  return <PreferenceContext.Provider value={value}>{children}</PreferenceContext.Provider>;
};

export const usePreference = () => {
  const context = useContext(PreferenceContext);
  if (!context) {
    throw new Error('usePreference must be used within a PreferenceProvider');
  }
  return context;
};
