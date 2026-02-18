/**
 * Role Utilities
 * Helper functions for role management and normalization
 */

/**
 * Normalize role from various formats
 * @param {string|Object} role - Role in various formats
 * @returns {string} Normalized role name
 */
export const normalizeRole = (role) => {
  if (!role) return 'user';

  // If it's an object with a name property
  let roleStr = typeof role === 'object' ? role.name || role.slug : String(role);

  if (!roleStr) return 'user';

  // Cleanup and normalize string
  roleStr = roleStr.toLowerCase().trim().replace(/\s+/g, '_');

  // Map common variants
  const mapping = {
    superadmin: 'super_admin',
    super_admin: 'super_admin',
    admin: 'admin',
    dealer: 'dealer_manager',
    dealer_manager: 'dealer_manager',
    user: 'user',
    customer: 'user',
  };

  return mapping[roleStr] || roleStr;
};

/**
 * Role-based route mapping
 */
export const ROLE_ROUTES = {
  super_admin: '/dashboard',
  admin: '/dashboard',
  dealer_manager: '/dashboard',
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
  super_admin: 3,
  admin: 2,
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
 * Get user-friendly role display name
 * @param {string} role - Role name
 * @returns {string} Display name
 */
export const getRoleDisplayName = (role) => {
  const displayNames = {
    super_admin: 'Super Admin',
    admin: 'Admin',
    dealer_manager: 'Dealer',
    user: 'User',
  };

  return displayNames[role] || role;
};

/**
 * Protected routes configuration
 */
export const PROTECTED_ROUTES = {
  '/roles': ['super_admin'],
  '/audit-logs': ['super_admin', 'admin'],
  '/users': ['super_admin', 'admin', 'dealer_manager'],
  '/dealerships': ['super_admin', 'admin'],
  '/quotes': ['super_admin', 'admin', 'dealer_manager'],
  '/notifications': ['super_admin', 'admin', 'dealer_manager'],
  '/settings': ['super_admin', 'admin', 'dealer_manager'],
  '/reports': ['super_admin', 'admin', 'dealer_manager'],
  '/support': ['super_admin', 'admin', 'dealer_manager'],
  '/dashboard': ['super_admin', 'admin', 'dealer_manager', 'user', 'staff'],
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
  getRoleDisplayName,
  canAccessRoute,
  ROLE_ROUTES,
  PROTECTED_ROUTES,
};
