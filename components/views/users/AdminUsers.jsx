import React, { useState, useEffect, useMemo } from 'react';
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from '@/hooks/useUsers';
import { useDealerships } from '@/hooks/useDealerships';
import { usePreference } from '@/context/PreferenceContext';
import DataTable from '../../common/DataTable';
import DetailViewModal from '../../common/DetailViewModal';
import GenericFormPage from '../../common/GenericFormPage';
import FilterDrawer from '../../common/FilterDrawer';
import UserFilterContent from './UserFilterContent';
import StatCard from '@/components/common/StatCard';
import Swal from 'sweetalert2';
import ActionMenuPortal from '../../common/ActionMenuPortal';
import * as yup from 'yup';
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
  Fingerprint,
  Filter,
  LucideActivitySquare,
} from 'lucide-react';
import userService from '../../../services/userService';
import auditService from '@/services/auditService';
import tagService from '@/services/tagService';
import TagInput from '@/components/common/tags/TagInput';
import TagList from '@/components/common/tags/TagList';
import { SkeletonTable } from '@/components/common/Skeleton';
import { useTranslation } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import PageHeader from '@/components/common/PageHeader';
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

const AdminUsers = ({
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
  const { user: currentUser, startImpersonation } = useAuth();
  const { preferences } = usePreference();
  const router = useRouter();
  const { t } = useTranslation('users');
  const [viewMode, setViewMode] = useState('list');
  const searchParams = useSearchParams();
  const highlightId = searchParams.get('highlight');

  const [openActionMenu, setOpenActionMenu] = useState(null);
  const [viewingUser, setViewingUser] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedUserIds, setSelectedUserIds] = useState([]);

  // Filter state
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // Always use props if available, fallback to local for safety during transition
  const activeFilters = useMemo(
    () =>
      activeFiltersProp || {
        name: '',
        roles: [],
        statuses: [],
        tags: [],
        dealership: '',
      },
    [activeFiltersProp]
  );
  const setActiveFilters = setActiveFiltersProp || (() => {});

  // Temporary filters for the drawer
  const [tempFilters, setTempFilters] = useState(activeFilters);

  const clearFilters = () => {
    setActiveFilters({
      name: '',
      roles: [],
      statuses: [],
      tags: [],
    });
    setTempFilters({
      name: '',
      roles: [],
      statuses: [],
      tags: [],
    });
  };

  // Sync temp filters when drawer opens
  useEffect(() => {
    if (isFilterDrawerOpen) {
      setTempFilters(activeFilters);
    }
  }, [isFilterDrawerOpen, activeFilters]);

  const [viewingActivities, setViewingActivities] = useState({ activities: [], loginLogs: [] });
  const [selectedFile, setSelectedFile] = useState(null);

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
      .filter((r) => r.name !== 'super_admin' && r.name !== 'admin')
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
          label: r.name.charAt(0).toUpperCase() + r.name.slice(1).replace('_', ' '),
          value: r.id,
          code: r.name,
          default_permissions: defaults,
        };
      });

    return [
      { label: 'Select the role', value: '', code: '', default_permissions: [] },
      ...formatted,
    ];
  }, [rolesProp, permissionsProp]);

  const dealerships = useMemo(() => {
    if (!Array.isArray(dealershipsProp) || dealershipsProp.length === 0) return [];

    let filtered = dealershipsProp;
    const userDealershipId = currentUser?.dealership_id || currentUser?.dealership?.id;
    if (userDealershipId && currentUser?.role !== 'super_admin') {
      filtered = dealershipsProp.filter((d) => String(d.id) === String(userDealershipId));
    }

    return filtered.map((d) => ({ value: d.id, label: d.name }));
  }, [dealershipsProp, currentUser]);

  const allUsers = useMemo(() => {
    const currentDealershipId =
      currentUser?.dealership?.id || currentUser?.dealership_id || currentUser?.dealership;

    return (Array.isArray(users) ? users : [])
      .filter((u) => {
        const roleName = u.role?.name || u.role;
        if (roleName === 'super_admin') return false;
        if (roleName === 'admin' && u.id !== currentUser.id) return false;

        const userDealershipId = u.dealership?.id || u.dealership_id || u.dealership;

        if (currentDealershipId) {
          if (!userDealershipId) return false;
          return String(userDealershipId) === String(currentDealershipId);
        }

        // Apply activeFilters.dealership if set
        if (activeFilters.dealership) {
          if (!userDealershipId || String(userDealershipId) !== String(activeFilters.dealership)) {
            return false;
          }
        }

        return true;
      })
      .map((u) => {
        const roleId = u.role_id || u.role?.id || null;
        const matchedRole = (Array.isArray(roles) ? roles : []).find((r) => r.value === roleId);
        const defaultPerms = matchedRole?.default_permissions || [];

        return {
          ...u,
          id: u.id,
          name: u.first_name && u.last_name ? `${u.first_name} ${u.last_name}` : u.name || u.email,
          role: u.role?.name || u.role || 'user',
          roleId: roleId,
          work: (() => {
            const userDealers = u.dealerships || u.assigned_dealerships || [];
            if (Array.isArray(userDealers) && userDealers.length > 0) {
              return userDealers.map((d) => d.name).join(', ');
            }
            return u.dealership && u.dealership.name ? u.dealership.name : 'System';
          })(),
          status: (u.is_active !== undefined ? u.is_active : u.isActive) ? 'active' : 'inactive',
          permissions:
            u.permissions && u.permissions.length > 0
              ? u.permissions.map((p) => (typeof p === 'string' ? p : p.id))
              : defaultPerms,
          original_data: u,
        };
      });
  }, [users, roles, currentUser, activeFilters.dealership]);

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
        const id = tag.id || tag;
        if (id) {
          tagsMap.set(id, typeof tag === 'object' ? tag : { id, name: id });
        }
      });
    });
    return Array.from(tagsMap.values());
  }, [allUsers]);

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
      is_active: data.status === 'active' || data.status === undefined,
    };

    // Handle plural dealership assignment
    if (payload.dealership_id && Array.isArray(payload.dealership_id)) {
      // Send plural to backend, but also sync singular dealership_id for backward compatibility
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
      if (selectedFile) {
        console.log('Uploading profile image:', selectedFile);
        const uploadResult = await userService.uploadProfileImage(selectedFile);
        console.log('Upload result:', uploadResult);

        if (uploadResult) {
          const imageUrl =
            uploadResult.url ||
            uploadResult.avatar ||
            uploadResult.profile_image ||
            uploadResult.profile_picture ||
            uploadResult.data?.url ||
            uploadResult.data?.avatar;
          if (imageUrl) {
            payload.avatar = imageUrl;
            payload.profile_image = imageUrl;
            payload.profile_picture = imageUrl;
            console.log('Image URL set to:', imageUrl);
          } else {
            console.warn('Upload succeeded but no URL found in response:', uploadResult);
          }
        }
      }

      const finalPayload = { ...payload };
      delete finalPayload.tags;

      if (editingUser) {
        console.log('Admin updating user:', finalPayload);
        await userService.updateUser(editingUser.id, finalPayload);

        if (data.tags) {
          const tagIds = data.tags.map((t) => t.id);
          await tagService.syncTags('user', editingUser.id, tagIds);
        }

        Swal.fire({
          icon: 'success',
          title: 'User Updated',
          text: 'User details updated successfully.',
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        const newUser = await userService.createUser(finalPayload);

        // Sync Tags for new user
        const newUserId = newUser?.id || newUser?.data?.id;
        if (newUserId && data.tags) {
          const tagIds = data.tags.map((t) => t.id);
          await tagService.syncTags('user', newUserId, tagIds);
        }

        Swal.fire({
          icon: 'success',
          title: 'User Created',
          text: 'New user added.',
          timer: 1500,
          showConfirmButton: false,
        });
      }
      setViewMode('list');
      setEditingUser(null);
      setSelectedFile(null); // Reset file
      onRefresh?.();
    } catch (error) {
      console.error('Save error:', error);
      Swal.fire('Error', error?.response?.data?.message || 'Failed to save user.', 'error');
    }
  };

  const handleAction = async (action, user) => {
    setOpenActionMenu(null);

    if (action === 'suspend') {
      const isSuspended = user.status === 'Suspended';
      Swal.fire({
        title: isSuspended ? 'Activate User?' : 'Suspend User?',
        text: isSuspended ? `Re - activate ${user.name}?` : `Suspend ${user.name}?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: isSuspended ? '#10B981' : '#d33',
        confirmButtonText: isSuspended ? 'Activate' : 'Suspend',
      }).then(async (result) => {
        // Async here
        if (result.isConfirmed) {
          try {
            const statusToSet = isSuspended ? true : false;
            await userService.updateUser(user.id, { is_active: statusToSet });
            onRefresh?.();
            Swal.fire(isSuspended ? 'Activated!' : 'Suspended!', '', 'success');
          } catch (e) {
            Swal.fire('Error', e?.response?.data?.message || 'Action failed', 'error');
          }
        }
      });
    } else if (action === 'password') {
      const { value: formValues } = await Swal.fire({
        title: 'Reset Password',
        html: `
                    <div style="text-align: left;">
                        <p style="margin-bottom: 15px;">Choose how to reset the password for <b>${user.name}</b>:</p>
                        <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                            <input type="radio" id="auto" name="resetType" value="auto" checked onchange="document.getElementById('custom-pass-container').style.display = 'none'">
                            <label for="auto">Auto-Generate</label>
                            
                            <input type="radio" id="custom" name="resetType" value="custom" onchange="document.getElementById('custom-pass-container').style.display = 'block'">
                            <label for="custom">Set Manually</label>
                        </div>
                        <div id="custom-pass-container" style="display: none;">
                            <input id="swal-new-password" type="password" class="swal2-input" placeholder="New Password" style="margin: 0; width: 100%;">
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
            if (!newPassword) Swal.showValidationMessage('Please enter a password');
            if (newPassword.length < 6)
              Swal.showValidationMessage('Password must be at least 6 characters');
            return { autoGenerate: false, newPassword };
          }
          return { autoGenerate: true };
        },
      });

      if (formValues) {
        try {
          const result = await userService.resetPassword(user.id, formValues);

          if (formValues.autoGenerate && result.temporaryPassword) {
            await Swal.fire({
              title: 'Password Reset Successful',
              html: `
                                <p>The password has been reset.</p>
                                <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
                                    <p style="margin: 0; font-size: 0.9em; color: #6b7280;">Temporary Password:</p>
                                    <p style="margin: 5px 0 0 0; font-family: monospace; font-size: 1.2em; font-weight: bold; letter-spacing: 1px;">${result.temporaryPassword}</p>
                                </div>
                                <p style="font-size: 0.9em;">An email has also been sent to the user.</p>
                            `,
              icon: 'success',
            });
          } else {
            Swal.fire('Success', 'Password has been reset and emailed to the user.', 'success');
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
        title: 'Delete User?',
        text: 'Permanently delete this user?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        confirmButtonText: 'Yes, delete',
      }).then(async (result) => {
        if (result.isConfirmed) {
          try {
            await userService.deleteUser(user.id);
            onRefresh?.();
            Swal.fire('Deleted!', 'User deleted.', 'success');
          } catch (error) {
            Swal.fire('Error', error?.response?.data?.message || 'Failed to delete user.', 'error');
          }
        }
      });
    } else if (action === 'view') {
      router.push(`/users/${user.id}`);
    } else if (action === 'edit') {
      try {
        // Fetch tags when editing
        const currentTags = await tagService.getEntityTags('user', user.id);
        setEditingUser({ ...user, tags: currentTags || [] });
        setViewMode('form');
      } catch (err) {
        console.error('Failed to fetch user tags:', err);
        setEditingUser(user);
        setViewMode('form');
      }
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
      title: `${actionText} ${selectedUserIds.length} Users ? `,
      text: `Are you sure you want to ${confirmText} the selected users ? `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: confirmColor,
      confirmButtonText: `Yes, ${actionText} `,
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
            'Processed!',
            `${selectedUserIds.length} users have been ${action === 'delete' ? 'deleted' : action + 'ed'}.`,
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
          .required(t('validation.firstNameRequired', 'First Name is required'))
          .matches(/^[A-Za-z\s'-]+$/, t('validation.nameInvalid', 'Invalid name')),
        last_name: yup
          .string()
          .required(t('validation.lastNameRequired', 'Last Name is required'))
          .matches(/^[A-Za-z\s'-]+$/, t('validation.nameInvalid', 'Invalid name')),
        email: yup
          .string()
          .email(t('validation.emailInvalid', 'Invalid email address'))
          .matches(/^[a-z0-9._-]+@[a-z0-9.-]+\.[a-z]{2,}$/, 'Email must be lowercase and valid')
          .required(t('validation.emailRequired', 'Email is required')),
        phone_number: yup
          .string()
          .required(t('validation.phoneRequired', 'Phone number is required'))
          .matches(/^[0-9]{10}$/, t('validation.phoneInvalid', 'Phone must be 10 digits')),
        role_id: yup.string().required(t('validation.roleRequired', 'Role is required')),
        dealership_id: yup.array().of(yup.string()).nullable(),
        status: yup.string().required(t('validation.statusRequired', 'Status is required')),
        password: editingUser
          ? yup
              .string()
              .transform((curr) => (curr === '' ? null : curr))
              .nullable()
              .min(6, t('validation.passwordMin', 'Password must be at least 6 characters'))
          : yup
              .string()
              .required(t('validation.passwordRequired', 'Password is required'))
              .min(6, t('validation.passwordMin', 'Password must be at least 6 characters')),
        confirmPassword: editingUser
          ? yup
              .string()
              .transform((curr) => (curr === '' ? null : curr))
              .nullable()
              .oneOf(
                [yup.ref('password'), null],
                t('validation.passwordMatch', 'Passwords must match')
              )
          : yup
              .string()
              .required(t('validation.confirmRequired', 'Confirm Password is required'))
              .oneOf(
                [yup.ref('password'), null],
                t('validation.passwordMatch', 'Passwords must match')
              ),
      }),
    [editingUser, t]
  );

  const fields = useMemo(
    () => [
      {
        type: 'section',
        title: t('form.personalInfo', 'Personal Information'),
        icon: User,
        fields: [
          {
            type: 'row',
            fields: [
              {
                name: 'first_name',
                label: t('form.firstName', 'First Name'),
                type: 'text',
                placeholder: t('form.firstNamePlaceholder', 'John'),
                required: true,
                onChange: (value, { setValue }) => {
                  const clean = value.replace(/[^A-Za-z\s'-]/g, '');
                  if (clean !== value) setValue('first_name', clean);
                },
              },
              {
                name: 'last_name',
                label: t('form.lastName', 'Last Name'),
                type: 'text',
                placeholder: t('form.lastNamePlaceholder', 'Doe'),
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
                label: t('form.email', 'Email Address'),
                type: 'email',
                placeholder: t('form.emailPlaceholder', 'john@example.com'),
                required: true,
              },
              {
                name: 'phone_number',
                label: t('form.phone', 'Phone Number'),
                type: 'text',
                placeholder: t('form.phonePlaceholder', '1234567890'),
                required: true,
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
                className: 'col-span-2 mt-4',
              },
            ],
          },
        ],
      },
      {
        type: 'section',
        title: t('form.roleAccess', 'Role & Access'),
        icon: Shield,
        fields: [
          {
            type: 'row',
            fields: [
              {
                name: 'role_id',
                label: t('form.role', 'Role'),
                type: 'select',
                options: roles,
                icon: User,
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
                label: t('form.accountStatus', 'Account Status'),
                type: 'select',
                icon: LucideActivitySquare,
                options: [
                  { value: '', label: t('form.selectStatus', 'Select Status...') },
                  { value: 'active', label: t('statuses.active', 'Active') },
                  { value: 'inactive', label: t('statuses.inactive', 'Inactive') },
                  { value: 'suspended', label: t('statuses.suspended', 'Suspended') },
                ],
                required: true,
              },
            ],
          },
          {
            name: 'dealership_id',
            label: t('form.assignedDealership', 'Assigned Dealership'),
            type: 'custom',
            component: MultiSelect,
            props: {
              options: dealerships,
              placeholder: t('form.selectDealership', 'Select Dealership...'),
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
            label: t('form.customPermissions', 'Custom Permissions'),
            type: 'custom',
            component: PermissionsAccordion,
            props: { options: availablePermissions },
          },
        ],
      },
      {
        type: 'section',
        title: t('form.security', 'Security'),
        icon: Lock,
        fields: [
          {
            type: 'row',
            fields: [
              {
                name: 'password',
                label: t('form.password', 'Password'),
                type: 'password',
                placeholder: '••••••••',
                required: !editingUser,
              },
              {
                name: 'confirmPassword',
                label: t('form.confirmPassword', 'Confirm Password'),
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
        title={editingUser?.id ? 'Edit User' : 'Create New User'}
        subtitle={
          editingUser?.id
            ? `Update details for ${editingUser.name}`
            : 'Fill in the information below to add a new user.'
        }
        initialData={{
          id: editingUser?.id,
          avatar: editingUser?.avatar || editingUser?.profile_picture || '',
          first_name: editingUser?.first_name || editingUser?.firstName || '',
          last_name: editingUser?.last_name || editingUser?.lastName || '',
          email: editingUser?.email || '',
          phone_number: editingUser?.phone_number || editingUser?.mobile || '',
          role_id: (() => {
            if (editingUser?.roleId) return editingUser.roleId;
            if (editingUser?.role_id) return editingUser.role_id;
            const roleToMatch = editingUser?.role || '';
            const matchedRole = (Array.isArray(roles) ? roles : []).find(
              (r) =>
                r.code === roleToMatch ||
                r.label === roleToMatch ||
                r.code === roleToMatch.toLowerCase()
            );
            return matchedRole ? matchedRole.value : '';
          })(),
          status: editingUser?.status || 'active',
          dealership_id: (() => {
            const dIds =
              editingUser?.dealership_id ||
              editingUser?.dealershipIds ||
              editingUser?.assigned_dealerships;
            if (Array.isArray(dIds) && dIds.length > 0) {
              return dIds.map((d) => (typeof d === 'object' ? String(d.id || d.value) : String(d)));
            }
            const singleId = editingUser?.dealership_id || editingUser?.dealership?.id || '';
            return singleId && singleId !== '' ? [String(singleId)] : [];
          })(),
          permission_ids: editingUser?.permissions || [],
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
        title="Dealer Team"
        subtitle="Manage users and permissions for your dealership."
        actions={
          <button
            onClick={() => {
              setEditingUser(null);
              setViewMode('form');
            }}
            className="flex items-center gap-2 bg-[rgb(var(--color-primary))] text-white px-4 py-2 rounded-lg hover:bg-[rgb(var(--color-primary-dark))] transition-all shadow-lg text-sm font-semibold"
          >
            <UserPlus size={18} />
            <span>Add New Member</span>
          </button>
        }
      />

      <DataTable
        onFilterClick={() => setIsFilterDrawerOpen(true)}
        onClearFilters={clearFilters}
        showClearFilter={Object.values(activeFilters).some((v) =>
          Array.isArray(v) ? v.length > 0 : v !== ''
        )}
        data={filteredUsers}
        searchKeys={['name', 'email', 'work']}
        highlightId={highlightId}
        columns={[
          { header: 'Name', accessor: 'name', sortable: true, className: 'font-bold' },
          { header: 'Email', accessor: 'email', className: 'text-[rgb(var(--color-text-muted))]' },
          {
            header: 'Tags',
            accessor: (row) => <TagList tags={row.tags} limit={2} />,
            className: 'min-w-[120px]',
          },
          {
            header: 'Role',
            type: 'badge',
            accessor: 'role',
            config: {
              purple: ['admin'],
              blue: ['dealer_manager'],
              orange: ['user', 'staff'],
            },
          },
          {
            header: 'Status',
            type: 'badge',
            accessor: 'status',
            config: {
              green: ['active'],
              gray: ['inactive'],
              red: ['suspended'],
            },
          },
          {
            header: 'Actions',
            className: 'text-center',
            accessor: (userRow) => (
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
                      // bottom = distance from viewport bottom to button top + 4px padding
                      const bottom = window.innerHeight - rect.top + 4;
                      position = { bottom, left: rect.right - 192 };
                    }

                    if (openActionMenu?.id === userRow.id) {
                      setOpenActionMenu(null);
                    } else {
                      setOpenActionMenu({
                        id: userRow.id,
                        position,
                        align: 'end',
                      });
                    }
                  }}
                  className={`p-1.5 rounded-lg transition-colors ${openActionMenu?.id === userRow.id ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                  <MoreVertical size={16} />
                </button>
              </div>
            ),
          },
        ]}
        itemsPerPage={preferences.items_per_page || 10}
        onSelectionChange={handleSelectionChange}
        selectedIds={selectedUserIds}
        {...paginationProps}
      />

      {selectedUserIds.length > 0 && (
        <div className="fixed bottom-0 left-0 lg:left-[280px] right-0 bg-[rgb(var(--color-surface))] border-t border-[rgb(var(--color-border))] p-4 md:p-6 z-50 shadow-xl">
          <div className="flex flex-col md:flex-row items-center justify-between md:justify-center gap-4 md:gap-8 max-w-7xl mx-auto">
            <span className="text-base font-medium text-[rgb(var(--color-text))] whitespace-nowrap">
              <span className="font-bold text-[rgb(var(--color-primary))] text-lg">
                {selectedUserIds.length}
              </span>{' '}
              <span className="hidden sm:inline">users</span> selected
            </span>

            <div className="hidden md:block h-8 w-px bg-[rgb(var(--color-border))]"></div>

            <div className="flex flex-wrap justify-center items-center gap-3 md:gap-6 w-full md:w-auto">
              <button
                onClick={() => handleBulkAction('activate')}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors font-medium text-sm whitespace-nowrap"
                title="Activate Selected"
              >
                <CheckCircle size={18} /> Activate
              </button>
              <button
                onClick={() => handleBulkAction('suspend')}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors font-medium text-sm whitespace-nowrap"
                title="Suspend Selected"
              >
                <Ban size={18} /> Suspend
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 transition-colors font-medium text-sm whitespace-nowrap"
                title="Delete Selected"
              >
                <Trash2 size={18} /> Delete
              </button>
            </div>

            <div className="hidden md:block h-8 w-px bg-[rgb(var(--color-border))]"></div>

            <button
              onClick={() => setSelectedUserIds([])}
              className="text-sm font-semibold text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))] transition-colors w-full md:w-auto text-center"
            >
              Cancel <span className="hidden sm:inline">Selection</span>
            </button>
          </div>
        </div>
      )}

      {openActionMenu && (
        <ActionMenuPortal
          isOpen={!!openActionMenu}
          onClose={() => setOpenActionMenu(null)}
          position={openActionMenu.position}
          align={openActionMenu.align}
        >
          <button
            onClick={() => router.push(`/users/${openActionMenu.id}`)}
            className="w-full text-left px-4 py-2 text-sm text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-background))] flex items-center gap-2"
          >
            <Eye size={14} /> View Details
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
            <Edit size={14} /> Edit User
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
            <KeyRound size={14} /> Reset Password
          </button>
          {openActionMenu &&
            (() => {
              const selectedUser = (Array.isArray(allUsers) ? allUsers : []).find(
                (u) => u.id === openActionMenu.id
              );
              const isSelf = selectedUser?.id === currentUser?.id;
              const isOtherAdmin = selectedUser?.role?.toLowerCase().includes('admin');
              if (!isSelf && !isOtherAdmin) {
                return (
                  <button
                    onClick={() => handleAction('impersonate', selectedUser)}
                    className="w-full text-left px-4 py-2 text-sm text-[rgb(var(--color-primary))] hover:bg-[rgb(var(--color-primary))]/5 flex items-center gap-2"
                  >
                    <Fingerprint size={14} /> Impersonate User
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
            <Trash2 size={14} /> Delete User
          </button>
        </ActionMenuPortal>
      )}

      <FilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        onApply={() => {
          setActiveFilters(tempFilters);
          setIsFilterDrawerOpen(false);
        }}
        onReset={() => {
          const resetFilters = {
            name: '',
            roles: [],
            statuses: [],
            tags: [],
          };
          setTempFilters(resetFilters);
          setActiveFilters(resetFilters);
        }}
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

export default React.memo(AdminUsers);
