import React from 'react';
import Image from 'next/image';
import { useTranslation, useLanguage } from '@/context/LanguageContext';
import { formatTime, translateUserRole, translateUserName } from '@/utils/i18n';
import {
  LogIn,
  LogOut,
  FilePlus,
  FileEdit,
  CheckCircle,
  XCircle,
  RefreshCcw,
  Layout,
  UserPlus,
  Trash2,
  Building,
  Activity,
  History,
} from 'lucide-react';

const AVATAR_GRADIENTS = [
  'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-violet-500 to-purple-600',
  'from-orange-500 to-red-600',
  'from-pink-500 to-rose-600',
  'from-cyan-500 to-blue-600',
];

const getAvatarGradient = (name = 'A') => {
  const charCode = name.charCodeAt(0);
  return AVATAR_GRADIENTS[charCode % AVATAR_GRADIENTS.length];
};

const getActivityConfig = (action = '', description = '') => {
  const act = String(action).toLowerCase();
  const desc = String(description).toLowerCase();

  if (act.includes('login') || desc.includes('login'))
    return {
      border: 'border-l-blue-500',
      icon: LogIn,
      color: 'text-blue-500',
      bg: 'bg-blue-50/50',
    };
  if (act.includes('logout') || desc.includes('logout'))
    return {
      border: 'border-l-gray-400',
      icon: LogOut,
      color: 'text-gray-500',
      bg: 'bg-gray-50/50',
    };
  if (act.includes('create dealership') || desc.includes('new dealership'))
    return {
      border: 'border-l-emerald-500',
      icon: Building,
      color: 'text-emerald-500',
      bg: 'bg-emerald-50/50',
    };
  if (act.includes('create') || act.includes('add'))
    return {
      border: 'border-l-emerald-500',
      icon: UserPlus,
      color: 'text-emerald-500',
      bg: 'bg-emerald-50/50',
    };
  if (act.includes('delete') || act.includes('remove'))
    return { border: 'border-l-red-500', icon: Trash2, color: 'text-red-500', bg: 'bg-red-50/50' };
  if (act.includes('update') || act.includes('edit'))
    return {
      border: 'border-l-orange-500',
      icon: FileEdit,
      color: 'text-orange-500',
      bg: 'bg-orange-50/50',
    };
  if (act.includes('approve'))
    return {
      border: 'border-l-purple-500',
      icon: CheckCircle,
      color: 'text-purple-500',
      bg: 'bg-purple-50/50',
    };
  if (act.includes('reject'))
    return { border: 'border-l-red-600', icon: XCircle, color: 'text-red-600', bg: 'bg-red-50/50' };
  if (act.includes('status'))
    return {
      border: 'border-l-cyan-500',
      icon: RefreshCcw,
      color: 'text-cyan-500',
      bg: 'bg-cyan-50/50',
    };
  if (act.includes('quote'))
    return {
      border: 'border-l-blue-600',
      icon: FilePlus,
      color: 'text-blue-600',
      bg: 'bg-blue-50/50',
    };

  return {
    border: 'border-l-[rgb(var(--color-primary))]',
    icon: Activity,
    color: 'text-[rgb(var(--color-primary))]',
    bg: 'bg-[rgb(var(--color-primary)/0.03)]',
  };
};

const translateActivityDescription = (description, t) => {
  if (!description) return t('activity.performedAction');
  const desc = String(description).toLowerCase();

  if (desc.includes('attempted to log into the system') || desc.includes('login'))
    return t('activity.loginAttempt');
  if (desc.includes('logged out') || desc.includes('logout')) return t('activity.loggedOut');
  if (desc.includes('created a new dealership')) return t('activity.dealershipCreated');
  if (desc.includes('deleted a dealership')) return t('activity.dealershipDeleted');
  if (desc.includes('created a new user account')) return t('activity.userCreated');
  if (desc.includes('updated user information')) return t('activity.userUpdated');
  if (
    desc.includes('created') ||
    desc.includes('new quote') ||
    desc.includes('submitted a new quote request')
  )
    return t('activity.newQuote');
  if (desc.includes('updated') || desc.includes('quote updated')) return t('activity.quoteUpdated');
  if (desc.includes('approved') || desc.includes('quote approved'))
    return t('activity.quoteApproved');
  if (desc.includes('rejected') || desc.includes('quote rejected'))
    return t('activity.quoteRejected');
  if (desc.includes('status changed')) return t('activity.statusChanged');

  return description;
};

const ActivityTimeline = ({ activities = [] }) => {
  const { t: tDashboard, locale } = useTranslation('dashboard');
  const { t: tCommon } = useLanguage();
  const isRTL = locale === 'ar';

  const sanitizeDescription = (desc, action, actionLabel) => {
    if (!desc) return null;
    const str = String(desc).trim();

    if (str.startsWith('{') && str.endsWith('}')) return null;

    const lowDesc = str.toLowerCase();
    if (lowDesc === String(action).toLowerCase()) return null;
    if (actionLabel && lowDesc === String(actionLabel).toLowerCase()) return null;

    const genericMessages = [
      'attempted to log into the system',
      'logged into the system',
      'system activity log entry',
      'performed an action',
      'logged in',
    ];
    if (genericMessages.some((m) => lowDesc.includes(m))) return null;

    return str;
  };

  return (
    <div className="space-y-4">
      {activities.length > 0 ? (
        activities.slice(0, 5).map((activity, idx) => {
          const config = getActivityConfig(activity.action, activity.description);
          const Icon = config.icon;

          // Translate both action and description
          const actionLabel = translateActivityDescription(activity.action, tDashboard);
          const rawDesc =
            activity.description && activity.description !== activity.action
              ? activity.description
              : null;
          const detailedDesc = sanitizeDescription(rawDesc, activity.action, actionLabel);

          const translatedName = translateUserName(
            activity.user_name || activity.user || 'Admin',
            tCommon
          );
          const gradient = getAvatarGradient(translatedName);
          const borderPosition = isRTL ? 'border-r-4' : 'border-l-4';
          const rtlBorderClass = config.border.replace('border-l-', 'border-r-');

          return (
            <div
              key={idx}
              className={`group relative flex items-center gap-4 p-4 rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] hover:shadow-md transition-all duration-300 ${isRTL ? rtlBorderClass : config.border} ${borderPosition} overflow-hidden`}
            >
              {/* Decorative Background Glow */}
              <div
                className={`absolute inset-0 ${config.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
              />

              <div className="relative flex-shrink-0">
                {activity.user_avatar ? (
                  <div className="w-12 h-12 rounded-full border-2 border-[rgb(var(--color-border))] overflow-hidden shadow-sm">
                    <Image
                      src={activity.user_avatar}
                      alt=""
                      width={48}
                      height={48}
                      className="object-cover w-full h-full"
                    />
                  </div>
                ) : (
                  <div
                    className={`w-12 h-12 rounded-full bg-gradient-to-br ${gradient} text-white flex items-center justify-center text-lg font-bold shadow-md border-2 border-white/20`}
                  >
                    {String(translatedName).charAt(0)}
                  </div>
                )}
                <div
                  className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-white shadow-sm flex items-center justify-center ${config.color} border border-[rgb(var(--color-border))]`}
                >
                  <Icon size={12} strokeWidth={2.5} />
                </div>
              </div>

              <div className="relative flex-1 min-w-0">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 truncate">
                    <p className="text-[13px] font-bold text-[rgb(var(--color-text))] truncate">
                      {translatedName}
                    </p>
                    <p className="text-[11px] font-semibold text-[rgb(var(--color-primary))] mt-0.5">
                      {actionLabel}
                    </p>
                  </div>
                  <span className="text-[10px] font-medium text-[rgb(var(--color-text-muted))] whitespace-nowrap bg-[rgb(var(--color-background))] px-2 py-0.5 rounded-full border border-[rgb(var(--color-border))]">
                    {activity.timestamp
                      ? formatTime(new Date(activity.timestamp))
                      : tDashboard('systemStatus.justNow')}
                  </span>
                </div>
                {detailedDesc && (
                  <p className="text-[11px] text-[rgb(var(--color-text-muted))] mt-1 leading-relaxed group-hover:text-[rgb(var(--color-text))] transition-colors duration-300 italic opacity-80">
                    {detailedDesc}
                  </p>
                )}
              </div>
            </div>
          );
        })
      ) : (
        <div className="p-8 text-center flex flex-col items-center justify-center text-[rgb(var(--color-text-muted))] bg-[rgb(var(--color-background))/0.3] rounded-xl border border-dashed border-[rgb(var(--color-border))]">
          <History size={32} className="mb-3 opacity-20" />
          <p className="text-xs font-medium">{tDashboard('noActivity')}</p>
        </div>
      )}
    </div>
  );
};

export default ActivityTimeline;
