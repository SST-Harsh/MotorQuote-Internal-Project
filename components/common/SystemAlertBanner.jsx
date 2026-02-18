'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, ShieldAlert, X } from 'lucide-react';
import { useNotifications } from '@/context/NotificationContext';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';

export default function SystemAlertBanner() {
  const { userNotifications } = useNotifications();
  const { user } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  const [dismissedAlerts, setDismissedAlerts] = useState([]);

  // Load dismissed alerts from localStorage on mount
  useEffect(() => {
    const dismissed = localStorage.getItem('dismissedSystemAlerts');
    if (dismissed) {
      setDismissedAlerts(JSON.parse(dismissed));
    }
  }, []);

  if (!user) return null;

  const threatNotification = userNotifications.find(
    (n) =>
      ['critical', 'alert', 'security_breach', 'threat', 'backend_alert'].includes(
        n.type?.toLowerCase()
      ) &&
      !(n.is_read || n.readBy?.includes(user?.id)) &&
      !dismissedAlerts.includes(n.id) // Check if this alert was dismissed
  );

  if (!threatNotification) return null;

  const isSuperAdmin = user?.role === 'super_admin';

  let alertTitle = t('alerts.systemAlert');
  if (isSuperAdmin) {
    alertTitle =
      threatNotification.type === 'security_breach'
        ? t('alerts.securityBreach')
        : t('alerts.backendAlert');
  }

  return (
    <div
      onClick={() => router.push('/notifications')}
      className="group bg-gradient-to-r from-red-500 via-rose-500 to-red-600 text-white px-4 py-3 cursor-pointer transition-all duration-300 shadow-[0_4px_12px_rgba(239,68,68,0.25)] hover:shadow-[0_6px_16px_rgba(239,68,68,0.35)] z-[60] relative border-b border-red-400/30"
      role="alert"
    >
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-soft-light pointer-events-none"></div>

      <div className="max-w-7xl mx-auto flex items-center justify-between relative z-10">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-[rgb(var(--color-surface))]/20 rounded-full animate-ping opacity-75"></div>
            <div className="relative p-2.5 bg-[rgb(var(--color-surface))]/20 backdrop-blur-sm rounded-full shadow-inner border border-[rgb(var(--color-surface))]/10 group-hover:scale-110 transition-transform duration-300">
              {isSuperAdmin ? (
                <ShieldAlert size={20} className="drop-shadow-sm" />
              ) : (
                <AlertTriangle size={20} className="drop-shadow-sm" />
              )}
            </div>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-[10px] md:text-xs tracking-[0.1em] text-red-50 bg-red-800/20 px-2 py-0.5 rounded backdrop-blur-md border border-red-400/20 uppercase shadow-sm">
                {alertTitle}
              </span>
            </div>
            <span className="text-sm md:text-base font-bold drop-shadow-sm mt-0.5 group-hover:translate-x-0.5 transition-transform">
              {threatNotification.message || t('alerts.criticalAttention')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 text-xs font-bold bg-[rgb(var(--color-surface))]/20 hover:bg-[rgb(var(--color-surface))]/30 px-4 py-2 rounded-full backdrop-blur-md border border-[rgb(var(--color-surface))]/20 shadow-sm transition-all duration-300 group-hover:pr-3 group-hover:gap-3">
            {t('alerts.viewDetails')}
            <span className="group-hover:translate-x-1 transition-transform duration-300">
              &rarr;
            </span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();

              // Add this alert ID to dismissed list
              const newDismissed = [...dismissedAlerts, threatNotification.id];
              setDismissedAlerts(newDismissed);
              localStorage.setItem('dismissedSystemAlerts', JSON.stringify(newDismissed));
            }}
            className="p-1.5 rounded-full bg-black/10 hover:bg-black/20 text-white/90 hover:text-white transition-all duration-200 border border-white/10 backdrop-blur-sm"
            aria-label="Dismiss alert"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
