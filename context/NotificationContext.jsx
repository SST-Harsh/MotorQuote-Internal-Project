"use client";
import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // --- LOAD NOTIFICATIONS ---
    useEffect(() => {
        const loadNotifications = () => {
            try {
                // Basic Mock Data if empty, just to demonstrate
                const stored = localStorage.getItem('notifications_data');
                if (stored) {
                    setNotifications(JSON.parse(stored));
                } else {
                    const initial = [
                        {
                            id: 'n-1',
                            title: 'System Welcome',
                            message: 'Welcome to the new MotorQuote Dashboard!',
                            type: 'info',
                            targetRole: 'all',
                            createdAt: new Date().toISOString(),
                            readBy: []
                        }
                    ];
                    setNotifications(initial);
                    localStorage.setItem('notifications_data', JSON.stringify(initial));
                }
            } catch (error) {
                console.error("Failed to load notifications", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadNotifications();

        // Optional: Poll every few seconds to sync across tabs/windows
        const interval = setInterval(loadNotifications, 5000);
        return () => clearInterval(interval);
    }, []); // Run once on mount

    const createNotification = ({ title, message, type = 'info', targetRole = 'all', targetUserId = null, scheduledAt = null }) => {
        const newNotif = {
            id: `notif-${Date.now()}`,
            title,
            message,
            type,
            targetRole,
            targetUserId: targetUserId,
            scheduledAt,
            createdAt: new Date().toISOString(),
            creatorId: user?.id,
            creatorRole: user?.role,
            readBy: [],
            clearedBy: []
        };

        const updated = [newNotif, ...notifications];
        setNotifications(updated);
        localStorage.setItem('notifications_data', JSON.stringify(updated));
    };

    const markAsRead = (id) => {
        if (!user) return;

        const updated = notifications.map(n => {
            if (n.id === id) {
                if (!n.readBy.includes(user.id)) {
                    return { ...n, readBy: [...n.readBy, user.id] };
                }
            }
            return n;
        });

        setNotifications(updated);
        localStorage.setItem('notifications_data', JSON.stringify(updated));
    };

    const markAllAsRead = () => {
        if (!user) return;
        const now = new Date();
        const updated = notifications.map(n => {
            if (n.scheduledAt && new Date(n.scheduledAt) > now) return n;

            const isRelevant =
                (n.targetRole === 'all') ||
                (n.targetRole === user.role) ||
                (n.targetUserId === user.id);

            if (isRelevant && !n.readBy.includes(user.id)) {
                return { ...n, readBy: [...n.readBy, user.id] };
            }
            return n;
        });
        setNotifications(updated);
        localStorage.setItem('notifications_data', JSON.stringify(updated));
    };

    const clearAllNotifications = () => {
        if (!user) return;
        const updated = notifications.map(n => {
            const isRelevant =
                (n.targetRole === 'all') ||
                (n.targetRole === user.role) ||
                (n.targetUserId === user.id);

            if (isRelevant) {
                const alreadyCleared = n.clearedBy || [];
                if (!alreadyCleared.includes(user.id)) {
                    return { ...n, clearedBy: [...alreadyCleared, user.id] };
                }
            }
            return n;
        });
        setNotifications(updated);
        localStorage.setItem('notifications_data', JSON.stringify(updated));
    };

    const deleteNotification = (id) => {
        const updated = notifications.filter(n => n.id !== id);
        setNotifications(updated);
        localStorage.setItem('notifications_data', JSON.stringify(updated));
    };

    const updateNotification = (id, updatedData) => {
        const updated = notifications.map(n => {
            if (n.id === id) {
                return { ...n, ...updatedData };
            }
            return n;
        });
        setNotifications(updated);
        localStorage.setItem('notifications_data', JSON.stringify(updated));
    };

    // --- FILTER FOR CURRENT USER ---
    const userNotifications = notifications.filter(n => {
        if (!user) return false;

        if (n.scheduledAt && new Date(n.scheduledAt) > new Date()) return false;

        if (n.clearedBy && n.clearedBy.includes(user.id)) return false;

        
        if (n.creatorId === user.id) return true;   
        if (n.targetUserId && n.targetUserId === user.id) return true;
        if (n.targetRole === 'all') return true;
        if (n.targetRole === user.role?.toLowerCase()) return true;

        
        if (user.role?.toLowerCase() === 'super_admin' && n.targetRole) return true;

        return false;
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const unreadCount = userNotifications.filter(n => user && !n.readBy.includes(user.id)).length;

    return (
        <NotificationContext.Provider value={{
            notifications,
            userNotifications,
            unreadCount,
            isLoading,
            createNotification,
            updateNotification,
            markAsRead,
            markAllAsRead,
            clearAllNotifications,
            deleteNotification
        }}>
            {children}
        </NotificationContext.Provider>
    );
}

export const useNotifications = () => useContext(NotificationContext);
