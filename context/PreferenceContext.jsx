'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import preferenceService from '@/services/preferenceService';
import { useAuth } from './AuthContext';

const PreferenceContext = createContext();

export const PreferenceProvider = ({ children }) => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState({
    items_per_page: 10,
    date_format: 'DD/MM/YYYY',
    theme: 'light',
    language: 'en',
  });
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
          ...preferences,
          ...sanitizedData,
        };

        setPreferences(updatedPrefs);

        // Sync to localStorage for i18n utilities
        localStorage.setItem('items_per_page', updatedPrefs.items_per_page);
        localStorage.setItem('date_format', updatedPrefs.date_format);
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

  const refreshPreferences = async () => {
    await fetchPreferences();
  };

  const value = {
    preferences,
    loading,
    refreshPreferences,
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
