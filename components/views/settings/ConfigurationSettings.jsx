'use client';
import { useState, useEffect } from 'react';
import { AlertTriangle, Shield, Trash2, UserPlus, ShieldCheck } from 'lucide-react';
import Swal from 'sweetalert2';

export default function ConfigurationSettings() {
  const [supportConfig, setSupportConfig] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('support_config');
      return saved ? JSON.parse(saved) : { bulkDelete: false, dealer2FA: false, enforce2FA: false };
    }
    return { bulkDelete: false, dealer2FA: false, enforce2FA: false };
  });

  useEffect(() => {
    localStorage.setItem('support_config', JSON.stringify(supportConfig));
  }, [supportConfig]);

  const toggleSupportConfig = (key) => {
    const newValue = !supportConfig[key];
    setSupportConfig((prev) => ({ ...prev, [key]: newValue }));

    const role = key.startsWith('dealer') ? 'Dealer' : 'Support';
    const actionDisplay =
      key === 'dealer2FA' || key === 'enforce2FA'
        ? '2FA Requirement'
        : key.replace(/([A-Z])/g, ' $1').trim();

    Swal.fire({
      icon: 'success',
      title: 'Permission Updated',
      text: `${role} role: ${actionDisplay} ${newValue ? 'enabled' : 'disabled'}.`,
      timer: 2000,
      showConfirmButton: false,
      toast: true,
      position: 'top-end',
      customClass: {
        popup: 'colored-toast',
      },
    });
  };

  return (
    <div className="bg-[rgb(var(--color-surface))] rounded-xl shadow-sm border border-[rgb(var(--color-border))] p-8 space-y-8">
      <div className="border-[rgb(var(--color-border))]">
        <h2 className="text-lg font-bold text-[rgb(var(--color-text))] mb-6 flex items-center gap-2">
          <Shield size={20} className="text-[rgb(var(--color-primary))]" />
          Support Role Access
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-start justify-between p-4 bg-[rgb(var(--color-background))] rounded-lg border border-[rgb(var(--color-border))]">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Trash2 size={16} className="text-[rgb(var(--color-text))]" />
                <h4 className="font-semibold text-[rgb(var(--color-text))] text-sm">
                  Allow Bulk Delete
                </h4>
              </div>
              <p className="text-xs text-[rgb(var(--color-text-muted))]">
                Permit Support users to delete multiple items.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={supportConfig.bulkDelete}
                onChange={() => toggleSupportConfig('bulkDelete')}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[rgb(var(--color-primary)/0.3)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[rgb(var(--color-primary))]"></div>
            </label>
          </div>

          <div className="flex items-start justify-between p-4 bg-[rgb(var(--color-background))] rounded-lg border border-[rgb(var(--color-border))]">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <UserPlus size={16} className="text-[rgb(var(--color-text))]" />
                <h4 className="font-semibold text-[rgb(var(--color-text))] text-sm">Enforce 2FA</h4>
              </div>
              <p className="text-xs text-[rgb(var(--color-text-muted))]">
                Enforce 2FA for Dealer users.
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

          <div className="flex items-start justify-between p-4 bg-[rgb(var(--color-background))] rounded-lg border border-[rgb(var(--color-border))]">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-[rgb(var(--color-success))]" />
                <h4 className="font-semibold text-[rgb(var(--color-text))] text-sm">Enforce 2FA</h4>
              </div>
              <p className="text-xs text-[rgb(var(--color-text-muted))]">
                Require Two-Factor Auth for all Support users.
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
        </div>
      </div>

      <div className="mt-4 p-3 bg-[rgb(var(--color-warning))/0.1] rounded-lg flex items-center gap-3 text-xs text-[rgb(var(--color-warning))]">
        <AlertTriangle size={16} />
        <span>Changes to these settings affect the entire system and all users immediately.</span>
      </div>
    </div>
  );
}
