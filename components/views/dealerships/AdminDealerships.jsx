'use client';
import React, { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  useDealerships,
  useCreateDealership,
  useUpdateDealership,
  useDeleteDealership,
} from '@/hooks/useDealerships';
import { useUsers } from '@/hooks/useUsers';
import { usePreference } from '@/context/PreferenceContext';
import { formatDate } from '@/utils/i18n';
import PageHeader from '@/components/common/PageHeader';
import {
  Building2,
  MapPin,
  Phone,
  User,
  Eye,
  TrendingUp,
  FileText,
  LayoutGrid,
  Edit2,
  CheckCircle,
  Ban,
  Fingerprint,
  Mail,
  MapMinus,
  MapPinned,
  MapPinHouse,
} from 'lucide-react';
import DataTable from '../../common/DataTable';
import FilterDrawer from '../../common/FilterDrawer';
import TagFilter from '@/components/common/tags/TagFilter';
import TagList from '@/components/common/tags/TagList';
import GenericFormPage from '@/components/common/GenericFormPage';
import TagInput from '@/components/common/tags/TagInput';
import Swal from 'sweetalert2';
import * as yup from 'yup';
import dealershipService from '@/services/dealershipService';
import tagService from '@/services/tagService';
import Image from 'next/image';
import { normalizeRole, getRoleDisplayName } from '@/utils/roleUtils';
import { SkeletonTable } from '../../common/Skeleton';

export default function AdminDealerships() {
  const { user } = useAuth();
  const { preferences } = usePreference();
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightId = searchParams.get('highlight');

  // Tab State: 'created' (Dealerships) vs 'assigned' (My Dealerships)
  const [activeTab, setActiveTab] = useState('created');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'form'
  const [editingDealer, setEditingDealer] = useState(null);
  const [selectedLogoFile, setSelectedLogoFile] = useState(null);

  // Queries
  const { data: dealershipsData, isLoading: loading, error, refetch } = useDealerships();
  const { data: usersData = [], isLoading: isLoadingUsers } = useUsers();

  // Mutations
  const createDealershipMutation = useCreateDealership();
  const updateDealershipMutation = useUpdateDealership();
  const deleteDealershipMutation = useDeleteDealership();

  // Filter State
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    tags: [],
  });
  const [tempFilters, setTempFilters] = useState(filters);

  const clearFilters = () => {
    setFilters({ status: '', tags: [] });
    setTempFilters({ status: '', tags: [] });
  };

  // --- Data Processing ---

  // 1. All Dealerships (Base List)
  const allDealerships = useMemo(() => {
    return Array.isArray(dealershipsData) ? dealershipsData : dealershipsData?.dealerships || [];
  }, [dealershipsData]);

  // 2. Filtered Lists based on Tabs
  const displayedDealerships = useMemo(() => {
    let filtered = [];

    // Filter by Tab Scope
    const userDealerId = user?.dealership_id;
    const userId = user?.id;

    if (!userId) {
      filtered = [];
    } else if (activeTab === 'created') {
      // Created: Any dealership where user is Primary Admin BUT NOT their "Assigned" home dealership
      filtered = allDealerships.filter(
        (d) =>
          String(d.primary_admin_id) === String(userId) && String(d.id) !== String(userDealerId)
      );
    } else {
      // Assigned: The dealership specifically assigned as the user's home dealership
      filtered = allDealerships.filter((d) => String(d.id) === String(userDealerId));
    }

    // Apply Common Filters (Status, Tags)
    return filtered
      .map((item) => {
        // Resolve Status
        const resolvedStatus =
          item.status === 1 || item.status === true || item.status === 'Active'
            ? 'Active'
            : 'Inactive';

        // Resolve Manager Name
        let dealerManagerName = item.dealer_manager_name || item.dealer_manager || '';
        if (!dealerManagerName && item.dealer_owner_name)
          dealerManagerName = item.dealer_owner_name;

        return {
          ...item,
          status: resolvedStatus,
          dealer_manager: dealerManagerName || 'Unassigned',
          joinedDate: item.joined_date
            ? formatDate(item.joined_date)
            : item.created_at
              ? formatDate(item.created_at)
              : 'Recent',
          code: item.code || item.id,
        };
      })
      .filter((item) => {
        // Status Filter
        if (filters.status && item.status !== filters.status) return false;

        // Tag Filter
        if (filters.tags && filters.tags.length > 0) {
          const itemTags = (item.tags || []).map((t) => t.id || t);
          if (!filters.tags.some((tagId) => itemTags.includes(tagId))) return false;
        }
        return true;
      });
  }, [allDealerships, user?.id, user?.dealership_id, activeTab, filters]);

  // Discover unique tags for filter drawer
  const discoveredTags = useMemo(() => {
    const tagMap = new Map();

    const userDealerId = user?.dealership_id;
    const userId = user?.id;

    let baseList = [];
    if (!userId) {
      baseList = [];
    } else if (activeTab === 'created') {
      baseList = allDealerships.filter(
        (d) =>
          String(d.primary_admin_id) === String(userId) && String(d.id) !== String(userDealerId)
      );
    } else {
      baseList = allDealerships.filter((d) => String(d.id) === String(userDealerId));
    }

    baseList.forEach((item) => {
      if (Array.isArray(item.tags)) {
        item.tags.forEach((tag) => {
          const id = typeof tag === 'object' ? tag.id : tag;
          if (id) {
            tagMap.set(id, typeof tag === 'object' ? tag : { id, name: id });
          }
        });
      }
    });

    return Array.from(tagMap.values());
  }, [allDealerships, user?.id, user?.dealership_id, activeTab]);

  // --- Form Logic ---

  const dealershipSchema = yup.object().shape({
    name: yup.string().required('Dealership Name is required'),
    contact_email: yup.string().email('Invalid email address').required('Email is required'),
    contact_phone: yup
      .string()
      .matches(/^[0-9]{10}$/, 'Phone must be exactly 10 digits')
      .required('Phone Number is required'),
    address: yup.string().required('Address is required'),
    city: yup.string().required('City is required'),
    state: yup.string().required('State is required'),
    zip_code: yup.string().required('Zip Code is required'),
    country: yup.string().required('Country is required'),
    website: yup.string().url('Must be a valid URL'),
    logo_url: yup.mixed().test('fileType', 'Unsupported File Format', (value) => {
      if (!value) return true;
      if (typeof value === 'string') return true;
      return (
        value instanceof File && ['image/jpeg', 'image/png', 'image/svg+xml'].includes(value.type)
      );
    }),
    license_number: yup.string().required('License Number is required'),
    tax_id: yup.string().required('Tax ID is required'),
    // dealer_owner/primary_admin are optional as we might auto-set them
    status: yup.string().oneOf(['Active', 'Inactive']).default('Active'),
  });

  const { dealers, admins } = useMemo(() => {
    const allUsers = Array.isArray(usersData)
      ? usersData
      : usersData.users || usersData.data?.users || usersData.data || [];

    // Dealer Owner: strictly show Dealer Managers
    const dealerList = allUsers
      .filter((u) => {
        const role = normalizeRole(u.role);
        return role === 'dealer_manager';
      })
      .map((u) => ({
        label:
          `${u.first_name || ''} ${u.last_name || ''} (${getRoleDisplayName('dealer_manager')} - ${u.email})`.trim(),
        value: u.id,
      }));

    // Primary Admin: shows only who created it (the current logged-in user)
    const adminList = user
      ? [
          {
            label:
              `${user.first_name || ''} ${user.last_name || ''} (${getRoleDisplayName(user.role)} - Me)`.trim(),
            value: user.id,
          },
        ]
      : [];

    // Fallback: If current user is a Dealer Manager and not in the list, add them (though usually admins create it)
    if (
      user &&
      normalizeRole(user.role) === 'dealer_manager' &&
      !dealerList.some((d) => d.value === user.id)
    ) {
      dealerList.push({
        label:
          `${user.first_name || ''} ${user.last_name || ''} (${getRoleDisplayName('dealer_manager')} - Me)`.trim(),
        value: user.id,
      });
    }

    return { dealers: dealerList, admins: adminList };
  }, [usersData, user]);

  const handleSave = async (formData) => {
    try {
      console.log('DEBUG: Saving Dealership (Admin)', formData);

      const payload = {
        name: formData.name,
        contact_email: formData.contact_email,
        location:
          formData.location || `${formData.city || ''}, ${formData.state || ''}`.trim() || null,
        contact_phone: formData.contact_phone,
        address: formData.address || null,
        city: formData.city || null,
        state: formData.state || null,
        zip_code: formData.zip_code || null,
        country: formData.country || null,
        website: formData.website || null,
        license_number: formData.license_number || null,
        tax_id: formData.tax_id || null,
        dealer_owner: formData.dealer_owner_name || user?.id, // Default to user if empty
        primary_admin_id: formData.primary_admin || user?.id, // Default to user if empty
        status: formData.status === 'Active',
      };

      if (!editingDealer) {
        payload.code = formData.code || `DLR-${Date.now().toString().slice(-6)}`;
      }

      let logoUrlToKeep = null;
      const isValidLogoUrl = (val) => typeof val === 'string' && val.trim().startsWith('http');

      if (isValidLogoUrl(formData.logo_url)) {
        logoUrlToKeep = formData.logo_url;
      } else if (editingDealer) {
        const existingLogo = editingDealer.logo_url || editingDealer.logoUrl;
        if (isValidLogoUrl(existingLogo)) {
          logoUrlToKeep = existingLogo;
        }
      }
      payload.logo_url = logoUrlToKeep || null;

      let finalData = payload;

      if (selectedLogoFile && selectedLogoFile instanceof File) {
        const formDataMultipart = new FormData();
        Object.keys(payload).forEach((key) => {
          if (key !== 'logo_url' && payload[key] !== null && payload[key] !== undefined) {
            formDataMultipart.append(key, payload[key]);
          }
        });
        formDataMultipart.append('logo_url', selectedLogoFile);
        finalData = formDataMultipart;
      }

      const result = editingDealer
        ? await updateDealershipMutation.mutateAsync({ id: editingDealer.id, data: finalData })
        : await createDealershipMutation.mutateAsync(finalData);

      const savedId = result?.id || result?.data?.id || editingDealer?.id;

      if (savedId && formData.tags) {
        const tagIds = formData.tags.map((t) => t.id).filter((id) => id);
        try {
          await tagService.syncTags('dealership', savedId, tagIds);
        } catch (err) {
          console.error('Failed to sync dealership tags', err);
        }
      }

      setViewMode('list');
      setEditingDealer(null);
      setSelectedLogoFile(null);
      refetch();

      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: `Dealership ${editingDealer ? 'updated' : 'created'} successfully!`,
        timer: 2000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end',
      });
    } catch (error) {
      console.error('Save failed:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Failed to save dealership data.',
      });
    }
  };

  const handleAction = async (action, dealership) => {
    try {
      if (action === 'toggleStatus') {
        const newStatus = dealership.status === 'Active' ? 'Inactive' : 'Active';
        const statusValue = newStatus === 'Active' ? 1 : 0;
        const result = await Swal.fire({
          title: `${newStatus === 'Active' ? 'Activate' : 'Deactivate'} Dealership?`,
          text: `Are you sure you want to ${newStatus.toLowerCase()} ${dealership.name}?`,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: newStatus === 'Active' ? '#10b981' : '#ef4444',
          cancelButtonText: 'Cancel',
          confirmButtonText: `Yes, ${newStatus.toLowerCase()} it!`,
        });

        if (result.isConfirmed) {
          await updateDealershipMutation.mutateAsync({
            id: dealership.id,
            data: { status: statusValue },
          });
          Swal.fire(
            `${newStatus === 'Active' ? 'Activated' : 'Deactivated'}!`,
            `${dealership.name} has been ${newStatus.toLowerCase()}.`,
            'success'
          );
          refetch();
        }
      } else if (action === 'delete') {
        const deleteResult = await Swal.fire({
          title: 'Delete Dealership?',
          text: `Are you sure you want to delete ${dealership.name}? This action cannot be undone.`,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#ef4444',
          cancelButtonText: 'Cancel',
          confirmButtonText: 'Yes, delete it!',
        });

        if (deleteResult.isConfirmed) {
          await deleteDealershipMutation.mutateAsync(dealership.id);
          Swal.fire('Deleted!', `${dealership.name} has been deleted.`, 'success');
          refetch();
        }
      }
    } catch (error) {
      console.error(`Action ${action} failed:`, error);
    }
  };

  const fields = useMemo(
    () => [
      {
        type: 'section',
        title: 'Basic Information',
        contentClassName: 'grid grid-cols-1 md:grid-cols-2 gap-4',
        fields: [
          {
            name: 'name',
            label: 'Dealership Name',
            placeholder: 'e.g. Metro Ford',
            icon: Building2,
            onChange: (value, { setValue }) => {
              const clean = value.replace(/[^A-Za-z\s'-]/g, '');
              if (clean !== value) setValue('name', clean);
            },
          },
          {
            name: 'contact_email',
            label: 'Email',
            placeholder: 'e.g. metro.ford@gmail.com',
            icon: Mail,
          },
          {
            name: 'contact_phone',
            label: 'Phone Number',
            placeholder: 'xxxxxxxxxx',
            icon: Phone,
            onChange: (value, { setValue }) => {
              const clean = value.replace(/[^0-9]/g, '');
              if (clean !== value) setValue('contact_phone', clean);
            },
          },
          {
            name: 'status',
            label: 'Status',
            type: 'select',
            options: [
              { value: 'Active', label: 'Active' },
              { value: 'Inactive', label: 'Inactive' },
            ],
            icon: CheckCircle,
          },
        ],
      },
      {
        type: 'section',
        title: 'Address Details',
        contentClassName: 'grid grid-cols-1 md:grid-cols-2 gap-4',
        fields: [
          {
            name: 'address',
            label: 'Street Address',
            placeholder: 'e.g. 123 Business Blvd',
            icon: MapPin,
          },
          {
            name: 'city',
            label: 'City',
            placeholder: 'e.g. Los Angeles',
            icon: MapPin,
            onChange: (value, { setValue }) => {
              const clean = value.replace(/[^A-Za-z\s'-]/g, '');
              if (clean !== value) setValue('city', clean);
            },
          },
          {
            name: 'state',
            label: 'State',
            placeholder: 'e.g. California',
            icon: MapMinus,
            onChange: (value, { setValue }) => {
              const clean = value.replace(/[^A-Za-z\s'-]/g, '');
              if (clean !== value) setValue('state', clean);
            },
          },
          {
            name: 'zip_code',
            label: 'ZIP Code',
            placeholder: 'e.g. 90001',
            icon: MapPinHouse,
            onChange: (value, { setValue }) => {
              const clean = value.replace(/[^0-9]/g, '');
              if (clean !== value) setValue('zip_code', clean);
            },
          },
          {
            name: 'country',
            label: 'Country',
            placeholder: 'e.g. USA',
            icon: MapPinned,
            className: 'md:col-span-2',
            onChange: (value, { setValue }) => {
              const clean = value.replace(/[^A-Za-z\s'-]/g, '');
              if (clean !== value) setValue('country', clean);
            },
          },
        ],
      },
      {
        type: 'section',
        title: 'Business Details',
        contentClassName: 'grid grid-cols-1 md:grid-cols-2 gap-4',
        fields: [
          {
            name: 'website',
            label: 'Website URL',
            placeholder: 'e.g. https://dealership.com',
            icon: Building2,
          },
          {
            name: 'logo_url',
            label: 'Dealership Logo',
            type: 'file',
            accept: 'image/*',
            preview: true,
            onChange: (file) => setSelectedLogoFile(file),
            helpText: 'Recommended: SVG, PNG or JPG (Max 2MB)',
          },
          {
            name: 'license_number',
            label: 'License Number',
            placeholder: 'e.g. DL-123456',
            icon: Fingerprint,
          },
          { name: 'tax_id', label: 'Tax ID', placeholder: 'e.g. 12-3456789', icon: Fingerprint },
        ],
      },
      {
        type: 'section',
        title: 'Contact & Management',
        contentClassName: 'grid grid-cols-1 md:grid-cols-2 gap-4',
        fields: [
          {
            name: 'dealer_owner_name',
            label: 'Dealer Owner',
            type: 'select',
            options: dealers.length ? [...dealers] : [{ value: '', label: 'No Dealers Found' }],
            icon: Fingerprint,
            className: 'md:col-span-2',
          },
          {
            name: 'primary_admin',
            label: 'Primary Admin',
            type: 'select',
            options: admins.length ? [...admins] : [{ value: '', label: 'No Admin Found' }],
            icon: User,
            className: 'md:col-span-2',
          },
        ],
      },
      {
        type: 'section',
        title: 'Tags & Labels',
        contentClassName: 'grid grid-cols-1 gap-4',
        fields: [
          {
            name: 'tags',
            label: 'Dealership Tags',
            type: 'custom',
            render: ({ value, onChange }) => (
              <TagInput
                type="dealership"
                value={value || []}
                onChange={onChange}
                placeholder="Add labels..."
              />
            ),
          },
        ],
      },
    ],
    [dealers, admins]
  );

  // --- Render ---

  if (viewMode === 'form') {
    const initialData = editingDealer
      ? {
          ...editingDealer,
          dealer_owner_name: editingDealer.dealer_owner || editingDealer.dealer_id || user?.id, // Fallback to current user
          primary_admin: editingDealer.primary_admin_id || editingDealer.primary_admin || user?.id, // Fallback to current user
          contact_email: editingDealer.contact_email,
          contact_phone: editingDealer.contact_phone,
          tax_id: editingDealer.tax_id,
          license_number: editingDealer.license_number,
          website: editingDealer.website,
          logo_url: editingDealer.logo_url,
          address: editingDealer.address,
          city: editingDealer.city,
          state: editingDealer.state,
          zip_code: editingDealer.zip_code,
          country: editingDealer.country,
          tags: editingDealer.tags || [],
        }
      : {
          tags: [],
          // Pre-fill owner/admin for new dealerships
          dealer_owner_name: user?.id,
          primary_admin: user?.id,
        };

    return (
      <GenericFormPage
        title={editingDealer ? 'Edit Dealership' : 'Register Dealership'}
        subtitle={editingDealer ? 'Update dealership details.' : 'Create a new dealership.'}
        initialData={initialData}
        validationSchema={dealershipSchema}
        fields={fields}
        onSave={handleSave}
        onCancel={() => {
          setViewMode('list');
          setEditingDealer(null);
          setSelectedLogoFile(null);
        }}
      />
    );
  }

  if (loading || isLoadingUsers) {
    return (
      <div className="p-6">
        <SkeletonTable rows={5} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <PageHeader
        title="Dealership Management"
        subtitle="Manage your created and assigned dealerships."
        actions={
          activeTab === 'created' && (
            <button
              onClick={() => {
                setEditingDealer(null);
                setViewMode('form');
              }}
              className="flex items-center gap-2 bg-[rgb(var(--color-primary))] text-white px-5 py-2.5 rounded-xl hover:bg-[rgb(var(--color-primary-dark))] transition-all text-sm font-bold shadow-lg shadow-[rgb(var(--color-primary)/0.2)]"
            >
              <Building2 size={18} />
              <span>Add Dealership</span>
            </button>
          )
        }
      />

      {/* Tab Navigation */}
      <div className="flex gap-1 p-1 bg-[rgb(var(--color-background-soft))] border border-[rgb(var(--color-border))] rounded-2xl w-fit shadow-sm">
        <button
          onClick={() => setActiveTab('created')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'created'
              ? 'bg-[rgb(var(--color-primary))] text-white shadow-lg shadow-[rgb(var(--color-primary)/0.2)]'
              : 'text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-background))]'
          }`}
        >
          <Building2 size={16} />
          Dealerships
        </button>
        <button
          onClick={() => setActiveTab('assigned')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'assigned'
              ? 'bg-[rgb(var(--color-primary))] text-white shadow-lg shadow-[rgb(var(--color-primary)/0.2)]'
              : 'text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-background))]'
          }`}
        >
          <LayoutGrid size={16} />
          My Dealerships
        </button>
      </div>

      <DataTable
        data={displayedDealerships}
        searchKeys={['name', 'location', 'dealer_manager', 'status']}
        highlightId={highlightId}
        itemsPerPage={preferences.items_per_page || 10}
        onFilterClick={() => setIsFilterOpen(true)}
        onClearFilters={clearFilters}
        showClearFilter={filters.status !== '' || (filters.tags && filters.tags.length > 0)}
        columns={[
          {
            header: 'Dealership',
            accessor: 'name',
            sortable: true,
            render: (row) => (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[rgb(var(--color-background))] border border-[rgb(var(--color-border))] overflow-hidden flex items-center justify-center flex-shrink-0 shadow-sm">
                  {row.logo_url ? (
                    <div className="relative w-full h-full p-1">
                      <Image
                        src={row.logo_url}
                        alt={row.name}
                        fill
                        className="object-contain"
                        sizes="40px"
                      />
                    </div>
                  ) : (
                    <Building2 size={20} className="text-[rgb(var(--color-text-muted))]" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-[rgb(var(--color-text))] truncate">{row.name}</div>
                  <div className="flex items-center gap-1 text-xs text-[rgb(var(--color-text-muted))] mt-0.5">
                    <MapPin size={12} />
                    <span className="truncate">{row.location}</span>
                  </div>
                </div>
              </div>
            ),
          },
          {
            header: 'Manager',
            accessor: 'dealer_manager',
            render: (row) => (
              <div
                className={`text-sm ${row.dealer_manager === 'Unassigned' ? 'text-[rgb(var(--color-text-muted))] italic' : 'text-[rgb(var(--color-text))] font-medium'}`}
              >
                {row.dealer_manager}
              </div>
            ),
          },
          {
            header: 'Tags',
            accessor: 'tags',
            render: (row) => <TagList tags={row.tags || []} limit={2} />,
          },
          {
            header: 'Status',
            type: 'badge',
            accessor: 'status',
            config: { green: ['Active'], gray: ['Inactive'] },
          },
          {
            header: 'Performance',
            className: 'text-center',
            accessor: (row) => (
              <div className="text-sm">
                <span className="font-semibold text-[rgb(var(--color-text))]">
                  {row.performance?.quotes || 0} Quotes
                </span>
                <span className="mx-1.5 text-gray-300">•</span>
                <span
                  className={`font-medium ${(row.performance?.conversion || 0) >= 70 ? 'text-emerald-600' : (row.performance?.conversion || 0) >= 50 ? 'text-blue-600' : 'text-orange-600'}`}
                >
                  {row.performance?.conversion || 0}% Conv.
                </span>
              </div>
            ),
          },
          {
            header: 'Actions',
            className: 'text-center',
            accessor: (row) => (
              <div className="flex justify-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/dealerships/${row.id}`);
                  }}
                  className="p-1.5 text-[rgb(var(--color-text-muted))] hover:bg-[rgb(var(--color-info))/0.1] rounded-lg hover:text-[rgb(var(--color-info))]"
                  title="View Details"
                >
                  <Eye size={16} />
                </button>
                {activeTab === 'created' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingDealer(row);
                      setViewMode('form');
                    }}
                    className="p-1.5 text-[rgb(var(--color-text-muted))] hover:bg-[rgb(var(--color-primary))/0.1] rounded-lg hover:text-[rgb(var(--color-primary))]"
                    title="Edit"
                  >
                    <Edit2 size={16} />
                  </button>
                )}
                {activeTab === 'created' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAction('toggleStatus', row);
                    }}
                    className={`p-1.5 rounded-lg transition-colors ${row.status === 'Active' ? 'text-[rgb(var(--color-text-muted))] hover:bg-[rgb(var(--color-error))/0.1] hover:text-[rgb(var(--color-error))]' : 'text-[rgb(var(--color-success))] hover:bg-[rgb(var(--color-success))/0.1]'}`}
                    title={row.status === 'Active' ? 'Deactivate' : 'Activate'}
                  >
                    {row.status === 'Active' ? <Ban size={16} /> : <CheckCircle size={16} />}
                  </button>
                )}
              </div>
            ),
          },
        ]}
      />

      <FilterDrawer
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onReset={() => setTempFilters({ status: '', tags: [] })}
        onApply={() => {
          setFilters(tempFilters);
          setIsFilterOpen(false);
        }}
      >
        <div className="space-y-6">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[rgb(var(--color-text))]">Status</h3>
            <select
              value={tempFilters.status}
              onChange={(e) => setTempFilters((prev) => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 bg-[rgb(var(--color-background))] border border-[rgb(var(--color-border))] rounded-xl text-sm"
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
          <div className="space-y-3">
            <TagFilter
              selectedTags={tempFilters.tags || []}
              onChange={(tags) => setTempFilters((prev) => ({ ...prev, tags }))}
              type="dealership"
              options={discoveredTags}
            />
          </div>
        </div>
      </FilterDrawer>
    </div>
  );
}
