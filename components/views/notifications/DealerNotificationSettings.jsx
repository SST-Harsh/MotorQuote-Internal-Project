'use client';
import React, { useState, useEffect } from 'react';
import {
  Mail,
  Bell,
  Save,
  Shield,
  Info,
  AlertTriangle,
  CheckCircle,
  Loader2,
  FilePlus,
} from 'lucide-react';
import notificationService from '@/services/notificationService';
import { useAuth } from '@/context/AuthContext';
import Swal from 'sweetalert2';
import Loader from '@/components/common/Loader';

export default function DealerNotificationSettings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Default Preferences Structure
  const [preferences, setPreferences] = useState({
    email_notifications: true,
    sms_notifications: false,
    quote_updates: true,
    quote_created: true,
    quote_approved: true,
    quote_rejected: true,
    system_alerts: true,
    maintenance_alerts: true,
    security_alerts: true,
    marketing_emails: false,
    newsletter: false,
  });

  useEffect(() => {
    loadPreferences();
  }, [user?.id]);

  const loadPreferences = async () => {
    setLoading(true);
    try {
      const response = await notificationService.getPreferences();
      if (response.success && response.data) {
        setPreferences((prev) => ({ ...prev, ...response.data }));
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
      await notificationService.updatePreferences(preferences);

      // Update AuthContext if needed, though usually preferences are separate
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Preferences saved',
        showConfirmButton: false,
        timer: 1500,
      });
    } catch (error) {
      console.error('Failed to save preferences', error);
      const status = error.response?.status;
      const message = error.response?.data?.message || error.message;

      Swal.fire({
        title: 'Save Failed',
        html: `
                    <div class="text-left space-y-2 font-sans">
                        <p className="text-sm"><strong>Status:</strong> ${status || 'Unknown'}</p>
                        <p className="text-sm"><strong>Message:</strong> ${message}</p>
                        ${error.response?.data?.error ? `<p class="text-xs text-red-500 mt-2">${error.response.data.error}</p>` : ''}
                    </div>
                `,
        icon: 'error',
        confirmButtonColor: 'rgb(var(--color-primary))',
      });
    } finally {
      setSaving(false);
    }
  };

  const Toggle = ({ ckey, label, description }) => (
    <label className="flex items-start justify-between cursor-pointer group">
      <div className="flex-1 pr-4">
        <span className="block text-sm font-medium text-[rgb(var(--color-text))] group-hover:text-[rgb(var(--color-primary))] transition-colors">
          {label}
        </span>
        <span className="block text-xs text-[rgb(var(--color-text-muted))] mt-0.5">
          {description}
        </span>
      </div>
      <div className="relative inline-flex items-center mt-0.5">
        <input
          type="checkbox"
          className="sr-only peer"
          checked={preferences[ckey]}
          onChange={(e) => setPreferences((prev) => ({ ...prev, [ckey]: e.target.checked }))}
        />
        <div className="w-11 h-6 bg-[rgb(var(--color-border))] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[rgb(var(--color-primary))]"></div>
      </div>
    </label>
  );

  if (loading)
    return (
      <div className="bg-[rgb(var(--color-surface))] rounded-xl shadow-sm border border-[rgb(var(--color-border))] p-8 flex items-center justify-center min-h-[300px]">
        <Loader />
      </div>
    );

  return (
    <div className="bg-[rgb(var(--color-surface))] rounded-xl shadow-sm border border-[rgb(var(--color-border))] p-8 animate-fade-in">
      <h2 className="text-lg font-bold text-[rgb(var(--color-text))] mb-6 flex items-center gap-2">
        <Bell size={20} className="text-[rgb(var(--color-primary))]" />
        Communication Preferences
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        {/* Main Channels */}
        <div className="space-y-8">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-bold text-[rgb(var(--color-text))] mb-4 uppercase tracking-wider opacity-80">
              <Mail size={16} /> Notification Channels
            </h3>
            <div className="space-y-6">
              <Toggle
                ckey="email_notifications"
                label="Email Notifications"
                description="Receive updates and alerts via your registered email."
              />
              <div className="h-px bg-[rgb(var(--color-border))]" />
              <Toggle
                ckey="sms_notifications"
                label="SMS Notifications"
                description="Get urgent alerts directly to your phone."
              />
            </div>
          </div>

          <div>
            <h3 className="flex items-center gap-2 text-sm font-bold text-[rgb(var(--color-text))] mb-4 uppercase tracking-wider opacity-80">
              <Shield size={16} /> Security & System
            </h3>
            <div className="space-y-6">
              <Toggle
                ckey="security_alerts"
                label="Security Alerts"
                description="Logins from new devices or password changes."
              />
              <div className="h-px bg-[rgb(var(--color-border))]" />
              <Toggle
                ckey="maintenance_alerts"
                label="System Maintenance"
                description="Notifications about planned downtimes."
              />
            </div>
          </div>
        </div>

        {/* Quote Updates & Marketing */}
        <div className="space-y-8">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-bold text-[rgb(var(--color-text))] mb-4 uppercase tracking-wider opacity-80">
              <FilePlus size={16} /> Quote Activity
            </h3>
            <div className="space-y-6">
              <Toggle
                ckey="quote_created"
                label="Quote Created"
                description="When a new quote is assigned to you."
              />
              <div className="h-px bg-[rgb(var(--color-border))]" />
              <Toggle
                ckey="quote_approved"
                label="Quote Approved"
                description="When your submitted quote is approved."
              />
              <div className="h-px bg-[rgb(var(--color-border))]" />
              <Toggle
                ckey="quote_rejected"
                label="Quote Rejected"
                description="When a quote requires revision or is rejected."
              />
            </div>
          </div>

          <div>
            <h3 className="flex items-center gap-2 text-sm font-bold text-[rgb(var(--color-text))] mb-4 uppercase tracking-wider opacity-80">
              <Info size={16} /> Promotions & News
            </h3>
            <div className="space-y-6">
              <Toggle
                ckey="newsletter"
                label="Monthly Newsletter"
                description="Industry trends and dealership insights."
              />
              <div className="h-px bg-[rgb(var(--color-border))]" />
              <Toggle
                ckey="marketing_emails"
                label="Marketing Communications"
                description="Occasional offers and partner rewards."
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-8 pt-6 border-t border-[rgb(var(--color-border))]">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-[rgb(var(--color-primary))] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-[rgb(var(--color-primary-dark))] transition-colors shadow-lg shadow-[rgb(var(--color-primary)/0.3)] disabled:opacity-70 disabled:cursor-wait"
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          Save Preferences
        </button>
      </div>
    </div>
  );
}
