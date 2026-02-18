'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import DataTable from '../../common/DataTable';
import GenericFormPage from '@/components/common/GenericFormPage';
import { useRouter, useSearchParams } from 'next/navigation';
import Swal from 'sweetalert2';
import * as yup from 'yup';
import {
  Building2,
  Mail,
  MapPin,
  Phone,
  User,
  Fingerprint,
  CheckCircle,
  Edit2,
  Ban,
  Eye,
  MapPinHouse,
  MapMinus,
  MapPinned,
} from 'lucide-react';
import { SkeletonTable } from '../../common/Skeleton';
import {
  useDealerships,
  useCreateDealership,
  useUpdateDealership,
  useDeleteDealership,
} from '@/hooks/useDealerships';
import { useUsers } from '@/hooks/useUsers';
import { usePreference } from '@/context/PreferenceContext';
import { formatDate } from '@/utils/i18n';
import dealershipService from '@/services/dealershipService';
import tagService from '@/services/tagService';
import TagInput from '@/components/common/tags/TagInput';
import TagList from '@/components/common/tags/TagList';
import FilterDrawer from '../../common/FilterDrawer';
import TagFilter from '@/components/common/tags/TagFilter';
import PageHeader from '@/components/common/PageHeader';

const SuperAdminDealerships = ({ onRefresh, hideHeader = false }) => {
  const { data: dealershipsData = [], isLoading: isLoadingDealerships } = useDealerships();
  const { data: usersData = [], isLoading: isLoadingUsers } = useUsers();
  const { preferences } = usePreference();

  const createDealershipMutation = useCreateDealership();
  const updateDealershipMutation = useUpdateDealership();
  const deleteDealershipMutation = useDeleteDealership();

  const { dealers, admins } = React.useMemo(() => {
    const allUsers = Array.isArray(usersData)
      ? usersData
      : usersData.users || usersData.data?.users || usersData.data || [];

    const dealerList = allUsers
      .filter((u) => {
        const roleValue = u.role?.name || u.role || u.user_role || u.userRole || '';
        const roleStr = String(roleValue).toLowerCase();
        return (
          roleStr.includes('dealer') ||
          roleStr.includes('manager') ||
          ['dealer_manager', 'dealership_manager', 'dealership_admin'].includes(roleStr)
        );
      })
      .map((u) => ({
        label:
          `${u.first_name || u.firstName || u.name || ''} ${u.last_name || u.lastName || ''} (${u.email})`.trim(),
        value: u.id,
      }));

    const adminList = allUsers
      .filter((u) => {
        const roleStr = (u.role?.name || u.role || '').toLowerCase();
        const isAdmin = roleStr.includes('admin') || roleStr === 'admin';
        const isSuperAdmin = roleStr.includes('super_admin') || roleStr === 'super_admin';
        return isAdmin && !isSuperAdmin;
      })
      .map((u) => ({
        label:
          `${u.first_name || u.firstName || u.name || ''} ${u.last_name || u.lastName || ''} (${u.email})`.trim(),
        value: u.id,
      }));

    return { dealers: dealerList, admins: adminList };
  }, [usersData]);

  const dealershipSchema = yup.object().shape({
    name: yup.string().required('Dealership Name is required'),
    contact_email: yup
      .string()
      .email('Invalid email address')
      .matches(
        /^[a-z0-9._-]+@[a-z0-9.-]+\.[a-z]{2,}$/,
        'Email must be lowercase and valid (e.g. name@dealership.com)'
      )
      .required('Email is required'),
    location: yup.string(),
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
    dealer_owner_name: yup.string().required('Dealer Owner Name is required'),
    primary_admin: yup.string().required('Primary Admin is required'),
    status: yup.string().oneOf(['Active', 'Inactive']).default('Active'),
  });

  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightId = searchParams.get('highlight');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'form'
  const [editingDealer, setEditingDealer] = useState(null);
  const [selectedLogoFile, setSelectedLogoFile] = useState(null);

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

  const dealerships = React.useMemo(() => {
    const list = Array.isArray(dealershipsData)
      ? dealershipsData
      : dealershipsData.dealerships || [];

    // 0. Preliminary Mapping
    let mapped = list.map((item) => {
      // 1. Resolve Status (Consistent for both UI and Filtering)
      const resolvedStatus =
        item.status === 1 || item.status === true || item.status === 'Active'
          ? 'Active'
          : 'Inactive';

      // 2. Resolve Dealer Manager Name (Consistent for both UI and SEARCH)
      let dealerManagerName = item.dealer_manager_name || item.dealer_manager || '';

      if (!dealerManagerName) {
        if (item.dealer_owner_name) {
          dealerManagerName = item.dealer_owner_name;
        } else if (item.dealer?.name) {
          dealerManagerName = item.dealer.name;
        } else {
          const dealerId = item.dealer_owner || item.dealer_id || item.dealerId || item.dealer?.id;
          if (dealerId && dealers.length > 0) {
            const matchedDealer = dealers.find((d) => d.value === dealerId);
            if (matchedDealer) dealerManagerName = matchedDealer.label;
          }
        }
      }

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
    });

    // 1. Apply Filters
    return mapped.filter((item) => {
      // Status Filter
      if (filters.status && item.status !== filters.status) return false;

      // Tag Filter
      if (filters.tags && filters.tags.length > 0) {
        const itemTags = (item.tags || []).map((t) => t.id || t);
        const hasMatch = filters.tags.some((tagId) => itemTags.includes(tagId));
        if (!hasMatch) return false;
      }

      return true;
    });
  }, [dealershipsData, dealers, filters]);

  // Discover unique tags from dealerships for the filter drawer
  const discoveredTags = React.useMemo(() => {
    const list = Array.isArray(dealershipsData)
      ? dealershipsData
      : dealershipsData.dealerships || [];
    const tagMap = new Map();

    list.forEach((item) => {
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
  }, [dealershipsData]);

  const handleSave = async (formData) => {
    try {
      // Log raw form data for debugging
      console.log('DEBUG: Raw Form Data from GenericFormPage:', formData);

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
        dealer_owner: formData.dealer_owner_name === '' ? null : formData.dealer_owner_name,
        primary_admin_id: formData.primary_admin === '' ? null : formData.primary_admin,
        status: formData.status === 'Active', // Convert to boolean (true/false) as per API Docs
      };

      // Add code for new dealerships
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
        console.log('DEBUG: Consolidating text and file into a single FormData payload...');
        const formDataMultipart = new FormData();

        Object.keys(payload).forEach((key) => {
          if (key !== 'logo_url' && payload[key] !== null && payload[key] !== undefined) {
            formDataMultipart.append(key, payload[key]);
          }
        });

        formDataMultipart.append('logo_url', selectedLogoFile);
        finalData = formDataMultipart;
      }

      console.log(
        'DEBUG: Final Payload to be sent:',
        finalData instanceof FormData ? 'FormData (Multi-part)' : finalData
      );

      const dealershipId =
        editingDealer?.id ||
        (editingDealer ? editingDealer.id : null) ||
        updateDealershipMutation.data?.id ||
        createDealershipMutation.data?.id;

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
      onRefresh?.();

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
      switch (action) {
        case 'toggleStatus':
          const newStatus = dealership.status === 'Active' ? 'Inactive' : 'Active';
          const statusValue = newStatus === 'Active' ? 1 : 0;
          const result = await Swal.fire({
            title: `${newStatus === 'Active' ? 'Activate' : 'Deactivate'} Dealership?`,
            text: `Are you sure you want to ${newStatus.toLowerCase()} ${dealership.name}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: newStatus === 'Active' ? '#10b981' : '#ef4444',
            cancelButtonColor: '#6b7280',
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
            onRefresh?.();
          }
          break;

        case 'delete':
          const deleteResult = await Swal.fire({
            title: 'Delete Dealership?',
            text: `Are you sure you want to delete ${dealership.name}? This action cannot be undone.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, delete it!',
          });

          if (deleteResult.isConfirmed) {
            await deleteDealershipMutation.mutateAsync(dealership.id);
            Swal.fire('Deleted!', `${dealership.name} has been deleted.`, 'success');
            onRefresh?.();
          }
          break;

        default:
          console.warn('Unknown action:', action);
      }
    } catch (error) {
      console.error(`Action ${action} failed:`, error);
    }
  };

  if (viewMode === 'form') {
    const fields = [
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
                placeholder="Add labels (e.g. VIP, Priority, East Coast)..."
              />
            ),
          },
        ],
      },
    ];

    console.log('DEBUG: Editing Dealer', editingDealer);
    console.log('DEBUG: Admins List', admins);

    const initialData = editingDealer
      ? {
          ...editingDealer,
          dealer_owner_name:
            editingDealer.dealer_owner ||
            editingDealer.dealer_id ||
            editingDealer.dealerId ||
            editingDealer.dealer?.id ||
            '',
          primary_admin:
            editingDealer.primary_admin_id ||
            editingDealer.primary_admin ||
            editingDealer.primaryAdmin ||
            editingDealer.admin?.id ||
            '',
          contact_email: editingDealer.contact_email || editingDealer.contactEmail,
          contact_phone: editingDealer.contact_phone || editingDealer.contactPhone,
          tax_id: editingDealer.tax_id || editingDealer.taxId,
          license_number: editingDealer.license_number || editingDealer.licenseNumber,
          website: editingDealer.website || editingDealer.website,
          logo_url: editingDealer.logo_url || editingDealer.logoUrl,
          address: editingDealer.address || editingDealer.address,
          city: editingDealer.city || editingDealer.city,
          state: editingDealer.state || editingDealer.state,
          zip_code: editingDealer.zip_code || editingDealer.zipCode,
          country: editingDealer.country || editingDealer.country,
          tags: editingDealer.tags || [],
        }
      : {
          tags: [],
        };

    return (
      <GenericFormPage
        title={editingDealer ? 'Edit Dealership' : 'Register Dealership'}
        subtitle="Enter dealership details and assign a dealer."
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

  return (
    <div className="space-y-6">
      {!hideHeader && (
        <PageHeader
          title="Dealership Management"
          subtitle="Onboard and manage dealership partners"
          actions={
            !isLoadingDealerships &&
            !isLoadingUsers && (
              <button
                onClick={() => {
                  setEditingDealer(null);
                  setViewMode('form');
                }}
                className="flex items-center gap-2 bg-[rgb(var(--color-primary))] text-white px-5 py-2.5 rounded-xl hover:bg-[rgb(var(--color-primary-dark))] transition-all text-sm font-bold shadow-lg shadow-[rgb(var(--color-primary)/0.2)] whitespace-nowrap group"
              >
                <Building2 size={18} className="group-hover:scale-110 transition-transform" />
                <span className="hidden sm:inline">Add Dealership</span>
                <span className="sm:hidden">Add Dealership</span>
              </button>
            )
          }
        />
      )}

      {isLoadingDealerships || isLoadingUsers ? (
        <div className="p-6 overflow-hidden">
          <SkeletonTable rows={5} />
        </div>
      ) : (
        <DataTable
          data={dealerships}
          searchKeys={['name', 'location', 'dealer_manager', 'status']}
          highlightId={highlightId}
          itemsPerPage={preferences.items_per_page || 10}
          sortOptions={[
            { key: 'name', label: 'Name' },
            { key: 'location', label: 'Location' },
            { key: 'dealer_manager', label: 'Manager' },
          ]}
          onFilterClick={() => setIsFilterOpen(true)}
          onClearFilters={clearFilters}
          showClearFilter={filters.status !== '' || (filters.tags && filters.tags.length > 0)}
          extraControls={
            hideHeader && (
              <button
                onClick={() => {
                  setEditingDealer(null);
                  setViewMode('form');
                }}
                className="flex items-center gap-2 bg-[rgb(var(--color-primary))] text-white px-4 h-11 rounded-xl hover:bg-[rgb(var(--color-primary-dark))] transition-all text-sm font-bold shadow-sm whitespace-nowrap group"
              >
                <Building2 size={16} className="group-hover:scale-110 transition-transform" />
                <span>Add Dealership</span>
              </button>
            )
          }
          columns={[
            {
              header: 'Dealership',
              accessor: 'name',
              sortable: true,
              sort: true,
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
                    <div className="font-bold text-[rgb(var(--color-text))] truncate">
                      {row.name}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-[rgb(var(--color-text-muted))] mt-0.5">
                      <MapPin size={12} />
                      <span className="truncate">{row.location}</span>
                    </div>
                  </div>
                </div>
              ),
            },
            {
              header: 'Dealer Manager',
              sortable: true,
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
              config: {
                green: ['Active'],
                gray: ['Inactive'],
              },
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
                    className={`font-medium ${
                      (row.performance?.conversion || 0) >= 70
                        ? 'text-emerald-600'
                        : (row.performance?.conversion || 0) >= 50
                          ? 'text-blue-600'
                          : 'text-orange-600'
                    }`}
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
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAction('toggleStatus', row);
                    }}
                    className={`p-1.5 rounded-lg transition-colors ${
                      row.status === 'Active'
                        ? 'text-[rgb(var(--color-text-muted))] hover:bg-[rgb(var(--color-error))/0.1] hover:text-[rgb(var(--color-error))]'
                        : 'text-[rgb(var(--color-success))] hover:bg-[rgb(var(--color-success))/0.1]'
                    }`}
                    title={row.status === 'Active' ? 'Deactivate' : 'Activate'}
                  >
                    {row.status === 'Active' ? <Ban size={16} /> : <CheckCircle size={16} />}
                  </button>
                </div>
              ),
            },
          ]}
        />
      )}

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
              className="w-full px-3 py-2 bg-[rgb(var(--color-background))] border border-[rgb(var(--color-border))] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))/0.2]"
            >
              <option value="">All Status</option>
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
};

export default SuperAdminDealerships;
