/**
 * Role Common Utilities
 * Extracted to prevent circular dependencies
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
    dealer: 'dealer_manager',
    dealer_manager: 'dealer_manager',
    user: 'user',
    customer: 'user',
  };

  return mapping[roleStr] || roleStr;
};

export default {
  normalizeRole,
};
