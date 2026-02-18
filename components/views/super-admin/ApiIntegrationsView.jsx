import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Key,
  Shield,
  Globe,
  CreditCard,
  Mail,
  MessageSquare,
  Share2,
  Plus,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Settings,
  Copy,
  RefreshCw,
  Edit,
  MoreHorizontal,
  Clock,
} from 'lucide-react';
import ActionMenuPortal from '@/components/common/ActionMenuPortal';
import Swal from 'sweetalert2';
import { SkeletonTable } from '../../common/Skeleton';
import DataTable from '../../common/DataTable';
import FormModal from '../../common/FormModal';
import DetailViewModal from '../../common/DetailViewModal';
import * as yup from 'yup';
import {
  useApiKeys,
  useCreateApiKey,
  useUpdateApiKey,
  useRevokeApiKey,
  useRegenerateApiSecret,
  useApiKey,
} from '@/hooks/useApiKeys';
import { usePreference } from '@/context/PreferenceContext';
import { formatDate } from '@/utils/i18n';

export default function ApiIntegrationsView() {
  const { data: apiKeys = [], isLoading: loading } = useApiKeys();
  const { preferences } = usePreference();
  const createMutation = useCreateApiKey();
  const updateMutation = useUpdateApiKey();
  const revokeMutation = useRevokeApiKey();
  const regenerateMutation = useRegenerateApiSecret();

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState(null);
  const [selectedKeyId, setSelectedKeyId] = useState(null);
  const [activeDropdownId, setActiveDropdownId] = useState(null);
  const [triggerRect, setTriggerRect] = useState(null);

  const { data: keyDetails } = useApiKey(selectedKeyId);

  const handleCreateKey = () => {
    setSelectedKey(null);
    setIsFormModalOpen(true);
  };

  const handleEdit = React.useCallback((row) => {
    setSelectedKey(row);
    setIsFormModalOpen(true);
  }, []);

  const handleViewDetails = React.useCallback((id) => {
    setSelectedKeyId(id);
    setIsDetailsModalOpen(true);
  }, []);

  const handleRevoke = React.useCallback(
    (id) => {
      Swal.fire({
        title: 'Are you sure?',
        text: 'This will immediately block access for this API key.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: 'rgb(var(--color-error))',
        cancelButtonColor: 'rgb(var(--color-text-muted))',
        confirmButtonText: 'Yes, Revoke it!',
      }).then(async (result) => {
        if (result.isConfirmed) {
          revokeMutation.mutate(id);
        }
      });
    },
    [revokeMutation]
  );

  const handleRegenerateSecret = React.useCallback(
    (id) => {
      Swal.fire({
        title: 'Regenerate API Secret?',
        html: `
                <p class="text-sm text-gray-600 mb-2">This will invalidate the current secret.</p>
                <p class="text-sm text-red-600 font-semibold">⚠️ Update all integrations using this key!</p>
            `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: 'rgb(var(--color-warning))',
        cancelButtonColor: 'rgb(var(--color-text-muted))',
        confirmButtonText: 'Yes, regenerate it!',
      }).then(async (result) => {
        if (result.isConfirmed) {
          try {
            const newKey = await regenerateMutation.mutateAsync(id);

            // Show new secret once
            Swal.fire({
              title: 'New Secret Generated',
              html: `
                            <p class="text-sm text-[rgb(var(--color-text-muted))] mb-2">Copy this secret now. You won't be able to see it again.</p>
                            <div class="bg-[rgb(var(--color-background))] p-3 rounded border border-[rgb(var(--color-border))] font-mono text-center break-all select-all font-bold text-lg text-[rgb(var(--color-success))]">
                                ${newKey.secret || newKey.api_secret || newKey.key || 'secret_regenerated_successfully'}
                            </div>
                        `,
              icon: 'success',
            });
          } catch (error) {
            // Error handled by mutation
          }
        }
      });
    },
    [regenerateMutation]
  );

  const handleCopy = React.useCallback((text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 1500,
      customClass: {
        popup: 'rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))]',
      },
    });
    Toast.fire({ icon: 'success', title: 'Copied to clipboard' });
  }, []);

  const handleFormSave = async (formData) => {
    try {
      if (selectedKey) {
        // Update
        await updateMutation.mutateAsync({ id: selectedKey.id, data: formData });
      } else {
        // Create
        const payload = {
          ...formData,
          key_name: formData.key_name || formData.service_name,
          service_name:
            formData.service_name || formData.key_name?.toLowerCase().replace(/\s+/g, '_'),
        };
        const newKey = await createMutation.mutateAsync(payload);

        // Show generated key/secret for creation
        Swal.fire({
          title: 'API Key Generated',
          html: `
                        <p class="text-sm text-[rgb(var(--color-text-muted))] mb-2">Copy this key now. You won't be able to see it again.</p>
                        <div class="bg-[rgb(var(--color-background))] p-3 rounded border border-[rgb(var(--color-border))] font-mono text-center break-all select-all font-bold text-lg text-[rgb(var(--color-success))]">
                            ${newKey.key || newKey.token || newKey.secret || newKey.api_key || 'key_generated_successfully'}
                        </div>
                    `,
          icon: 'success',
        });
      }
      setIsFormModalOpen(false);
      setSelectedKey(null);
    } catch (error) {
      // Error handled by mutation toast/logger
    }
  };

  // Form fields configuration
  const formFields = [
    {
      name: 'key_name',
      label: 'Key Name',
      type: 'text',
      placeholder: 'e.g., Stripe Payment Gateway',
    },
    {
      name: 'service_name',
      label: 'Service Identifier',
      type: 'text',
      placeholder: 'e.g., stripe',
    },
    {
      name: 'service_type',
      label: 'Service Type',
      type: 'select',
      options: [
        { value: '', label: 'Select type' },
        { value: 'external', label: 'External' },
        { value: 'internal', label: 'Internal' },
        { value: 'integration', label: 'Integration' },
      ],
    },
    {
      name: 'permissions',
      label: 'Permissions',
      type: 'checkbox-group',
      options: [
        { value: 'read', label: 'Read' },
        { value: 'write', label: 'Write' },
        { value: 'delete', label: 'Delete' },
        { value: 'admin', label: 'Admin' },
      ],
    },
  ];

  const validationSchema = yup.object().shape({
    key_name: yup.string().required('Key name is required'),
    service_name: yup.string().required('Service identifier is required'),
    service_type: yup.string().required('Service type is required'),
  });

  const columns = useMemo(
    () => [
      {
        header: 'Name / Service',
        accessor: (row) => (
          <div>
            <div className="font-bold text-[rgb(var(--color-text))]">
              {row.service_name || 'Unnamed Key'}
            </div>
            <div className="text-xs text-[rgb(var(--color-text-muted))] uppercase tracking-wider">
              {row.service_type || 'Generic'}
            </div>
          </div>
        ),
        sortable: true,
        sortKey: 'service_name',
      },
      {
        header: 'API Key Prefix',
        accessor: (row) => (
          <div className="font-mono text-xs text-[rgb(var(--color-text-muted))] bg-[rgb(var(--color-background))] px-2 py-1 rounded w-fit flex items-center gap-2">
            <Key size={12} className="opacity-50" />
            {row.api_key ? row.api_key.substring(0, 8) + '...' : 'pk_****'}
          </div>
        ),
      },
      {
        header: 'Permissions',
        accessor: (row) => (
          <div className="flex flex-wrap gap-1">
            {Array.isArray(row.permissions) && row.permissions.length > 0 ? (
              row.permissions.slice(0, 2).map((perm, i) => (
                <span
                  key={i}
                  className="px-1.5 py-0.5 rounded text-[10px] bg-[rgb(var(--color-text-muted))/0.1] text-[rgb(var(--color-text-muted))] border border-[rgb(var(--color-border))]"
                >
                  {perm}
                </span>
              ))
            ) : (
              <span className="text-xs text-[rgb(var(--color-text-muted))]">-</span>
            )}
            {Array.isArray(row.permissions) && row.permissions.length > 2 && (
              <span className="text-[10px] text-[rgb(var(--color-text-muted))]">
                +{row.permissions.length - 2} more
              </span>
            )}
          </div>
        ),
      },
      {
        header: 'Created / Expires',
        accessor: (row) => (
          <div className="text-xs text-[rgb(var(--color-text-muted))]">
            <div>Created: {row.created_at ? formatDate(row.created_at) : 'N/A'}</div>
            {row.expires_at && (
              <div className="text-[rgb(var(--color-danger))]">
                Exp: {formatDate(row.expires_at)}
              </div>
            )}
          </div>
        ),
        sortable: true,
        sortKey: 'created_at',
      },
      {
        header: 'Actions',
        className: 'text-center',
        accessor: (row) => (
          <div className="flex justify-center pr-2">
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const rect = e.currentTarget.getBoundingClientRect();
                  setTriggerRect(rect);
                  setActiveDropdownId(activeDropdownId === row.id ? null : row.id);
                }}
                className={`p-1.5 rounded-lg transition-colors ${activeDropdownId === row.id ? 'bg-[rgb(var(--color-primary))/0.05] text-[rgb(var(--color-primary))]' : 'text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-primary))] hover:bg-[rgb(var(--color-primary)/0.05)]'}`}
              >
                <MoreHorizontal size={18} />
              </button>

              <ActionMenuPortal
                isOpen={activeDropdownId === row.id}
                onClose={() => setActiveDropdownId(null)}
                triggerRect={triggerRect}
                align="end"
              >
                <div className="py-2">
                  {/* View Details */}
                  <button
                    onClick={() => {
                      handleViewDetails(row.id);
                      setActiveDropdownId(null);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-primary))] hover:bg-[rgb(var(--color-primary)/0.05)] transition-all"
                  >
                    <Eye size={14} /> View Key Details
                  </button>

                  {/* Edit */}
                  <button
                    onClick={() => {
                      handleEdit(row);
                      setActiveDropdownId(null);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-primary))] hover:bg-[rgb(var(--color-primary)/0.05)] transition-all"
                  >
                    <Edit size={14} /> Edit Configuration
                  </button>

                  {/* Copy */}
                  <button
                    onClick={() => {
                      handleCopy(row.api_key || row.prefix);
                      setActiveDropdownId(null);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-primary))] hover:bg-[rgb(var(--color-primary)/0.05)] transition-all"
                  >
                    <Copy size={14} /> Copy Prefix
                  </button>

                  {/* Regenerate Secret */}
                  {row.is_active && (
                    <button
                      onClick={() => {
                        handleRegenerateSecret(row.id);
                        setActiveDropdownId(null);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-[rgb(var(--color-warning))] hover:bg-[rgb(var(--color-warning))]/5 transition-all border-t border-[rgb(var(--color-border))]"
                    >
                      <RefreshCw size={14} /> Regenerate Secret
                    </button>
                  )}

                  {/* Revoke */}
                  {row.is_active && (
                    <button
                      onClick={() => {
                        handleRevoke(row.id);
                        setActiveDropdownId(null);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-[rgb(var(--color-danger))] hover:bg-[rgb(var(--color-danger)/0.05)] transition-all"
                    >
                      <Trash2 size={14} /> Revoke Key
                    </button>
                  )}
                </div>
              </ActionMenuPortal>
            </div>
          </div>
        ),
      },
    ],
    [
      handleRevoke,
      handleCopy,
      handleRegenerateSecret,
      activeDropdownId,
      handleEdit,
      handleViewDetails,
      triggerRect,
    ]
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {loading && !apiKeys.length ? (
        <div className="p-6 overflow-hidden">
          <SkeletonTable rows={5} />
        </div>
      ) : (
        <>
          <div>
            <h2 className="text-xl font-bold text-[rgb(var(--color-text))] flex items-center gap-2">
              <Key className="text-[rgb(var(--color-primary))]" /> API Keys & Access
            </h2>
            <p className="text-[rgb(var(--color-text-muted))] text-sm mt-1">
              Manage secret keys for external access and configure third-party integrations.
            </p>
          </div>

          <DataTable
            data={apiKeys}
            columns={columns}
            searchKeys={['service_name', 'service_type', 'environment']}
            searchPlaceholder="Search keys..."
            itemsPerPage={preferences.items_per_page || 10}
            extraControls={
              <button
                onClick={handleCreateKey}
                className="flex items-center gap-2 px-4 py-2 bg-[rgb(var(--color-primary))] text-white rounded-xl text-sm font-bold shadow-lg shadow-[rgb(var(--color-primary))/0.2] hover:bg-[rgb(var(--color-primary-dark))] transition-all whitespace-nowrap"
              >
                <Plus size={16} /> Generate New Key
              </button>
            }
          />

          <FormModal
            isOpen={isFormModalOpen}
            onClose={() => {
              setIsFormModalOpen(false);
              setSelectedKey(null);
            }}
            onSave={handleFormSave}
            title={selectedKey ? 'Edit API Key' : 'Generate New API Key'}
            subtitle={
              selectedKey
                ? 'Update the API key configuration below.'
                : 'Enter the details to generate a new secure access key.'
            }
            initialData={selectedKey}
            fields={formFields}
            validationSchema={validationSchema}
            isEditMode={!!selectedKey}
          />

          {isDetailsModalOpen && keyDetails && (
            <DetailViewModal
              isOpen={isDetailsModalOpen}
              onClose={() => {
                setIsDetailsModalOpen(false);
                setSelectedKeyId(null);
              }}
              title="API Key Details"
              showActivityTab={false}
              data={{
                ...keyDetails,
                name: keyDetails.key_name,
                status: keyDetails.is_active ? 'Active' : 'Revoked',
                createdAt: keyDetails.created_at, // Mapping to fix "Joined" date in Modal
                display_permissions: Array.isArray(keyDetails.permissions)
                  ? keyDetails.permissions.join(', ')
                  : keyDetails.permissions || 'N/A',
              }}
              sections={[
                {
                  title: 'Key Configuration',
                  icon: Key,
                  fields: [
                    { label: 'Service Name', key: 'service_name' },
                    { label: 'Service Type', key: 'service_type' },
                    {
                      label: 'Environment',
                      key: 'environment',
                      value: keyDetails.environment || 'N/A',
                    },
                    { label: 'Permissions', key: 'display_permissions' },
                  ],
                },
                {
                  title: 'Security & Access',
                  icon: Shield,
                  fields: [
                    {
                      label: 'API Key Prefix',
                      key: 'api_key',
                      value: keyDetails.api_key
                        ? keyDetails.api_key.substring(0, 8) + '...'
                        : 'N/A',
                    },
                    {
                      label: 'Status',
                      key: 'status',
                      value: keyDetails.is_active ? 'Active' : 'Revoked',
                    },
                  ],
                },
                {
                  title: 'Metadata',
                  icon: Clock,
                  fields: [
                    { label: 'Created At', key: 'created_at' },
                    { label: 'Expires At', key: 'expires_at' },
                  ],
                },
              ]}
            />
          )}
        </>
      )}
    </div>
  );
}
