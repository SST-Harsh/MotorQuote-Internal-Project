'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check, Trash2 } from 'lucide-react';
import { useNotifications } from '@/context/NotificationContext';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/LanguageContext';

export default function NotificationCenter() {
  const { user } = useAuth();
  const { t } = useTranslation('common');
  const { unreadCount, userNotifications, markAsRead, markAllAsRead, clearAllNotifications } =
    useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isMarkingRead, setIsMarkingRead] = useState(false);
  const dropdownRef = useRef(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const handleClear = async (e) => {
    e.stopPropagation();
    setIsClearing(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      clearAllNotifications();
    } catch (error) {
      console.error('Error clearing notifications:', error);
    } finally {
      setTimeout(() => setIsClearing(false), 100);
    }
  };

  const handleMarkAllRead = async (e) => {
    e.stopPropagation();
    setIsMarkingRead(true);
    try {
      await markAllAsRead();
    } catch (error) {
      console.error('Error marking all as read:', error);
    } finally {
      setTimeout(() => setIsMarkingRead(false), 500);
    }
  };

  const getRelativeTime = (date) => {
    const now = new Date();
    const past = new Date(date);
    const diffInSeconds = Math.floor((now - past) / 1000);

    if (diffInSeconds < 60) return t('notifications.justNow');
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}${t('time.m')}`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}${t('time.h')}`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}${t('time.d')}`;
    return past.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const hasImportantError = userNotifications.some((n) => {
    const isRead =
      n.isRead ||
      n.is_read ||
      (Array.isArray(n.readBy) && n.readBy.some((id) => id?.toString() === user?.id?.toString())) ||
      (Array.isArray(n.read_by) && n.read_by.some((id) => id?.toString() === user?.id?.toString()));
    return n.type === 'error' && !isRead;
  });

  const displayedNotifications = userNotifications.filter((n) => {
    const isRead =
      n.isRead ||
      n.is_read ||
      (Array.isArray(n.readBy) &&
        user?.id != null &&
        n.readBy.some((id) => id?.toString() === user.id.toString())) ||
      (Array.isArray(n.read_by) &&
        user?.id != null &&
        n.read_by.some((id) => id?.toString() === user.id.toString()));

    const senderIdRaw = n.created_by ?? n.sender_id ?? n.senderId ?? n.sender?.id ?? n.creator_id;
    const senderId = senderIdRaw != null ? senderIdRaw.toString() : undefined;
    const isSentByMe = user?.id != null && senderId === user.id.toString();

    return !isRead && !isSentByMe;
  });
  const hasUnread = displayedNotifications.length > 0;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative h-9 w-9 md:h-10 md:w-10 flex items-center justify-center rounded-lg text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-background))] hover:text-[rgb(var(--color-primary))] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))] focus:ring-opacity-50"
        aria-label="Notifications"
        data-testid="notification-bell-button"
      >
        <Bell
          size={20}
          className={`transition-all duration-300 ${
            hasImportantError
              ? 'animate-pulse text-red-500'
              : isOpen
                ? 'text-[rgb(var(--color-primary))]'
                : ''
          }`}
        />
        {unreadCount > 0 && (
          <div className="absolute top-2 end-2 flex items-center justify-center">
            <span
              className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${
                hasImportantError ? 'bg-red-400' : 'bg-[rgb(var(--color-error))]'
              }`}
            ></span>
            <span
              className={`relative flex items-center justify-center min-w-[18px] h-[18px] text-[10px] font-bold rounded-full border-2 border-[rgb(var(--color-surface))] ${
                hasImportantError
                  ? 'bg-red-600 text-white'
                  : 'bg-[rgb(var(--color-error))] text-white'
              } transition-all duration-200`}
              data-testid="notification-unread-badge"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </div>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed top-[72px] end-4 w-[calc(100vw-2rem)] max-w-sm sm:absolute sm:top-12 sm:end-0 sm:w-96 bg-[rgb(var(--color-surface))]/90 dark:bg-[rgb(var(--color-surface))]/95 backdrop-blur-xl border border-[rgb(var(--color-border))]/50 rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25)] z-[9999] overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300 ring-1 ring-black/5"
            style={{ maxHeight: 'calc(100vh - 120px)' }}
            data-testid="notification-dropdown"
          >
            {/* Header Section */}
            <div className="p-4 border-b border-[rgb(var(--color-border))]/50 bg-[rgb(var(--color-surface))]/50 flex items-center justify-between backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm text-[rgb(var(--color-text))] flex items-center gap-2 uppercase tracking-wide">
                  <Bell
                    size={16}
                    className="text-[rgb(var(--color-primary))] fill-[rgb(var(--color-primary))]/20"
                  />
                  {t('notifications.title')}
                </h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-100 text-indigo-600 rounded-full shadow-sm">
                    {unreadCount} {t('notifications.new')}
                  </span>
                )}
              </div>

              {/* Actions - Only visible if has unread */}
              {hasUnread && (
                <div className="flex gap-1">
                  <button
                    onClick={handleMarkAllRead}
                    disabled={isMarkingRead}
                    title={t('notifications.markAllRead')}
                    className="p-1.5 text-[rgb(var(--color-primary))] hover:bg-[rgb(var(--color-primary))]/10 rounded-lg transition-all duration-200 disabled:opacity-50"
                    data-testid="mark-all-read-button"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    onClick={handleClear}
                    disabled={isClearing}
                    title={t('notifications.clearAll')}
                    className="p-1.5 text-[rgb(var(--color-text-muted))] hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200 disabled:opacity-50"
                    data-testid="clear-all-button"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>

            {/* Notifications List */}
            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
              {!hasUnread ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-[rgb(var(--color-primary))]/10 to-[rgb(var(--color-primary))]/5 flex items-center justify-center">
                    <Bell size={28} className="text-[rgb(var(--color-primary))]/50" />
                  </div>
                  <p className="text-sm font-medium text-[rgb(var(--color-text))] mb-1">
                    {t('notifications.allCaughtUp')}
                  </p>
                  <p className="text-xs text-[rgb(var(--color-text-muted))]">
                    {t('notifications.noNew')}
                  </p>
                </div>
              ) : (
                <div
                  className={`transition-all duration-300 ease-out ${
                    isClearing
                      ? 'opacity-0 scale-95 translate-x-4'
                      : 'opacity-100 scale-100 translate-x-0'
                  }`}
                >
                  {displayedNotifications.map((notif, index) => {
                    const isUnread = true; // By definition these are unread

                    const typeColors = {
                      error: 'bg-red-500',
                      warning: 'bg-yellow-500',
                      success: 'bg-green-500',
                      info: 'bg-blue-500',
                      default: 'bg-[rgb(var(--color-primary))]',
                    };
                    const indicatorColor = typeColors[notif.type] || typeColors.default;

                    return (
                      <div
                        key={notif.id}
                        onClick={() => markAsRead(notif.id)}
                        className={`group relative p-4 border-b border-[rgb(var(--color-border))]/50 last:border-0 hover:bg-[rgb(var(--color-surface))]/80 transition-all duration-200 cursor-pointer ${
                          isUnread ? 'bg-[rgb(var(--color-primary))]/5' : ''
                        }`}
                        style={{ animationDelay: `${index * 30}ms` }}
                        data-testid={`notification-item-${notif.id}`}
                      >
                        {/* Unread Indicator */}
                        {isUnread && (
                          <div
                            className={`absolute start-0 top-3 bottom-3 w-1 ${indicatorColor} rounded-e-full shadow-[0_0_8px_rgba(var(--color-primary-rgb),0.5)]`}
                          />
                        )}

                        <div className="flex items-start gap-4 mx-1">
                          {/* Icon */}
                          <div
                            className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center shadow-sm ${
                              isUnread
                                ? 'bg-[rgb(var(--color-surface))] shadow-md border border-[rgb(var(--color-border))]'
                                : 'bg-[rgb(var(--color-background))]'
                            }`}
                          >
                            <div
                              className={`w-2 h-2 rounded-full ${
                                isUnread ? indicatorColor : 'bg-[rgb(var(--color-text-muted))]'
                              }`}
                            />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0 pt-0.5">
                            <div className="flex items-start justify-between gap-2 mb-0.5">
                              <span
                                className={`text-sm leading-snug ${
                                  isUnread
                                    ? 'font-bold text-[rgb(var(--color-text))]'
                                    : 'font-medium text-[rgb(var(--color-text-muted))]'
                                }`}
                              >
                                {notif.title}
                              </span>
                              <span className="text-[10px] text-[rgb(var(--color-text-muted))] font-medium whitespace-nowrap flex-shrink-0 bg-[rgb(var(--color-background))] px-1.5 py-0.5 rounded">
                                {getRelativeTime(notif.created_at || notif.createdAt)}
                              </span>
                            </div>
                            <p
                              className={`text-xs leading-relaxed line-clamp-2 ${
                                isUnread
                                  ? 'text-[rgb(var(--color-text))] font-medium'
                                  : 'text-[rgb(var(--color-text-muted))]'
                              }`}
                            >
                              {notif.message}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
