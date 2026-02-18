'use client';
import React, { useState, useEffect, useMemo, useCallback } from 'react';

const EMPTY_ARRAY = [];
import {
  Save,
  RefreshCw,
  Search,
  Sliders,
  Hash,
  Type,
  ToggleLeft,
  ToggleRight,
  Database,
  ChevronRight,
  Plus,
  Trash2,
  Percent,
  Edit2,
} from 'lucide-react';
import { SkeletonCard } from '../../common/Skeleton';
import Swal from 'sweetalert2';
import TabNavigation from '@/components/common/TabNavigation';
import FormModal from '@/components/common/FormModal';
import * as yup from 'yup';
import ApiIntegrationsView from './ApiIntegrationsView';
import {
  usePricingConfigs,
  useUpdatePricingConfig,
  useCreatePricingConfig,
  useDeletePricingConfig,
} from '@/hooks/usePricingConfig';

const SmartJsonEditor = ({ value, onChange, category }) => {
  const [parsedData, setParsedData] = useState({});

  useEffect(() => {
    try {
      const parsed = typeof value === 'object' ? value : JSON.parse(value || '{}');
      setParsedData(parsed);
    } catch (e) {
      setParsedData({});
    }
  }, [value]);

  const handleVisualChange = (newData) => {
    setParsedData(newData);
    onChange(newData);
  };

  const updateKey = (oldKey, newKey) => {
    if (!newKey || parsedData[newKey]) return;
    const newData = { ...parsedData };
    newData[newKey] = newData[oldKey];
    delete newData[oldKey];
    handleVisualChange(newData);
  };

  const updateValue = (key, val) => {
    const newData = { ...parsedData, [key]: val };
    handleVisualChange(newData);
  };

  const deleteItem = (key) => {
    const newData = { ...parsedData };
    delete newData[key];
    handleVisualChange(newData);
  };

  const addItem = () => {
    const newData = { ...parsedData, [`new_key_${Date.now()}`]: '' };
    handleVisualChange(newData);
  };

  return (
    <div className="border border-[rgb(var(--color-border))] rounded-xl overflow-hidden bg-[rgb(var(--color-background))] flex flex-col h-full min-h-[300px]">
      <div className="p-3 space-y-2 overflow-y-auto h-full custom-scrollbar">
        {Object.entries(parsedData).map(([key, val]) => (
          <div key={key} className="flex gap-2 items-center group">
            <input
              type="text"
              defaultValue={key}
              onBlur={(e) => updateKey(key, e.target.value)}
              className="w-1/3 bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] rounded-lg px-3 py-2 text-xs font-bold text-[rgb(var(--color-primary))] focus:ring-2 focus:ring-[rgb(var(--color-primary))/0.2] outline-none"
            />
            <span className="text-[rgb(var(--color-text-muted))] font-mono">:</span>
            <div className="flex-1 relative">
              <input
                type="text"
                value={val}
                onChange={(e) => updateValue(key, e.target.value)}
                className="w-full bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] rounded-lg px-3 py-2 text-xs text-[rgb(var(--color-text))] focus:border-[rgb(var(--color-primary))] outline-none font-mono"
              />
              {(String(category).toLowerCase().includes('discount') ||
                String(category).toLowerCase().includes('insurance') ||
                String(category).toLowerCase().includes('tax') ||
                String(key).toLowerCase().includes('percentage') ||
                String(key).toLowerCase().includes('percent') ||
                String(key).toLowerCase().includes('rate')) && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[rgb(var(--color-text-muted))] pointer-events-none">
                  %
                </div>
              )}
              {(String(category).toLowerCase().includes('fee') ||
                String(key).toLowerCase().includes('price') ||
                String(key).toLowerCase().includes('amount') ||
                String(key).toLowerCase().includes('cost')) && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[rgb(var(--color-text-muted))] pointer-events-none">
                  $
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => deleteItem(key)}
              className="p-2 text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-danger))] hover:bg-[rgb(var(--color-danger)/0.1)] rounded-lg opacity-0 group-hover:opacity-100 transition-all"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addItem}
          className="w-full py-2 border border-dashed border-[rgb(var(--color-border))] rounded-lg text-xs font-bold text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-primary))] hover:border-[rgb(var(--color-primary))] hover:bg-[rgb(var(--color-primary))/0.05] transition-all flex items-center justify-center gap-2 mt-4"
        >
          <Plus size={14} /> Add Property
        </button>
      </div>
    </div>
  );
};

function ConfigCard({ config, onChange, onSave, onDelete, onEdit, isSaving }) {
  const TypeIcon =
    {
      boolean: config.parameterValue ? ToggleRight : ToggleLeft,
      number: Hash,
      string: Type,
      percentage: Percent,
      json: Database,
    }[config.valueType] || Sliders;

  return (
    <div
      className={`
            relative flex flex-col bg-[rgb(var(--color-surface))] rounded-2xl border transition-all duration-300
            ${
              config.isDirty
                ? 'border-[rgb(var(--color-primary))] shadow-lg shadow-[rgb(var(--color-primary))/0.1] -translate-y-1 ring-1 ring-[rgb(var(--color-primary))]'
                : 'border-[rgb(var(--color-border))] hover:shadow-md hover:border-[rgb(var(--color-text-muted))/0.5]'
            }
        `}
    >
      <div className="p-5 border-b border-[rgb(var(--color-border))] flex justify-between items-start bg-[rgb(var(--color-background))/0.3]">
        <div className="space-y-1 pr-4">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-md bg-[rgb(var(--color-background))] text-[rgb(var(--color-text-muted))] border border-[rgb(var(--color-border))] shadow-sm">
              <TypeIcon size={14} />
            </span>
            <h3
              className="font-bold text-[rgb(var(--color-text))] line-clamp-1 text-sm"
              title={config.parameterName}
            >
              {config.parameterName}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {config.isDirty && (
            <button
              onClick={() => onSave(config)}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[rgb(var(--color-primary))] text-white text-xs font-bold rounded-lg shadow-md hover:bg-[rgb(var(--color-primary-dark))] transition-all"
            >
              {isSaving ? <span className="animate-spin">⌛</span> : <Save size={14} />}
              Save
            </button>
          )}
          <button
            onClick={() => onEdit(config)}
            className="p-2 text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-primary))] hover:bg-[rgb(var(--color-primary)/0.1)] rounded-lg transition-all"
            title="Edit Settings"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={() => onDelete(config.id)}
            className="p-2 text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-danger))] hover:bg-[rgb(var(--color-danger)/0.1)] rounded-lg transition-all"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col gap-4">
        <p className="text-xs text-[rgb(var(--color-text-muted))] min-h-[32px] line-clamp-2 leading-relaxed">
          {config.description || 'No description provided for this parameter.'}
        </p>

        <div className="mt-auto pt-2">
          {config.valueType === 'boolean' && (
            <button
              onClick={() => onChange(config.id, !config.parameterValue)}
              className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                config.parameterValue
                  ? 'bg-[rgb(var(--color-success)/0.1)] border-[rgb(var(--color-success)/0.2)] text-[rgb(var(--color-success))] '
                  : 'bg-[rgb(var(--color-surface))] border-[rgb(var(--color-border))] text-[rgb(var(--color-text-muted))]'
              }`}
            >
              <span className="text-sm font-bold">
                {config.parameterValue ? 'Enabled' : 'Disabled'}
              </span>
              <div
                className={`w-10 h-6 rounded-full relative transition-colors ${config.parameterValue ? 'bg-[rgb(var(--color-success))]' : 'bg-[rgb(var(--color-border))]'}`}
              >
                {/* <div className={`absolute top-1 w-4 h-4 bg-[rgb(var(--color-text))] rounded-full transition-transform shadow-sm ${config.parameterValue ? 'left-5' : 'left-1'}`} /> */}
              </div>
            </button>
          )}

          {(config.valueType === 'string' ||
            config.valueType === 'number' ||
            config.valueType === 'percentage') && (
            <div className="relative group">
              <input
                type={
                  config.valueType === 'number' || config.valueType === 'percentage'
                    ? 'number'
                    : 'text'
                }
                value={config.parameterValue}
                onChange={(e) =>
                  onChange(
                    config.id,
                    config.valueType === 'number' || config.valueType === 'percentage'
                      ? Number(e.target.value)
                      : e.target.value
                  )
                }
                className="w-full bg-[rgb(var(--color-background))] border border-[rgb(var(--color-border))] rounded-xl px-4 py-3 text-sm font-medium text-[rgb(var(--color-text))] focus:ring-2 focus:ring-[rgb(var(--color-primary))/0.2] focus:border-[rgb(var(--color-primary))] outline-none transition-all shadow-sm"
              />
              {(config.valueType === 'percentage' ||
                String(config.category).toLowerCase().includes('discount') ||
                String(config.category).toLowerCase().includes('insurance') ||
                String(config.category).toLowerCase().includes('tax')) && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-[rgb(var(--color-text-muted))] pointer-events-none">
                  %
                </div>
              )}
              {(String(config.category).toLowerCase().includes('fee') ||
                String(config.parameterName).toLowerCase().includes('price') ||
                String(config.parameterName).toLowerCase().includes('amount') ||
                String(config.parameterKey).toLowerCase().includes('fee')) && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-[rgb(var(--color-text-muted))] pointer-events-none">
                  $
                </div>
              )}
            </div>
          )}

          {config.valueType === 'json' && (
            <div className="h-auto min-h-[300px]">
              <SmartJsonEditor
                value={config.parameterValue}
                onChange={(val) => onChange(config.id, val)}
                category={config.category}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SystemSettingsView() {
  const [activeTab, setActiveTab] = useState('config');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const {
    data: rawConfigs = EMPTY_ARRAY,
    isLoading: loading,
    refetch: fetchConfigs,
  } = usePricingConfigs();
  const updateMutation = useUpdatePricingConfig();
  const createMutation = useCreatePricingConfig();
  const deleteMutation = useDeletePricingConfig();

  const configs = useMemo(
    () =>
      rawConfigs.map((item) => ({
        id: item.id,
        parameterName:
          item.parameterName || item.parameter_name || item.config_key || item.configKey,
        parameterKey: item.parameterKey || item.parameter_key || item.config_key || item.configKey,
        parameterValue:
          item.parameterValue !== undefined
            ? item.parameterValue
            : item.parameter_value !== undefined
              ? item.parameter_value
              : item.config_value || item.configValue,
        valueType: item.valueType || item.value_type || 'string',
        category: item.category || 'General',
        description: item.description,
        isDirty: false,
      })),
    [rawConfigs]
  );

  const [localConfigs, setLocalConfigs] = useState([]);

  React.useEffect(() => {
    setLocalConfigs(configs);
  }, [configs]);

  const handleInputChange = useCallback((id, value) => {
    setLocalConfigs((prev) =>
      prev.map((c) => (c.id === id ? { ...c, parameterValue: value, isDirty: true } : c))
    );
  }, []);

  const handleSave = async (config) => {
    try {
      await updateMutation.mutateAsync({
        id: config.id,
        data: {
          parameter_value: config.parameterValue,
          config_value: config.parameterValue,
          description: config.description,
        },
      });
      setLocalConfigs((prev) =>
        prev.map((c) => (c.id === config.id ? { ...c, isDirty: false } : c))
      );
    } catch (error) {}
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Delete Configuration?',
      text: 'This action cannot be undone!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: 'rgb(var(--color-error))',
      cancelButtonColor: 'rgb(var(--color-text-muted))',
      confirmButtonText: 'Yes, delete it!',
    });

    if (result.isConfirmed) {
      deleteMutation.mutate(id);
    }
  };

  const handleFormSave = async (formData) => {
    if (editingConfig) {
      await updateMutation.mutateAsync({
        id: editingConfig.id,
        data: formData,
      });
    } else {
      await createMutation.mutateAsync(formData);
    }
  };

  const openCreateModal = () => {
    setEditingConfig(null);
    setIsFormModalOpen(true);
  };

  const openEditModal = (config) => {
    setEditingConfig(config);
    setIsFormModalOpen(true);
  };

  const categories = useMemo(
    () => ['All', ...new Set(localConfigs.map((c) => c.category || 'General'))],
    [localConfigs]
  );

  const formFields = [
    {
      name: 'parameter_name',
      label: 'Parameter Name',
      type: 'text',
      placeholder: 'e.g., Base Dealer Fee',
    },
    {
      name: 'category',
      label: 'Category',
      type: 'select',
      options: [
        { value: '', label: 'Select a category' },
        ...categories.filter((c) => c !== 'All').map((cat) => ({ value: cat, label: cat })),
      ],
    },
    {
      name: 'parameter_value',
      label: 'Parameter Value',
      type: 'text',
      placeholder: 'e.g., 500.00',
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      placeholder: 'Describe this configuration...',
    },
  ];

  const validationSchema = yup.object().shape({
    parameter_name: yup.string().required('Parameter name is required'),
    category: yup.string().required('Category is required'),
    parameter_value: yup.string().required('Parameter value is required'),
  });

  const filteredConfigs = localConfigs.filter((c) => {
    const matchesCategory =
      activeCategory === 'All' || (c.category || 'General') === activeCategory;
    const matchesSearch =
      c.parameterName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.parameterKey?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="flex flex-col gap-6 pb-6 border-b border-[rgb(var(--color-border))]">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[rgb(var(--color-text))] tracking-tight">
              System Settings
            </h1>
            <p className="text-[rgb(var(--color-text-muted))] mt-2 max-w-2xl">
              {activeTab === 'config'
                ? 'Manage global pricing variables, fee structures, and algorithmic parameters.'
                : 'Configure API access tokens and third-party service integrations.'}
            </p>
          </div>
          {activeTab === 'config' && (
            <div className="flex gap-3">
              <button
                onClick={openCreateModal}
                className="flex items-center gap-2 bg-[rgb(var(--color-primary))] text-white px-6 py-3 rounded-lg hover:bg-[rgb(var(--color-primary-dark))] transition-all duration-200 font-medium shadow-lg shadow-[rgb(var(--color-primary))]/20"
              >
                <Plus size={18} /> Create Config
              </button>
              <button
                onClick={fetchConfigs}
                className="p-2 text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-primary))] hover:bg-[rgb(var(--color-surface))] rounded-lg transition-colors border border-transparent hover:border-[rgb(var(--color-border))]"
                title="Refresh Data"
              >
                <RefreshCw size={20} />
              </button>
            </div>
          )}
        </div>

        <TabNavigation
          activeTab={activeTab}
          onTabChange={setActiveTab}
          tabs={[
            { key: 'config', label: 'Pricing & Parameters', icon: Sliders },
            { key: 'api', label: 'API & Integrations', icon: Database },
          ]}
        />
      </div>

      {/* Content Area */}
      {activeTab === 'config' ? (
        <>
          <div className="bg-[rgb(var(--color-background))] border-b border-[rgb(var(--color-border))] shadow-sm transition-all py-4 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between mb-6">
            <div className="w-full md:w-auto overflow-x-auto no-scrollbar">
              <TabNavigation
                activeTab={activeCategory}
                onTabChange={setActiveCategory}
                tabs={categories.map((cat) => ({ key: cat, label: cat }))}
                scrollable
              />
            </div>

            <div className="relative w-full md:w-72 group">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--color-text-muted))] group-focus-within:text-[rgb(var(--color-primary))] transition-colors"
                size={18}
              />
              <input
                type="text"
                placeholder="Search parameters..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] rounded-xl text-sm font-medium focus:ring-2 focus:ring-[rgb(var(--color-primary))/0.2] focus:border-[rgb(var(--color-primary))] outline-none transition-all shadow-sm group-hover:shadow-md"
              />
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
              {[...Array(6)].map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
              {filteredConfigs.map((config) => (
                <ConfigCard
                  key={config.id}
                  config={config}
                  onChange={handleInputChange}
                  onSave={handleSave}
                  onDelete={handleDelete}
                  onEdit={openEditModal}
                  isSaving={updateMutation.isPending}
                />
              ))}
              {filteredConfigs.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-20 opacity-60 bg-[rgb(var(--color-surface))] rounded-3xl border border-dashed border-[rgb(var(--color-border))] mt-4">
                  <Sliders size={48} className="mb-4 text-[rgb(var(--color-text-muted))]" />
                  <h3 className="text-lg font-bold text-[rgb(var(--color-text))]">
                    No configurations found
                  </h3>
                  <p className="text-sm text-[rgb(var(--color-text-muted))]">
                    Try adjusting your filters or search query.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* FormModal for Create/Edit */}
          <FormModal
            isOpen={isFormModalOpen}
            onClose={() => setIsFormModalOpen(false)}
            onSave={handleFormSave}
            title={editingConfig ? 'Edit Configuration' : 'Create Configuration'}
            subtitle={
              editingConfig
                ? 'Update the configuration details below.'
                : 'Fill in the details to create a new configuration.'
            }
            initialData={editingConfig}
            fields={formFields}
            validationSchema={validationSchema}
            isEditMode={!!editingConfig}
          />
        </>
      ) : (
        <ApiIntegrationsView />
      )}
    </div>
  );
}
