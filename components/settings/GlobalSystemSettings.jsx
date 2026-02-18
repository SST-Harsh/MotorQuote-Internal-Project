'use client';
import React, { useState, useEffect } from 'react';
import { Globe, Shield, Palette, AlertTriangle, Save } from 'lucide-react';
import Swal from 'sweetalert2';

export default function GlobalSystemSettings() {
  const [config, setConfig] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('global_system_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          branding: parsed.branding || { appName: 'MotorQuote', logoUrl: '', locale: 'en-US' },
          security: parsed.security || {
            twoFA: { admin: false, dealer: false },
            maintenanceMode: false,
          },
        };
      }
      return {
        branding: { appName: 'MotorQuote', logoUrl: '', locale: 'en-US' },
        security: {
          twoFA: { admin: false, dealer: false },
          maintenanceMode: false,
        },
      };
    }
    return {
      branding: { appName: 'MotorQuote', logoUrl: '', locale: 'en-US' },
      security: { twoFA: { admin: false, dealer: false }, maintenanceMode: false },
    };
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    localStorage.setItem('global_system_config', JSON.stringify(config));
  }, [config]);

  const handleChange = (section, key, value, subKey = null) => {
    setConfig((prev) => {
      if (subKey) {
        return {
          ...prev,
          [section]: {
            ...prev[section],
            [key]: {
              ...prev[section][key],
              [subKey]: value,
            },
          },
        };
      }
      return {
        ...prev,
        [section]: {
          ...prev[section],
          [key]: value,
        },
      };
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    Swal.fire({
      icon: 'success',
      title: 'Settings Saved',
      text: 'Global system configuration updated successfully.',
      timer: 2000,
      showConfirmButton: false,
      toast: true,
      position: 'top-end',
      customClass: { popup: 'colored-toast' },
    });
  };

  return (
    <div className="bg-[rgb(var(--color-surface))] rounded-xl shadow-sm border border-[rgb(var(--color-border))] p-8 space-y-8">
      <h2 className="text-lg font-bold text-[rgb(var(--color-text))] mb-2 flex items-center gap-2">
        <Globe size={20} className="text-[rgb(var(--color-primary))]" />
        Global System Configuration
      </h2>
      <div className="p-3 bg-[rgb(var(--color-info))/0.1] rounded-lg flex items-center gap-3 text-xs text-[rgb(var(--color-info))]">
        <AlertTriangle size={16} />
        <span>
          These settings affect the entire platform layout, security protocols, and branding.
        </span>
      </div>

      <div className="space-y-6 pt-4 border-t border-[rgb(var(--color-border))]">
        <h3 className="text-sm font-bold text-[rgb(var(--color-text))] uppercase tracking-wider flex items-center gap-2">
          <Palette size={16} /> Branding & Localization
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="text-sm font-semibold text-[rgb(var(--color-text))]">
              Application Name
            </label>
            <input
              type="text"
              value={config.branding.appName}
              onChange={(e) => handleChange('branding', 'appName', e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-[rgb(var(--color-border))] bg-[rgb(var(--color-background))] text-[rgb(var(--color-text))]"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-semibold text-[rgb(var(--color-text))]">Logo URL</label>
            <input
              type="text"
              placeholder="https://..."
              value={config.branding.logoUrl}
              onChange={(e) => handleChange('branding', 'logoUrl', e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-[rgb(var(--color-border))] bg-[rgb(var(--color-background))] text-[rgb(var(--color-text))]"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 bg-[rgb(var(--color-primary))] text-white px-6 py-2.5 rounded-xl font-bold hover:bg-[rgb(var(--color-primary-dark))] transition-all shadow-lg shadow-[rgb(var(--color-primary)/0.3)] disabled:opacity-70"
        >
          <Save size={18} />
          {isSaving ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>
    </div>
  );
}
