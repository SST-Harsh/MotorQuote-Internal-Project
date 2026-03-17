export { normalizeRole } from './roleCommon';
import { normalizeRole } from './roleCommon';

import {
  hasPermission as robustHasPermission,
  canExportReports,
  canCreateQuote as robustCanCreateQuote,
  canViewQuote as robustCanViewQuote,
  canEditQuote as robustCanEditQuote,
  canCreateDealership as robustCanCreateDealership,
  canViewDealership as robustCanViewDealership,
  canEditDealership as robustCanEditDealership,
  canViewNotifications as robustCanViewNotifications,
  canCreateNotifications as robustCanCreateNotifications,
  canViewUsers,
  canCreateUsers,
  canEditUsers,
  canDeleteUsers,
  canViewAuditLogs,
  canCleanupLogs,
  canManageCMS,
  canManageCustomers,
  canViewCustomers,
  canManageTickets,
  canViewRoles,
  canManageRoles,
  canViewImpersonationLogs,
  canViewReports,
  canViewSessions,
  canViewTickets,
  canBroadcastNotifications,
  canOverrideQuote,
  canAssignDealer,
  canBulkUsers,
  canImpersonate,
  canGenerateReports,
  canExportAnalytics,
} from './permissionUtils';

export {
  robustCanCreateQuote as canCreateQuote,
  robustCanViewQuote as canViewQuote,
  robustCanEditQuote as canEditQuote,
  robustCanCreateDealership as canCreateDealership,
  robustCanViewDealership as canViewDealership,
  robustCanEditDealership as canEditDealership,
  robustCanViewNotifications as canViewNotifications,
  robustCanCreateNotifications as canCreateNotifications,
  canViewUsers,
  canCreateUsers,
  canEditUsers,
  canDeleteUsers,
  canViewAuditLogs,
  canCleanupLogs,
  canManageCMS,
  canManageCustomers,
  canViewCustomers,
  canManageTickets,
  canViewRoles,
  canManageRoles,
  canExportReports,
  canViewImpersonationLogs,
  canViewReports,
  canViewSessions,
  canViewTickets,
  canBroadcastNotifications,
  canOverrideQuote,
  canAssignDealer,
  canBulkUsers,
  canImpersonate,
  canGenerateReports,
  canExportAnalytics,
};

/**
 * Role-based route mapping
 */
export const ROLE_ROUTES = {
  super_admin: '/dashboard',
  dealer_manager: '/dashboard',
  support_staff: '/dashboard',
  user: '/dashboard',
};

/**
 * Get redirect route for a role
 * @param {string} role - User role
 * @returns {string} Route path
 */
export const getRoleRoute = (role) => {
  return ROLE_ROUTES[role] || '/dashboard';
};

/**
 * Check if user has required role
 * @param {string} userRole - Current user's role
 * @param {string|string[]} requiredRoles - Required role(s)
 * @returns {boolean}
 */
export const hasRole = (userRole, requiredRoles) => {
  if (!userRole) return false;

  if (Array.isArray(requiredRoles)) {
    return requiredRoles.includes(userRole);
  }

  return userRole === requiredRoles;
};

/**
 * Role hierarchy for permission checking
 */
const ROLE_HIERARCHY = {
  super_admin: 2,
  dealer_manager: 1,
  user: 0,
};

/**
 * Check if user role has higher or equal level than required role
 * @param {string} userRole - Current user's role
 * @param {string} requiredRole - Required role level
 * @returns {boolean}
 */
export const hasRoleLevel = (userRole, requiredRole) => {
  const userLevel = ROLE_HIERARCHY[userRole] || 0;
  const requiredLevel = ROLE_HIERARCHY[requiredRole] || 0;
  return userLevel >= requiredLevel;
};

/**
 * Roles that are NOT allowed to delete any resources
 * Admin and dealer_manager roles cannot delete users, quotes, dealers, etc.
 */
export const ROLES_WITHOUT_DELETE_PERMISSION = ['dealer_manager'];

/**
 * Check if user has a specific permission
 * @param {Object} user - User object from AuthContext
 * @param {string} permissionCode - Permission code to check (e.g. 'users.delete')
 * @returns {boolean}
 */
export const hasPermission = (user, permissionCode) => {
  return robustHasPermission(user, permissionCode);
};

/**
 * Check if user has permission to delete based on their role or explicit permissions
 * @param {Object} user - User object
 * @param {string} resource - Resource type (e.g. 'users', 'dealership', 'quotes')
 * @returns {boolean} - true if user can delete, false otherwise
 */
export const canDelete = (user, resource) => {
  if (!user) return false;

  // Check for specific delete permission if resource is provided
  if (resource) {
    const permissionCode = `${resource}.delete`.toLowerCase();
    if (hasPermission(user, permissionCode)) return true;
  }

  const normalizedRole = normalizeRole(user.role);

  // Legacy fallback: Only super_admin can delete if no specific permission is found
  return normalizedRole === 'super_admin';
};

/**
 * Get user-friendly role display name
 * @param {string} role - Role name
 * @returns {string} Display name
 */
export const getRoleDisplayName = (role) => {
  const displayNames = {
    super_admin: 'Super Admin',
    dealer_manager: 'Dealer Manager',
    user: 'User',
  };

  return displayNames[role] || role;
};

/**
 * Protected routes configuration
 */
export const PROTECTED_ROUTES = {
  '/roles': ['super_admin'],
  '/audit-logs': ['super_admin'],
  '/users': ['super_admin', 'dealer_manager', 'support_staff'],
  '/users/suspended': ['super_admin'],
  '/api/users/suspended': ['super_admin'],
  '/api/users': ['super_admin', 'dealer_manager'],
  '/dealerships': ['super_admin', 'dealer_manager'],
  '/quotes': ['super_admin', 'dealer_manager', 'support_staff'],
  '/notifications': ['super_admin', 'dealer_manager', 'support_staff'],
  '/settings': ['super_admin', 'dealer_manager', 'support_staff'],
  '/reports': ['super_admin', 'dealer_manager'],
  '/support': ['super_admin', 'dealer_manager', 'support_staff'],
  '/dashboard': ['super_admin', 'dealer_manager', 'user', 'staff', 'support_staff'],
  '/trash': ['super_admin', 'dealer_manager', 'support_staff'],
};

/**
 * Check if user can access a route
 * @param {string} route - Route path
 * @param {string} userRole - User's role
 * @returns {boolean}
 */
export const canAccessRoute = (route, userRole) => {
  // Find matching route pattern
  const routePattern = Object.keys(PROTECTED_ROUTES).find((pattern) => route.startsWith(pattern));

  if (!routePattern) return true; // Public route

  const allowedRoles = PROTECTED_ROUTES[routePattern];
  return hasRole(userRole, allowedRoles);
};

export default {
  normalizeRole,
  getRoleRoute,
  hasRole,
  hasRoleLevel,
  hasPermission,
  canDelete,
  getRoleDisplayName,
  canAccessRoute,
  ROLE_ROUTES,
  PROTECTED_ROUTES,
  ROLES_WITHOUT_DELETE_PERMISSION,
  canExportReports,
  canCreateQuote: robustCanCreateQuote,
  canViewQuote: robustCanViewQuote,
  canEditQuote: robustCanEditQuote,
  canCreateDealership: robustCanCreateDealership,
  canViewDealership: robustCanViewDealership,
  canEditDealership: robustCanEditDealership,
  canViewNotifications: robustCanViewNotifications,
  canCreateNotifications: robustCanCreateNotifications,
  canViewUsers,
  canCreateUsers,
  canEditUsers,
  canDeleteUsers,
  canViewAuditLogs,
  canCleanupLogs,
  canManageCMS,
  canManageCustomers,
  canViewCustomers,
  canManageTickets,
  canViewRoles,
  canManageRoles,
  canViewImpersonationLogs,
  canViewReports,
  canViewSessions,
  canViewTickets,
  canBroadcastNotifications,
  canOverrideQuote,
  canAssignDealer,
  canBulkUsers,
  canImpersonate,
  canGenerateReports,
  canExportAnalytics,
};
