'use client';
import React, { useState, useEffect } from 'react';
import Loader from '../../common/Loader';
import Swal from 'sweetalert2';
import {
  Save,
  Shield,
  Users,
  Lock,
  Info,
  CheckCircle2,
  AlertCircle,
  Building2,
  Headset,
  Briefcase,
  ShieldAlert,
} from 'lucide-react';
import roleService from '../../../services/roleService';
import PageHeader from '@/components/common/PageHeader';

const HIDDEN_CONFIG = {
  // Roles to completely hide from the selection list
  roles: ['super_admin', 'admin', 'seller', 'user'],

  // Per-role specific hidden items
  byRole: {
    support_staff: {
      categories: ['analytics'],
      permissions: ['users.create', 'users.update', 'users.delete', 'quotes.delete'],
    },
    dealer_manager: {
      permissions: ['dealership.delete'],
    },
  },
};

export default function RolePermissionView({
  roles = [],
  permissions = [],
  loading = false,
  onRefresh,
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [activeRole, setActiveRole] = useState(null);
  const [permissionMatrix, setPermissionMatrix] = useState({});

  const [initialMatrix, setInitialMatrix] = useState({});

  useEffect(() => {
    if (Array.isArray(roles) && roles.length > 0) {
      const matrix = {};
      roles.forEach((role) => {
        matrix[role.id] = {};
        if (Array.isArray(role.permissions)) {
          role.permissions.forEach((p) => {
            const code = typeof p === 'string' ? p : p.code;
            matrix[role.id][code] = true;
          });
        }
      });
      setPermissionMatrix(matrix);
      setInitialMatrix(JSON.parse(JSON.stringify(matrix)));
    }
  }, [roles]);

  // Auto-select the first valid role if none is active
  useEffect(() => {
    if (!activeRole && Array.isArray(roles) && roles.length > 0) {
      const firstValidRole = roles.find((role) => {
        const name = (role.name || '').toLowerCase();
        return !HIDDEN_CONFIG.roles.includes(name);
      });
      if (firstValidRole) {
        setActiveRole(firstValidRole.id);
      }
    }
  }, [roles, activeRole]);

  const currentRoleObj = (Array.isArray(roles) ? roles : []).find((r) => r.id === activeRole);
  const roleName = (currentRoleObj?.name || '').toLowerCase();
  const isSystemRole = roleName === 'super_admin' || roleName === 'admin' || roleName === 'seller';
  const isSuperAdmin = roleName === 'super_admin';

  const handleToggle = (permCode) => {
    if (!activeRole) return;
    const currentRolePerms = permissionMatrix[activeRole] || {};
    setPermissionMatrix((prev) => ({
      ...prev,
      [activeRole]: {
        ...currentRolePerms,
        [permCode]: !currentRolePerms[permCode],
      },
    }));
  };

  const handleBulkToggle = (items, targetValue) => {
    if (!activeRole) return;
    const currentRolePerms = { ...(permissionMatrix[activeRole] || {}) };
    items.forEach((item) => {
      currentRolePerms[item.key] = targetValue;
    });

    setPermissionMatrix((prev) => ({
      ...prev,
      [activeRole]: currentRolePerms,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const currentRole = (Array.isArray(roles) ? roles : []).find((r) => r.id === activeRole);
      if (!currentRole) return;
      const activePermsForRole = permissionMatrix[activeRole] || {};
      const permissionIds = (Array.isArray(permissions) ? permissions : [])
        .filter((p) => activePermsForRole[p.code])
        .map((p) => p.id);

      await roleService.updateRole(activeRole, {
        name: currentRole.name,
        description: currentRole.description,
        permission_ids: permissionIds,
      });

      // Update initial state after successful save
      setInitialMatrix((prev) => ({
        ...prev,
        [activeRole]: { ...permissionMatrix[activeRole] },
      }));

      Swal.fire({
        icon: 'success',
        title: 'Saved',
        text: 'Permissions updated successfully.',
        timer: 1500,
        showConfirmButton: false,
      });
      onRefresh?.();
    } catch (error) {
      console.error('Save error', error);
      Swal.fire('Error', 'Failed to save permissions', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (!activeRole) return;

    const result = await Swal.fire({
      title: 'Reset Permissions?',
      text: 'This will revert all unsaved changes for this role to the last saved state.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: 'rgb(var(--color-primary))',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, reset',
    });

    if (result.isConfirmed) {
      const originalRole = (Array.isArray(roles) ? roles : []).find((r) => r.id === activeRole);
      if (!originalRole) return;

      const resetPermissions = {};
      if (Array.isArray(originalRole.permissions)) {
        originalRole.permissions.forEach((p) => {
          const code = typeof p === 'string' ? p : p.code;
          resetPermissions[code] = true;
        });
      }

      setPermissionMatrix((prev) => ({
        ...prev,
        [activeRole]: resetPermissions,
      }));

      Swal.fire({
        icon: 'success',
        title: 'Reset Complete',
        text: 'Permissions have been reverted to the last saved state.',
        timer: 1500,
        showConfirmButton: false,
      });
    }
  };

  const getGroupedPermissions = (targetRoleName) => {
    const groups = {};

    // Get role-specific hidden items
    const roleHidden = HIDDEN_CONFIG.byRole[targetRoleName] || { categories: [], permissions: [] };

    const hiddenCategories = (roleHidden.categories || []).map((c) => c.toLowerCase());
    const hiddenPermissions = (roleHidden.permissions || []).map((p) => p.toLowerCase());

    if (Array.isArray(permissions)) {
      permissions.forEach((p) => {
        // Skip if this specific permission is hidden for this role
        if (hiddenPermissions.includes(p.code.toLowerCase())) return;

        const part = p.code.split('.')[0];
        const category = part.charAt(0).toUpperCase() + part.slice(1);

        // Skip if this entire category is hidden for this role
        if (hiddenCategories.includes(category.toLowerCase())) return;

        if (!groups[category]) groups[category] = [];
        groups[category].push(p);
      });
    }

    return Object.entries(groups).map(([cat, items]) => ({
      category: cat,
      description: `Manage ${cat.toLowerCase()} permissions`,
      items: (Array.isArray(items) ? items : []).map((i) => ({
        key: i.code,
        label: i.name,
        desc: i.description,
        id: i.id,
      })),
    }));
  };

  const groupedPermissions = getGroupedPermissions(roleName);

  // Compute isDirty by comparing current permissions with the initial saved state for this role
  const isDirty = React.useMemo(() => {
    if (!activeRole) return false;
    const current = permissionMatrix[activeRole] || {};
    const initial = initialMatrix[activeRole] || {};
    const allCodes = new Set([...Object.keys(current), ...Object.keys(initial)]);
    for (const code of allCodes) {
      if (!!current[code] !== !!initial[code]) return true;
    }
    return false;
  }, [activeRole, permissionMatrix, initialMatrix]);

  // Helper for dynamic classes (Unified and Dark-Mode Aware)
  const getRoleStyles = (roleName, isActive) => {
    const name = (roleName || '').toLowerCase();
    let theme = 'gray';
    let Icon = Users;

    if (name.includes('admin')) {
      theme = 'purple';
      Icon = Shield;
    }
    if (name.includes('super')) {
      theme = 'rose';
      Icon = ShieldAlert;
    }
    if (name.includes('dealer')) {
      theme = 'blue';
      Icon = Building2;
    }
    if (name.includes('support')) {
      theme = 'emerald';
      Icon = Headset;
    }
    if (name.includes('sales')) {
      theme = 'amber';
      Icon = Briefcase;
    }

    const themes = {
      purple: {
        bg: 'bg-purple-50 dark:bg-purple-900/10',
        activeBg: 'bg-purple-600/15',
        text: 'text-purple-600 dark:text-purple-400',
        activeText: 'text-purple-600',
        border: 'border-purple-200 dark:border-purple-800/50',
        activeBorder: 'border-purple-600/25',
        ring: 'ring-purple-500/30',
        toggle: 'bg-purple-600',
      },
      rose: {
        bg: 'bg-rose-50 dark:bg-rose-900/10',
        activeBg: 'bg-rose-600/15',
        text: 'text-rose-600 dark:text-rose-400',
        activeText: 'text-rose-600',
        border: 'border-rose-200 dark:border-rose-800/50',
        activeBorder: 'border-rose-600/25',
        ring: 'ring-rose-500/30',
        toggle: 'bg-rose-600',
      },
      blue: {
        bg: 'bg-blue-50 dark:bg-blue-900/10',
        activeBg: 'bg-blue-400/15',
        text: 'text-blue-600 dark:text-blue-400',
        activeText: 'text-blue-600',
        border: 'border-blue-200 dark:border-blue-800/50',
        activeBorder: 'border-blue-600/25',
        ring: 'ring-blue-500/30',
        toggle: 'bg-blue-600',
      },
      emerald: {
        bg: 'bg-emerald-50 dark:bg-emerald-900/10',
        activeBg: 'bg-emerald-400/15',
        text: 'text-emerald-00 dark:text-emerald-400',
        activeText: 'text-emerald-600',
        border: 'border-emerald-200 dark:border-emerald-800/50',
        activeBorder: 'border-emerald-600/25',
        ring: 'ring-emerald-500/30',
        toggle: 'bg-emerald-600',
      },
      amber: {
        bg: 'bg-amber-50 dark:bg-amber-900/10',
        activeBg: 'bg-amber-600/15',
        text: 'text-amber-600 dark:text-amber-400',
        activeText: 'text-amber-600',
        border: 'border-amber-200 dark:border-amber-800/50',
        activeBorder: 'border-amber-600/25',
        ring: 'ring-amber-500/30',
        toggle: 'bg-amber-600',
      },
      gray: {
        bg: 'bg-gray-50 dark:bg-gray-900/10',
        activeBg: 'bg-gray-600/15',
        text: 'text-gray-600 dark:text-gray-400',
        activeText: 'text-gray-600',
        border: 'border-gray-200 dark:border-gray-800/50',
        activeBorder: 'border-gray-600/25',
        ring: 'ring-gray-500/30',
        toggle: 'bg-gray-600',
      },
    };

    const currentTheme = themes[theme] || themes.gray;
    return { ...currentTheme, Icon };
  };

  const activeTheme = getRoleStyles(currentRoleObj?.name, true);

  return (
    <div className="space-y-8 pb-20 animate-fade-in">
      <PageHeader
        title="Access Control"
        subtitle="Define capabilities for each system role."
        actions={
          <div className="flex gap-3">
            <button
              onClick={handleReset}
              disabled={isSuperAdmin}
              className="px-4 py-2 text-sm font-semibold text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-background))] rounded-xl transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Reset to Default
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || isSuperAdmin || !isDirty}
              className={`flex items-center gap-2 text-white px-6 py-2 rounded-xl transition-all shadow-lg disabled:opacity-70 bg-[rgb(var(--color-primary))]`}
            >
              {isSaving ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save size={18} />
              )}
              <span>Save Changes</span>
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {(Array.isArray(roles) ? roles : [])
          .filter((role) => {
            const name = (role.name || '').toLowerCase();
            return !HIDDEN_CONFIG.roles.includes(name);
          })
          .map((role) => {
            const isActive = activeRole === role.id;
            const roleStyle = getRoleStyles(role.name, isActive);
            const RoleIcon = roleStyle.Icon;
            const activeCount = Object.values(permissionMatrix[role.id] || {}).filter(
              Boolean
            ).length;

            return (
              <button
                key={role.id}
                onClick={() => setActiveRole(role.id)}
                className={`
                                    relative p-4 rounded-xl border text-left transition-all duration-200
                                    ${
                                      isActive
                                        ? `${roleStyle.activeBg} ${roleStyle.activeBorder} shadow-sm ring-1 ${roleStyle.ring}`
                                        : `bg-[rgb(var(--color-surface))] border-[rgb(var(--color-border))] hover:border-[rgb(var(--color-text-muted))]`
                                    }
                                `}
              >
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`p-2 rounded-lg ${isActive ? `${roleStyle.activeBg} ${roleStyle.activeText}` : `bg-[rgb(var(--color-background))] text-[rgb(var(--color-text-muted))]`} transition-colors`}
                  >
                    <RoleIcon size={20} />
                  </div>
                  {isActive && <CheckCircle2 size={18} className={roleStyle.activeText} />}
                </div>
                <h3
                  className={`font-bold text-sm ${isActive ? 'text-[rgb(var(--color-text))]' : 'text-[rgb(var(--color-text-muted))]'}`}
                >
                  {role.name.charAt(0).toUpperCase() + role.name.slice(1).replace(/_/g, ' ')}
                </h3>
                <p className="text-xs text-[rgb(var(--color-text-muted))] mt-1">
                  {role.name === 'super_admin'
                    ? 'Full System Access'
                    : `${activeCount} Active Permissions`}
                </p>
              </button>
            );
          })}
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {(Array.isArray(groupedPermissions) ? groupedPermissions : []).map((category, idx) => (
            <div
              key={idx}
              className="bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] rounded-xl overflow-hidden shadow-sm"
            >
              <div className="px-6 py-4 border-b border-[rgb(var(--color-border))] bg-[rgb(var(--color-background))]/30 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-[rgb(var(--color-text))] text-sm">
                    {category.category}
                  </h3>
                  <p className="text-[10px] uppercase font-semibold text-[rgb(var(--color-text-muted))] mt-0.5">
                    {category.description}
                  </p>
                </div>
                {!isSuperAdmin && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const allSelected = category.items.every(
                          (i) => permissionMatrix[activeRole]?.[i.key]
                        );
                        handleBulkToggle(category.items, !allSelected);
                      }}
                      className={`text-[10px] uppercase tracking-wider font-bold px-3 py-1.5 rounded-lg transition-all duration-200 ${
                        category.items.every((i) => permissionMatrix[activeRole]?.[i.key])
                          ? 'text-rose-500 bg-rose-500/10 hover:bg-rose-500/20'
                          : 'text-[rgb(var(--color-primary))] bg-[rgb(var(--color-primary))]/10 hover:bg-[rgb(var(--color-primary))]/20'
                      }`}
                    >
                      {category.items.every((i) => permissionMatrix[activeRole]?.[i.key])
                        ? 'Disable All'
                        : 'Enable All'}
                    </button>
                  </div>
                )}
              </div>

              <div className="divide-y divide-[rgb(var(--color-border))]">
                {(Array.isArray(category.items) ? category.items : []).map((item) => {
                  const isLocked = isSystemRole;
                  const isEnabled = permissionMatrix[activeRole]?.[item.key];

                  return (
                    <div
                      key={item.key}
                      className="px-6 py-4 flex items-center justify-between hover:bg-[rgb(var(--color-background))]/20 transition-colors"
                    >
                      <div className="pr-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-sm font-medium ${isEnabled ? 'text-[rgb(var(--color-text))]' : 'text-[rgb(var(--color-text-muted))]'}`}
                          >
                            {item.label}
                          </span>
                          {isLocked && (
                            <Lock
                              size={12}
                              className="text-[rgb(var(--color-text-muted))] opacity-50"
                            />
                          )}
                        </div>
                        <p className="text-[11px] text-[rgb(var(--color-text-muted))] mt-0.5">
                          {item.desc}
                        </p>
                      </div>

                      <button
                        onClick={() => handleToggle(item.key)}
                        disabled={isLocked}
                        className={`
                                                    relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none
                                                    ${isEnabled ? activeTheme.toggle : 'bg-gray-200 dark:bg-gray-700'}
                                                    ${isLocked ? 'opacity-40 cursor-not-allowed' : ''}
                                                `}
                      >
                        <span className="sr-only">Use setting</span>
                        <span
                          aria-hidden="true"
                          className={`
                                                        pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                                                        ${isEnabled ? 'translate-x-5' : 'translate-x-0'}
                                                    `}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
