'use client';
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import notificationService from '@/services/notificationService';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const isLoadingRef = React.useRef(false);

  const loadNotifications = useCallback(async () => {
    if (!user) return;

    if (isLoadingRef.current) {
      return;
    }

    try {
      isLoadingRef.current = true;
      setIsLoading(true);

      let currentUnreadCount = 0;
      try {
        const countRes = await notificationService.getUnreadCount();
        currentUnreadCount =
          countRes?.unread_count ??
          countRes?.data?.unread_count ??
          countRes?.unreadCount ??
          countRes?.data?.unreadCount ??
          0;
      } catch (error) {
        console.warn('Failed to fetch unread count, using fallback:', error);
        currentUnreadCount = 0;
      }
      setUnreadCount(currentUnreadCount);

      let notificationsList = [];
      try {
        const listRes = await notificationService.getUserNotifications({ limit: 100 });

        if (Array.isArray(listRes)) {
          notificationsList = listRes;
        } else if (listRes?.notifications && Array.isArray(listRes.notifications)) {
          notificationsList = listRes.notifications;
        } else if (listRes?.data?.notifications && Array.isArray(listRes.data.notifications)) {
          notificationsList = listRes.data.notifications;
        } else if (listRes?.data && Array.isArray(listRes.data)) {
          notificationsList = listRes.data;
        } else if (listRes?.success && listRes?.data?.notifications) {
          notificationsList = Array.isArray(listRes.data.notifications)
            ? listRes.data.notifications
            : [];
        }
      } catch (error) {
        console.warn('Failed to fetch notifications, using empty array:', error);
        notificationsList = [];
      }

      const userRole = user.role?.toLowerCase() || '';
      const currentUserId = user?.id != null ? user.id.toString() : undefined;

      const filteredNotifications = notificationsList.filter((notification) => {
        // Filter out draft/scheduled notifications that haven't been sent yet
        const status = notification.status || 'active';
        if (status === 'draft') {
          console.log(`⏰ Skipping draft notification:`, notification.title);
          return false;
        }

        // Also filter out notifications scheduled for the future
        const scheduledAt = notification.scheduled_at || notification.scheduledAt;
        if (scheduledAt) {
          const scheduledTime = new Date(scheduledAt).getTime();
          const currentTime = Date.now();
          if (scheduledTime > currentTime) {
            console.log(
              `⏰ Skipping future scheduled notification (scheduled for ${new Date(scheduledAt).toLocaleString()}):`,
              notification.title
            );
            return false;
          }
        }

        const senderIdRaw =
          notification.created_by ??
          notification.sender_id ??
          notification.senderId ??
          notification.sender?.id ??
          notification.creator_id;
        const senderId = senderIdRaw != null ? senderIdRaw.toString() : undefined;
        const isSentByMe = currentUserId != null && senderId === currentUserId;

        // Targeting Checks
        let isTargeted = false;

        // 1. Individual targeting (highest priority)
        const targetUsers = notification.target_user_ids || notification.targetUserIds || [];
        if (
          Array.isArray(targetUsers) &&
          currentUserId != null &&
          targetUsers.some((id) => id?.toString() === currentUserId)
        ) {
          isTargeted = true;
          console.log('✅ Targeted individually:', notification.title);
        }

        // 2. Role-based targeting (target_roles takes priority over target_audience)
        if (!isTargeted) {
          const targetRoles = notification.target_roles || notification.targetRoles;
          const targetAudience = (notification.target_audience || notification.targetAudience || '')
            .toLowerCase()
            .replace(/[_\s]/g, '');
          const normalizedUserRole = userRole.toLowerCase().replace(/[_\s]/g, '');

          // Check target_roles (HIGHEST PRIORITY)
          if (Array.isArray(targetRoles) && targetRoles.length > 0) {
            const normalizedTargetRoles = targetRoles.map((r) =>
              r.toLowerCase().replace(/[_\s]/g, '')
            );

            // DEBUG: Log role matching
            console.log('🔍 Role Matching Debug:', {
              notificationTitle: notification.title,
              targetRoles: targetRoles,
              normalizedTargetRoles: normalizedTargetRoles,
              targetAudience: notification.target_audience || notification.targetAudience,
              userRole: userRole,
              normalizedUserRole: normalizedUserRole,
            });

            // If target_roles is set, it MUST match (ignore target_audience)
            if (
              normalizedTargetRoles.includes('all') ||
              normalizedTargetRoles.includes(normalizedUserRole)
            ) {
              isTargeted = true;
              console.log(`✅ Role match:`, notification.title);
            } else {
              // target_roles is set but doesn't match - REJECT IMMEDIATELY
              console.log(`❌ Role mismatch - REJECTED:`, notification.title);
              return false; // Explicit early return to filter out this notification
            }
          } else {
            // No target_roles set - fall back to target_audience
            if (targetAudience === 'all' || targetAudience === normalizedUserRole) {
              isTargeted = true;
              console.log(`✅ Audience match (no roles set):`, notification.title);
            }
          }
        }

        // Filter Logic:
        // Hide if I sent it but am NOT a target (prevents cluttering inbox with personal sent items).
        if (isSentByMe && !isTargeted) return false;

        return isTargeted;
      });

      setNotifications(filteredNotifications);

      const actualUnreadCount = filteredNotifications.filter((n) => {
        const isRead =
          n.isRead ||
          n.is_read ||
          (Array.isArray(n.readBy) &&
            currentUserId != null &&
            n.readBy.some((id) => id?.toString() === currentUserId)) ||
          (Array.isArray(n.read_by) &&
            currentUserId != null &&
            n.read_by.some((id) => id?.toString() === currentUserId));

        // Exclude notifications sent by the current user from the unread count
        const senderIdRaw =
          n.created_by ?? n.sender_id ?? n.senderId ?? n.sender?.id ?? n.creator_id;
        const senderId = senderIdRaw != null ? senderIdRaw.toString() : undefined;
        const isSentByMe = currentUserId != null && senderId === currentUserId;

        return !isRead && !isSentByMe;
      }).length;
      setUnreadCount(actualUnreadCount);
    } catch (error) {
      console.error('Failed to load notifications', error);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
    }
  }, [user]);

  const intervalRef = React.useRef(null);

  useEffect(() => {
    if (!user) return;

    loadNotifications();

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      if (user) {
        loadNotifications();
      }
    }, 60000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [user?.id, loadNotifications]);

  const createNotification = (data) => {};

  const markAsRead = useCallback(
    async (id) => {
      try {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === id
              ? { ...n, isRead: true, is_read: true, readAt: new Date().toISOString() }
              : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));

        try {
          await notificationService.markAsRead(id);
        } catch (error) {
          console.warn('Failed to mark as read on server:', error);
        }
      } catch (error) {
        console.error('Failed to mark as read', error);
        loadNotifications();
      }
    },
    [loadNotifications]
  );

  const markAllAsRead = useCallback(async () => {
    try {
      // Define currentUserId in this scope
      const currentUserId = user?.id != null ? user.id.toString() : undefined;

      // Identify all unread notifications before marking them locally
      const unreadItems = notifications.filter((n) => {
        const isRead =
          n.isRead ||
          n.is_read ||
          (Array.isArray(n.readBy) &&
            currentUserId != null &&
            n.readBy.some((id) => id?.toString() === currentUserId)) ||
          (Array.isArray(n.read_by) &&
            currentUserId != null &&
            n.read_by.some((id) => id?.toString() === currentUserId));

        const senderIdRaw =
          n.created_by ?? n.sender_id ?? n.senderId ?? n.sender?.id ?? n.creator_id;
        const senderId = senderIdRaw != null ? senderIdRaw.toString() : undefined;
        const isSentByMe = currentUserId != null && senderId === currentUserId;

        return !isRead && !isSentByMe;
      });

      // Optimistic UI update
      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          isRead: true,
          is_read: true,
          readAt: new Date().toISOString(),
          readBy: n.readBy ? [...new Set([...n.readBy, user?.id])] : [user?.id],
        }))
      );
      setUnreadCount(0);

      try {
        // 1. Primary bulk mark-all-as-read
        const res = await notificationService.markAllAsRead();
        // If API returns an explicit failure, fall back to per-item marking
        if (res && res.success === false) throw new Error('Bulk markAllAsRead indicated failure');
      } catch (error) {
        console.warn('Bulk markAllAsRead failed or indicated partial failure:', error);
        // Fallback: Mark individual unread items to ensure persistence for broadcasts/targeted notifications
        const itemsToMark = unreadItems.slice(0, 50);
        await Promise.allSettled(
          itemsToMark.map((item) => notificationService.markAsRead(item.id))
        );
      }
    } catch (error) {
      console.error('Failed to mark all as read', error);
      loadNotifications();
    }
  }, [notifications, user?.id, loadNotifications]);

  const clearAllNotifications = useCallback(async () => {
    try {
      setNotifications([]);
      setUnreadCount(0);
      try {
        await notificationService.markAllAsRead();
      } catch (error) {
        console.warn('Backend mark all as read failed:', error);
      }
    } catch (error) {
      console.error('Failed to clear notifications', error);
    }
  }, []);

  const normalizedNotifications = useMemo(() => {
    const currentUserId = user?.id != null ? user.id.toString() : undefined;

    return notifications.map((n) => {
      const isRead =
        n.isRead ||
        n.is_read ||
        (Array.isArray(n.readBy) &&
          currentUserId != null &&
          n.readBy.some((id) => id?.toString() === currentUserId)) ||
        (Array.isArray(n.read_by) &&
          currentUserId != null &&
          n.read_by.some((id) => id?.toString() === currentUserId));

      return {
        ...n,
        isRead: isRead,
        is_read: isRead,
        readBy: n.readBy || n.read_by || (isRead ? [user?.id] : []),
        type: n.type || 'info',
      };
    });
  }, [notifications, user?.id]);

  const value = useMemo(
    () => ({
      notifications: normalizedNotifications,
      userNotifications: normalizedNotifications,
      unreadCount,
      isLoading,
      createNotification,
      updateNotification: () => {},
      markAsRead,
      markAllAsRead,
      clearAllNotifications,
      deleteNotification: () => {},
    }),
    [
      normalizedNotifications,
      unreadCount,
      isLoading,
      markAsRead,
      markAllAsRead,
      clearAllNotifications,
    ]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export const useNotifications = () => useContext(NotificationContext);
