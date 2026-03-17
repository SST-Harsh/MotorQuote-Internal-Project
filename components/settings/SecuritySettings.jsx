'use client';
import { useState } from 'react';
import { Shield, UserPlus, ShieldCheck, AlertTriangle, Save } from 'lucide-react';
import Swal from 'sweetalert2';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/authService';

export default function SecuritySettings() {
  const { user } = useAuth();

  // No GET endpoint exists — Super Admin sets enforcement state explicitly
  const [config, setConfig] = useState({ dealer2FA: false, enforce2FA: false });
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleToggle = (key) => {
    const nextConfig = { ...config, [key]: !config[key] };
    setConfig(nextConfig);
    setHasChanges(
      nextConfig.dealer2FA !== prevConfig.dealer2FA ||
        nextConfig.enforce2FA !== prevConfig.enforce2FA
    );
  };

  const handleCancel = () => {
    setConfig({ ...prevConfig });
    setHasChanges(false);
  };

  // Track what was changed from the initial OFF state
  const [prevConfig, setPrevConfig] = useState({ dealer2FA: false, enforce2FA: false });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Dealer Manager 2FA enforcement
      if (config.dealer2FA !== prevConfig.dealer2FA) {
        if (config.dealer2FA) {
          await authService.enable2fa('dealer_manager');
        } else {
          await authService.disable2FA('dealer_manager');
        }
      }

      // Admin 2FA enforcement
      if (config.enforce2FA !== prevConfig.enforce2FA) {
        if (config.enforce2FA) {
          await authService.enable2fa('dealer_manager');
        } else {
          await authService.disable2FA('dealer_manager');
        }
      }

      setPrevConfig({ ...config });
      setHasChanges(false);

      Swal.fire({
        icon: 'success',
        title: 'Settings Saved',
        text: '2FA enforcement settings have been updated.',
        timer: 2000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end',
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Save Failed',
        text: 'Could not save settings. Please try again.',
        toast: true,
        position: 'top-end',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6 pb-2 border-b border-[rgb(var(--color-border))]">
        <div className="flex items-center gap-2">
          <Shield size={20} className="text-[rgb(var(--color-primary))]" />
          <h2 className="text-lg font-semibold text-[rgb(var(--color-text))]">Security Settings</h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCancel}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-background))] rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-[rgb(var(--color-primary))] text-white text-sm font-bold rounded-lg hover:bg-[rgb(var(--color-primary-dark))] disabled:opacity-70 transition-colors"
          >
            <Save size={16} />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Enforce 2FA for Dealer Managers */}
        {user?.role === 'super_admin' && (
          <div className="flex items-start justify-between p-4 bg-[rgb(var(--color-background))] rounded-lg border border-[rgb(var(--color-border))]">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <UserPlus size={16} className="text-[rgb(var(--color-text))]" />
                <h4 className="font-semibold text-[rgb(var(--color-text))] text-sm">
                  Enforce 2FA for Dealer Managers
                </h4>
              </div>
              <p className="text-xs text-[rgb(var(--color-text-muted))]">
                Require all dealer managers to use two-factor authentication.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={config.dealer2FA}
                onChange={() => handleToggle('dealer2FA')}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[rgb(var(--color-primary)/0.3)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[rgb(var(--color-primary))]"></div>
            </label>
          </div>
        )}

        {/* Enforce 2FA for Admins */}
        {user?.role === 'super_admin' && (
          <div className="flex items-start justify-between p-4 bg-[rgb(var(--color-background))] rounded-lg border border-[rgb(var(--color-border))]">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-[rgb(var(--color-success))]" />
                <h4 className="font-semibold text-[rgb(var(--color-text))] text-sm">
                  Enforce 2FA for Admins
                </h4>
              </div>
              <p className="text-xs text-[rgb(var(--color-text-muted))]">
                Require all admins to use two-factor authentication.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={config.enforce2FA}
                onChange={() => handleToggle('enforce2FA')}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[rgb(var(--color-success)/0.3)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[rgb(var(--color-success))]"></div>
            </label>
          </div>
        )}
      </div>

      <div className="mt-6 p-3 bg-[rgb(var(--color-warning))/0.1] rounded-lg flex items-center gap-3 text-xs text-[rgb(var(--color-warning))]">
        <AlertTriangle size={16} />
        <span>
          Changes to these settings will be applied when you click &quot;Save Changes&quot;.
        </span>
      </div>
    </section>
  );
}
