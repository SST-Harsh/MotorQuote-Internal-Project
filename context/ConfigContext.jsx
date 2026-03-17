'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';

const ConfigContext = createContext();

export const ConfigProvider = ({ children }) => {
  const [config, setConfig] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('global_system_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          branding: parsed.branding || { appName: 'MotorQuote', logoUrl: '', locale: 'en-US' },
          security: parsed.security || { twoFA: { dealer: false }, maintenanceMode: false },
        };
      }
    }
    return {
      branding: { appName: 'MotorQuote', logoUrl: '', locale: 'en-US' },
      security: {
        twoFA: { dealer: false },
        maintenanceMode: false,
      },
    };
  });
  useEffect(() => {
    // Global config fetching is currently disabled/handled via static defaults
    // until a replacement sync endpoint is established.
  }, []);

  const is2FAEnforced = useCallback(
    (role) => {
      if (!config?.security?.twoFA) return false;
      if (role === 'super_admin') return false;
      if (role === 'dealer_manager') return config.security.twoFA.dealer;
      return false;
    },
    [config]
  );

  const updateConfig = useCallback((newConfig) => {
    setConfig((prev) => {
      const updated = typeof newConfig === 'function' ? newConfig(prev) : newConfig;
      localStorage.setItem('global_system_config', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const value = {
    config,
    updateConfig,
    is2FAEnforced,
  };

  return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>;
};

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
};
