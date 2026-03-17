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
import Switch from '../common/Switch';
import Input from '../common/Input';
import Swal from 'sweetalert2';
import Loader from '@/components/common/Loader';
import CustomSelect from '@/components/common/CustomSelect';
import { useAuth } from '@/context/AuthContext';

const timezones = [
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'New York' },
  { value: 'Europe/London', label: 'London' },
  { value: 'Asia/Dubai', label: 'Dubai' },
  { value: 'Asia/Kolkata', label: 'Kolkata' },
];

const dateFormats = [
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
];

export default function UserPreferences() {
  const { user } = useAuth();
  const { preferences: contextPrefs, refreshPreferences } = usePreference();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  // Initialize from context (which is already seeded from localStorage cache)
  const [prefs, setPrefs] = useState(contextPrefs);
  const [initialPrefs, setInitialPrefs] = useState(contextPrefs);

  const userRole = user?.role?.toLowerCase() || '';
  const hideTimeouts = userRole === 'dealer_manager' || userRole === 'support_staff';

  // Sync local state if context prefs update (e.g. after background fetch)
  useEffect(() => {
    setPrefs(contextPrefs);
    setInitialPrefs(contextPrefs);
  }, [contextPrefs]);

  // isDirty: check if any preference differs from initial
  const isDirty = React.useMemo(() => {
    if (!initialPrefs) return false;
    return JSON.stringify(prefs) !== JSON.stringify(initialPrefs);
  }, [prefs, initialPrefs]);

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

      // Sync to localStorage for immediate effect (full object + individual keys)
      localStorage.setItem('user_preferences', JSON.stringify(prefs));
      localStorage.setItem('date_format', prefs.date_format);
      localStorage.setItem('items_per_page', prefs.items_per_page);

      // Refresh global context
      await refreshPreferences();
      // Reset dirty state
      setInitialPrefs(prefs);

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
        <CustomSelect
          value={value}
          onChange={(e) => onChange(e.target.value)}
          options={options}
          className="w-full"
        />
      </div>
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
          <div className="p-4 border-b border-[rgb(var(--color-border))] flex items-center gap-3 bg-[rgb(var(--color-background))/0.5]">
            <div className="p-2 bg-[rgb(var(--color-info))/0.1] text-[rgb(var(--color-info))] rounded-lg">
              <Globe size={18} />
            </div>
            <h3 className="text-sm font-bold text-[rgb(var(--color-text))]">Regional Settings</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        {/* Notification Channels */}
        <div className="bg-[rgb(var(--color-background))] rounded-xl border border-[rgb(var(--color-border))] overflow-hidden">
          <div className="p-4 border-b border-[rgb(var(--color-border))] flex items-center gap-3 bg-[rgb(var(--color-background))/0.5]">
            <div className="p-2 bg-[rgb(var(--color-warning))/0.1] text-[rgb(var(--color-warning))] rounded-lg">
              <Bell size={18} />
            </div>
            <h3 className="text-sm font-bold text-[rgb(var(--color-text))]">
              Communication Preferences
            </h3>
          </div>
          <div className="p-6">
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
        <div className="bg-[rgb(var(--color-background))] rounded-xl border border-[rgb(var(--color-border))] overflow-hidden lg:col-span-2">
          <div className="p-4 border-b border-[rgb(var(--color-border))] flex items-center gap-3 bg-[rgb(var(--color-background))/0.5]">
            <div className="p-2 bg-[rgb(var(--color-error))/0.1] text-[rgb(var(--color-error))] rounded-lg">
              <Shield size={18} />
            </div>
            <h3 className="text-sm font-bold text-[rgb(var(--color-text))]">
              General & Productivity
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-1">
              <ToggleRow
                icon={Layout}
                label="Show Quick Stats"
                description="Display KPI summary on dashboard"
                prefKey="show_quick_stats"
              />
            </div>

            {!hideTimeouts && (
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
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-6 pt-4 border-t border-[rgb(var(--color-border))]">
        <button
          onClick={handleSave}
          disabled={saving || !isDirty}
          className="flex items-center gap-2 px-6 py-2.5 bg-[rgb(var(--color-primary))] text-white font-bold rounded-xl hover:bg-[rgb(var(--color-primary-dark))] shadow-lg shadow-[rgb(var(--color-primary)/0.2)] disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          Save Changes
        </button>
      </div>
    </section>
  );
}
