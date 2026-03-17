/**
 * Permission Utilities
 * Normalize and check permissions coming from backend/user objects.
 */

const normalizePermissionToken = (token) => {
  if (!token) return null;
  const str = String(token).trim();
  if (!str) return null;
  return str.toLowerCase();
};

const extractPermissionTokens = (perm) => {
  if (!perm) return [];
  if (typeof perm === 'string' || typeof perm === 'number') return [perm];
  if (typeof perm !== 'object') return [];

  return [
    perm.code,
    perm.name,
    perm.label,
    perm.value,
    perm.key,
    perm.slug,
    perm.id,
    perm.permission_code,
    perm.permission_name,
  ].filter(Boolean);
};

export const getUserPermissionSet = (user) => {
  const rawSources = [
    user?.permissions,
    user?.user_permissions,
    user?.userPermissions,
    user?.role?.permissions,
    user?.roleDetails?.permissions,
  ];

  const tokens = new Set();
  rawSources
    .filter(Array.isArray)
    .flat()
    .forEach((perm) => {
      extractPermissionTokens(perm).forEach((t) => {
        const normalized = normalizePermissionToken(t);
        if (normalized) tokens.add(normalized);
      });
    });

  return tokens;
};

import { normalizeRole } from './roleCommon';

/**
 * Robust check for a specific permission code.
 * @param {Object} user - User object
 * @param {string} permissionCode - Code to check (e.g. 'users.delete')
 * @returns {boolean}
 */
export const hasPermission = (user, permissionCode) => {
  if (!user) return false;

  const role = normalizeRole(user.role);
  if (role === 'super_admin') return true;

  const perms = getUserPermissionSet(user);
  if (perms.size === 0) return false;

  const normalizedCode = permissionCode.toLowerCase();
  return perms.has(normalizedCode);
};

export const canExportReports = (user) => {
  const role = normalizeRole(user?.role);

  // High-level roles bypass detailed checks
  if (role === 'super_admin') return true;

  const perms = getUserPermissionSet(user);
  if (perms.size === 0) return false;

  const allowList = [
    'reports.export',
    'reports.export_all',
    'reports.export_analytics',
    'analytics.export',
    'analytics.export_data',
    'export.reports',
    'reports.all',
    'analytics.all',
    'export',
    'download_reports',
  ];
  if (allowList.some((p) => perms.has(p))) return true;

  // Fallback for servers that return human-readable names like "Export Reports" or specific dot notations
  for (const p of perms) {
    const looksLikeExport =
      p.includes('export') || p.includes('download') || p.includes('csv') || p.includes('excel');
    const looksLikeReports =
      p.includes('report') ||
      p.includes('reports') ||
      p.includes('analytics') ||
      p.includes('data');

    if (looksLikeExport && looksLikeReports) return true;

    // Common dot-notation patterns or variants
    if (/^(reports|analytics|export|data)\.(export|download|all|reports)(\.|$)/.test(p))
      return true;
    if (/^export_(reports|analytics|data)$/.test(p)) return true;
  }

  return false;
};

// --- Quotes ---
export const canCreateQuote = (user) => {
  return hasPermission(user, 'quotes.create') || hasPermission(user, 'quote.create');
};

export const canViewQuote = (user) => {
  return hasPermission(user, 'quotes.view') || hasPermission(user, 'quote.view');
};

export const canEditQuote = (user) => {
  return (
    hasPermission(user, 'quotes.update') ||
    hasPermission(user, 'quotes.edit') ||
    hasPermission(user, 'quote.update') ||
    hasPermission(user, 'quote.edit') ||
    hasPermission(user, 'quotes.manage')
  );
};

export const canOverrideQuote = (user) => {
  return hasPermission(user, 'quotes.override') || hasPermission(user, 'quotes.manage');
};

// --- Dealerships ---
export const canCreateDealership = (user) => {
  return hasPermission(user, 'dealership.create') || hasPermission(user, 'dealerships.create');
};

export const canViewDealership = (user) => {
  return hasPermission(user, 'dealership.view') || hasPermission(user, 'dealerships.view');
};

export const canEditDealership = (user) => {
  return (
    hasPermission(user, 'dealership.update') ||
    hasPermission(user, 'dealership.edit') ||
    hasPermission(user, 'dealerships.update') ||
    hasPermission(user, 'dealerships.edit')
  );
};

export const canAssignDealer = (user) => {
  return hasPermission(user, 'dealership.assign');
};

// --- Notifications ---
export const canViewNotifications = (user) => {
  // Support staff, dealer roles and users with permission can view notifications
  const role = user?.role;
  if (
    role === 'support_staff' ||
    role === 'dealer_manager' ||
    role === 'dealer' ||
    role === 'staff'
  ) {
    return true;
  }
  return hasPermission(user, 'notifications.view') || hasPermission(user, 'notification.view');
};

export const canCreateNotifications = (user) => {
  return hasPermission(user, 'notifications.create') || hasPermission(user, 'notification.create');
};

export const canBroadcastNotifications = (user) => {
  return hasPermission(user, 'notifications.broadcast');
};

// --- Users ---
export const canViewUsers = (user) => {
  return (
    hasPermission(user, 'users.view') ||
    hasPermission(user, 'users.read') ||
    hasPermission(user, 'user.view') ||
    hasPermission(user, 'user.read')
  );
};

export const canCreateUsers = (user) => {
  return hasPermission(user, 'users.create') || hasPermission(user, 'user.create');
};

export const canEditUsers = (user) => {
  return (
    hasPermission(user, 'users.update') ||
    hasPermission(user, 'users.edit') ||
    hasPermission(user, 'user.update') ||
    hasPermission(user, 'user.edit')
  );
};

export const canDeleteUsers = (user) => {
  return hasPermission(user, 'users.delete') || hasPermission(user, 'user.delete');
};

export const canBulkUsers = (user) => {
  return hasPermission(user, 'users.bulk');
};

export const canImpersonate = (user) => {
  return (
    hasPermission(user, 'users.impersonate') ||
    hasPermission(user, 'impersonate_user') ||
    hasPermission(user, 'impersonate.user') ||
    hasPermission(user, 'impersonate user')
  );
};

// --- Audit & Logs ---
export const canViewAuditLogs = (user) => {
  return hasPermission(user, 'audit.view') || hasPermission(user, 'audit.read');
};

export const canViewSessions = (user) => {
  return (
    hasPermission(user, 'sessions.view') ||
    hasPermission(user, 'session.view') ||
    hasPermission(user, 'view_active_impersonations') ||
    hasPermission(user, 'logs.read')
  );
};

export const canViewImpersonationLogs = (user) => {
  return (
    hasPermission(user, 'view_impersonation_history') ||
    hasPermission(user, 'impersonation.history') ||
    hasPermission(user, 'impersonation.read')
  );
};

export const canCleanupLogs = (user) => {
  return hasPermission(user, 'audit.cleanup');
};

// --- Analytics & Reports ---
export const canViewReports = (user) => {
  return hasPermission(user, 'reports.view') || hasPermission(user, 'analytics.view');
};

export const canGenerateReports = (user) => {
  return hasPermission(user, 'reports.generate');
};

export const canExportAnalytics = (user) => {
  return hasPermission(user, 'analytics.export');
};

// --- CMS & System ---
export const canManageCMS = (user) => {
  return (
    hasPermission(user, 'cms.manage') ||
    hasPermission(user, 'cms.content.manage') ||
    hasPermission(user, 'cms.templates.manage') ||
    hasPermission(user, 'cms.pricing.manage') ||
    hasPermission(user, 'system.configuration')
  );
};

// --- Customers ---
export const canManageCustomers = (user) => {
  return hasPermission(user, 'customers.manage');
};

export const canViewCustomers = (user) => {
  return hasPermission(user, 'customers.view');
};

// --- Tickets ---
export const canViewTickets = (user) => {
  return (
    hasPermission(user, 'tickets.view') ||
    hasPermission(user, 'support.view') ||
    hasPermission(user, 'tickets.manage')
  );
};

export const canManageTickets = (user) => {
  return hasPermission(user, 'tickets.manage');
};

// --- Roles ---
export const canViewRoles = (user) => {
  return hasPermission(user, 'roles.view');
};

export const canManageRoles = (user) => {
  return hasPermission(user, 'roles.manage');
};
