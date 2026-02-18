'use client';
import { useState, useEffect } from 'react';
import { AlertTriangle, Shield, UserPlus, ShieldCheck, Save } from 'lucide-react';
import Swal from 'sweetalert2';
import { useAuth } from '../../context/AuthContext';

export default function ConfigurationSettings() {
  const { user } = useAuth();

  // Initial state from localStorage or defaults
  const [initialConfig, setInitialConfig] = useState({ dealer2FA: false, enforce2FA: false });
  const [supportConfig, setSupportConfig] = useState({ dealer2FA: false, enforce2FA: false });
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('support_config');
      const config = saved ? JSON.parse(saved) : { dealer2FA: false, enforce2FA: false };
      setInitialConfig(config);
      setSupportConfig(config);
    }
  }, []);

  useEffect(() => {
    // Check if current config differs from initial
    const changed =
      initialConfig.dealer2FA !== supportConfig.dealer2FA ||
      initialConfig.enforce2FA !== supportConfig.enforce2FA;
    setHasChanges(changed);
  }, [supportConfig, initialConfig]);

  const toggleSupportConfig = (key) => {
    setSupportConfig((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Simulate API call (replace with actual API call)
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Save to localStorage
      localStorage.setItem('support_config', JSON.stringify(supportConfig));
      setInitialConfig(supportConfig);
      setHasChanges(false);

      Swal.fire({
        icon: 'success',
        title: 'Settings Saved',
        text: '2FA enforcement settings have been updated.',
        timer: 2000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end',
        customClass: {
          popup: 'colored-toast',
        },
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

  const handleCancel = () => {
    setSupportConfig(initialConfig);
    setHasChanges(false);
  };

  return (
    <div className="bg-[rgb(var(--color-surface))] rounded-xl shadow-sm border border-[rgb(var(--color-border))] p-8 space-y-8">
      <div className="border-[rgb(var(--color-border))]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-[rgb(var(--color-text))] flex items-center gap-2">
            <Shield size={20} className="text-[rgb(var(--color-primary))]" />
            2FA Enforcement Settings
          </h2>
          {hasChanges && (
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
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Enforce 2FA for Dealer Managers */}
          {(user?.role === 'super_admin' || user?.role === 'admin') && (
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
                  checked={supportConfig.dealer2FA}
                  onChange={() => toggleSupportConfig('dealer2FA')}
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
                  checked={supportConfig.enforce2FA}
                  onChange={() => toggleSupportConfig('enforce2FA')}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[rgb(var(--color-success)/0.3)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[rgb(var(--color-success))]"></div>
              </label>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 p-3 bg-[rgb(var(--color-warning))/0.1] rounded-lg flex items-center gap-3 text-xs text-[rgb(var(--color-warning))]">
        <AlertTriangle size={16} />
        <span>
          Changes to these settings will be applied when you click &quot;Save Changes&quot;.
        </span>
      </div>
    </div>
  );
}
