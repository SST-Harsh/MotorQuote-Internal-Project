import React, { useState, useEffect, useMemo } from 'react';
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from '@/hooks/useUsers';
import { useDealerships } from '@/hooks/useDealerships';
import { usePreference } from '@/context/PreferenceContext';
import DataTable from '../../common/DataTable';
import DetailViewModal from '../../common/DetailViewModal';
import GenericFormPage from '../../common/GenericFormPage';
import Swal from 'sweetalert2';
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
  Filter,
} from 'lucide-react';
import userService from '../../../services/userService';
import staffService from '../../../services/staffService';
import tagService from '@/services/tagService';
import TagInput from '@/components/common/tags/TagInput';
import { SkeletonTable } from '@/components/common/Skeleton';
import { useAuth } from '@/context/AuthContext';
import PageHeader from '@/components/common/PageHeader';
import FilterDrawer from '../../common/FilterDrawer';
import { formatDate } from '@/utils/i18n';

const PermissionsAccordion = ({ value = [], onChange, options = [] }) => {
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
                    {category} Management
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
                className="text-xs font-medium text-[rgb(var(--color-primary))] hover:text-[rgb(var(--color-primary-dark))] px-2 py-1 rounded hover:bg-blue-50 transition-colors"
              >
                {isAllSelected ? 'Deselect All' : 'Select All'}
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
                        className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-gray-300 bg-white checked:border-[rgb(var(--color-primary))] checked:bg-[rgb(var(--color-primary))] focus:ring-2 focus:ring-[rgb(var(--color-primary))] focus:ring-offset-1"
                      />
                      <CheckCircle
                        size={10}
                        className="pointer-events-none absolute left-0.5 top-0.5 text-white opacity-0 peer-checked:opacity-100"
                      />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-[rgb(var(--color-text))] group-hover:text-[rgb(var(--color-primary))] transition-colors">
                        {p.label}
                      </span>
                      {p.description && (
                        <p className="text-xs text-[rgb(var(--color-text-muted))] mt-0.5">
                          {p.description}
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

const StaffManagement = ({
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
  const { user: currentUser } = useAuth();
  const isDealerManager = currentUser?.role === 'dealer_manager';
  const router = useRouter();

  const [viewMode, setViewMode] = useState('list');
  const searchParams = useSearchParams();
  const highlightId = searchParams.get('highlight');

  const [openActionMenu, setOpenActionMenu] = useState(null);
  const [viewingUser, setViewingUser] = useState(null);
  const [editingUser, setEditingUser] = useState(null);

  const [viewingActivities, setViewingActivities] = useState({ activities: [], loginLogs: [] });
  const [selectedFile, setSelectedFile] = useState(null);

  // always use props if available
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

  // Map activeFilters to the old filterConfig structure used in this component
  const filterConfig = useMemo(
    () => ({
      roles: activeFilters.roles || [],
      status: activeFilters.statuses || [],
      dealerships: activeFilters.dealership ? [activeFilters.dealership] : [],
    }),
    [activeFilters]
  );

  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [tempFilterConfig, setTempFilterConfig] = useState(filterConfig);

  // Sync temp filters when drawer opens
  useEffect(() => {
    if (isFilterDrawerOpen) {
      setTempFilterConfig(filterConfig);
    }
  }, [isFilterDrawerOpen, filterConfig]);

  const clearFilters = () => {
    setActiveFilters({
      name: '',
      roles: [],
      statuses: [],
      dealership: '',
      tags: [],
    });
    setTempFilterConfig({ roles: [], status: [], dealerships: [] });
  };

  // Derived State from Props
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
      .filter((r) => r.name !== 'super_admin')
      .filter((r) => {
        if (isDealerManager) {
          const name = (r.name || '').toLowerCase();
          return name.includes('staff') || name.includes('support');
        }
        return true;
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
          label: r.name.charAt(0).toUpperCase() + r.name.slice(1).replace('_', ' '),
          value: r.id,
          code: r.name,
          default_permissions: defaults,
        };
      });

    return formatted;
  }, [rolesProp, permissionsProp, isDealerManager]);

  const dealerships = useMemo(() => {
    if (!Array.isArray(dealershipsProp)) return [];
    return dealershipsProp.map((d) => ({ value: d.id, label: d.name }));
  }, [dealershipsProp]);

  const allUsers = useMemo(() => {
    return (Array.isArray(users) ? users : [])
      .filter((u) => {
        const roleName = u.role?.name || u.role;
        return roleName !== 'super_admin' && roleName !== 'admin' && roleName !== 'dealer_manager';
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

        return {
          ...u,
          id: u.id,
          name: u.first_name && u.last_name ? `${u.first_name} ${u.last_name} ` : u.name || u.email,
          role: u.role?.name || u.role || 'user',
          roleId: roleId,
          work: u.dealership && u.dealership.name ? u.dealership.name : 'System',
          status: (u.is_active !== undefined ? u.is_active : u.isActive)
            ? 'active'
            : u.status === 'Pending' || u.status === 'Invited'
              ? 'pending'
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
  }, [users, roles]);

  const filteredUsers = useMemo(() => {
    let result = allUsers;

    // Drawer Filtering
    if (filterConfig.roles.length > 0) {
      result = result.filter((u) => filterConfig.roles.includes(u.roleId));
    }
    if (filterConfig.status.length > 0) {
      result = result.filter((u) => filterConfig.status.includes(u.status?.toLowerCase()));
    }
    if (filterConfig.dealerships.length > 0) {
      result = result.filter(
        (u) => u.dealership && filterConfig.dealerships.includes(u.dealership.id)
      );
    }

    return result;
  }, [allUsers, filterConfig]);

  useEffect(() => {
    const handleClickOutside = () => setOpenActionMenu(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const handleSaveUser = async (data) => {
    let createdUserId = null;
    // Base payload
    const payload = { ...data };

    // Handle permissions mapping
    // API expects 'permissions' as array of codes for dealers.
    // Frontend uses 'permission_ids' as array of IDs.
    const selectedPermIds = (data.permission_ids || []).map((p) =>
      typeof p === 'object' ? p.value : p
    );

    // Map IDs to Codes
    const selectedPermCodes = selectedPermIds
      .map((id) => {
        const perm = (Array.isArray(availablePermissions) ? availablePermissions : []).find(
          (p) => p.value === id
        );
        return perm ? perm.code : null;
      })
      .filter(Boolean);

    // Common cleanups
    delete payload.role;
    delete payload.dealershipId;

    // Role Handling
    if (payload.role_id) {
      const r = (Array.isArray(roles) ? roles : []).find((item) => item.value === payload.role_id);
      if (r && (r.code === 'user' || r.code === 'admin')) {
        payload.dealership_id = null;
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
          }
        }
      }

      if (editingUser) {
        if (isDealerManager) {
          // Adapt payload for Dealer API
          const dealerPayload = {
            first_name: payload.first_name,
            last_name: payload.last_name,
            phone_number: payload.phone_number || payload.phone, // Ensure phone field matches API
            permissions: selectedPermCodes, // API DOC: permissions [strings]
            status: payload.status === 'Active' ? 'active' : 'inactive', // Lowercase status
          };
          await staffService.updateStaff(editingUser.id, dealerPayload);
        } else {
          const finalPayload = { ...payload };
          delete finalPayload.tags; // Move tags out of the main user payload
          finalPayload.permission_ids = selectedPermIds; // Legacy Admin API uses IDs

          console.log('Updating user with payload:', finalPayload);
          await userService.updateUser(editingUser.id, finalPayload);
        }

        // Sync Tags for existing user
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
        if (isDealerManager) {
          // Adapt payload for Dealer API
          const dealerPayload = {
            email: payload.email,
            first_name: payload.first_name,
            last_name: payload.last_name,
            phone_number: payload.phone_number || payload.phone,
            role: payload.role, // Set role for new staff members
            permissions: selectedPermCodes, // API DOC: permissions [strings]
            send_invitation_email: true,
          };
          await staffService.inviteStaff(dealerPayload);
        } else {
          // Legacy Admin API
          const finalPayload = { ...payload };
          delete finalPayload.tags; // Move tags out of the main user payload
          finalPayload.permission_ids = selectedPermIds;

          const newUser = await userService.createUser(finalPayload);
          createdUserId = newUser?.id || newUser?.data?.id;
        }

        // Sync Tags for new user
        // Note: staffService.inviteStaff doesn't always return the new user ID clearly in some cases,
        // if it does, we can add syncing for Dealer Staff invitations here too.
        // For now, we sync for Admin created users and edits.
        if (createdUserId && data.tags) {
          const tagIds = data.tags.map((t) => t.id);
          await tagService.syncTags('user', createdUserId, tagIds);
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
            if (isDealerManager) {
              if (isSuspended) await staffService.reactivateStaff(user.id);
              else await staffService.deactivateStaff(user.id, 'Suspended by Manager');
            } else {
              await userService.updateUser(user.id, { is_active: statusToSet });
            }
            onRefresh?.();
            Swal.fire(isSuspended ? 'Activated!' : 'Suspended!', '', 'success');
          } catch (e) {
            // Fallback to old mock logic if API fails? No, we want API only instructions.
            Swal.fire('Error', e?.response?.data?.message || 'Action failed', 'error');
          }
        }
      });
    } else if (action === 'password') {
      const { value: formValues } = await Swal.fire({
        title: 'Reset Password',
        html: `
    < div style = "text-align: left;" >
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
    < p > The password has been reset.</p >
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
      // Navigate to staff detail page instead of modal
      router.push(`/ staff - management / ${user.id} `);
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
    } else if (action === 'resend') {
      try {
        await staffService.resendInvitation(user.id);
        Swal.fire('Sent!', `Invitation resent to ${user.email}.`, 'success');
      } catch (error) {
        Swal.fire(
          'Error',
          error?.response?.data?.message || 'Failed to resend invitation.',
          'error'
        );
      }
    } else if (action === 'cancel') {
      Swal.fire({
        title: 'Cancel Invitation?',
        text: `Are you sure you want to cancel the invitation for ${user.email} ? `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        confirmButtonText: 'Yes, cancel',
      }).then(async (result) => {
        if (result.isConfirmed) {
          try {
            await staffService.cancelInvitation(user.id);
            onRefresh?.();
            Swal.fire('Cancelled!', 'Invitation cancelled.', 'success');
          } catch (error) {
            Swal.fire(
              'Error',
              error?.response?.data?.message || 'Failed to cancel invitation.',
              'error'
            );
          }
        }
      });
    }
  };

  const validationSchema = useMemo(
    () =>
      yup.object().shape({
        first_name: yup.string().required('First Name is required'),
        last_name: yup.string().required('Last Name is required'),
        email: yup
          .string()
          .email('Invalid email address')
          .matches(/^[a-z0-9._-]+@[a-z0-9.-]+\.[a-z]{2,}$/, 'Email must be lowercase and valid')
          .required('Email is required'),
        role_id: yup.string().required('Role is required'),
        dealership_id: yup.string().nullable(),
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
              .oneOf([yup.ref('password'), null], 'Passwords must match')
          : yup
              .string()
              .required('Confirm Password is required')
              .oneOf([yup.ref('password'), null], 'Passwords must match'),
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
                placeholder: 'John',
                required: true,
              },
              {
                name: 'last_name',
                label: 'Last Name',
                type: 'text',
                placeholder: 'Doe',
                required: true,
              },
            ],
          },
          {
            name: 'email',
            label: 'Email Address',
            type: 'email',
            placeholder: 'john@example.com',
            required: true,
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
                label: 'Role',
                type: 'select',
                options: roles,
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
                label: 'Account Status',
                type: 'select',
                options: [
                  { value: 'Active', label: 'Active' },
                  { value: 'Inactive', label: 'Inactive' },
                  { value: 'Suspended', label: 'Suspended' },
                ],
                required: true,
              },
            ],
          },
          {
            name: 'dealership_id',
            label: 'Assigned Dealership',
            type: 'select',
            options: [{ value: '', label: 'Select Dealership...' }, ...dealerships],

            showIf: (values) => {
              const r = (Array.isArray(roles) ? roles : []).find(
                (item) => item.value === values.role_id
              );
              return (
                r && (r.code === 'dealer' || r.code === 'dealer_manager' || r.code === 'manager')
              );
            },
          },
          {
            name: 'permission_ids',
            label: 'Custom Permissions',
            type: 'custom',
            component: PermissionsAccordion,
            props: { options: availablePermissions },
          },
          {
            name: 'tags',
            label: 'Tags',
            type: 'custom',
            component: TagInput,
            props: { type: 'user', placeholder: 'Add user tags...' },
            className: 'col-span-2 mt-4',
          },
        ],
      },
      {
        type: 'section',
        title: 'Security',
        icon: Lock,
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
              },
              {
                name: 'confirmPassword',
                label: 'Confirm Password',
                type: 'password',
                placeholder: '••••••••',
                required: !editingUser,
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
        title={editingUser?.id ? 'Edit User' : 'Create New User'}
        subtitle={
          editingUser?.id
            ? `Update details for ${editingUser.name}`
            : 'Fill in the information below to add a new user.'
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
          status: editingUser?.status || (editingUser?.is_active ? 'Active' : 'Inactive'),
          dealership_id:
            editingUser?.dealership_id ||
            editingUser?.dealershipId ||
            editingUser?.dealership?.id ||
            '',
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
        title={isDealerManager ? 'Staff Management' : 'Global Users'}
        subtitle={
          isDealerManager
            ? "Manage your dealership's staff and track their activity."
            : 'Monitor and manage all users across the entire platform.'
        }
        actions={
          <button
            onClick={() => {
              setEditingUser(null);
              setViewMode('form');
            }}
            className="flex items-center gap-2 bg-[rgb(var(--color-primary))] text-white px-4 py-2 rounded-lg hover:bg-[rgb(var(--color-primary-dark))] transition-all shadow-lg"
          >
            <UserPlus size={18} />
            <span>{isDealerManager ? 'Invite Staff Member' : 'Create New User'}</span>
          </button>
        }
      />

      <FilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        onApply={() => {
          setActiveFilters((prev) => ({
            ...prev,
            roles: tempFilterConfig.roles,
            statuses: tempFilterConfig.status,
            dealership: tempFilterConfig.dealerships[0] || '',
          }));
          setIsFilterDrawerOpen(false);
        }}
        onReset={() => setTempFilterConfig({ roles: [], status: [], dealerships: [] })}
      >
        {/* Role Filter */}
        <div className="space-y-3">
          <label className="text-sm font-bold text-[rgb(var(--color-text))] uppercase tracking-tight opacity-80">
            Roles
          </label>
          <div className="space-y-2">
            {(Array.isArray(roles) ? roles : [])
              .filter((r) => r.value)
              .map((role) => (
                <label
                  key={role.value}
                  className="flex items-center gap-3 p-3 rounded-xl border border-[rgb(var(--color-border))] cursor-pointer hover:bg-[rgb(var(--color-background))] transition-colors bg-[rgb(var(--color-surface))] hover:border-[rgb(var(--color-primary-dark))/0.3]"
                >
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      checked={tempFilterConfig.roles.includes(role.value)}
                      onChange={() => {
                        setTempFilterConfig((prev) => ({
                          ...prev,
                          roles: prev.roles.includes(role.value)
                            ? prev.roles.filter((id) => id !== role.value)
                            : [...prev.roles, role.value],
                        }));
                      }}
                      className="peer h-4 w-4 appearance-none rounded border border-[rgb(var(--color-border))] checked:bg-[rgb(var(--color-primary))] checked:border-[rgb(var(--color-primary))] focus:ring-2 focus:ring-[rgb(var(--color-primary))/0.2] bg-[rgb(var(--color-background))]"
                    />
                    <CheckCircle
                      size={10}
                      className="pointer-events-none absolute left-0.5 top-0.5 text-white opacity-0 peer-checked:opacity-100"
                    />
                  </div>
                  <span className="text-sm font-medium text-[rgb(var(--color-text))]">
                    {role.label}
                  </span>
                </label>
              ))}
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-bold text-[rgb(var(--color-text))] uppercase tracking-tight opacity-80">
            Status
          </label>
          <div className="relative">
            <select
              className="w-full h-11 pl-4 pr-10 bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] rounded-xl text-sm font-medium text-[rgb(var(--color-text))] outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))/0.2] focus:border-[rgb(var(--color-primary))] appearance-none cursor-pointer transition-all hover:bg-[rgb(var(--color-background))] hover:border-[rgb(var(--color-border-hover))] shadow-sm"
              value={tempFilterConfig.status[0] || ''}
              onChange={(e) => {
                const val = e.target.value;
                setTempFilterConfig((prev) => ({
                  ...prev,
                  status: val ? [val] : [],
                }));
              }}
            >
              <option value="">All Statuses</option>
              {['Active', 'Inactive', 'Suspended', 'Pending'].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <ChevronDown
              size={16}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[rgb(var(--color-text-muted))] pointer-events-none"
            />
          </div>
        </div>

        {!isDealerManager && dealerships.length > 0 && (
          <div className="space-y-3">
            <label className="text-sm font-bold text-[rgb(var(--color-text))] uppercase tracking-tight opacity-80">
              Dealership
            </label>
            <div className="relative">
              <select
                className="w-full h-11 pl-4 pr-10 bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] rounded-xl text-sm font-medium text-[rgb(var(--color-text))] outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))/0.2] focus:border-[rgb(var(--color-primary))] appearance-none cursor-pointer transition-all hover:bg-[rgb(var(--color-background))] hover:border-[rgb(var(--color-border-hover))] shadow-sm"
                value={tempFilterConfig.dealerships[0] || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setTempFilterConfig((prev) => ({ ...prev, dealerships: val ? [val] : [] }));
                }}
              >
                <option value="">All Dealerships</option>
                {dealerships.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[rgb(var(--color-text-muted))] pointer-events-none"
              />
            </div>
          </div>
        )}
      </FilterDrawer>

      {loading ? (
        <div className="p-6 overflow-hidden">
          <SkeletonTable rows={5} />
        </div>
      ) : (
        <DataTable
          onFilterClick={() => setIsFilterDrawerOpen(true)}
          onClearFilters={clearFilters}
          showClearFilter={
            filterConfig.roles.length > 0 ||
            filterConfig.status.length > 0 ||
            filterConfig.dealerships.length > 0
          }
          data={filteredUsers}
          searchKeys={['name', 'email', 'work']}
          highlightId={highlightId}
          filterOptions={
            isDealerManager
              ? []
              : [
                  {
                    key: 'role',
                    label: 'Role',
                    options: [
                      { value: 'admin', label: 'Admin' },
                      { value: 'dealer_manager', label: 'Dealer Manager' },
                      { value: 'staff', label: 'Staff' },
                    ],
                  },
                ]
          }
          columns={[
            { header: 'Name', accessor: 'name', sortable: true, className: 'font-bold' },
            {
              header: 'Email',
              accessor: 'email',
              className: 'text-[rgb(var(--color-text-muted))]',
            },
            {
              header: 'Role',
              type: 'badge',
              accessor: 'role',
              config: {
                purple: ['admin'],
                blue: ['dealer_manager'],
                orange: ['staff'],
              },
            },
            ...(!isDealerManager ? [{ header: 'Work', accessor: 'work' }] : []),
            ...(!isDealerManager
              ? [
                  {
                    header: 'Dealer Manager ID',
                    accessor: (row) => {
                      if (row.role === 'dealer_manager') {
                        return (
                          <span
                            className="font-mono text-xs text-blue-600 font-medium"
                            title="This User's ID"
                          >
                            {row.id}
                          </span>
                        );
                      }
                      if (row.dealer_manager_id) {
                        return (
                          <span className="font-mono text-xs text-gray-500">
                            {row.dealer_manager_id}
                          </span>
                        );
                      }
                      return <span className="text-gray-300">-</span>;
                    },
                  },
                ]
              : []),
            {
              header: 'Status',
              type: 'badge',
              accessor: (row) =>
                row.status
                  ? row.status.charAt(0).toUpperCase() + row.status.slice(1).toLowerCase()
                  : 'Inactive',
              config: {
                green: ['Active'],
                gray: ['Inactive'],
                red: ['Suspended'],
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
                      const rect = e.currentTarget.getBoundingClientRect();
                      if (openActionMenu?.id === row.id) {
                        setOpenActionMenu(null);
                      } else {
                        // Manual positioning with overflow handling
                        let pos = { top: rect.bottom - 12, left: rect.left - 160 };

                        // Check overflow
                        const spaceBelow = window.innerHeight - rect.bottom;
                        if (spaceBelow < 300) {
                          // position bottom relative to screen bottom
                          const bottom = window.innerHeight - rect.top + 4;
                          pos = { bottom, left: rect.left - 160 };
                        }

                        setOpenActionMenu({
                          id: row.id,
                          ...pos,
                        });
                      }
                    }}
                    className={`p - 1.5 rounded - lg transition - colors ${openActionMenu?.id === row.id ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-100'} `}
                  >
                    <MoreVertical size={16} />
                  </button>
                </div>
              ),
            },
          ]}
          itemsPerPage={preferences.items_per_page || 10}
          {...paginationProps}
        />
      )}

      {openActionMenu && (
        <>
          <div className="fixed inset-0 z-[100]" onClick={() => setOpenActionMenu(null)}></div>
          <div
            className="fixed w-48 bg-[rgb(var(--color-surface))] rounded-lg shadow-xl border border-[rgb(var(--color-border))] z-[101] overflow-hidden"
            style={{
              top: openActionMenu.bottom ? 'auto' : openActionMenu.top,
              bottom: openActionMenu.bottom,
              left: openActionMenu.left,
            }}
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
            {(() => {
              const selectedUser = (Array.isArray(allUsers) ? allUsers : []).find(
                (u) => u.id === openActionMenu.id
              );
              if (selectedUser?.status === 'Pending' || selectedUser?.status === 'Invited') {
                return (
                  <>
                    <button
                      onClick={() => handleAction('resend', selectedUser)}
                      className="w-full text-left px-4 py-2 text-sm text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-background))] flex items-center gap-2"
                    >
                      <Mail size={14} /> Resend Invitation
                    </button>
                    <button
                      onClick={() => handleAction('cancel', selectedUser)}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <Ban size={14} /> Cancel Invitation
                    </button>
                  </>
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
          </div>
        </>
      )}

      {viewingUser && (
        <DetailViewModal
          isOpen={!!viewingUser}
          onClose={() => {
            setViewingUser(null);
            setViewingActivities([]);
          }}
          data={{
            ...viewingUser,
            name: viewingUser.name,
            role: viewingUser.role,
            status: viewingUser.status,
            permissions:
              Array.isArray(viewingUser.permissions) && viewingUser.permissions.length > 0 ? (
                <div className="flex flex-wrap gap-1 justify-end">
                  {viewingUser.permissions.map((permId) => {
                    const perm = (
                      Array.isArray(availablePermissions) ? availablePermissions : []
                    ).find((p) => p.value === permId);
                    const label = perm ? perm.label : permId;
                    return (
                      <span
                        key={permId}
                        className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs border border-slate-200 text-left"
                      >
                        {label}
                      </span>
                    );
                  })}
                </div>
              ) : (
                'None'
              ),
            joinedDate: viewingUser.createdAt ? formatDate(viewingUser.createdAt) : 'Recent',
          }}
          title="User Profile"
          sections={[
            {
              title: 'Account Info',
              fields: [
                { label: 'Full Name', key: 'name' },
                { label: 'Email Address', key: 'email' },
                { label: 'Role', key: 'role' },
                { label: 'Status', key: 'status' },
              ],
            },
            {
              title: 'Organization',
              fields: [
                { label: 'Dealership / Work', key: 'work' },
                { label: 'Permissions', key: 'permissions' },
              ],
            },
          ]}
          activityContent={
            <div className="space-y-6">
              {/* 1. Login History Section */}
              {viewingActivities.loginLogs && viewingActivities.loginLogs.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-[rgb(var(--color-text))] flex items-center gap-2">
                    <Clock size={16} className="text-blue-500" /> Recent Logins
                  </h4>
                  <div className="space-y-2">
                    {viewingActivities.loginLogs.map((log, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center p-3 rounded-lg border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))]"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 bg-blue-50 text-blue-600 rounded-md">
                            <User size={14} />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[rgb(var(--color-text))]">
                              Login Detected
                            </p>
                            <p className="text-xs text-[rgb(var(--color-text-muted))]">
                              IP: {log.ip_address || log.ip || log.ipAddress || 'Unknown'}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs text-[rgb(var(--color-text-muted))]">
                          {(() => {
                            const dateVal =
                              log.created_at ||
                              log.timestamp ||
                              log.date ||
                              log.createdAt ||
                              log.time ||
                              log.login_time;
                            if (!dateVal) return 'N/A';
                            const d = new Date(dateVal);
                            return isNaN(d.getTime()) ? dateVal : d.toLocaleString();
                          })()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. General Activities Section */}
              {viewingActivities.activities && viewingActivities.activities.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-[rgb(var(--color-text))] flex items-center gap-2">
                    <Activity size={16} className="text-[rgb(var(--color-primary))]" /> General
                    Actions
                  </h4>
                  <div className="space-y-3">
                    {viewingActivities.activities.map((act, idx) => (
                      <div
                        key={idx}
                        className="flex gap-4 p-4 rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] hover:shadow-sm transition-shadow"
                      >
                        <div
                          className={`p - 2 rounded - lg h - fit ${
                            act.action === 'Login'
                              ? 'bg-blue-100 text-blue-600'
                              : act.action === 'Create'
                                ? 'bg-green-100 text-green-600'
                                : 'bg-purple-100 text-purple-600'
                          } `}
                        >
                          <Activity size={18} />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <h4 className="font-semibold text-[rgb(var(--color-text))]">
                              {act.action}
                            </h4>
                            <span className="text-xs text-[rgb(var(--color-text-muted))]">
                              {new Date(act.timestamp || Date.now()).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-[rgb(var(--color-text-muted))] mt-1">
                            {typeof act.details === 'object'
                              ? JSON.stringify(act.details)
                              : act.details || 'No details available'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {!viewingActivities.activities?.length && !viewingActivities.loginLogs?.length && (
                <div className="text-center py-8 text-[rgb(var(--color-text-muted))]">
                  <p>No activity recorded.</p>
                </div>
              )}
            </div>
          }
        />
      )}
    </div>
  );
};

export default React.memo(StaffManagement);
