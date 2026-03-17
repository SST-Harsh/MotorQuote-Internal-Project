'use client';
import React, { useMemo } from 'react';
import { Lock, ChevronDown, ChevronRight, CheckCircle2 } from 'lucide-react';

/**
 * ModernPermissionsSelector Component
 *
 * A card-based permissions selector with categories and toggles.
 *
 * @param {Array} value - Selected permission IDs
 * @param {Function} onChange - Callback when selection changes
 * @param {Array} options - Available permissions [{ value, label, description, code }]
 * @param {string} roleName - Optional role name for theme colors
 * @param {boolean} readOnly - Whether the selector is interactive
 */
const ModernPermissionsSelector = ({
  value = [],
  onChange,
  options = [],
  roleName = 'user',
  readOnly = false,
}) => {
  // Group permissions by category (first part of the code)
  const groupedPermissions = useMemo(() => {
    const groups = {};
    const normRole = (roleName || '').toLowerCase();

    // Base hidden categories for all roles
    const baseHiddenCategories = [
      'audit',
      'admin',
      'impersonate_user',
      'logs',
      'view_active_impersonations',
      'view_impersonation_history',
      'system',
      'cms',
    ];

    // Base hidden permissions for all roles
    const baseHiddenPermissions = ['dealership.delete'];

    // Role-specific hidden logic (matches RolePermissionView.jsx)
    const roleExclusions = {
      support_staff: {
        categories: ['analytics'],
        permissions: [
          'users.create',
          'users.update',
          'users.delete',
          'quotes.delete',
          'quote.delete',
        ],
      },
      dealer_manager: {
        permissions: ['dealership.delete'],
      },
    };

    const exclusions = roleExclusions[normRole] || { categories: [], permissions: [] };
    const combinedHiddenCategories = [
      ...baseHiddenCategories,
      ...(exclusions.categories || []),
    ].map((c) => c.toLowerCase());
    const combinedHiddenPermissions = [
      ...baseHiddenPermissions,
      ...(exclusions.permissions || []),
    ].map((p) => p.toLowerCase());

    options.forEach((p) => {
      const code = (p.code || '').toLowerCase();

      // Skip if this specific permission is hidden
      if (combinedHiddenPermissions.includes(code)) return;
      if (code === 'view_impersonation_history') return; // Legacy explicit check

      const part = p.code ? p.code.split('.')[0] : 'Other';
      const category = part.charAt(0).toUpperCase() + part.slice(1);
      const catLower = category.toLowerCase();

      // Skip if this entire category is hidden
      if (combinedHiddenCategories.includes(catLower)) return;

      if (!groups[category]) groups[category] = [];
      groups[category].push(p);
    });

    return Object.entries(groups).map(([cat, items]) => ({
      category: cat,
      description: `Manage ${cat.toLowerCase()} permissions`,
      items: items,
    }));
  }, [options]);

  // Theme helper
  const activeTheme = useMemo(() => {
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
        text: 'text-gray-500',
        border: 'border-gray-100',
        activeRing: 'ring-gray-300',
        activeBorder: 'border-gray-300',
        toggle: 'bg-gray-400',
      },
    };
    return themes[colorTheme] || themes.gray;
  }, [roleName]);

  const handleToggle = (id) => {
    if (readOnly) return;
    const current = new Set(value);
    if (current.has(id)) current.delete(id);
    else current.add(id);
    onChange(Array.from(current));
  };

  const handleSelectAll = (catItems) => {
    if (readOnly) return;
    const itemIds = catItems.map((i) => i.value);
    const current = new Set(value);
    const allSelected = itemIds.every((id) => current.has(id));

    if (allSelected) {
      itemIds.forEach((id) => current.delete(id));
    } else {
      itemIds.forEach((id) => current.add(id));
    }
    onChange(Array.from(current));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mt-2">
      {groupedPermissions.map((category, idx) => {
        const selectedCount = category.items.filter((i) => value.includes(i.value)).length;
        const isAllSelected = category.items.length > 0 && selectedCount === category.items.length;

        return (
          <div
            key={idx}
            className="bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] rounded-2xl overflow-hidden shadow-sm flex flex-col transition-all hover:border-[rgb(var(--color-primary))]/30"
          >
            {/* Header */}
            <div className="px-5 py-3 border-b border-[rgb(var(--color-border))] bg-[rgb(var(--color-background))]/30 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-[rgb(var(--color-text))]">
                  {category.category}
                </h3>
                <p className="text-[10px] text-[rgb(var(--color-text-muted))] uppercase font-semibold tracking-wider">
                  {category.description}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleSelectAll(category.items)}
                className={`text-[11px] font-bold px-2 py-1 rounded-lg transition-colors ${
                  isAllSelected
                    ? 'text-red-500 bg-red-50 hover:bg-red-100'
                    : 'text-[rgb(var(--color-primary))] bg-[rgb(var(--color-primary))]/10 hover:bg-[rgb(var(--color-primary))]/20'
                }`}
              >
                {isAllSelected ? 'Disable All' : 'Enable All'}
              </button>
            </div>

            {/* List */}
            <div className="flex-1 divide-y divide-[rgb(var(--color-border))]">
              {category.items.map((item) => {
                const isEnabled = value.includes(item.value);

                return (
                  <div
                    key={item.value}
                    className="px-5 py-3 flex items-center justify-between hover:bg-[rgb(var(--color-background))]/30 transition-colors"
                  >
                    <div className="pr-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm font-medium ${isEnabled ? 'text-[rgb(var(--color-text))]' : 'text-[rgb(var(--color-text-muted))]'}`}
                        >
                          {item.label}
                        </span>
                      </div>
                      {item.description && (
                        <p className="text-[11px] text-[rgb(var(--color-text-muted))] mt-0.5 leading-tight">
                          {item.description}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggle(item.value)}
                      disabled={readOnly}
                      className={`
                                                relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none
                                                ${isEnabled ? activeTheme.toggle : 'bg-gray-100 dark:bg-gray-500'}
                                                ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}
                                            `}
                    >
                      <span
                        aria-hidden="true"
                        className={`
                                                    pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                                                    ${isEnabled ? 'translate-x-5' : 'translate-x-0'}
                                                `}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ModernPermissionsSelector;
