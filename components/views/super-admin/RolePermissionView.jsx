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

export default function RolePermissionView({
  roles = [],
  permissions = [],
  loading = false,
  onRefresh,
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [activeRole, setActiveRole] = useState(null);
  const [permissionMatrix, setPermissionMatrix] = useState({});

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
    }
  }, [roles]);

  useEffect(() => {
    if (Array.isArray(roles) && roles.length > 0 && !activeRole) {
      setActiveRole(roles[0].id);
    }
  }, [roles, activeRole]);

  if (loading) return <Loader />;

  const handleToggle = (code) => {
    const role = (Array.isArray(roles) ? roles : []).find((r) => r.id === activeRole);
    if (role && role.name === 'super_admin') return;

    setPermissionMatrix((prev) => ({
      ...prev,
      [activeRole]: {
        ...prev[activeRole],
        [code]: !prev[activeRole]?.[code],
      },
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

  const handleReset = () => {
    if (!activeRole) return;
    setPermissionMatrix((prev) => ({
      ...prev,
      [activeRole]: {},
    }));
  };

  const getGroupedPermissions = () => {
    const groups = {};
    if (Array.isArray(permissions)) {
      permissions.forEach((p) => {
        const part = p.code.split('.')[0];
        const category = part.charAt(0).toUpperCase() + part.slice(1);
        if (!groups[category]) groups[category] = [];
        groups[category].push(p);
      });
    }

    return Object.entries(groups).map(([cat, items]) => ({
      category: cat,
      description: `Manage ${cat.toLowerCase()}`,
      items: (Array.isArray(items) ? items : []).map((i) => ({
        key: i.code,
        label: i.name,
        desc: i.description,
      })),
    }));
  };

  const groupedPermissions = getGroupedPermissions();
  const currentRoleObj = (Array.isArray(roles) ? roles : []).find((r) => r.id === activeRole);
  const isSuperAdmin = currentRoleObj?.name === 'super_admin';

  // Helper for dynamic classes (Lifted up)
  const getThemeForRole = (roleName) => {
    const name = (roleName || '').toLowerCase();
    let colorTheme = 'gray';
    if (name.includes('admin')) colorTheme = 'purple';
    if (name.includes('super')) colorTheme = 'rose';
    if (name.includes('dealer')) colorTheme = 'blue';
    if (name.includes('support')) colorTheme = 'emerald';
    if (name.includes('sales')) colorTheme = 'amber';

    const themes = {
      purple: {
        bg: 'bg-purple-50',
        text: 'text-purple-600',
        border: 'border-purple-200',
        activeRing: 'ring-purple-500',
        activeBorder: 'border-purple-500',
        toggle: 'bg-purple-600',
      },
      rose: {
        bg: 'bg-rose-50',
        text: 'text-rose-600',
        border: 'border-rose-200',
        activeRing: 'ring-rose-500',
        activeBorder: 'border-rose-500',
        toggle: 'bg-rose-600',
      },
      blue: {
        bg: 'bg-blue-50',
        text: 'text-blue-600',
        border: 'border-blue-200',
        activeRing: 'ring-blue-500',
        activeBorder: 'border-blue-500',
        toggle: 'bg-blue-600',
      },
      emerald: {
        bg: 'bg-emerald-50',
        text: 'text-emerald-600',
        border: 'border-emerald-200',
        activeRing: 'ring-emerald-500',
        activeBorder: 'border-emerald-500',
        toggle: 'bg-emerald-600',
      },
      amber: {
        bg: 'bg-amber-50',
        text: 'text-amber-600',
        border: 'border-amber-200',
        activeRing: 'ring-amber-500',
        activeBorder: 'border-amber-500',
        toggle: 'bg-amber-600',
      },
      gray: {
        bg: 'bg-gray-50',
        text: 'text-gray-600',
        border: 'border-gray-200',
        activeRing: 'ring-gray-500',
        activeBorder: 'border-gray-500',
        toggle: 'bg-gray-600',
      },
    };
    return themes[colorTheme] || themes.gray;
  };

  const activeTheme = getThemeForRole(currentRoleObj?.name);

  return (
    <div className="space-y-8 pb-20 animate-fade-in">
      {/* Dashboard Style Header */}
      <div className="flex flex-col sm:flex-row justify-between items-end gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[rgb(var(--color-text))]">Access Control</h1>
          <p className="text-[rgb(var(--color-text-muted))] text-sm mt-1">
            Define capabilities and permissions for each system role.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleReset}
            disabled={isSuperAdmin}
            className="px-4 py-2.5 text-sm font-medium text-[rgb(var(--color-text-muted))] hover:bg-[rgb(var(--color-background))] rounded-xl transition-colors disabled:opacity-50 border border-transparent hover:border-[rgb(var(--color-border))]"
          >
            Reset to Default
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || isSuperAdmin}
            className={`flex items-center gap-2 text-white px-6 py-2.5 rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-70 bg-[rgb(var(--color-primary))] font-semibold`}
          >
            {isSaving ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save size={18} />
            )}
            <span>Save Changes</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(Array.isArray(roles) ? roles : []).map((role) => {
          const isActive = activeRole === role.id;

          let RoleIcon = Users;
          let colorTheme = 'gray';

          const name = (role.name || '').toLowerCase();
          if (name.includes('admin')) {
            RoleIcon = Shield;
            colorTheme = 'purple';
          }
          if (name.includes('super')) {
            RoleIcon = ShieldAlert;
            colorTheme = 'rose';
          }
          if (name.includes('dealer')) {
            RoleIcon = Building2;
            colorTheme = 'blue';
          }
          if (name.includes('support')) {
            RoleIcon = Headset;
            colorTheme = 'emerald';
          }
          if (name.includes('sales')) {
            RoleIcon = Briefcase;
            colorTheme = 'amber';
          }

          const activeCount = Object.values(permissionMatrix[role.id] || {}).filter(Boolean).length;

          const getThemeClasses = () => {
            const themes = {
              purple: {
                bg: 'bg-purple-50',
                text: 'text-purple-600',
                border: 'border-purple-200',
                activeRing: 'ring-purple-500',
                activeBorder: 'border-purple-500',
              },
              rose: {
                bg: 'bg-rose-50',
                text: 'text-rose-600',
                border: 'border-rose-200',
                activeRing: 'ring-rose-500',
                activeBorder: 'border-rose-500',
              },
              blue: {
                bg: 'bg-blue-50',
                text: 'text-blue-600',
                border: 'border-blue-200',
                activeRing: 'ring-blue-500',
                activeBorder: 'border-blue-500',
              },
              emerald: {
                bg: 'bg-emerald-50',
                text: 'text-emerald-600',
                border: 'border-emerald-200',
                activeRing: 'ring-emerald-500',
                activeBorder: 'border-emerald-500',
              },
              amber: {
                bg: 'bg-amber-50',
                text: 'text-amber-600',
                border: 'border-amber-200',
                activeRing: 'ring-amber-500',
                activeBorder: 'border-amber-500',
              },
              gray: {
                bg: 'bg-gray-50',
                text: 'text-gray-600',
                border: 'border-gray-200',
                activeRing: 'ring-gray-500',
                activeBorder: 'border-gray-500',
              },
            };
            return themes[colorTheme] || themes.gray;
          };

          const theme = getThemeClasses();

          return (
            <button
              key={role.id}
              onClick={() => setActiveRole(role.id)}
              className={`
                                relative p-4 rounded-2xl border text-left transition-all duration-200 group
                                ${
                                  isActive
                                    ? `bg-[rgb(var(--color-surface))] ${theme.activeBorder} shadow-md ring-1 ${theme.activeRing}`
                                    : `bg-[rgb(var(--color-surface))] border-[rgb(var(--color-border))] hover:border-[rgb(var(--color-text-muted))] hover:shadow-sm`
                                }
                            `}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg ${theme.bg} ${theme.text} transition-colors`}>
                  <RoleIcon size={20} />
                </div>
                {isActive && <CheckCircle2 size={18} className={theme.text} />}
              </div>
              <h3
                className={`font-bold ${isActive ? 'text-[rgb(var(--color-text))]' : 'text-[rgb(var(--color-text-muted))] group-hover:text-[rgb(var(--color-text))]'}`}
              >
                {role.name.charAt(0).toUpperCase() + role.name.slice(1).replace('_', ' ')}
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
        {isSuperAdmin && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-start gap-3">
            <Lock className="text-red-600 mt-0.5" size={18} />
            <div>
              <h4 className="text-sm font-bold text-red-800">System Locked</h4>
              <p className="text-xs text-red-700 mt-1">
                Super Admin permissions are hard-coded for security and cannot be modified.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {(Array.isArray(groupedPermissions) ? groupedPermissions : []).map((category, idx) => (
            <div
              key={idx}
              className="bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] rounded-2xl overflow-hidden shadow-sm"
            >
              <div className="px-6 py-4 border-b border-[rgb(var(--color-border))] bg-[rgb(var(--color-background))/0.5]">
                <h3 className="font-bold text-[rgb(var(--color-text))]">{category.category}</h3>
                <p className="text-xs text-[rgb(var(--color-text-muted))]">
                  {category.description}
                </p>
              </div>

              <div className="divide-y divide-[rgb(var(--color-border))]">
                {(Array.isArray(category.items) ? category.items : []).map((item) => {
                  const isLocked = isSuperAdmin;
                  const isEnabled = permissionMatrix[activeRole]?.[item.key];

                  return (
                    <div
                      key={item.key}
                      className="px-6 py-4 flex items-center justify-between hover:bg-[rgb(var(--color-background))/0.3] transition-colors"
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
                        <p className="text-xs text-[rgb(var(--color-text-muted))] mt-0.5">
                          {item.desc}
                        </p>
                      </div>

                      <button
                        onClick={() => handleToggle(item.key)}
                        disabled={isLocked}
                        className={`
                                                    relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none
                                                    ${isEnabled ? activeTheme.toggle : 'bg-[rgb(var(--color-border))]'}
                                                    ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}
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
