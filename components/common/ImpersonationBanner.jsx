'use client';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/LanguageContext';
import { AlertTriangle, X, User, Shield } from 'lucide-react';

export default function ImpersonationBanner() {
  const { isImpersonating, impersonationData, exitImpersonation } = useAuth();
  const { t } = useTranslation('common');

  if (!isImpersonating || !impersonationData) {
    return null;
  }

  const { impersonated_user, original_admin } = impersonationData;

  const handleExit = async () => {
    try {
      await exitImpersonation();
    } catch (error) {
      console.error('Failed to exit impersonation:', error);
    }
  };

  return (
    <div className="sticky top-0 z-40 bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg">
      <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
          {/* Left: Warning Icon + Message */}
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 w-full sm:w-auto">
            <div className="flex-shrink-0">
              <AlertTriangle size={20} className="sm:w-6 sm:h-6 animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-xs sm:text-sm">⚠️ {t('impersonation.mode')}</span>
                <span className="hidden sm:inline text-xs opacity-90">•</span>
                <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                  <User size={12} className="sm:w-3.5 sm:h-3.5" />
                  <span className="font-medium truncate">
                    {t('impersonation.viewingAs')} {impersonated_user?.first_name}{' '}
                    {impersonated_user?.last_name}
                  </span>
                  <span className="text-xs opacity-75 truncate hidden md:inline">
                    ({impersonated_user?.email})
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs opacity-90 mt-0.5 sm:mt-1">
                <Shield size={10} className="sm:w-3 sm:h-3" />
                <span className="truncate">
                  {t('impersonation.originalAdmin')} {original_admin?.email}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Exit Button */}
          <button
            onClick={handleExit}
            className="flex-shrink-0 w-full sm:w-auto flex items-center justify-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white text-orange-600 rounded-lg hover:bg-orange-50 transition-colors font-semibold text-xs sm:text-sm shadow-md"
          >
            <X size={14} className="sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">{t('impersonation.exit')}</span>
            <span className="sm:hidden">{t('Exit')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
