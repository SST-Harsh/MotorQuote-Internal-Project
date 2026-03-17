import React from 'react';
import Image from 'next/image';
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
  MessageSquare,
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

const getActivityConfig = (action = '', description = '', new_status = '') => {
  const act = String(action).toLowerCase();
  const desc = String(description).toLowerCase();
  const status = String(new_status || '').toLowerCase();

  // Prioritize status-based coloring if it's a status change
  if (status) {
    if (status === 'approved' || status === 'accepted')
      return {
        border: 'border-l-emerald-500',
        icon: CheckCircle,
        color: 'text-emerald-500',
        bg: 'bg-emerald-50/50',
      };
    if (status === 'rejected' || status === 'declined')
      return {
        border: 'border-l-red-500',
        icon: XCircle,
        color: 'text-red-500',
        bg: 'bg-red-50/50',
      };
    if (status === 'pending' || status === 'waiting')
      return {
        border: 'border-l-amber-500',
        icon: RefreshCcw,
        color: 'text-amber-500',
        bg: 'bg-amber-50/50',
      };
  }

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
  if (act.includes('ticket') || desc.includes('ticket'))
    return {
      border: 'border-l-indigo-500',
      icon: MessageSquare,
      color: 'text-indigo-500',
      bg: 'bg-indigo-50/50',
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
      border: 'border-l-emerald-500',
      icon: CheckCircle,
      color: 'text-emerald-500',
      bg: 'bg-emerald-50/50',
    };
  if (act.includes('reject'))
    return { border: 'border-l-red-500', icon: XCircle, color: 'text-red-500', bg: 'bg-red-50/50' };
  if (act.includes('status') || act.includes('change'))
    return {
      border: 'border-l-blue-400',
      icon: RefreshCcw,
      color: 'text-blue-400',
      bg: 'bg-blue-50/50',
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

const translateActivityDescription = (action) => {
  if (!action) return 'Performed an action';
  const desc = String(action).toLowerCase();

  if (desc.includes('attempted to log into the system') || desc.includes('login'))
    return 'Login Attempt';
  if (desc.includes('logged out') || desc.includes('logout')) return 'Logged Out';
  if (desc.includes('created a new dealership')) return 'Dealership Created';
  if (desc.includes('deleted a dealership')) return 'Dealership Deleted';
  if (desc.includes('created a new user account')) return 'User Created';
  if (desc.includes('updated user information')) return 'User Updated';
  if (desc.includes('ticket')) return 'Ticket Created';
  if (
    desc.includes('created') ||
    desc.includes('new quote') ||
    desc.includes('submitted a new quote request')
  )
    return 'New Quote';
  if (desc.includes('updated') || desc.includes('quote updated')) return 'Quote Updated';
  if (desc.includes('approved') || desc.includes('quote approved')) return 'Quote Approved';
  if (desc.includes('rejected') || desc.includes('quote rejected')) return 'Quote Rejected';
  if (desc.includes('status changed') || desc.includes('status_changed')) return 'Status Changed';

  return action;
};

const ActivityTimeline = ({ activities = [] }) => {
  const isRTL = false; // Hardcoded to false as we are standardizing on English

  const sanitizeDescription = (desc, action, actionLabel) => {
    if (!desc) return null;

    // If desc is an object, try to extract a string or return null to avoid [object Object]
    if (typeof desc === 'object') {
      if (desc.message && typeof desc.message === 'string') return desc.message;
      if (desc.details && typeof desc.details === 'string') return desc.details;
      return null;
    }

    const str = String(desc).trim();

    // Avoid JSON strings
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
          // Ensure description is a string before passing to config and sanitization
          const processedDescription =
            typeof activity.description === 'string'
              ? activity.description
              : typeof activity.details === 'string'
                ? activity.details
                : activity.metadata?.message || '';

          const config = getActivityConfig(
            activity.action,
            processedDescription,
            activity.new_status
          );
          const Icon = config.icon;

          // Translate both action and description
          const actionLabel = translateActivityDescription(activity.action);
          const rawDesc =
            processedDescription && processedDescription !== activity.action
              ? processedDescription
              : null;
          const detailedDesc = sanitizeDescription(rawDesc, activity.action, actionLabel);

          const translatedName = activity.user_name || activity.user || 'Admin';
          const rawRole =
            activity.user_role ||
            activity.userRole ||
            activity.role ||
            activity.role_name ||
            activity.roleName;
          const translatedRole = rawRole || '';
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
                    {String(translatedName).charAt(0).toUpperCase()}
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
                    <div className="flex items-center gap-2 min-w-0">
                      <p className="text-[13px] font-bold text-[rgb(var(--color-text))] truncate">
                        {translatedName}
                      </p>
                      {translatedRole ? (
                        <span className="text-[10px] font-bold text-[rgb(var(--color-text-muted))] bg-[rgb(var(--color-background))] px-2 py-0.5 rounded-full border border-[rgb(var(--color-border))] whitespace-nowrap">
                          {translatedRole}
                        </span>
                      ) : null}
                    </div>
                    <p className="text-[11px] font-semibold text-[rgb(var(--color-primary))] mt-0.5">
                      {actionLabel}{' '}
                      {activity.new_status ? (
                        <span className="text-[rgb(var(--color-text-muted))] ml-1">
                          to{' '}
                          <span className={`${config.color} font-bold uppercase`}>
                            {activity.new_status}
                          </span>
                        </span>
                      ) : null}
                    </p>
                  </div>
                  <span className="text-[10px] font-medium text-[rgb(var(--color-text-muted))] whitespace-nowrap bg-[rgb(var(--color-background))] px-2 py-0.5 rounded-full border border-[rgb(var(--color-border))]">
                    {activity.timestamp
                      ? new Date(activity.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Just Now'}
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
          <p className="text-xs font-medium">No activity recorded yet</p>
        </div>
      )}
    </div>
  );
};

export default ActivityTimeline;
