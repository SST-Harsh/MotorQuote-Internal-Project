import React, { useState, useEffect, useMemo } from 'react';
import {
  useUsers,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  useSuspendUser,
  useRestoreUser,
  useEnable2FA,
  useDisable2FA,
} from '@/hooks/useUsers';
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
  ShieldCheck,
} from 'lucide-react';
import userService from '../../../services/userService';
import auditService from '@/services/auditService';
import { SkeletonTable } from '@/components/common/Skeleton';
import { useAuth } from '@/context/AuthContext';
import PageHeader from '@/components/common/PageHeader';
import TagInput from '../../common/tags/TagInput';
import TagList from '../../common/tags/TagList';
import tagService from '@/services/tagService';
import MultiSelect from '../../common/MultiSelect';
import PhoneInput from '../../common/PhoneInput';
import {
  canCreateUsers,
  canEditUsers,
  canDeleteUsers,
  hasPermission,
  canImpersonate,
  normalizeRole,
} from '@/utils/roleUtils';

const normalizePermissionIds = (input) => {
  if (!Array.isArray(input)) return [];
  const ids = input
    .map((p) => {
      if (!p) return null;
      if (typeof p === 'string') return p;
      if (typeof p === 'number') return String(p);
      if (typeof p === 'object') {
        if (p.value) return String(p.value);
        if (p.id) return String(p.id);
      }
      return null;
    })
    .filter(Boolean);

  return Array.from(new Set(ids));
};

import ModernPermissionsSelector from '../../common/ModernPermissionsSelector';

const SuperAdminUsers = ({
  users = [],
  roles: rolesProp = [],
  permissions: permissionsProp = [],
  dealerships: dealershipsProp = [],
  loading: loadingProp = false,
  onRefresh,
  activeFilters: activeFiltersProp,
  setActiveFilters: setActiveFiltersProp,
}) => {
  const { preferences } = usePreference();
  const [viewMode, setViewMode] = useState('list');
  const router = useRouter();
  const sidebarState =
    typeof window !== 'undefined' ? localStorage.getItem('sidebar-collapsed') : 'false';
  const isSidebarCollapsed = sidebarState === 'true';

  const { user: currentUser, startImpersonation } = useAuth();
  const canCreate = canCreateUsers(currentUser);
  const canEdit = canEditUsers(currentUser);
  const canDelete = canDeleteUsers(currentUser);
  const canImpersonateUser = canImpersonate(currentUser);
  const canManage2FA = hasPermission(currentUser, 'users.2fa');

  const searchParams = useSearchParams();
  const highlightId = searchParams.get('highlightId') || searchParams.get('highlight');

  // Initialize mutations for suspend and restore
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const suspendUserMutation = useSuspendUser();
  const restoreUserMutation = useRestoreUser();
  const enable2faMutation = useEnable2FA();
  const disable2faMutation = useDisable2FA();

  const [openActionMenu, setOpenActionMenu] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);

  // Filter state
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [recentlyChangedUsers, setRecentlyChangedUsers] = useState({});

  // Always use props if available, fallback to local for safety during transition
  // Base keys for persistence
  const USER_FILTERS_KEY = 'super_admin_users_filters';

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

  const setActiveFilters = (filters) => {
    if (setActiveFiltersProp) setActiveFiltersProp(filters);
  };

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
      .filter((r) => {
        const name = (r.name || '').toLowerCase();
        return !name.includes('super') && name !== 'admin';
      })
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
          label: r.name,
          value: r.id,
          code: r.name,
          default_permissions: defaults,
        };
      });

    return [...formatted];
  }, [rolesProp, permissionsProp]);

  const dealerships = useMemo(() => {
    if (!Array.isArray(dealershipsProp)) return [];
    return dealershipsProp.map((d) => ({ value: d.id, label: d.name }));
  }, [dealershipsProp]);

  const allUsers = useMemo(() => {
    const propUsersArray = Array.isArray(users) ? users : [];

    // Combine prop users with recently changed users not in props
    const combinedUsers = [...propUsersArray];
    const propIds = new Set(propUsersArray.map((u) => u.id));

    Object.values(recentlyChangedUsers).forEach((u) => {
      if (!propIds.has(u.id)) {
        combinedUsers.push(u);
      }
    });

    return combinedUsers
      .filter((u) => {
        const roleName = (u.role?.name || u.role?.code || u.role || '').toLowerCase();
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
          status:
            u.status?.toLowerCase() === 'suspended'
              ? 'suspended'
              : (u.is_active !== undefined ? u.is_active : u.isActive)
                ? 'active'
                : 'inactive',
          permissions:
            u.permissions && u.permissions.length > 0
              ? u.permissions.map((p) => (typeof p === 'string' ? p : p.id))
              : u.user_permissions && u.user_permissions.length > 0
                ? u.user_permissions.map((p) => (typeof p === 'string' ? p : p.id))
                : defaultPerms,
          original_data: u,
        };
      });
  }, [users, roles, recentlyChangedUsers]);

  const filteredUsers = useMemo(() => {
    return allUsers.filter((user) => {
      if (activeFilters.name) {
        const lowerSearch = activeFilters.name.toLowerCase();
        const matchesSearch =
          (user.name || '').toLowerCase().includes(lowerSearch) ||
          (user.email || '').toLowerCase().includes(lowerSearch) ||
          (user.role || '').toLowerCase().includes(lowerSearch) ||
          (user.work || '').toLowerCase().includes(lowerSearch);

        if (!matchesSearch) return false;
      }

      if (activeFilters.roles.length > 0 && !activeFilters.roles.includes(user.roleId)) {
        return false;
      }

      // Exclude suspended users by default from User Management list
      // Only show them if explicitly filtering for suspended status
      if (
        user.status === 'suspended' &&
        (!activeFilters.statuses || activeFilters.statuses.length === 0)
      ) {
        return false;
      }

      if (activeFilters.statuses.length > 0 && !activeFilters.statuses.includes(user.status)) {
        // If the user was recently changed locally, keep them in the view
        if (!recentlyChangedUsers[user.id]) {
          return false;
        }
      }

      if (activeFilters.dealership) {
        const userDealers = Array.isArray(user.dealershipId)
          ? user.dealershipId
          : [user.dealershipId];
        if (!userDealers.some((d) => d && String(d) === String(activeFilters.dealership))) {
          return false;
        }
      }

      if (activeFilters.tags && activeFilters.tags.length > 0) {
        // Check if user has ANY of the selected tags
        const userTags = user.tags ? user.tags.map((t) => t.id) : [];
        const hasTag = activeFilters.tags.some((tagId) => userTags.includes(tagId));
        if (!hasTag) return false;
      }

      return true;
    });
  }, [allUsers, activeFilters, recentlyChangedUsers]);

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

    // Clean up empty passwords on edit so we don't send empty strings to API
    if (!payload.password) {
      delete payload.password;
    }
    if (!payload.confirmPassword) {
      delete payload.confirmPassword;
    }

    // Ensure status is formatted correctly for API (Title Case) and sync is_active
    if (payload.status) {
      const lowerStatus = payload.status.toLowerCase();
      payload.status = lowerStatus.charAt(0).toUpperCase() + lowerStatus.slice(1);
      payload.is_active = lowerStatus === 'active';
    }

    // Handle dealership assignment (wrapped in array for API and providing dealership_id)
    if (payload.dealerships && payload.dealerships.length > 0) {
      const dealershipId = Array.isArray(payload.dealerships)
        ? payload.dealerships[0]
        : payload.dealerships;
      payload.dealership_id = dealershipId;
      payload.dealerships = Array.isArray(payload.dealerships)
        ? payload.dealerships
        : [dealershipId];
    } else if (payload.dealership_id) {
      // Also handle if they named it dealership_id by mistake
      payload.dealerships = [payload.dealership_id];
    } else {
      payload.dealerships = [];
      payload.dealership_id = null;
    }

    if (payload.role_id) {
      const r = (Array.isArray(roles) ? roles : []).find((item) => item.value === payload.role_id);
      if (r && r.code === 'user') {
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
        await updateUserMutation.mutateAsync({ id: editingUser.id, data: finalPayload });

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
      } else {
        const newUser = await createUserMutation.mutateAsync(finalPayload);

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

    // Defense-in-depth: Validate restrictions again before proceeding
    const targetRole = normalizeRole(user?.role);
    const isSupportRole = targetRole === 'support_staff' || targetRole === 'staff';
    const isSellerRole = targetRole === 'user' || targetRole === 'seller';

    if (action === 'edit' && (isSupportRole || isSellerRole)) {
      Swal.fire(
        'Restricted',
        `Super Admins cannot edit ${isSupportRole ? 'Support' : 'Seller'} roles directly.`,
        'warning'
      );
      return;
    }

    if (action === 'impersonate' && (isSupportRole || isSellerRole)) {
      Swal.fire(
        'Restricted',
        'Impersonation is not allowed for Support or Seller roles.',
        'warning'
      );
      return;
    }

    if ((action === 'enable2fa' || action === 'disable2fa' || action === '2fa') && isSellerRole) {
      Swal.fire('Restricted', 'Super Admins cannot manage 2FA for Seller roles.', 'warning');
      return;
    }

    if (action === 'suspend') {
      const isSuspended = user.status === 'suspended';

      if (isSuspended) {
        // For activation, use the existing flow
        Swal.fire({
          title: 'Activate User',
          text: `Are you sure you want to activate ${user.name}?`,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#10B981',
          confirmButtonText: 'Activate',
        }).then(async (result) => {
          if (result.isConfirmed) {
            try {
              await restoreUserMutation.mutateAsync(user.id);

              // Update local cache for changed users
              const updatedUser = {
                ...user,
                status: 'active',
                is_active: true,
                isActive: true,
              };
              setRecentlyChangedUsers((prev) => ({
                ...prev,
                [user.id]: updatedUser,
              }));

              onRefresh?.();
              Swal.fire('Success', 'User has been activated.', 'success');
            } catch (e) {
              Swal.fire('Error', e?.response?.data?.message || 'Action failed', 'error');
            }
          }
        });
      } else {
        // For suspension, show input for reason
        const { value: reason } = await Swal.fire({
          title: 'Suspend User',
          text: `Are you sure you want to suspend ${user.name}?`,
          input: 'textarea',
          inputLabel: 'Suspension Reason',
          inputPlaceholder: 'Enter the reason for suspension...',
          inputAttributes: {
            'aria-label': 'Enter the reason for suspension',
          },
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#d33',
          confirmButtonText: 'Suspend',
          inputValidator: (value) => {
            if (!value || !value.trim()) {
              return 'You need to provide a reason for suspension';
            }
          },
        });

        if (reason) {
          try {
            await suspendUserMutation.mutateAsync({ userId: user.id, reason });

            // Update local cache for changed users
            const updatedUser = {
              ...user,
              status: 'suspended',
              is_active: false,
              isActive: false,
            };
            setRecentlyChangedUsers((prev) => ({
              ...prev,
              [user.id]: updatedUser,
            }));

            onRefresh?.();
            Swal.fire('Success', 'User has been suspended.', 'success');
          } catch (e) {
            Swal.fire('Error', e?.response?.data?.message || 'Action failed', 'error');
          }
        }
      }
    } else if (action === 'password') {
      const { value: formValues } = await Swal.fire({
        title: 'Reset Password',
        html: `
                    <div style="text-align: left;">
                        <p style="margin-bottom: 15px;">Setting a new password for <strong>${user.name}</strong>.</p>
                        <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                            <input type="radio" id="auto" name="resetType" value="auto" checked onchange="
                                document.getElementById('custom-pass-container').style.display = 'none';
                            ">
                            <label for="auto">Auto-generate password</label>
                            
                            <input type="radio" id="custom" name="resetType" value="custom" onchange="
                                document.getElementById('custom-pass-container').style.display = 'block';
                            ">
                            <label for="custom">Set manually</label>
                        </div>
                        <div id="custom-pass-container" style="display: none;">
                            <div style="position: relative; display: flex; align-items: center;">
                                <input id="swal-new-password" type="password" class="swal2-input" placeholder="New Password" style="margin: 0; width: 100%; padding-right: 40px;">
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
        confirmButtonText: 'Reset Password',
        focusConfirm: false,
        preConfirm: () => {
          const type = document.querySelector('input[name="resetType"]:checked').value;
          const newPassword = document.getElementById('swal-new-password').value;

          if (type === 'custom') {
            if (!newPassword) Swal.showValidationMessage('Password is required');
            if (newPassword.length < 6)
              Swal.showValidationMessage('Password must be at least 6 characters');
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
              title: 'Password Reset Success',
              html: `
                                <p>The user's password has been reset successfully.</p>
                                <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
                                    <p style="margin: 0; font-size: 0.9em; color: #6b7280;">Temporary Password</p>
                                    <p style="margin: 5px 0 0 0; font-family: monospace; font-size: 1.2em; font-weight: bold; letter-spacing: 1px;">${result.temporaryPassword}</p>
                                </div>
                                <p style="font-size: 0.9em;">An email has been sent to the user.</p>
                            `,
              icon: 'success',
            });
          } else {
            Swal.fire('Success', 'An email has been sent to the user.', 'success');
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
        title: 'Delete User',
        text: 'Are you sure you want to delete this user? This action cannot be undone.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        confirmButtonText: 'Yes, Delete',
      }).then(async (result) => {
        if (result.isConfirmed) {
          try {
            await userService.deleteUser(user.id);
            onRefresh?.();
            Swal.fire('Deleted!', 'User has been deleted successfully.', 'success');
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

        const permission_ids = normalizePermissionIds(
          userData.permission_ids || userData.permissions || userData.user_permissions
        );

        setEditingUser({ ...userData, permission_ids, tags });
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
    } else if (action === 'enable2fa' || action === 'disable2fa') {
      const isEnable = action === 'enable2fa';
      Swal.fire({
        title: isEnable ? 'Enable 2FA' : 'Disable 2FA',
        text: `Are you sure you want to ${isEnable ? 'enable' : 'disable'} 2FA for ${user.name}?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: isEnable ? '#10B981' : '#d33',
        confirmButtonText: `Yes, ${isEnable ? 'Enable' : 'Disable'}`,
      }).then(async (result) => {
        if (result.isConfirmed) {
          try {
            if (isEnable) {
              await enable2faMutation.mutateAsync(user.id);
            } else {
              await disable2faMutation.mutateAsync(user.id);
            }
            onRefresh?.();
          } catch (e) {
            // Error handled by hook
          }
        }
      });
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

          setRecentlyChangedUsers((prev) => {
            const next = { ...prev };
            const statusToSet = action === 'activate';
            const statusLabel = action === 'activate' ? 'active' : 'suspended';

            selectedUserIds.forEach((id) => {
              const originalUser = allUsers.find((u) => u.id === id) || { id };
              next[id] = {
                ...originalUser,
                status: statusLabel,
                is_active: statusToSet,
                isActive: statusToSet,
              };
            });
            return next;
          });

          setSelectedUserIds([]);
          Swal.fire(
            'Success',
            `${selectedUserIds.length} users have been processed successfully.`,
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
          .required('First name is required')
          .matches(/^[A-Za-z\s'-]+$/, 'Please enter a valid name'),
        last_name: yup
          .string()
          .required('Last name is required')
          .matches(/^[A-Za-z\s'-]+$/, 'Please enter a valid name'),
        email: yup
          .string()
          .email('Invalid email address')
          .matches(/^[a-z0-9._-]+@[a-z0-9.-]+\.[a-z]{2,}$/, 'Email must be lowercase and valid')
          .required('Email is required'),
        phone_number: yup.string().required('Phone number is required'),
        role_id: yup.string().required('Role is required'),
        dealerships: yup.mixed().nullable(),
        status: yup.string().required('Status is required'),
        password: editingUser
          ? yup
              .string()
              .transform((curr) => (curr === '' ? null : curr))
              .nullable()
              .min(6, 'Password must be at least 6 characters')
          : yup
              .string()
              .required('Password is required')
              .min(6, 'Password must be at least 6 characters'),
        confirmPassword: editingUser
          ? yup
              .string()
              .transform((curr) => (curr === '' ? null : curr))
              .nullable()
              .oneOf([yup.ref('password'), null], 'Passwords do not match')
          : yup
              .string()
              .required('Confirm Password is required')
              .oneOf([yup.ref('password'), null], 'Passwords do not match'),
      }),
    [editingUser]
  );

  const fields = useMemo(
    () => [
      {
        type: 'section',
        title: 'Personal Information',
        icon: User,
        fields: [
          {
            type: 'row',
            fields: [
              {
                name: 'first_name',
                label: 'First Name',
                type: 'text',
                placeholder: 'Enter first name',
                required: true,
                onChange: (value, { setValue }) => {
                  const clean = value.replace(/[^A-Za-z\s'-]/g, '');
                  if (clean !== value) setValue('first_name', clean);
                },
              },
              {
                name: 'last_name',
                label: 'Last Name',
                type: 'text',
                placeholder: 'Enter last name',
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
                label: 'Email Address',
                type: 'email',
                placeholder: 'Enter email address',
                required: true,
              },
              {
                name: 'phone_number',
                label: 'Phone Number',
                type: 'custom',
                component: PhoneInput,
                props: { placeholder: 'Enter phone number', enableSearch: true },
                required: true,
              },
            ],
          },
          {
            type: 'row',
            fields: [
              {
                name: 'tags',
                label: 'User Tags',
                type: 'custom',
                component: TagInput,
                props: { type: 'user', placeholder: 'Add user tags...' },
                className: 'col-span-2',
              },
            ],
          },
        ],
      },
      {
        type: 'section',
        title: 'Role & Access',
        icon: Shield,
        fields: [
          {
            type: 'row',
            fields: [
              {
                name: 'role_id',
                label: 'Account Role',
                type: 'select',
                options: roles.filter((r) => {
                  const isRestricted = r.code === 'support_staff' || r.code === 'seller';
                  if (isRestricted) {
                    // Only show restricted roles if the user already has it (cannot assign to new users)
                    const roleId = String(r.value);
                    const currentRoleId = String(
                      editingUser?.roleId || editingUser?.role_id || editingUser?.role?.id || ''
                    );
                    return currentRoleId === roleId;
                  }
                  return true;
                }),
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
                label: 'Status',
                type: 'select',
                icon: LucideActivitySquare,
                placeholder: 'Select Status',
                options: editingUser
                  ? [
                      { value: 'active', label: 'Active' },
                      { value: 'inactive', label: 'Inactive' },
                    ]
                  : [{ value: 'active', label: 'Active' }],
                required: true,
              },
            ],
          },
          {
            name: 'dealerships',
            label: 'Assigned Dealerships',
            type: 'custom',
            component: MultiSelect,
            props: {
              options: dealerships,
              placeholder: 'Select Dealerships...',
            },
            icon: Building2,
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
            label: 'Custom Permissions',
            type: 'custom',
            render: ({ value, onChange, getValues }) => {
              const roleId = getValues('role_id');
              const selectedRole = (Array.isArray(roles) ? roles : []).find(
                (r) => String(r.value) === String(roleId)
              );
              return (
                <ModernPermissionsSelector
                  value={value}
                  onChange={onChange}
                  options={availablePermissions}
                  roleName={selectedRole?.code || 'user'}
                />
              );
            },
          },
        ],
      },
      {
        type: 'section',
        title: 'Security Settings',
        icon: Lock,
        showIf: () => !editingUser,
        fields: [
          {
            type: 'row',
            fields: [
              {
                name: 'password',
                label: 'Password',
                type: 'password',
                placeholder: '••••••••',
                required: !editingUser, // Required only on create
                showIf: () => !editingUser,
              },
              {
                name: 'confirmPassword',
                label: 'Confirm Password',
                type: 'password',
                placeholder: '••••••••',
                required: !editingUser,
                showIf: () => !editingUser,
              },
            ],
          },
        ],
      },
    ],
    [roles, dealerships, availablePermissions, editingUser]
  );

  if (viewMode === 'form') {
    return (
      <GenericFormPage
        title={editingUser?.id ? 'Edit User' : 'Add New User'}
        subtitle={
          editingUser?.id
            ? `Updating details for ${editingUser.name}`
            : 'Create a new account for the platform.'
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
          dealerships: (() => {
            const dList = editingUser?.dealerships || editingUser?.assigned_dealerships || [];
            if (Array.isArray(dList) && dList.length > 0) {
              return dList.map((d) =>
                typeof d === 'object' ? String(d.id || d.value) : String(d)
              );
            }
            const singleId =
              editingUser?.dealership_id ||
              editingUser?.dealershipId ||
              editingUser?.dealership?.id;
            return singleId ? [String(singleId)] : [];
          })(),
          permission_ids: normalizePermissionIds(
            editingUser?.permission_ids || editingUser?.permissions || editingUser?.user_permissions
          ),
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
        title="User Management"
        subtitle="Manage and oversee all platform users."
        actions={
          <button
            onClick={() => canCreate && (setEditingUser(null), setViewMode('form'))}
            disabled={!canCreate}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all shadow-lg ${
              canCreate
                ? 'bg-[rgb(var(--color-primary))] text-white hover:bg-[rgb(var(--color-primary-dark))]'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
            }`}
            title={canCreate ? 'Add New User' : "You don't have permission to create users."}
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
          externalFilters={activeFilters}
          onFilterClick={() => setIsFilterDrawerOpen(true)}
          onClearFilters={() => {
            const empty = { name: '', roles: [], statuses: [], dealership: '', tags: [] };
            setActiveFilters(empty);
            setTempFilters(empty);
          }}
          onRemoveExternalFilter={(key) => {
            setActiveFilters((prev) => ({
              ...prev,
              [key]: Array.isArray(prev[key]) ? [] : '',
            }));
          }}
          showClearFilter={Object.values(activeFilters).some((v) =>
            Array.isArray(v) ? v.length > 0 : v !== ''
          )}
          manualFiltering={true}
          searchValue={activeFilters.name}
          onSearchChange={(val) => setActiveFilters({ ...activeFilters, name: val })}
          data={filteredUsers}
          searchKeys={['name', 'email', 'role', 'work']}
          searchPlaceholder="Search users by name, email, dealership, or role..."
          highlightId={highlightId}
          filterOptions={[
            { key: 'roles', label: 'Roles', options: roles },
            {
              key: 'statuses',
              label: 'Status',
              options: [
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ],
            },
            { key: 'dealership', label: 'Dealership', options: dealerships },
            {
              key: 'tags',
              label: 'Tags',
              options: (userTagOptions || []).map((t) => ({ value: t.id, label: t.name })),
            },
          ]}
          hideFilterDropdowns={true}
          columns={[
            { header: 'Full Name', accessor: 'name', sortable: true, className: 'font-bold' },
            {
              header: 'Email Address',
              accessor: 'email',
              sortable: true,
              className: 'text-[rgb(var(--color-text-muted))]',
            },
            {
              header: 'Primary Role',
              type: 'badge',
              accessor: 'role',
              sortable: true,
              config: {
                purple: ['seller'],
                blue: ['dealer manager', 'manager'],
                orange: ['staff', 'support staff'],
              },
            },
            {
              header: 'Account Tags',
              sortKey: (row) => row.tags?.length || 0,
              accessor: (row) => <TagList tags={row.tags || []} limit={2} />,
              className: 'min-w-[150px]',
              sortable: true,
            },
            // {header: 'Work', accessor: 'work' },
            {
              header: 'Status',
              type: 'badge',
              accessor: 'status',
              config: {
                green: ['Active'],
                orange: ['Suspended'],
                red: ['Inactive'],
              },
            },
            {
              header: 'Actions',
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
                    className={`p-1.5 rounded-lg transition-colors ${openActionMenu?.id === row.id ? 'bg-[rgb(var(--color-primary))] text-[rgb(var(--color-text))] ' : 'text-[rgb(var(--color-text-muted))] hover:bg-[rgb(var(--color-primary))] hover:text-[rgb(var(--color-text))] '}`}
                  >
                    <MoreVertical size={16} />
                  </button>
                </div>
              ),
            },
          ]}
          loading={loading}
          itemsPerPage={preferences.items_per_page || 10}
          onSelectionChange={handleSelectionChange}
          selectedIds={selectedUserIds}
          persistenceKey="super-admin-users"
        />
      )}

      {selectedUserIds.length > 0 && (
        <div className="fixed bottom-0 left-0 lg:left-[280px] right-0 bg-[rgb(var(--color-surface))] border-t border-[rgb(var(--color-border))] p-4 md:p-6 z-50 shadow-xl">
          <div className="flex flex-col md:flex-row items-center justify-between md:justify-center gap-4 md:gap-8 max-w-[1600px] mx-auto">
            <span className="text-base font-medium text-[rgb(var(--color-text))] whitespace-nowrap">
              <span className="font-bold text-[rgb(var(--color-primary))] text-lg">
                {selectedUserIds.length}
              </span>{' '}
              <span className="hidden sm:inline">
                User{selectedUserIds.length !== 1 ? 's' : ''} Selected
              </span>
            </span>

            <div className="hidden md:block h-8 w-px bg-[rgb(var(--color-border))]"></div>

            <div className="flex flex-wrap justify-center items-center gap-3 md:gap-6 w-full md:w-auto">
              <button
                onClick={() => handleBulkAction('activate')}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[rgb(var(--color-success))]/10 text-[rgb(var(--color-success))] hover:bg-[rgb(var(--color-success))]/20 transition-colors font-medium text-sm whitespace-nowrap border border-[rgb(var(--color-success))]/20"
                title="Activate"
              >
                <CheckCircle size={18} /> Activate
              </button>
              <button
                onClick={() => handleBulkAction('suspend')}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[rgb(var(--color-warning))]/10 text-[rgb(var(--color-warning))] hover:bg-[rgb(var(--color-warning))]/20 transition-colors font-medium text-sm whitespace-nowrap border border-[rgb(var(--color-warning))]/20"
                title="Suspend"
              >
                <Ban size={18} /> Suspend
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[rgb(var(--color-error))]/10 text-[rgb(var(--color-error))] hover:bg-[rgb(var(--color-error))]/20 transition-colors font-medium text-sm whitespace-nowrap border border-[rgb(var(--color-error))]/20"
                title="Delete"
              >
                <Trash2 size={18} /> Delete
              </button>
            </div>

            <div className="hidden md:block h-8 w-px bg-[rgb(var(--color-border))]"></div>

            <button
              onClick={() => setSelectedUserIds([])}
              className="text-sm font-semibold text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))] transition-colors w-full md:w-auto text-center"
            >
              {'Cancel Selection'}
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
          {(() => {
            const selectedUser = (Array.isArray(allUsers) ? allUsers : []).find(
              (u) => u.id === openActionMenu.id
            );
            if (!selectedUser) return null;

            const targetRole = normalizeRole(selectedUser.role);
            const isSupportRole = targetRole === 'support_staff' || targetRole === 'staff';
            const isSellerRole = targetRole === 'user' || targetRole === 'seller';
            const isSelf = selectedUser.id === currentUser?.id;
            const isSuspended = selectedUser.status === 'suspended';
            const is2faEnabled =
              selectedUser.two_factor_auth ||
              selectedUser.two_factor_enabled ||
              selectedUser.twoFactorEnabled;

            // Super Admin permission restrictions
            const canEditThisUser = canEdit && !isSupportRole && !isSellerRole;
            const canImpersonateThisUser =
              canImpersonateUser && !isSupportRole && !isSellerRole && !isSelf;

            return (
              <>
                <button
                  onClick={() => handleAction('view', selectedUser)}
                  className="w-full text-left px-4 py-2 text-sm text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-background))] flex items-center gap-2"
                >
                  <Eye size={14} /> View Details
                </button>

                {canEditThisUser && (
                  <button
                    onClick={() => handleAction('edit', selectedUser)}
                    className="w-full text-left px-4 py-2 text-sm text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-background))] flex items-center gap-2 transition-colors"
                  >
                    <Edit size={14} /> Edit User
                  </button>
                )}

                <button
                  onClick={() => handleAction('password', selectedUser)}
                  className="w-full text-left px-4 py-2 text-sm text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-background))] flex items-center gap-2"
                >
                  <KeyRound size={14} /> Reset Password
                </button>

                {!isSellerRole && (
                  <button
                    onClick={() =>
                      canManage2FA &&
                      handleAction(is2faEnabled ? 'disable2fa' : 'enable2fa', selectedUser)
                    }
                    disabled={!canManage2FA}
                    className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 transition-colors ${
                      canManage2FA
                        ? 'text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-background))]'
                        : 'text-gray-400 cursor-not-allowed opacity-50'
                    }`}
                    title={!canManage2FA ? "You don't have permission to manage 2FA." : ''}
                  >
                    <ShieldCheck
                      size={14}
                      className={is2faEnabled ? 'text-emerald-500' : 'text-gray-400'}
                    />
                    {is2faEnabled ? 'Disable 2FA' : 'Enable 2FA'}
                  </button>
                )}

                {canImpersonateThisUser && (
                  <button
                    onClick={() => handleAction('impersonate', selectedUser)}
                    className="w-full text-left px-4 py-2 text-sm flex items-center gap-2 transition-colors text-[rgb(var(--color-primary))] hover:bg-[rgb(var(--color-primary))]/5"
                  >
                    <Fingerprint size={14} /> Impersonate User
                  </button>
                )}

                <button
                  onClick={() => handleAction('suspend', selectedUser)}
                  className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 transition-colors ${
                    isSuspended
                      ? 'text-[rgb(var(--color-success))] hover:bg-[rgb(var(--color-success))]/5'
                      : 'text-[rgb(var(--color-warning))] hover:bg-[rgb(var(--color-warning))]/5'
                  }`}
                >
                  {isSuspended ? (
                    <>
                      <CheckCircle size={14} /> Activate User
                    </>
                  ) : (
                    <>
                      <Ban size={14} /> Suspend User
                    </>
                  )}
                </button>
              </>
            );
          })()}
          <div className="h-px bg-[rgb(var(--color-border))] my-1"></div>
          <button
            onClick={() =>
              canDelete &&
              handleAction(
                'delete',
                (Array.isArray(allUsers) ? allUsers : []).find((u) => u.id === openActionMenu.id)
              )
            }
            disabled={!canDelete}
            className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 transition-colors ${
              canDelete
                ? 'text-red-600 hover:bg-red-50'
                : 'text-gray-400 cursor-not-allowed opacity-50'
            }`}
            title={!canDelete ? "You don't have permission to delete users." : ''}
          >
            <Trash2 size={14} /> Delete User
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
        title="User Filters"
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
