'use client';
import React, { useState, useEffect } from 'react';
import {
  Clock,
  Calendar,
  Globe,
  Bell,
  FileText,
  Layout,
  Save,
  Loader2,
  Monitor,
  Shield,
  Check,
} from 'lucide-react';
import preferenceService from '@/services/preferenceService';
import { usePreference } from '@/context/PreferenceContext';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import Switch from '../common/Switch';
import Input from '../common/Input';
import Swal from 'sweetalert2';
import Loader from '@/components/common/Loader';

const timezones = [
  { value: 'UTC', label: '(UTC) Coordinated Universal Time' },
  { value: 'America/New_York', label: 'Eastern Time (New York)' },
  { value: 'Europe/London', label: 'Western European Time (London)' },
  { value: 'Asia/Dubai', label: 'Gulf Standard Time (Dubai)' },
  { value: 'Asia/Kolkata', label: 'India Standard Time (Kolkata)' },
];

const dateFormats = [
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (12/31/2024)' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (31/12/2024)' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (2024-12-31)' },
];

const dashboardViews = [
  { value: 'overview', label: 'Analytics Overview' },
  { value: 'quotes', label: 'Quotes Dashboard' },
  { value: 'activities', label: 'Recent Activity' },
];

const quoteTemplates = [
  { value: 'standard', label: 'Standard Template' },
  { value: 'modern', label: 'Modern Compact' },
  { value: 'detailed', label: 'Detailed Breakdown' },
];

const themes = [
  { value: 'light', label: 'Light Mode' },
  { value: 'dark', label: 'Dark Mode' },
  { value: 'slate', label: 'Slate' },
  { value: 'luxury', label: 'Luxury' },
];

export default function UserPreferences() {
  const { locale, supportedLanguages, changeLanguage } = useLanguage();
  const { changeTheme } = useTheme();
  const { refreshPreferences } = usePreference();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [prefs, setPrefs] = useState({
    default_dashboard_view: 'overview',
    recent_items_count: 10,
    show_quick_stats: true,
    email_notifications: true,
    marketing_notifications: false,
    push_notifications: true,
    quote_notifications: true,
    system_notifications: true,
    auto_save_quotes: true,
    default_quote_expiry_days: 30,
    quote_template: 'standard',
    password_expiry_days: 90,
    session_timeout: 30,
    two_factor_auth: false,
    date_format: 'MM/DD/YYYY',
    items_per_page: 20,
    language: 'en',
    theme: 'light',
    timezone: 'America/New_York',
  });

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    setLoading(true);
    try {
      const data = await preferenceService.getPreferences();
      if (data) {
        // Remove quotes from string values if they exist (handling the provided raw payload style)
        const sanitizedData = Object.entries(data).reduce((acc, [key, val]) => {
          acc[key] = typeof val === 'string' ? val.replace(/^"|"$/g, '') : val;
          return acc;
        }, {});
        setPrefs(sanitizedData);
      }
    } catch (error) {
      console.error('Failed to load preferences', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await preferenceService.updatePreferences(prefs);

      // Sync to localStorage for immediate effect in utilities
      localStorage.setItem('date_format', prefs.date_format);
      localStorage.setItem('items_per_page', prefs.items_per_page);

      // Refresh global context
      await refreshPreferences();

      // Sync language if changed
      if (prefs.language !== locale) {
        await changeLanguage(prefs.language);
      }

      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Preferences updated successfully',
        showConfirmButton: false,
        timer: 2000,
      });
    } catch (error) {
      Swal.fire('Error', 'Failed to save preferences', 'error');
    } finally {
      setSaving(false);
    }
  };

  const ToggleRow = ({ icon: Icon, label, description, prefKey }) => (
    <div className="flex items-center justify-between py-4 border-b border-[rgb(var(--color-border))] last:border-0 group">
      <div className="flex items-center gap-4">
        <div className="p-2.5 bg-[rgb(var(--color-background))] rounded-xl text-[rgb(var(--color-text-muted))] group-hover:text-[rgb(var(--color-primary))] group-hover:bg-[rgb(var(--color-primary)/0.1)] transition-colors">
          <Icon size={20} />
        </div>
        <div>
          <p className="font-semibold text-[rgb(var(--color-text))]">{label}</p>
          {description && (
            <p className="text-xs text-[rgb(var(--color-text-muted))]">{description}</p>
          )}
        </div>
      </div>
      <Switch
        checked={prefs[prefKey]}
        onChange={(val) => setPrefs((prev) => ({ ...prev, [prefKey]: val }))}
      />
    </div>
  );

  const SelectField = ({ label, value, options, onChange, icon: Icon }) => (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-[rgb(var(--color-text-muted))] flex items-center gap-2">
        {Icon && <Icon size={14} />}
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-[rgb(var(--color-background))] border border-[rgb(var(--color-border))] rounded-xl px-4 py-2.5 text-sm font-medium text-[rgb(var(--color-text))] focus:ring-2 focus:ring-[rgb(var(--color-primary)/0.2)] focus:border-[rgb(var(--color-primary))] outline-none appearance-none transition-all"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[rgb(var(--color-text-muted))]">
          <Layout size={14} />
        </div>
      </div>
    </div>
  );

  if (loading)
    return (
      <div className="bg-[rgb(var(--color-surface))] rounded-2xl shadow-sm border border-[rgb(var(--color-border))] p-12 flex justify-center items-center">
        <Loader />
      </div>
    );

  return (
    <section className="bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] rounded-2xl p-6 shadow-sm mb-10">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-[rgb(var(--color-border))]">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-[rgb(var(--color-primary))/0.1] text-[rgb(var(--color-primary))] rounded-lg">
            <Monitor size={20} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[rgb(var(--color-text))]">
              User Preferences
            </h2>
            <p className="text-xs text-[rgb(var(--color-text-muted))]">
              Personalize your experience and regional settings.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Regional & Localization */}
        <div className="bg-[rgb(var(--color-background))] rounded-xl border border-[rgb(var(--color-border))] overflow-hidden">
          <div className="p-4 border-b border-[rgb(var(--color-border))] flex items-center gap-3">
            <div className="p-2 bg-[rgb(var(--color-info))/0.1] text-[rgb(var(--color-info))] rounded-lg">
              <Globe size={18} />
            </div>
            <h3 className="text-sm font-semibold text-[rgb(var(--color-text))]">
              Regional Settings
            </h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SelectField
                label="Theme"
                value={prefs.theme}
                options={themes}
                onChange={(val) => {
                  setPrefs((prev) => ({ ...prev, theme: val }));
                  changeTheme(val);
                }}
                icon={Monitor}
              />
              <SelectField
                label="Language"
                value={prefs.language}
                options={supportedLanguages.map((l) => ({
                  value: l.code,
                  label: `${l.flag} ${l.nativeName}`,
                }))}
                onChange={(val) => setPrefs((prev) => ({ ...prev, language: val }))}
                icon={Globe}
              />
              <SelectField
                label="Timezone"
                value={prefs.timezone}
                options={timezones}
                onChange={(val) => setPrefs((prev) => ({ ...prev, timezone: val }))}
                icon={Clock}
              />
              <SelectField
                label="Date Format"
                value={prefs.date_format}
                options={dateFormats}
                onChange={(val) => setPrefs((prev) => ({ ...prev, date_format: val }))}
                icon={Calendar}
              />
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[rgb(var(--color-text-muted))] flex items-center gap-2">
                  <Monitor size={14} /> Items Per Page
                </label>
                <input
                  type="number"
                  value={prefs.items_per_page}
                  onChange={(e) =>
                    setPrefs((prev) => ({ ...prev, items_per_page: parseInt(e.target.value) }))
                  }
                  className="w-full bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] rounded-xl px-4 py-2.5 text-sm font-medium text-[rgb(var(--color-text))] focus:ring-2 focus:ring-[rgb(var(--color-primary)/0.2)] focus:border-[rgb(var(--color-primary))] outline-none transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard & Quote Defaults */}
        <div className="bg-[rgb(var(--color-background))] rounded-xl border border-[rgb(var(--color-border))] overflow-hidden">
          <div className="p-4 border-b border-[rgb(var(--color-border))] flex items-center gap-3">
            <div className="p-2 bg-[rgb(var(--color-success))/0.1] text-[rgb(var(--color-success))] rounded-lg">
              <FileText size={18} />
            </div>
            <h3 className="text-sm font-semibold text-[rgb(var(--color-text))]">
              Experience & Defaults
            </h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SelectField
                label="Default Dashboard"
                value={prefs.default_dashboard_view}
                options={dashboardViews}
                onChange={(val) => setPrefs((prev) => ({ ...prev, default_dashboard_view: val }))}
                icon={Layout}
              />
              <SelectField
                label="Quote Template"
                value={prefs.quote_template}
                options={quoteTemplates}
                onChange={(val) => setPrefs((prev) => ({ ...prev, quote_template: val }))}
                icon={FileText}
              />
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[rgb(var(--color-text-muted))]">
                  Recent Items Count
                </label>
                <input
                  type="number"
                  value={prefs.recent_items_count}
                  onChange={(e) =>
                    setPrefs((prev) => ({ ...prev, recent_items_count: parseInt(e.target.value) }))
                  }
                  className="w-full bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] rounded-xl px-4 py-2.5 text-sm font-medium text-[rgb(var(--color-text))] focus:ring-2 focus:ring-[rgb(var(--color-primary)/0.2)] focus:border-[rgb(var(--color-primary))] outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[rgb(var(--color-text-muted))]">
                  Quote Expiry (Days)
                </label>
                <input
                  type="number"
                  value={prefs.default_quote_expiry_days}
                  onChange={(e) =>
                    setPrefs((prev) => ({
                      ...prev,
                      default_quote_expiry_days: parseInt(e.target.value),
                    }))
                  }
                  className="w-full bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] rounded-xl px-4 py-2.5 text-sm font-medium text-[rgb(var(--color-text))] focus:ring-2 focus:ring-[rgb(var(--color-primary)/0.2)] focus:border-[rgb(var(--color-primary))] outline-none transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Notification Channels */}
        <div className="bg-[rgb(var(--color-background))] rounded-xl border border-[rgb(var(--color-border))] overflow-hidden">
          <div className="p-4 border-b border-[rgb(var(--color-border))] flex items-center gap-3">
            <div className="p-2 bg-[rgb(var(--color-warning))/0.1] text-[rgb(var(--color-warning))] rounded-lg">
              <Bell size={18} />
            </div>
            <h3 className="text-sm font-semibold text-[rgb(var(--color-text))]">
              Communication Preferences
            </h3>
          </div>
          <div className="p-6 space-y-1">
            <ToggleRow
              icon={Globe}
              label="Email Notifications"
              description="Receive vital updates via email"
              prefKey="email_notifications"
            />
            <ToggleRow
              icon={FileText}
              label="Marketing Notifications"
              description="Receive promotions and news"
              prefKey="marketing_notifications"
            />
            <ToggleRow
              icon={Shield}
              label="Push Notifications"
              description="Browser-based real-time alerts"
              prefKey="push_notifications"
            />
            <ToggleRow
              icon={FileText}
              label="Quote Updates"
              description="New quotes and status changes"
              prefKey="quote_notifications"
            />
            <ToggleRow
              icon={Shield}
              label="System Alerts"
              description="Maintenance and security updates"
              prefKey="system_notifications"
            />
          </div>
        </div>

        {/* General & Security */}
        <div className="bg-[rgb(var(--color-background))] rounded-xl border border-[rgb(var(--color-border))] overflow-hidden">
          <div className="p-4 border-b border-[rgb(var(--color-border))] flex items-center gap-3">
            <div className="p-2 bg-[rgb(var(--color-error))/0.1] text-[rgb(var(--color-error))] rounded-lg">
              <Shield size={18} />
            </div>
            <h3 className="text-sm font-semibold text-[rgb(var(--color-text))]">
              General & Productivity
            </h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="space-y-1">
              <ToggleRow
                icon={Layout}
                label="Show Quick Stats"
                description="Display KPI summary on dashboard"
                prefKey="show_quick_stats"
              />
              <ToggleRow
                icon={Save}
                label="Auto-Save Quotes"
                description="Automatically save drafts as you type"
                prefKey="auto_save_quotes"
              />
              <ToggleRow
                icon={Shield}
                label="Two-Factor Authentication"
                description="Enhanced account protection (requires setup)"
                prefKey="two_factor_auth"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[rgb(var(--color-border))]">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[rgb(var(--color-text-muted))]">
                  Session Timeout (Min)
                </label>
                <input
                  type="number"
                  value={prefs.session_timeout}
                  onChange={(e) =>
                    setPrefs((prev) => ({ ...prev, session_timeout: parseInt(e.target.value) }))
                  }
                  className="w-full bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] rounded-lg px-3 py-2 text-xs font-medium text-[rgb(var(--color-text))] outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary)/0.2)] focus:border-[rgb(var(--color-primary))]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[rgb(var(--color-text-muted))]">
                  Password Expiry (Days)
                </label>
                <input
                  type="number"
                  value={prefs.password_expiry_days}
                  onChange={(e) =>
                    setPrefs((prev) => ({
                      ...prev,
                      password_expiry_days: parseInt(e.target.value),
                    }))
                  }
                  className="w-full bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] rounded-lg px-3 py-2 text-xs font-medium text-[rgb(var(--color-text))] outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary)/0.2)] focus:border-[rgb(var(--color-primary))]"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-6 pt-4 border-t border-[rgb(var(--color-border))]">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-[rgb(var(--color-primary))] text-white font-bold rounded-xl hover:bg-[rgb(var(--color-primary-dark))] shadow-lg shadow-[rgb(var(--color-primary)/0.2)] disabled:opacity-50 transition-all active:scale-95"
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          Save Changes
        </button>
      </div>
    </section>
  );
}
