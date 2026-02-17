'use client';
import React, { useState, useEffect } from 'react';
import {
  Globe,
  Shield,
  Bell,
  Lock,
  Mail,
  Server,
  Palette,
  AlertTriangle,
  Save,
  FileText,
  DollarSign,
} from 'lucide-react';
import Swal from 'sweetalert2';

export default function GlobalSystemSettings() {
  // Initial State from LocalStorage or Defaults
  const [config, setConfig] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('global_system_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure new fields exist if loading old config
        return {
          ...parsed,
          cms: parsed.cms || { faq: '', terms: '', privacy: '' },
          pricing: parsed.pricing || { minValidityDays: 14, currency: 'INR' },
        };
      }
      return {
        branding: { appName: 'MotorQuote', logoUrl: '', locale: 'en-US' },
        security: {
          twoFA: { admin: false, dealer: false },
          maintenanceMode: false,
        },
        communication: {
          smtp: { host: 'smtp.example.com', port: '587', user: 'admin', pass: '****' },
          notifications: {
            channels: { email: true, sms: false, inApp: true },
            types: { marketing: false, alerts: true, updates: true },
          },
        },
        cms: { faq: '', terms: '', privacy: '' },
        pricing: { minValidityDays: 14, currency: 'INR' },
      };
    }
    return {
      branding: { appName: 'MotorQuote', logoUrl: '', locale: 'en-US' },
      security: { twoFA: { admin: false, dealer: false }, maintenanceMode: false },
      communication: {
        smtp: { host: 'smtp.example.com', port: '587', user: 'admin', pass: '****' },
        notifications: {
          channels: { email: true, sms: false, inApp: true },
          types: { marketing: false, alerts: true, updates: true },
        },
      },
      cms: { faq: '', terms: '', privacy: '' },
      pricing: { minValidityDays: 14, currency: 'INR' },
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
          These settings affect the entire platform layout, security protocols, and communication
          channels.
        </span>
      </div>

      {/* Branding Section */}
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
      <div className="space-y-6 pt-6 border-t border-[rgb(var(--color-border))]">
        <h3 className="text-sm font-bold text-[rgb(var(--color-text))] uppercase tracking-wider flex items-center gap-2">
          <Shield size={16} /> Security Controls
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ToggleCard
            title="Enforce Admin 2FA"
            desc="Require 2FA for all Dealership Admins."
            checked={config.security.twoFA.admin}
            icon={<Lock size={18} />}
            onChange={() =>
              handleChange('security', 'twoFA', !config.security.twoFA.admin, 'admin')
            }
          />

          <ToggleCard
            title="Enforce dealer 2FA"
            desc="Require 2FA for all dealer Staff."
            checked={config.security.twoFA.dealer}
            icon={<Lock size={18} />}
            onChange={() =>
              handleChange('security', 'twoFA', !config.security.twoFA.dealer, 'dealer')
            }
          />
        </div>

        <div className="bg-[rgb(var(--color-error))/0.05] border border-[rgb(var(--color-error))/0.2] rounded-lg p-4 flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-[rgb(var(--color-error))]" />
              <h4 className="font-bold text-[rgb(var(--color-error))]">
                System Freeze (Maintenance Mode)
              </h4>
            </div>
            <p className="text-xs text-[rgb(var(--color-text-muted))] max-w-md">
              Locks out all non-Super Admin users. Use during critical updates.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={config.security.maintenanceMode}
              onChange={() =>
                handleChange('security', 'maintenanceMode', !config.security.maintenanceMode)
              }
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[rgb(var(--color-error)/0.3)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[rgb(var(--color-error))]"></div>
          </label>
        </div>
      </div>

      {/* Communication Section */}
      <div className="space-y-6 pt-6 border-t border-[rgb(var(--color-border))]">
        <h3 className="text-sm font-bold text-[rgb(var(--color-text))] uppercase tracking-wider flex items-center gap-2">
          <Mail size={16} /> Communication
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h4 className="text-xs font-semibold text-[rgb(var(--color-text-muted))]">
              SMTP SERVER (Mock)
            </h4>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="SMTP Host"
                className="w-full px-4 py-2 text-sm rounded-lg border border-[rgb(var(--color-border))] bg-[rgb(var(--color-background))] text-[rgb(var(--color-text))]"
                value={config.communication.smtp.host}
                onChange={(e) => handleChange('communication', 'smtp', e.target.value, 'host')}
              />
              <input
                type="text"
                placeholder="Port"
                className="w-full px-4 py-2 text-sm rounded-lg border border-[rgb(var(--color-border))] bg-[rgb(var(--color-background))] text-[rgb(var(--color-text))]"
                value={config.communication.smtp.port}
                onChange={(e) => handleChange('communication', 'smtp', e.target.value, 'port')}
              />
            </div>
          </div>
          <div className="space-y-4">
            <h4 className="text-xs font-semibold text-[rgb(var(--color-text-muted))]">
              NOTIFICATIONS
            </h4>
            <div className="space-y-2">
              {Object.keys(config.communication.notifications.channels).map((channel) => (
                <SwitchRow
                  key={channel}
                  label={`${channel.charAt(0).toUpperCase() + channel.slice(1)} Channel`}
                  checked={config.communication.notifications.channels[channel]}
                  setter={(v) => {
                    setConfig((prev) => ({
                      ...prev,
                      communication: {
                        ...prev.communication,
                        notifications: {
                          ...prev.communication.notifications,
                          channels: {
                            ...prev.communication.notifications.channels,
                            [channel]: v,
                          },
                        },
                      },
                    }));
                  }}
                />
              ))}
            </div>
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

// Local helper components
const ToggleCard = ({ title, desc, checked, onChange, icon }) => (
  <div className="flex items-start justify-between p-4 bg-[rgb(var(--color-background))] rounded-lg border border-[rgb(var(--color-border))] hover:border-[rgb(var(--color-primary)/0.3)] transition-colors">
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <span className="text-[rgb(var(--color-text))]">{icon}</span>
        <h4 className="font-semibold text-[rgb(var(--color-text))] text-sm">{title}</h4>
      </div>
      <p className="text-xs text-[rgb(var(--color-text-muted))]">{desc}</p>
    </div>
    <label className="relative inline-flex items-center cursor-pointer">
      <input type="checkbox" className="sr-only peer" checked={checked} onChange={onChange} />
      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[rgb(var(--color-primary))]"></div>
    </label>
  </div>
);

const SwitchRow = ({ label, checked, setter }) => (
  <div className="flex items-center justify-between py-1">
    <span className="text-sm text-[rgb(var(--color-text-muted))]">{label}</span>
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        className="sr-only peer"
        checked={checked}
        onChange={(e) => setter(e.target.checked)}
      />
      <div className="w-8 h-4 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[rgb(var(--color-primary))]"></div>
    </label>
  </div>
);
