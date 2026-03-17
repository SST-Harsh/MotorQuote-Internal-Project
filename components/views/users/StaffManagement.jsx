import React, { useState, useEffect, useMemo } from 'react';
import { useCreateUser, useUpdateUser, useDeleteUser } from '@/hooks/useUsers';
import {
  useInviteStaff,
  useUpdateStaff,
  useDeactivateStaff,
  useReactivateStaff,
} from '@/hooks/useStaff';
import { usePreference } from '@/context/PreferenceContext';
import DataTable from '../../common/DataTable';
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
  User,
  Mail,
  Shield,
} from 'lucide-react';
import userService from '../../../services/userService';
import staffService from '../../../services/staffService';
import tagService from '@/services/tagService';
import TagInput from '@/components/common/tags/TagInput';
import TagList from '@/components/common/tags/TagList';
import { SkeletonTable } from '@/components/common/Skeleton';
import { useAuth } from '@/context/AuthContext';
import PageHeader from '@/components/common/PageHeader';
import { canDelete, canCreateUsers, canEditUsers } from '@/utils/roleUtils';
import PhoneInput from '@/components/common/PhoneInput';

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

const StaffManagement = ({
  users = [],
  roles: rolesProp = [],
  permissions: permissionsProp = [],
  dealerships: dealershipsProp = [],
  loading: loadingProp = false,
  onRefresh,
  ...paginationProps
}) => {
  const { preferences } = usePreference();
  const { user: currentUser } = useAuth();
  const isDealerManager = currentUser?.role === 'dealer_manager';
  const canDeleteUser = currentUser ? canDelete(currentUser, 'users') : false;
  const canCreate = canCreateUsers(currentUser);
  const canEdit = canEditUsers(currentUser);
  const router = useRouter();

  const [viewMode, setViewMode] = useState('list');
  const searchParams = useSearchParams();
  const highlightId = searchParams.get('highlightId') || searchParams.get('highlight');

  const [openActionMenu, setOpenActionMenu] = useState(null);
  const [editingUser, setEditingUser] = useState(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const inviteParam = searchParams.get('invite');

  useEffect(() => {
    if (inviteParam === 'true' && canCreate) {
      setEditingUser(null);
      setViewMode('form');
    }
  }, [inviteParam, canCreate]);

  // Mutations
  const inviteStaffMutation = useInviteStaff();
  const updateStaffMutation = useUpdateStaff();
  const deactivateStaffMutation = useDeactivateStaff();
  const reactivateStaffMutation = useReactivateStaff();
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const deleteUserMutation = useDeleteUser();

  // Mutations

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
      .filter((r) => {
        const name = (r.name || '').toLowerCase();
        return name !== 'super_admin' && name !== 'admin';
      })
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
        return roleName !== 'super_admin' && roleName !== 'dealer_manager';
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
          name: u.first_name && u.last_name ? `${u.first_name} ${u.last_name}` : u.name || u.email,
          role: u.role?.name || u.role || 'user',
          roleId: roleId,
          work: u.dealership && u.dealership.name ? u.dealership.name : 'System',
          dealershipId: u.dealership?.id || '',
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

    // Role Handling
    let roleId = null;
    if (payload.role) {
      const r = (Array.isArray(roles) ? roles : []).find(
        (item) =>
          item.label === payload.role ||
          item.code === payload.role ||
          item.value === payload.role ||
          (payload.role === 'support_staff' && (item.code === 'staff' || item.label === 'Staff'))
      );
      if (r) {
        roleId = r.value;
      }
    }

    // Common cleanups
    delete payload.dealershipId;

    if (payload.dealerships) {
      const dealershipId = Array.isArray(payload.dealerships)
        ? payload.dealerships[0]
        : payload.dealerships;
      payload.dealership_id = dealershipId;
      if (!Array.isArray(payload.dealerships)) {
        payload.dealerships = [dealershipId];
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
            phone_number: payload.phone_number || payload.phone,
            permissions: selectedPermCodes,
            status: payload.status === 'Active' ? 'active' : 'inactive',
            dealerships: payload.dealerships ? [payload.dealerships] : [],
          };
          await updateStaffMutation.mutateAsync({ id: editingUser.id, data: dealerPayload });
        } else {
          const finalPayload = { ...payload };
          delete finalPayload.tags;
          finalPayload.role_id = roleId || payload.role; // Fallback to string if no ID found
          finalPayload.permission_ids = selectedPermIds;

          console.log('Updating user with payload:', finalPayload);
          await updateUserMutation.mutateAsync({ id: editingUser.id, data: finalPayload });
        }

        // Tags functionality removed
      } else {
        if (isDealerManager) {
          // Adapt payload for Dealer API
          const dealerPayload = {
            email: payload.email,
            first_name: payload.first_name,
            last_name: payload.last_name,
            phone_number: payload.phone_number || payload.phone,
            role: payload.role,
            permissions: selectedPermCodes,
            dealerships: payload.dealerships ? [payload.dealerships] : [],
            send_invitation_email: true,
          };
          await inviteStaffMutation.mutateAsync(dealerPayload);
        } else {
          // Legacy Admin API
          const finalPayload = { ...payload };
          delete finalPayload.tags;
          finalPayload.role_id = roleId || payload.role;
          finalPayload.permission_ids = selectedPermIds;

          const newUser = await createUserMutation.mutateAsync(finalPayload);
          createdUserId = newUser?.id || newUser?.data?.id;
        }

        // Tags functionality removed
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

    if (action === 'view') {
      router.push(`/users/staff/${user.id}`);
      return;
    }

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
              if (isSuspended) await reactivateStaffMutation.mutateAsync(user.id);
              else
                await deactivateStaffMutation.mutateAsync({
                  id: user.id,
                  reason: 'Suspended by Manager',
                });
            } else {
              await updateUserMutation.mutateAsync({
                id: user.id,
                data: { is_active: statusToSet },
              });
            }
            onRefresh?.();
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
            await deleteUserMutation.mutateAsync(user.id);
            onRefresh?.();
          } catch (error) {
            Swal.fire('Error', error?.response?.data?.message || 'Failed to delete user.', 'error');
          }
        }
      });
    } else if (action === 'view') {
      router.push(`/users/${user.id}`);
    } else if (action === 'edit') {
      try {
        // Fetch fresh user details and tags in parallel
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
        setViewMode('form');
      } catch (error) {
        console.error('Failed to fetch user details', error);
        // Fallback to list data if fetch fails
        Swal.fire({
          icon: 'warning',
          title: 'Partial Data',
          text: 'Could not fetch latest user details. Editing with cached data.',
          timer: 2000,
        });
        setEditingUser({ ...user, tags: [] });
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
        phone: yup.string().required('Phone Number is required'),
        email: yup
          .string()
          .email('Invalid email address')
          .matches(/^[a-z0-9._-]+@[a-z0-9.-]+\.[a-z]{2,}$/, 'Email must be lowercase and valid')
          .required('Email is required'),
        role: yup.string().required('Role is required'),
        dealerships: yup.mixed().nullable(),
        status: yup.string().required('Status is required'),
      }),
    []
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
            type: 'row',
            fields: [
              {
                name: 'phone',
                label: 'Phone Number',
                type: 'custom',
                component: PhoneInput,
                props: { placeholder: '123-456-7890', enableSearch: true },
                required: true,
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
          // Tags input removed
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
                name: 'role',
                label: 'Role',
                type: 'text',
                placeholder: 'Enter role...',
                disabled: true,
                required: true,
              },
              {
                name: 'status',
                label: 'Account Status',
                type: 'select',
                options: editingUser
                  ? [
                      { value: 'Active', label: 'Active' },
                      { value: 'Inactive', label: 'Inactive' },
                    ]
                  : [{ value: 'Active', label: 'Active' }],
                required: true,
              },
            ],
          },
          {
            name: 'dealerships',
            label: 'Assigned Dealership',
            type: 'select',
            options: [...dealerships],
          },
          {
            name: 'permission_ids',
            label: 'Custom Permissions',
            type: 'custom',
            render: ({ value, onChange, getValues }) => {
              const roleValue = getValues('role');
              const selectedRole = (Array.isArray(roles) ? roles : []).find(
                (r) =>
                  String(r.value) === String(roleValue) ||
                  r.label === roleValue ||
                  r.code === roleValue
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
          phone: editingUser?.phone || editingUser?.phone_number || editingUser?.phoneNumber || '',
          email: editingUser?.email || '',
          role: (() => {
            if (isDealerManager) return 'support_staff';
            if (editingUser) {
              if (typeof editingUser.role === 'string') return editingUser.role;
              return (
                editingUser.role?.code || editingUser.role?.name || editingUser.role?.label || ''
              );
            }
            return '';
          })(),
          status: editingUser?.id
            ? String(editingUser?.status).toLowerCase() === 'active' ||
              editingUser?.is_active === true
              ? 'Active'
              : 'Inactive'
            : '',
          dealerships: (() => {
            // Prefer the dealerships array from API, fall back to dealership_id
            const arr = editingUser?.dealerships;
            if (Array.isArray(arr) && arr.length > 0) {
              return String(arr[0]?.id || arr[0]);
            }
            return String(editingUser?.dealership_id || editingUser?.dealership?.id || '');
          })(),
          permission_ids: (() => {
            const existing =
              editingUser?.permission_ids ||
              editingUser?.permissions ||
              editingUser?.user_permissions;
            if (existing && existing.length > 0) return existing;

            if (isDealerManager) {
              // Find the role that matches 'support_staff' or 'staff'
              const supportRole = roles.find(
                (r) => r.code === 'support_staff' || r.code === 'staff'
              );
              return supportRole?.default_permissions || [];
            }
            return [];
          })(),
          tags: editingUser?.tags || [],
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
              if (canCreate) {
                setEditingUser(null);
                setViewMode('form');
              }
            }}
            disabled={!canCreate}
            className="flex items-center gap-2 bg-[rgb(var(--color-primary))] text-white px-4 py-2 rounded-lg transition-all shadow-lg hover:bg-[rgb(var(--color-primary-dark))] disabled:opacity-50 disabled:cursor-not-allowed"
            title={
              canCreate
                ? isDealerManager
                  ? 'Create Staff Member'
                  : 'Create New User'
                : "You don't have permission to create users."
            }
          >
            <UserPlus size={18} />
            <span>{isDealerManager ? 'Create Staff Member' : 'Create New User'}</span>
          </button>
        }
      />

      {loading ? (
        <div className="p-6 overflow-hidden">
          <SkeletonTable rows={5} />
        </div>
      ) : (
        <DataTable
          data={allUsers}
          searchKeys={['name', 'email', 'work']}
          searchPlaceholder="Search staff by name or email..."
          highlightId={highlightId}
          filterOptions={
            isDealerManager
              ? [
                  {
                    key: 'status',
                    label: 'Status',
                    options: [
                      { value: 'active', label: 'Active' },
                      { value: 'inactive', label: 'Inactive' },
                    ],
                  },
                ]
              : [
                  {
                    key: 'roleId',
                    label: 'Role',
                    options: (Array.isArray(roles) ? roles : []).map((r) => ({
                      value: r.value,
                      label: r.label,
                    })),
                  },
                  {
                    key: 'status',
                    label: 'Status',
                    options: [
                      { value: 'active', label: 'Active' },
                      { value: 'inactive', label: 'Inactive' },
                    ],
                  },
                  {
                    key: 'dealershipId',
                    label: 'Dealership',
                    options: dealerships,
                  },
                ]
          }
          columns={[
            { header: 'Name', accessor: 'name', sortable: true, className: 'font-bold' },
            {
              header: 'Email',
              accessor: 'email',
              sortable: true,
              className: 'text-[rgb(var(--color-text-muted))]',
            },
            {
              header: 'Role',
              type: 'badge',
              accessor: 'role',
              config: {
                orange: ['staff', 'support staff', 'support_staff'],
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
              sortable: true,
              sortKey: (row) => row.status || '',
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
                    className={`p-1.5 rounded-lg transition-colors ${openActionMenu?.id === row.id ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-100'}`}
                  >
                    <MoreVertical size={16} />
                  </button>
                </div>
              ),
            },
          ]}
          itemsPerPage={preferences.items_per_page || 10}
          persistenceKey="staff-management"
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
              onClick={() => {
                if (canEdit)
                  handleAction(
                    'edit',
                    (Array.isArray(allUsers) ? allUsers : []).find(
                      (u) => u.id === openActionMenu.id
                    )
                  );
              }}
              disabled={!canEdit}
              className="w-full text-left px-4 py-2 text-sm text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-background))] flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title={canEdit ? 'Edit User' : "You don't have permission to edit users."}
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
              onClick={() => {
                if (canDeleteUser)
                  handleAction(
                    'delete',
                    (Array.isArray(allUsers) ? allUsers : []).find(
                      (u) => u.id === openActionMenu.id
                    )
                  );
              }}
              disabled={!canDeleteUser}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title={canDeleteUser ? 'Delete User' : "You don't have permission to delete users."}
            >
              <Trash2 size={14} /> Delete User
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default React.memo(StaffManagement);
