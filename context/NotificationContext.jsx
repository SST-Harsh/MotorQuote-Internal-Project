'use client';
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { usePreference } from './PreferenceContext';
import notificationService from '@/services/notificationService';
import { canViewNotifications } from '@/utils/roleUtils';
import { useQuery } from '@tanstack/react-query';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const { preferences } = usePreference();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const isLoadingRef = React.useRef(false);
  // Stable ref for user — avoids loadNotifications being recreated on every user object mutation
  const userRef = React.useRef(user);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const loadNotifications = useCallback(async (explicitUser = null) => {
    const currentUser = explicitUser || userRef.current;
    if (!currentUser) {
      setIsLoading(false);
      return;
    }

    // Permission check
    if (!canViewNotifications(currentUser)) {
      setNotifications([]);
      setUnreadCount(0);
      setIsLoading(false);
      return;
    }

    if (isLoadingRef.current && !explicitUser) {
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
      // Disable premature count setting from backend to avoid flicker with frontend filtering
      // setUnreadCount(currentUnreadCount);

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

      const userRole = currentUser.role?.toLowerCase() || '';
      const currentUserId = currentUser?.id != null ? currentUser.id.toString() : undefined;

      const filteredNotifications = notificationsList.filter((notification) => {
        // 1. Filter out draft/scheduled notifications
        const status = notification.status || 'active';
        if (status === 'draft') return false;

        const scheduledAt = notification.scheduled_at || notification.scheduledAt;
        // Add 1 minute grace period for client-server clock skew
        if (scheduledAt && new Date(scheduledAt).getTime() > new Date().getTime() + 60000)
          return false;

        // 2. Expiration Check (applies to all)
        const expiresAt = notification.expires_at || notification.expiresAt;
        if (expiresAt && new Date(expiresAt) < new Date()) return false;

        const senderIdRaw =
          notification.created_by ??
          notification.sender_id ??
          notification.senderId ??
          notification.sender?.id ??
          notification.creator_id;
        const senderId = senderIdRaw?.toString();
        const isSentByMe = currentUserId != null && senderId === currentUserId;

        // 3. Targeting Checks
        let isTargeted = false;
        const targetUsers = notification.target_user_ids || notification.targetUserIds || [];
        const isIndividuallyTargeted =
          Array.isArray(targetUsers) &&
          currentUserId != null &&
          targetUsers.some((id) => id?.toString() === currentUserId);

        if (isIndividuallyTargeted) {
          isTargeted = true;
        } else {
          // 4. Role-based / Broadcast targeting

          // a. Temporal filter for new users
          const userCreatedAt = currentUser.created_at || currentUser.createdAt;
          const notificationCreatedAt = notification.created_at || notification.createdAt;
          if (userCreatedAt && notificationCreatedAt) {
            const userCreationTime = new Date(userCreatedAt).getTime();
            const notificationTime = new Date(notificationCreatedAt).getTime();
            if (notificationTime < userCreationTime - 60000) return false;
          }

          // b. Audience/Role Matching
          const targetRoles = notification.target_roles || notification.targetRoles;
          const normalizedUserRole = userRole.toLowerCase().replace(/[_\s]/g, '');

          if (Array.isArray(targetRoles) && targetRoles.length > 0) {
            const normalizedTargetRoles = targetRoles.map((r) =>
              r.toLowerCase().replace(/[_\s]/g, '')
            );
            if (
              normalizedTargetRoles.includes('all') ||
              normalizedTargetRoles.includes(normalizedUserRole)
            ) {
              isTargeted = true;
            } else {
              return false; // Specifically targeted at other roles
            }
          } else {
            const targetAudience = (
              notification.target_audience ||
              notification.targetAudience ||
              ''
            )
              .toLowerCase()
              .replace(/[_\s]/g, '');
            if (targetAudience === 'all' || targetAudience === normalizedUserRole) {
              isTargeted = true;
            }
          }
        }

        // If I sent it, I should see it in my history/control center
        if (isSentByMe) return true;

        if (!isTargeted) return false;

        // 5. Type-based Filtering (Communication Preferences)
        const type = (notification.type || 'info').toLowerCase();
        const quoteEnabled = preferences.quote_notifications !== false;
        const systemEnabled = preferences.system_notifications !== false;
        const pushEnabled = preferences.push_notifications !== false;

        if (!quoteEnabled && (type === 'message' || type === 'status' || type === 'quote'))
          return false;
        if (!systemEnabled && type === 'alert') return false;
        if (!pushEnabled && (type === 'announcement' || type === 'push')) return false;

        return true;
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
  }, []); // Stable — reads user via ref to avoid recreating on every user mutation

  // Heartbeat: Poll unread count every 30 seconds
  const { data: heartbeatData } = useQuery({
    queryKey: ['notifications', 'unread-count', user?.id],
    queryFn: () => notificationService.getUnreadCount(),
    enabled: !!user?.id && canViewNotifications(user),
    refetchInterval: 30000, // 30 seconds
    refetchOnWindowFocus: true,
  });

  const previousCountRef = React.useRef(null);

  useEffect(() => {
    if (!user) return;

    // Initial load
    if (previousCountRef.current === null) {
      loadNotifications();
    }

    const serverCount =
      heartbeatData?.unread_count ??
      heartbeatData?.data?.unread_count ??
      heartbeatData?.unreadCount ??
      heartbeatData?.data?.unreadCount ??
      0;

    // If count has changed, reload the full list
    if (previousCountRef.current !== null && serverCount !== previousCountRef.current) {
      loadNotifications();
    }

    previousCountRef.current = serverCount;
  }, [heartbeatData, user?.id, loadNotifications]); // loadNotifications intentionally omitted if stable, but here we include it for safety if it's not truly stable in some edge cases. Actually it is stable.

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
      loadNotifications,
      refreshNotifications: loadNotifications,
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
      loadNotifications,
      markAsRead,
      markAllAsRead,
      clearAllNotifications,
    ]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export const useNotifications = () => useContext(NotificationContext);
