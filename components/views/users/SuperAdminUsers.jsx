import React, { useState, useEffect, useMemo } from 'react';
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from '@/hooks/useUsers';
import { useDealerships } from '@/hooks/useDealerships';
import { usePreference } from '@/context/PreferenceContext';
import DataTable from '../../common/DataTable';
import GenericFormPage from '../../common/GenericFormPage';
import FilterDrawer from '../../common/FilterDrawer';
import UserFilterContent from './UserFilterContent';
import Swal from 'sweetalert2';
import * as yup from 'yup';
import ActionMenuPortal from '../../common/ActionMenuPortal';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Ban,
  KeyRound,
  UserPlus,
  MoreVertical,
  Trash2,
  Eye,
  Edit,
  CheckCircle,
  User,
  Mail,
  Shield,
  Lock,
  Building2,
  CheckSquare,
  Camera,
  ChevronRight,
  ChevronDown,
  Clock,
  Activity,
  Filter,
  Fingerprint,
  User2,
  LucideActivitySquare,
} from 'lucide-react';
import userService from '../../../services/userService';
import auditService from '@/services/auditService';
import { SkeletonTable } from '@/components/common/Skeleton';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/LanguageContext';
import PageHeader from '@/components/common/PageHeader';
import TagInput from '../../common/tags/TagInput';
import TagList from '../../common/tags/TagList';
import tagService from '@/services/tagService';
import MultiSelect from '../../common/MultiSelect';

const PermissionsAccordion = ({ value = [], onChange, options = [] }) => {
  const { t } = useTranslation('users');
  const [expanded, setExpanded] = useState({});

  const grouped = useMemo(
    () =>
      options.reduce((acc, p) => {
        const category = p.code ? p.code.split('.')[0] : 'Other';
        const catLabel = category.charAt(0).toUpperCase() + category.slice(1);
        if (!acc[catLabel]) acc[catLabel] = [];
        acc[catLabel].push(p);
        return acc;
      }, {}),
    [options]
  );

  useEffect(() => {
    const defaults = Object.keys(grouped).reduce((acc, key) => ({ ...acc, [key]: true }), {});
    setExpanded(defaults);
  }, [grouped]);

  const toggleCategory = (cat) => {
    setExpanded((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  const togglePerm = (id) => {
    const current = new Set(value);
    if (current.has(id)) current.delete(id);
    else current.add(id);
    onChange(Array.from(current));
  };

  const handleSelectAll = (catPerms) => {
    const allIds = catPerms.map((p) => p.value);
    const current = new Set(value);
    const allSelected = allIds.every((id) => current.has(id));

    if (allSelected) {
      allIds.forEach((id) => current.delete(id));
    } else {
      allIds.forEach((id) => current.add(id));
    }
    onChange(Array.from(current));
  };

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([category, perms]) => {
        const isExpanded = expanded[category];
        const selectedCount = perms.filter((p) => value.includes(p.value)).length;
        const isAllSelected = perms.length > 0 && selectedCount === perms.length;

        return (
          <div
            key={category}
            className="bg-[rgb(var(--color-surface))] rounded-xl border border-[rgb(var(--color-border))] overflow-hidden shadow-sm transition-all hover:border-[rgb(var(--color-primary))]/30"
          >
            <div
              className="px-4 py-3 bg-[rgb(var(--color-background))]/50 border-b border-[rgb(var(--color-border))] flex items-center justify-between cursor-pointer select-none"
              onClick={() => toggleCategory(category)}
            >
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleCategory(category);
                  }}
                  className="p-1 hover:bg-[rgb(var(--color-background))] rounded-md transition-colors"
                >
                  {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-sm text-[rgb(var(--color-text))]">
                    {t('form.management', {
                      category: t(`permissions.categories.${category.toLowerCase()}`, {
                        defaultValue: category,
                      }),
                    })}
                  </h4>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[rgb(var(--color-background))] text-[rgb(var(--color-text-muted))] border border-[rgb(var(--color-border))]">
                    {selectedCount}/{perms.length}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectAll(perms);
                }}
                className="text-xs font-medium text-[rgb(var(--color-primary))] hover:text-[rgb(var(--color-primary-dark))] px-2 py-1 rounded hover:bg-[rgb(var(--color-primary))]/5 transition-colors"
              >
                {isAllSelected ? t('form.deselectAll') : t('form.selectAll')}
              </button>
            </div>

            {isExpanded && (
              <div className="divide-y divide-[rgb(var(--color-border))]">
                {perms.map((p) => (
                  <label
                    key={p.value}
                    className="flex items-start gap-3 p-3 pl-10 hover:bg-[rgb(var(--color-background))]/50 cursor-pointer transition-colors group"
                  >
                    <div className="relative flex items-center mt-0.5">
                      <input
                        type="checkbox"
                        checked={value.includes(p.value)}
                        onChange={() => togglePerm(p.value)}
                        className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] checked:border-[rgb(var(--color-primary))] checked:bg-[rgb(var(--color-primary))] focus:ring-2 focus:ring-[rgb(var(--color-primary))] focus:ring-offset-1 transition-all"
                      />
                      <CheckCircle
                        size={10}
                        className="pointer-events-none absolute left-0.5 top-0.5 text-white opacity-0 peer-checked:opacity-100"
                      />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-[rgb(var(--color-text))] group-hover:text-[rgb(var(--color-primary))] transition-colors">
                        {t(`permissions.${p.code}.label`, { defaultValue: p.label })}
                      </span>
                      {p.description && (
                        <p className="text-xs text-[rgb(var(--color-text-muted))] mt-0.5">
                          {t(`permissions.${p.code}.description`, { defaultValue: p.description })}
                        </p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

const SuperAdminUsers = ({
  users = [],
  roles: rolesProp = [],
  permissions: permissionsProp = [],
  dealerships: dealershipsProp = [],
  loading: loadingProp = false,
  onRefresh,
  activeFilters: activeFiltersProp,
  setActiveFilters: setActiveFiltersProp,
  ...paginationProps
}) => {
  const { preferences } = usePreference();
  const [viewMode, setViewMode] = useState('list');
  const { t } = useTranslation('users');
  const router = useRouter();
  const { startImpersonation } = useAuth();
  const searchParams = useSearchParams();
  const highlightId = searchParams.get('highlight');

  const [openActionMenu, setOpenActionMenu] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);

  // Filter state
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // Always use props if available, fallback to local for safety during transition
  const activeFilters = useMemo(
    () =>
      activeFiltersProp || {
        name: '',
        roles: [],
        statuses: [],
        dealership: '',
        tags: [],
      },
    [activeFiltersProp]
  );
  const setActiveFilters = setActiveFiltersProp || (() => {});

  // Temporary filters for the drawer
  const [tempFilters, setTempFilters] = useState(activeFilters);

  // Sync temp filters when drawer opens
  useEffect(() => {
    if (isFilterDrawerOpen) {
      setTempFilters(activeFilters);
    }
  }, [isFilterDrawerOpen, activeFilters]);

  const loading = loadingProp;

  const availablePermissions = useMemo(
    () =>
      (Array.isArray(permissionsProp) ? permissionsProp : []).map((p) => ({
        value: p.id,
        label: p.name,
        description: p.description,
        code: p.code,
      })),
    [permissionsProp]
  );

  const roles = useMemo(() => {
    const permMap = {};
    if (Array.isArray(permissionsProp)) {
      permissionsProp.forEach((p) => {
        permMap[p.code] = p.id;
      });
    }

    const formatted = (Array.isArray(rolesProp) ? rolesProp : [])
      .filter((r) => !(r.name || '').toLowerCase().includes('super'))
      .map((r) => {
        const defaults = [];
        if (Array.isArray(r.permissions)) {
          r.permissions.forEach((p) => {
            if (typeof p === 'string') {
              if (permMap[p]) defaults.push(permMap[p]);
            } else if (p && p.id) {
              defaults.push(p.id);
            } else if (p && p.code && permMap[p.code]) {
              defaults.push(permMap[p.code]);
            }
          });
        }
        return {
          label: t(`roles.${(r.name || '').toLowerCase().replace(/ /g, '_')}`, {
            defaultValue: r.name,
          }),
          value: r.id,
          code: r.name,
          default_permissions: defaults,
        };
      });

    return [...formatted];
  }, [rolesProp, permissionsProp, t]);

  const dealerships = useMemo(() => {
    if (!Array.isArray(dealershipsProp)) return [];
    return dealershipsProp.map((d) => ({ value: d.id, label: d.name }));
  }, [dealershipsProp]);

  const allUsers = useMemo(() => {
    return (Array.isArray(users) ? users : [])
      .filter((u) => {
        const roleName = u.role?.name || u.role;
        return roleName !== 'super_admin';
      })
      .map((u) => {
        const roleIdFromUser = u.role_id || u.roleId || u.role?.id;
        const roleCodeFromUser = typeof u.role === 'string' ? u.role : u.role?.code || u.role?.name;
        const matchedRole = (Array.isArray(roles) ? roles : []).find(
          (r) =>
            (roleIdFromUser && String(r.value) === String(roleIdFromUser)) ||
            (roleCodeFromUser && (r.code === roleCodeFromUser || r.label === roleCodeFromUser))
        );
        const roleId = matchedRole?.value || roleIdFromUser || null;
        const defaultPerms = matchedRole?.default_permissions || u.role?.permissions || [];

        let safeName = u.email;
        if (u.first_name && u.last_name) {
          safeName = `${u.first_name} ${u.last_name}`;
        } else if (u.name && typeof u.name === 'string') {
          safeName = u.name;
        }

        let safeRole = 'User';
        if (u.role) {
          const rawRole =
            typeof u.role === 'string' ? u.role : u.role.name || u.role.code || 'user';

          safeRole = rawRole
            .split(/[_\s]+/)
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
        }
        let safeWork = 'System';
        let dealershipId = null;
        const userDealers = u.dealerships || u.assigned_dealerships || [];

        if (Array.isArray(userDealers) && userDealers.length > 0) {
          safeWork = userDealers.map((d) => d.name).join(', ');
          dealershipId = userDealers.map((d) => d.id || d);
        } else if (u.dealership) {
          if (typeof u.dealership === 'string') {
            safeWork = u.dealership;
          } else if (u.dealership.name) {
            safeWork = u.dealership.name;
            dealershipId = u.dealership.id || null;
          }
        }

        return {
          ...u,
          id: u.id,
          name: safeName,
          role: safeRole,
          roleId: roleId,
          work: safeWork,
          dealershipId: dealershipId,
          status: (u.is_active !== undefined ? u.is_active : u.isActive) ? 'active' : 'inactive',
          permissions:
            u.permissions && u.permissions.length > 0
              ? u.permissions.map((p) => (typeof p === 'string' ? p : p.id))
              : u.user_permissions && u.user_permissions.length > 0
                ? u.user_permissions.map((p) => (typeof p === 'string' ? p : p.id))
                : defaultPerms,
          original_data: u,
        };
      });
  }, [users, roles]);

  const filteredUsers = useMemo(() => {
    return allUsers.filter((user) => {
      if (
        activeFilters.name &&
        !(user.name || '').toLowerCase().includes((activeFilters.name || '').toLowerCase())
      ) {
        return false;
      }

      if (activeFilters.roles.length > 0 && !activeFilters.roles.includes(user.roleId)) {
        return false;
      }

      if (activeFilters.statuses.length > 0 && !activeFilters.statuses.includes(user.status)) {
        return false;
      }

      if (
        activeFilters.dealership &&
        String(user.dealership?.id || user.dealership_id || '') !== String(activeFilters.dealership)
      ) {
        return false;
      }

      if (activeFilters.tags && activeFilters.tags.length > 0) {
        // Check if user has ANY of the selected tags
        const userTags = user.tags ? user.tags.map((t) => t.id) : [];
        const hasTag = activeFilters.tags.some((tagId) => userTags.includes(tagId));
        if (!hasTag) return false;
      }

      return true;
    });
  }, [allUsers, activeFilters]);

  const userTagOptions = useMemo(() => {
    const tagsMap = new Map();
    allUsers.forEach((u) => {
      (u.tags || []).forEach((tag) => {
        const id = typeof tag === 'object' ? tag.id : tag;
        if (id) {
          tagsMap.set(id, typeof tag === 'object' ? tag : { id, name: id });
        }
      });
    });
    return Array.from(tagsMap.values());
  }, [allUsers]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (activeFilters.name) count++;
    if (activeFilters.roles.length > 0) count++;
    if (activeFilters.statuses.length > 0) count++;
    if (activeFilters.dealership) count++;
    if (activeFilters.tags && activeFilters.tags.length > 0) count++;
    return count;
  }, [activeFilters]);

  useEffect(() => {
    const handleClickOutside = () => setOpenActionMenu(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const handleSaveUser = async (data) => {
    const payload = {
      ...data,
      permission_ids: (data.permission_ids || []).map((p) => (typeof p === 'object' ? p.value : p)),
      role: undefined,
      permissions: undefined,
      dealershipId: undefined,
      tags: undefined,
    };

    // Ensure status is formatted correctly for API (Title Case) and sync is_active
    if (payload.status) {
      const lowerStatus = payload.status.toLowerCase();
      payload.status = lowerStatus.charAt(0).toUpperCase() + lowerStatus.slice(1);
      payload.is_active = lowerStatus === 'active';
    }

    // Handle plural dealership assignment
    if (payload.dealership_id && Array.isArray(payload.dealership_id)) {
      // Send plural to backend as dealership_ids to preserve all selections
      payload.dealership_ids = payload.dealership_id;
      // Sync singular dealership_id for backward compatibility (primary dealership)
      payload.dealership_id = payload.dealership_id.length > 0 ? payload.dealership_id[0] : null;
    }

    if (payload.role_id) {
      const r = (Array.isArray(roles) ? roles : []).find((item) => item.value === payload.role_id);
      if (r && (r.code === 'user' || r.code === 'admin')) {
        payload.dealership_id = null;
        payload.dealership_id = [];
      }
    }

    try {
      let finalPayload = payload;

      // If a file is selected, we MUST use FormData for both Create and Update
      if (selectedFile) {
        const formData = new FormData();

        // Append all regular fields
        Object.keys(payload).forEach((key) => {
          const value = payload[key];
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              // Handle arrays (like permission_ids) if backend expects them specifically
              value.forEach((v) => formData.append(`${key}[]`, v));
            } else {
              formData.append(key, value);
            }
          }
        });

        // Append the file
        formData.append('profile_picture', selectedFile);
        finalPayload = formData;
      }

      if (editingUser) {
        console.log('Updating user with payload:', finalPayload);
        await userService.updateUser(editingUser.id, finalPayload);

        // Sync Tags
        if (data.tags) {
          try {
            const tagIds = data.tags.map((t) => t.id);
            await tagService.syncTags('user', editingUser.id, tagIds);
          } catch (tagError) {
            console.error('Failed to sync tags during update:', tagError);
            Swal.fire({
              icon: 'warning',
              title: 'User Updated',
              text: 'User details updated, but tags could not be synced.',
              timer: 3000,
            });
          }
        }

        Swal.fire({
          icon: 'success',
          title: t('messages.userUpdated'),
          text: t('messages.detailsUpdated'),
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        const newUser = await userService.createUser(finalPayload);

        // Sync Tags (newUser might be the response object or data)
        const newUserId = newUser?.id || newUser?.data?.id;
        if (newUserId && data.tags) {
          try {
            const tagIds = data.tags.map((t) => t.id);
            await tagService.syncTags('user', newUserId, tagIds);
          } catch (tagError) {
            console.error('Failed to sync tags during creation:', tagError);
            // Optional: Show a warning toast if tags failed, but keep success flow
            Swal.fire({
              icon: 'warning',
              title: 'User Created',
              text: 'User created successfully, but tags could not be applied.',
              timer: 3000,
            });
          }
        }

        Swal.fire({
          icon: 'success',
          title: t('messages.userCreated'),
          text: t('messages.newAdded'),
          timer: 1500,
          showConfirmButton: false,
        });
      }
      setViewMode('list');
      setEditingUser(null);
      setSelectedFile(null);
      onRefresh?.();
    } catch (error) {
      console.error('Save error:', error);
      Swal.fire('Error', error?.response?.data?.message || 'Failed to save user.', 'error');
    }
  };

  const handleAction = async (action, user) => {
    setOpenActionMenu(null);

    if (action === 'suspend') {
      const isSuspended = user.status === 'suspended';
      Swal.fire({
        title: isSuspended ? t('messages.activateUser') : t('messages.suspendUser'),
        text: isSuspended
          ? t('messages.confirmActivate', { name: user.name })
          : t('messages.confirmSuspend', { name: user.name }),
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: isSuspended ? '#10B981' : '#d33',
        confirmButtonText: isSuspended ? t('activate') : t('suspend'),
      }).then(async (result) => {
        // Async here
        if (result.isConfirmed) {
          try {
            const statusToSet = isSuspended ? true : false;
            await userService.updateUser(user.id, { is_active: statusToSet });
            onRefresh?.();
            Swal.fire(
              isSuspended ? t('messages.processed') : t('messages.processed'),
              '',
              'success'
            );
          } catch (e) {
            Swal.fire('Error', e?.response?.data?.message || 'Action failed', 'error');
          }
        }
      });
    } else if (action === 'password') {
      const { value: formValues } = await Swal.fire({
        title: t('messages.resetPasswordTitle'),
        html: `
                    <div style="text-align: left;">
                        <p style="margin-bottom: 15px;">${t('messages.resetPasswordInstr', { name: user.name })}</p>
                        <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                            <input type="radio" id="auto" name="resetType" value="auto" checked onchange="
                                document.getElementById('custom-pass-container').style.display = 'none';
                            ">
                            <label for="auto">${t('messages.autoGenerate')}</label>
                            
                            <input type="radio" id="custom" name="resetType" value="custom" onchange="
                                document.getElementById('custom-pass-container').style.display = 'block';
                            ">
                            <label for="custom">${t('messages.setManually')}</label>
                        </div>
                        <div id="custom-pass-container" style="display: none;">
                            <div style="position: relative; display: flex; align-items: center;">
                                <input id="swal-new-password" type="password" class="swal2-input" placeholder="${t('form.password')}" style="margin: 0; width: 100%; padding-right: 40px;">
                                <span id="toggle-password-visibility" style="position: absolute; right: 10px; cursor: pointer; color: #6b7280; display: flex; align-items: center;">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>
                                    </svg>
                                </span>
                            </div>
                        </div>
                    </div>
                `,
        showCancelButton: true,
        confirmButtonText: t('resetPassword'),
        focusConfirm: false,
        preConfirm: () => {
          const type = document.querySelector('input[name="resetType"]:checked').value;
          const newPassword = document.getElementById('swal-new-password').value;

          if (type === 'custom') {
            if (!newPassword) Swal.showValidationMessage(t('validation.passwordRequired'));
            if (newPassword.length < 6) Swal.showValidationMessage(t('validation.passwordMin'));
            return { autoGenerate: false, newPassword };
          }
          return { autoGenerate: true };
        },
        didOpen: () => {
          const toggleBtn = document.getElementById('toggle-password-visibility');
          const input = document.getElementById('swal-new-password');

          if (toggleBtn && input) {
            toggleBtn.addEventListener('click', () => {
              if (input.type === 'password') {
                input.type = 'text';
                toggleBtn.innerHTML =
                  '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>';
              } else {
                input.type = 'password';
                toggleBtn.innerHTML =
                  '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>';
              }
            });
          }
        },
      });

      if (formValues) {
        try {
          const result = await userService.resetPassword(user.id, formValues);

          if (formValues.autoGenerate && result.temporaryPassword) {
            await Swal.fire({
              title: t('messages.resetSuccessTitle'),
              html: `
                                <p>${t('messages.resetSuccessBody')}</p>
                                <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
                                    <p style="margin: 0; font-size: 0.9em; color: #6b7280;">${t('messages.tempPassword')}</p>
                                    <p style="margin: 5px 0 0 0; font-family: monospace; font-size: 1.2em; font-weight: bold; letter-spacing: 1px;">${result.temporaryPassword}</p>
                                </div>
                                <p style="font-size: 0.9em;">${t('messages.emailSent')}</p>
                            `,
              icon: 'success',
            });
          } else {
            Swal.fire(t('messages.success'), t('messages.emailSent'), 'success');
          }
        } catch (error) {
          console.error('Reset error:', error);
          Swal.fire(
            'Error',
            error?.response?.data?.message || 'Failed to reset password.',
            'error'
          );
        }
      }
    } else if (action === 'delete') {
      Swal.fire({
        title: t('delete'),
        text: t('messages.confirmDelete'),
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        confirmButtonText: t('messages.yesDelete'),
      }).then(async (result) => {
        if (result.isConfirmed) {
          try {
            await userService.deleteUser(user.id);
            onRefresh?.();
            Swal.fire(t('messages.userDeleted'), t('messages.deletedSuccess'), 'success');
          } catch (error) {
            Swal.fire('Error', error?.response?.data?.message || 'Failed to delete user.', 'error');
          }
        }
      });
    } else if (action === 'view') {
      router.push(`/users/${user.id}`);
    } else if (action === 'edit') {
      try {
        // Fetch fresh user details (essential for multi-dealership arrays not in list view)
        // and tags in parallel
        const [fullUser, tags] = await Promise.all([
          userService.getUserById(user.id),
          tagService.getEntityTags('user', user.id).catch((e) => {
            console.error('Failed to fetch user tags', e);
            return [];
          }),
        ]);

        // fullUser might be wrapped in a data property depending on API response structure
        const userData = fullUser.data || fullUser;

        setEditingUser({ ...userData, tags });
      } catch (error) {
        console.error('Failed to fetch user details', error);
        // Fallback to list data if fetch fails, but warn
        Swal.fire({
          icon: 'warning',
          title: 'Partial Data',
          text: 'Could not fetch latest user details. Editing with cached data.',
          timer: 2000,
        });
        setEditingUser({ ...user, tags: [] });
      }
      setViewMode('form');
    } else if (action === 'impersonate') {
      try {
        await startImpersonation(user.id);
      } catch (error) {
        // Error handled in startImpersonation
      }
    }
  };

  const handleSelectionChange = (ids) => {
    setSelectedUserIds(ids);
  };

  const handleBulkAction = (action) => {
    if (selectedUserIds.length === 0) return;

    const actionText =
      action === 'delete' ? 'Delete' : action === 'suspend' ? 'Suspend' : 'Activate';
    const confirmText =
      action === 'delete' ? 'permanently delete' : action === 'suspend' ? 'suspend' : 'activate';
    const confirmColor =
      action === 'delete' ? '#d33' : action === 'suspend' ? '#f59e0b' : '#10B981';

    Swal.fire({
      title: `${actionText} ${selectedUserIds.length} Users?`,
      text: `Are you sure you want to ${confirmText} the selected users?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: confirmColor,
      confirmButtonText: `Yes, ${actionText}`,
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          if (action === 'delete') {
            await Promise.all(selectedUserIds.map((id) => userService.deleteUser(id)));
          } else if (action === 'suspend') {
            await userService.bulkDeactivate(selectedUserIds);
          } else if (action === 'activate') {
            await userService.bulkActivate(selectedUserIds);
          }

          onRefresh?.();
          setSelectedUserIds([]);
          Swal.fire(
            t('messages.processed'),
            t('messages.bulkProcessed', { count: selectedUserIds.length, action: action }),
            'success'
          );
        } catch (error) {
          console.error('Bulk action failed', error);
          Swal.fire(
            'Error',
            error?.response?.data?.message || 'Failed to process bulk action.',
            'error'
          );
        }
      }
    });
  };

  const validationSchema = useMemo(
    () =>
      yup.object().shape({
        first_name: yup
          .string()
          .required(t('validation.firstNameRequired'))
          .matches(/^[A-Za-z\s'-]+$/, t('validation.nameInvalid')),
        last_name: yup
          .string()
          .required(t('validation.lastNameRequired'))
          .matches(/^[A-Za-z\s'-]+$/, t('validation.nameInvalid')),
        email: yup
          .string()
          .email(t('validation.emailInvalid'))
          .matches(/^[a-z0-9._-]+@[a-z0-9.-]+\.[a-z]{2,}$/, 'Email must be lowercase and valid')
          .required(t('validation.emailRequired')),
        phone_number: yup
          .string()
          .required(t('validation.phoneRequired'))
          .matches(/^[0-9]{10}$/, t('validation.phoneInvalid')),
        role_id: yup.string().required(t('validation.roleRequired')),
        dealership_id: yup.array().of(yup.string()).nullable(),
        status: yup.string().required(t('validation.statusRequired')),
        password: editingUser
          ? yup
              .string()
              .transform((curr) => (curr === '' ? null : curr))
              .nullable()
              .min(6, t('validation.passwordMin'))
          : yup
              .string()
              .required(t('validation.passwordRequired'))
              .min(6, t('validation.passwordMin')),
        confirmPassword: editingUser
          ? yup
              .string()
              .transform((curr) => (curr === '' ? null : curr))
              .nullable()
              .oneOf([yup.ref('password'), null], t('validation.passwordMatch'))
          : yup
              .string()
              .required('Confirm Password is required')
              .oneOf([yup.ref('password'), null], t('validation.passwordMatch')),
      }),
    [editingUser, t]
  );

  const fields = useMemo(
    () => [
      {
        type: 'section',
        title: t('form.personalInfo'),
        icon: User,
        fields: [
          {
            type: 'row',
            fields: [
              {
                name: 'first_name',
                label: t('form.firstName'),
                type: 'text',
                placeholder: t('form.firstNamePlaceholder'),
                required: true,
                onChange: (value, { setValue }) => {
                  const clean = value.replace(/[^A-Za-z\s'-]/g, '');
                  if (clean !== value) setValue('first_name', clean);
                },
              },
              {
                name: 'last_name',
                label: t('form.lastName'),
                type: 'text',
                placeholder: t('form.lastNamePlaceholder'),
                required: true,
                onChange: (value, { setValue }) => {
                  const clean = value.replace(/[^A-Za-z\s'-]/g, '');
                  if (clean !== value) setValue('last_name', clean);
                },
              },
            ],
          },
          {
            type: 'row',
            fields: [
              {
                name: 'email',
                label: t('form.email'),
                type: 'email',
                placeholder: t('form.emailPlaceholder'),
                required: true,
              },
              {
                name: 'phone_number',
                label: t('form.phone'),
                type: 'text',
                placeholder: t('form.phonePlaceholder'),
                onChange: (value, { setValue }) => {
                  const clean = value.replace(/[^0-9]/g, '');
                  if (clean !== value) setValue('phone_number', clean);
                },
              },
            ],
          },
          {
            type: 'row',
            fields: [
              {
                name: 'tags',
                label: t('form.tags', 'Tags'),
                type: 'custom',
                component: TagInput,
                props: { type: 'user', placeholder: t('form.tagPlaceholder', 'Add user tags...') },
                className: 'col-span-2',
              },
            ],
          },
        ],
      },
      {
        type: 'section',
        title: t('form.roleAccess'),
        icon: Shield,
        fields: [
          {
            type: 'row',
            fields: [
              {
                name: 'role_id',
                label: t('form.role'),
                type: 'select',
                options: roles,
                icon: User2,
                required: true,
                onChange: (value, { setValue }) => {
                  const selectedRole = (Array.isArray(roles) ? roles : []).find(
                    (r) => r.value === value
                  );
                  if (selectedRole) {
                    setValue('permission_ids', selectedRole.default_permissions || []);
                  }
                },
              },
              {
                name: 'status',
                label: t('form.status', 'Status'),
                type: 'select',
                icon: LucideActivitySquare,
                placeholder: t('form.selectStatus', 'Select Status'),
                options: [
                  { value: 'active', label: t('statuses.active') },
                  { value: 'inactive', label: t('statuses.inactive') },
                  { value: 'suspended', label: t('statuses.suspended') },
                ],
                required: true,
              },
            ],
          },
          {
            name: 'dealership_id',
            label: t('form.assignedDealership'),
            type: 'custom',
            component: MultiSelect,
            props: {
              options: dealerships,
              placeholder: t('form.selectDealership'),
            },
            showIf: (values) => {
              const r = (Array.isArray(roles) ? roles : []).find(
                (item) => item.value === values.role_id
              );
              return (
                r &&
                (r.code === 'dealer' ||
                  r.code === 'dealer_manager' ||
                  r.code === 'manager' ||
                  r.code === 'staff')
              );
            },
          },
          {
            name: 'permission_ids',
            label: t('form.customPermissions'),
            type: 'custom',
            component: PermissionsAccordion,
            props: { options: availablePermissions },
          },
        ],
      },
      {
        type: 'section',
        title: t('form.security'),
        icon: Lock,
        fields: [
          {
            type: 'row',
            fields: [
              {
                name: 'password',
                label: t('form.password'),
                type: 'password',
                placeholder: '••••••••',
                required: !editingUser, // Required only on create
              },
              {
                name: 'confirmPassword',
                label: t('form.confirmPassword'),
                type: 'password',
                placeholder: '••••••••',
                required: !editingUser,
              },
            ],
          },
        ],
      },
    ],
    [roles, dealerships, availablePermissions, editingUser, t]
  );

  if (viewMode === 'form') {
    return (
      <GenericFormPage
        title={editingUser?.id ? t('form.editTitle') : t('form.createTitle')}
        subtitle={
          editingUser?.id
            ? t('form.editSubtitle', { name: editingUser.name })
            : t('form.createSubtitle')
        }
        initialData={{
          id: editingUser?.id,
          avatar:
            editingUser?.avatar ||
            editingUser?.profile_image ||
            editingUser?.profile_picture ||
            editingUser?.profilePicture ||
            editingUser?.image ||
            editingUser?.picture ||
            '',
          first_name: editingUser?.first_name || editingUser?.firstName || '',
          last_name: editingUser?.last_name || editingUser?.lastName || '',
          email: editingUser?.email || '',
          phone_number: editingUser?.phone_number || editingUser?.phoneNumber || '',
          role_id: (() => {
            const rId = editingUser?.roleId || editingUser?.role_id || editingUser?.role?.id;
            const rName =
              typeof editingUser?.role === 'string'
                ? editingUser.role
                : editingUser?.role?.code || editingUser?.role?.name;
            const matched = (Array.isArray(roles) ? roles : []).find(
              (r) =>
                (rId && String(r.value) === String(rId)) ||
                (rName && (r.code === rName || r.label === rName || r.code === rName.toLowerCase()))
            );
            return matched ? matched.value : rId || '';
          })(),
          status: editingUser
            ? (
                editingUser?.status || (editingUser?.is_active ? 'active' : 'inactive')
              ).toLowerCase()
            : '',
          dealership_id: (() => {
            const dIds =
              editingUser?.dealership_id ||
              editingUser?.dealershipIds ||
              editingUser?.assigned_dealerships;
            if (Array.isArray(dIds) && dIds.length > 0) {
              return dIds.map((d) => (typeof d === 'object' ? String(d.id || d.value) : String(d)));
            }

            // Fallback to single ID if plural not available
            const singleId =
              editingUser?.dealership_id ||
              editingUser?.dealershipId ||
              editingUser?.dealership?.id;
            return singleId && singleId !== '' ? [String(singleId)] : [];
          })(),
          permission_ids: editingUser?.permissions || editingUser?.user_permissions || [],
          tags: editingUser?.tags || [],
          password: '',
          confirmPassword: '',
        }}
        fields={fields}
        validationSchema={validationSchema}
        onSave={handleSaveUser}
        onCancel={() => {
          setViewMode('list');
          setEditingUser(null);
          setSelectedFile(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        subtitle={t('subtitle')}
        actions={
          <button
            onClick={() => {
              setEditingUser(null);
              setViewMode('form');
            }}
            className="flex items-center gap-2 bg-[rgb(var(--color-primary))] text-white px-4 py-2 rounded-lg hover:bg-[rgb(var(--color-primary-dark))] transition-all shadow-lg"
          >
            <UserPlus size={18} />
            <span>Add New User</span>
          </button>
        }
      />

      {loading ? (
        <div className="p-6 overflow-hidden">
          <SkeletonTable rows={5} />
        </div>
      ) : (
        <DataTable
          onFilterClick={() => setIsFilterDrawerOpen(true)}
          onClearFilters={() => {
            setActiveFilters({ name: '', roles: [], statuses: [], dealership: '', tags: [] });
            setTempFilters({ name: '', roles: [], statuses: [], dealership: '', tags: [] });
          }}
          showClearFilter={Object.values(activeFilters).some((v) =>
            Array.isArray(v) ? v.length > 0 : v !== ''
          )}
          data={filteredUsers}
          searchKeys={['name', 'email', 'work']}
          highlightId={highlightId}
          manualFiltering={true} // Ensure server-side data is displayed directly
          columns={[
            { header: t('table.name'), accessor: 'name', sortable: true, className: 'font-bold' },
            {
              header: t('table.email'),
              accessor: 'email',
              className: 'text-[rgb(var(--color-text-muted))]',
            },
            {
              header: t('table.role'),
              type: 'badge',
              accessor: 'role',
              config: {
                purple: ['admin'],
                blue: ['dealer manager', 'manager'],
                orange: ['staff', 'support staff'],
              },
            },
            {
              header: t('table.tags', 'Tags'),
              accessor: (row) => <TagList tags={row.tags || []} limit={2} />,
              className: 'min-w-[150px]',
            },
            // {header: 'Work', accessor: 'work' },
            {
              header: t('table.status'),
              type: 'badge',
              accessor: 'status',
              config: {
                green: ['Active'],
                gray: ['Inactive'],
                red: ['Suspended'],
              },
            },
            {
              header: t('table.actions'),
              className: 'text-center',
              accessor: (row) => (
                <div className="relative flex justify-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Convert DOMRect to plain object to ensure properties are preserved in state
                      const domRect = e.currentTarget.getBoundingClientRect();
                      const rect = {
                        top: domRect.top,
                        bottom: domRect.bottom,
                        left: domRect.left,
                        right: domRect.right,
                        width: domRect.width,
                        height: domRect.height,
                        mouseX: e.clientX,
                        mouseY: e.clientY,
                      };

                      // Manual positioning with overflow handling
                      // w-48 is 192px. Align right edge of menu with right edge of trigger.
                      let position = { top: rect.bottom + 4, left: rect.right - 192 };

                      // Check if menu fits below (assuming ~300px height for safety)
                      const spaceBelow = window.innerHeight - rect.bottom;
                      if (spaceBelow < 300) {
                        // Flip to top - Anchor to bottom of menu to top of button
                        // bottom = distance from viewport bottom to button top - 8px padding (aggressive overlap)
                        const bottom = window.innerHeight - rect.top - 8;
                        position = { bottom, left: rect.right - 192 };
                      }

                      if (openActionMenu?.id === row.id) {
                        setOpenActionMenu(null);
                      } else {
                        setOpenActionMenu({
                          id: row.id,
                          position,
                          align: 'end',
                        });
                      }
                    }}
                    className={`p-1.5 rounded-lg transition-colors ${openActionMenu?.id === row.id ? 'bg-[rgb(var(--color-primary))] text-[rgb(var(--color-text))] ' : 'text-[rgba(var(--color-text-muted))] hover:bg-[rgba(var(--color-primary))] hover:text-[rgb(var(--color-text))] '}`}
                  >
                    <MoreVertical size={16} />
                  </button>
                </div>
              ),
            },
          ]}
          loading={loading}
          itemsPerPage={preferences.items_per_page || 10}
          searchPlaceholder="Search users by name, email, or role..."
          onSelectionChange={handleSelectionChange}
          selectedIds={selectedUserIds}
        />
      )}

      {selectedUserIds.length > 0 && (
        <div className="fixed bottom-0 left-0 lg:left-[280px] right-0 bg-[rgb(var(--color-surface))] border-t border-[rgb(var(--color-border))] p-4 md:p-6 z-50 shadow-xl">
          <div className="flex flex-col md:flex-row items-center justify-between md:justify-center gap-4 md:gap-8 max-w-7xl mx-auto">
            <span className="text-base font-medium text-[rgb(var(--color-text))] whitespace-nowrap">
              <span className="font-bold text-[rgb(var(--color-primary))] text-lg">
                {selectedUserIds.length}
              </span>{' '}
              <span className="hidden sm:inline">
                {t('table.selected', { count: '' })
                  .replace(selectedUserIds.length, '')
                  .replace(' ', '')}
              </span>
            </span>

            <div className="hidden md:block h-8 w-px bg-[rgb(var(--color-border))]"></div>

            <div className="flex flex-wrap justify-center items-center gap-3 md:gap-6 w-full md:w-auto">
              <button
                onClick={() => handleBulkAction('activate')}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[rgb(var(--color-success))]/10 text-[rgb(var(--color-success))] hover:bg-[rgb(var(--color-success))]/20 transition-colors font-medium text-sm whitespace-nowrap border border-[rgb(var(--color-success))]/20"
                title={t('activate')}
              >
                <CheckCircle size={18} /> {t('activate')}
              </button>
              <button
                onClick={() => handleBulkAction('suspend')}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[rgb(var(--color-warning))]/10 text-[rgb(var(--color-warning))] hover:bg-[rgb(var(--color-warning))]/20 transition-colors font-medium text-sm whitespace-nowrap border border-[rgb(var(--color-warning))]/20"
                title={t('suspend')}
              >
                <Ban size={18} /> {t('suspend')}
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[rgb(var(--color-error))]/10 text-[rgb(var(--color-error))] hover:bg-[rgb(var(--color-error))]/20 transition-colors font-medium text-sm whitespace-nowrap border border-[rgb(var(--color-error))]/20"
                title={t('delete')}
              >
                <Trash2 size={18} /> {t('delete')}
              </button>
            </div>

            <div className="hidden md:block h-8 w-px bg-[rgb(var(--color-border))]"></div>

            <button
              onClick={() => setSelectedUserIds([])}
              className="text-sm font-semibold text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))] transition-colors w-full md:w-auto text-center"
            >
              {t('table.cancelSelection')}
            </button>
          </div>
        </div>
      )}

      {openActionMenu && (
        <ActionMenuPortal
          isOpen={!!openActionMenu}
          onClose={() => setOpenActionMenu(null)}
          position={openActionMenu.position}
          align={openActionMenu.align || 'end'}
        >
          <button
            onClick={() =>
              handleAction(
                'view',
                (Array.isArray(allUsers) ? allUsers : []).find((u) => u.id === openActionMenu.id)
              )
            }
            className="w-full text-left px-4 py-2 text-sm text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-background))] flex items-center gap-2"
          >
            <Eye size={14} /> {t('view')}
          </button>
          <button
            onClick={() =>
              handleAction(
                'edit',
                (Array.isArray(allUsers) ? allUsers : []).find((u) => u.id === openActionMenu.id)
              )
            }
            className="w-full text-left px-4 py-2 text-sm text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-background))] flex items-center gap-2"
          >
            <Edit size={14} /> {t('edit')}
          </button>
          <button
            onClick={() =>
              handleAction(
                'password',
                (Array.isArray(allUsers) ? allUsers : []).find((u) => u.id === openActionMenu.id)
              )
            }
            className="w-full text-left px-4 py-2 text-sm text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-background))] flex items-center gap-2"
          >
            <KeyRound size={14} /> {t('resetPassword')}
          </button>
          {openActionMenu &&
            (() => {
              const selectedUser = (Array.isArray(allUsers) ? allUsers : []).find(
                (u) => u.id === openActionMenu.id
              );
              const isOtherAdmin = selectedUser?.role?.toLowerCase().includes('admin');
              if (!isOtherAdmin) {
                return (
                  <button
                    onClick={() => handleAction('impersonate', selectedUser)}
                    className="w-full text-left px-4 py-2 text-sm text-[rgb(var(--color-primary))] hover:bg-[rgb(var(--color-primary))]/5 flex items-center gap-2"
                  >
                    <Fingerprint size={14} /> {t('impersonate')}
                  </button>
                );
              }
              return null;
            })()}
          <div className="h-px bg-[rgb(var(--color-border))] my-1"></div>
          <button
            onClick={() =>
              handleAction(
                'delete',
                (Array.isArray(allUsers) ? allUsers : []).find((u) => u.id === openActionMenu.id)
              )
            }
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
          >
            <Trash2 size={14} /> {t('delete')}
          </button>
        </ActionMenuPortal>
      )}

      {/* Filter Drawer */}
      <FilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        onApply={() => {
          setActiveFilters(tempFilters);
          setIsFilterDrawerOpen(false);
        }}
        onReset={() => {
          const emptyFilters = {
            name: '',
            roles: [],
            statuses: [],
            dealership: '',
            tags: [],
          };
          setTempFilters(emptyFilters);
          setActiveFilters(emptyFilters);
        }}
        title={t('filters.title')}
      >
        <UserFilterContent
          activeFilters={tempFilters}
          setActiveFilters={setTempFilters}
          roles={roles}
          dealerships={dealerships}
          tagOptions={userTagOptions}
        />
      </FilterDrawer>
    </div>
  );
};

export default React.memo(SuperAdminUsers);
