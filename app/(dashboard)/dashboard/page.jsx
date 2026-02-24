'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import dynamic from 'next/dynamic';
import dealershipService from '@/services/dealershipService';
import userService from '@/services/userService';
import quoteService from '@/services/quoteService';
import auditService from '@/services/auditService';
import analyticsService from '@/services/analyticsService';

const SuperAdminDashboard = dynamic(
  () => import('@/components/views/dashboard/SuperAdminDashboard')
);
const AdminDashboard = dynamic(() => import('@/components/views/dashboard/AdminDashboard'));
const DealerDashboard = dynamic(() => import('@/components/views/dashboard/DealerDashboard'));

export default function DashboardPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalQuotes: 0,
      pendingApprovals: 0,
      totalConversions: 0,
      totalDealerships: 0,
      conversionRate: 0,
      // Admin specific
      quotes: 0,
      pending: 0,
      users: 0,
      dealers: 0,
    },
    recentActivity: [],
  });

  /*
  const fetchData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      let analyticsStats = null;
      let monthlyTrends = [];
      if (user.role === 'super_admin') {
        try {
          // Fetch summary for Super Admin as requested (Graph data not available in summary)
          const analyticsRes = await analyticsService.getAnalyticsSummary();
          analyticsStats = analyticsRes?.data || analyticsRes;
          monthlyTrends = []; // Summary API does not provide trends
        } catch (err) {
          console.warn('Failed to fetch analytics summary', err);
        }
      } else if (user.role === 'admin') {
        try {
          // Fetch scoped summary for Admin
          const analyticsRes = await analyticsService.getAnalyticsSummary();
          analyticsStats = analyticsRes?.data || analyticsRes;
        } catch (err) {
          console.warn('Failed to fetch analytics summary', err);
        }
      }
      console.log('📊 [Dashboard] Analytics Stats:', analyticsStats); // DEBUG: Check what we actually have

      if (user.role === 'super_admin') {
        const [logsResult, usersResult] = await Promise.allSettled([
          auditService.getLoginHistory({ limit: 10 }), // Global login history
          userService.getAllUsers({ limit: 1000 }),
        ]);

        // Helper to extract value or default
        const getValue = (result, def) => (result.status === 'fulfilled' ? result.value : def);

        const securityLogsResult = getValue(logsResult, []);
        const usersResultData = getValue(usersResult, []);

        // Robust extraction for users
        const allUsers = Array.isArray(usersResultData)
          ? usersResultData
          : usersResultData?.users || usersResultData?.data?.users || usersResultData?.data || [];

        // Restore User Map for Logs - Use string IDs for robust lookup

        // Restore User Map for Logs - Use string IDs for robust lookup
        const userMap = allUsers.reduce((acc, u) => {
          if (u.id) acc[String(u.id)] = u;
          return acc;
        }, {});

        // Restore Logs Processing
        let logs = [];
        const logRes = securityLogsResult;
        if (logRes) {
          if (Array.isArray(logRes)) logs = logRes;
          else if (Array.isArray(logRes.logs)) logs = logRes.logs;
          else if (logRes.data && Array.isArray(logRes.data)) logs = logRes.data;
          else if (logRes.data && Array.isArray(logRes.data.logs)) logs = logRes.data.logs;
        }

        if (logs.length === 0) {
          try {
            logs = JSON.parse(localStorage.getItem('audit_logs') || '[]');
          } catch (e) {
            console.warn('Failed to parse local audit logs', e);
            logs = [];
          }
        }
        const sortedLogs = logs
          .sort(
            (a, b) => new Date(b.timestamp || b.created_at) - new Date(a.timestamp || a.created_at)
          )
          .slice(0, 8);

        // Removed unused local calculations for quotes

        const mappedLogs = sortedLogs.map((log) => {
          let displayUser = 'System';
          let userAvatar = log.user_avatar || null;

          const userId = log.user_id || log.userId || log.user?.id;
          const rawName =
            log.user_name || log.userName || log.username || log.full_name || log.name;
          const logEmail = log.email || log.user_email;
          const firstName = log.first_name || log.firstName;
          const lastName = log.last_name || log.lastName;

          if (!userId && !rawName && !logEmail && !firstName) {
            displayUser =
              user.full_name ||
              user.name ||
              (user.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : 'Me');
            userAvatar = user.profile_picture || null;
          }

          if (userId && userMap[String(userId)]) {
            const u = userMap[String(userId)];
            displayUser =
              u.full_name ||
              u.name ||
              `${u.first_name || ''} ${u.last_name || ''}`.trim() ||
              u.username ||
              u.email ||
              'User';
            if (!userAvatar && u.profile_picture) userAvatar = u.profile_picture;
          } else if (firstName) {
            displayUser = `${firstName} ${lastName || ''}`.trim();
          } else if (rawName) {
            displayUser = rawName;
          } else if (logEmail) {
            displayUser = logEmail.split('@')[0];
          }

          let description = 'System activity log entry';
          if (log.description && typeof log.description === 'string') {
            description = log.description;
          } else if (log.message && typeof log.message === 'string') {
            description = log.message;
          } else if (log.details && typeof log.details === 'string') {
            description = log.details;
          } else if (log.description && typeof log.description === 'object') {
            if (log.description.message) {
              description = log.description.message;
            } else if (log.description.details) {
              description = log.description.details;
            } else {
              description = `${log.action || log.event || 'System activity'} performed`;
            }
          } else {
            const actionType = log.action || log.event || '';
            switch (actionType.toUpperCase()) {
              case 'LOGIN_ATTEMPT':
                description = 'Attempted to log into the system';
                break;
              case 'LOGOUT':
                description = 'Logged out of the system';
                break;
              case 'DEALERSHIP_CREATED':
                description = 'Created a new dealership';
                break;
              case 'DEALERSHIP_DELETED':
                description = 'Deleted a dealership';
                break;
              case 'USER_CREATED':
                description = 'Created a new user account';
                break;
              case 'USER_UPDATED':
                description = 'Updated user information';
                break;
              default:
                description = `Performed ${actionType.toLowerCase().replace(/_/g, ' ')} action`;
            }
          }

          // Handle action properly
          let action = 'performed an action';
          if (log.action && typeof log.action === 'string') {
            action = log.action.toLowerCase().replace(/_/g, ' ');
          } else if (log.event && typeof log.event === 'string') {
            action = log.event.toLowerCase().replace(/_/g, ' ');
          }

          return {
            user_name: String(displayUser),
            action: String(action),
            description: String(description),
            timestamp: String(log.timestamp || log.created_at || new Date().toISOString()),
            user_avatar: userAvatar,
          };
        });

        const uniqueActivity = [];
        const seenActivity = new Set();
        [...mappedLogs].forEach((item) => {
          const timeStr = new Date(item.timestamp).toISOString().split('.')[0];
          const key = `${item.user_name}-${item.action}-${timeStr}`;
          if (!seenActivity.has(key)) {
            seenActivity.add(key);
            uniqueActivity.push(item);
          }
        });

        const combinedActivity = uniqueActivity
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          .slice(0, 10);

        const finalActivity = combinedActivity;

        setDashboardData({
          stats: {
            // Use Analytics API data
            totalQuotes: analyticsStats?.total_quotes ?? 0,
            pendingApprovals: analyticsStats?.pending_quotes ?? 0,
            totalConversions: analyticsStats?.accepted_quotes ?? 0,
            conversionRate: analyticsStats?.conversion_rate ?? 0,
            totalRevenue: analyticsStats?.total_revenue ?? 0,
            monthlyGrowth: analyticsStats?.monthly_growth ?? 0,
            rejectedQuotes: analyticsStats?.rejected_quotes ?? 0,
            expiredQuotes: analyticsStats?.expired_quotes ?? 0,
            topDealership: analyticsStats?.top_dealership ?? null,
          },
          recentActivity: finalActivity,
        });
      } else if (user.role === 'admin') {
        try {
          console.log('🔍 [Admin Dashboard] Fetching Admin Analytics for User:', user.id);

          // Fetch Analytics AND Users (for mapping names/avatars)
          const [analyticsRes, usersRes] = await Promise.all([
            analyticsService.getAdminAnalytics({ user_id: user.id }),
            userService.getUsers({ role: 'dealer_manager,support_staff' }),
          ]);

          const adminData = analyticsRes?.data || analyticsRes;
          const usersList = Array.isArray(usersRes)
            ? usersRes
            : usersRes?.users || usersRes?.data || [];

          // Create User Map
          const userMap = usersList.reduce((acc, u) => {
            acc[u.id] = u;
            return acc;
          }, {});
          // Add current user to map
          userMap[user.id] = user;

          console.log('📊 [Admin Dashboard] Analytics Data:', adminData);

          // 1. Filter Users Count (Only dealer_manager + support_staff)
          const relevantRoles = ['dealer_manager', 'support_staff'];
          const filteredUserCount = (adminData.users?.users_by_role || [])
            .filter((r) => relevantRoles.includes(r.role_name))
            .reduce((sum, r) => sum + r.count, 0);

          // 2. Resolve recent activity user details
          const resolvedActivity = (adminData.recent_activity || []).map((item) => {
            const actor = userMap[item.user_id];
            let displayName = 'System';
            let avatar = null;

            if (item.user_id === user.id) {
              displayName =
                user.full_name ||
                (user.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : null) ||
                user.name ||
                'Me';
              avatar = user.profile_picture; // Always use current profile picture for self
            } else if (actor) {
              displayName =
                actor.full_name ||
                actor.name ||
                `${actor.first_name || ''} ${actor.last_name || ''}`.trim() ||
                actor.username;
              avatar = actor.profile_picture;
            }

            return {
              ...item,
              user_name: displayName,
              user_avatar: avatar,
              // Ensure timestamp is compatible
              timestamp: item.created_at || item.timestamp,
            };
          });

          // Ensure defaults to prevent crashes
          const safeStats = {
            quotes: adminData.quotes?.total_quotes || 0,
            revenue: adminData.revenue?.total_revenue || 0,
            users: filteredUserCount, // Use filtered count
            dealers: adminData.dealerships?.active_dealerships || 0,
            // Detailed stats for enhanced dashboard
            support: adminData.support_tickets || {},
            quoteStats: adminData.quotes || {},
            revenueStats: adminData.revenue || {},
            userStats:
              {
                ...adminData.users,
                active_users: filteredUserCount, // Override active_users with our filtered count for display
              } || {},
          };

          setDashboardData({
            stats: safeStats,
            recentActivity: resolvedActivity,
          });
        } catch (err) {
          console.error('Failed to fetch admin dashboard data', err);
          setDashboardData((prev) => ({ ...prev, recentActivity: [] }));
        }
      }
    } catch (error) {
      console.error('Dashboard calculation error', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    let mounted = true;
    if (user && mounted) {
      fetchData();
    }
    return () => {
      mounted = false;
    };
  }, [fetchData, user]);
  */

  // MOCK DATA FOR DESIGN REFERENCE
  useEffect(() => {
    setDashboardData({
      stats: {
        totalQuotes: 1250,
        pendingApprovals: 45,
        totalConversions: 850,
        conversionRate: 68,
        totalRevenue: 1250000,
        monthlyGrowth: 12.5,
        quotes: 1250,
        revenue: 1250000,
        users: 156,
        dealers: 42,
        support: { open_tickets: 5, total_tickets: 120, resolved_tickets: 115 },
        quoteStats: { total_quotes: 1250, monthly_growth: 12.5 },
        revenueStats: { total_revenue: 1250000, revenue_growth: 8.4 },
        userStats: { active_users: 156, total_users: 200 },
      },
      recentActivity: [
        {
          user_name: 'John Doe',
          action: 'created a quote',
          description: 'Quote #1234 generated',
          timestamp: new Date().toISOString(),
        },
        {
          user_name: 'Jane Smith',
          action: 'logged in',
          description: 'System login',
          timestamp: new Date().toISOString(),
        },
      ],
      // Add specific mock data for new charts if needed by AdminDashboard
      salesBySegment: [
        { name: 'Mon', value: 300 },
        { name: 'Tue', value: 450 },
        { name: 'Wed', value: 398 },
        { name: 'Thu', value: 500 },
        { name: 'Fri', value: 420 },
        { name: 'Sat', value: 550 },
        { name: 'Sun', value: 600 },
      ],
      inventoryBySegment: [
        { name: 'Mon', value: 200 },
        { name: 'Tue', value: 250 },
        { name: 'Wed', value: 150 }, // 15% drop shape
        { name: 'Thu', value: 300 },
        { name: 'Fri', value: 280 },
        { name: 'Sat', value: 320 },
        { name: 'Sun', value: 350 },
      ],
    });
    setIsLoading(false);
  }, []);

  if (!user) {
    return <div className="p-8">Please log in to view the dashboard.</div>;
  }

  switch (user.role) {
    case 'super_admin':
      return (
        <SuperAdminDashboard
          stats={dashboardData.stats}
          recentActivity={dashboardData.recentActivity}
          loading={isLoading}
        />
      );
    case 'admin':
      return (
        <AdminDashboard
          stats={dashboardData.stats}
          recentQuotes={dashboardData.recentQuotes}
          recentActivity={dashboardData.recentActivity}
          loading={isLoading}
        />
      );
    case 'dealer_manager':
      return <DealerDashboard />;
    default:
      return (
        <div className="p-8 text-center text-red-500">
          Access Denied: Unknown Role ({user.role})
        </div>
      );
  }
}
