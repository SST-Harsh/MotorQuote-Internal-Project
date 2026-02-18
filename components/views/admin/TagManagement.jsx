import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '@/context/LanguageContext';
import tagService from '@/services/tagService';
import DataTable from '@/components/common/DataTable';
import PageHeader from '@/components/common/PageHeader';
import { Plus, Edit, Trash2, Tag as TagIcon } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import TagBadge from '@/components/common/tags/TagBadge';
import { createPortal } from 'react-dom';
import FormModal from '@/components/common/FormModal';
import { tagValidationSchema } from '@/validations/tagValidation';
import { usePreference } from '@/context/PreferenceContext';

export default function TagManagement() {
  const { t } = useTranslation('common');
  const { preferences } = usePreference();
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const [formData, setFormData] = useState({ name: '', colour: '#3B82F6', type: 'general' });
  const [activeTab, setActiveTab] = useState('all');
  const [validationErrors, setValidationErrors] = useState({});

  // Tag Types
  const TAG_TYPES = ['general', 'quote', 'user', 'dealership', 'support', 'custom'];

  const fetchTags = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 100 };
      if (activeTab !== 'all') params.type = activeTab;

      const response = await tagService.getAllTags(params);

      // Robust data extraction: API can return array directly, or {tags: []}, or {data: []}
      let data = [];
      if (Array.isArray(response)) {
        data = response;
      } else if (response && response.tags && Array.isArray(response.tags)) {
        data = response.tags;
      } else if (response && response.data && Array.isArray(response.data)) {
        data = response.data;
      } else if (response && response.data?.tags && Array.isArray(response.data.tags)) {
        data = response.data.tags;
      }

      setTags(data);
    } catch (error) {
      console.error('Failed to fetch tags', error);
      showError('Error', 'Failed to fetch tags');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchTags();
  }, [activeTab, fetchTags]);

  const handleSave = async (e) => {
    e.preventDefault();

    // Validate form data
    try {
      await tagValidationSchema.validate(formData, { abortEarly: false });
      setValidationErrors({}); // Clear errors if validation passes
    } catch (err) {
      // Collect validation errors
      const errors = {};
      err.inner.forEach((error) => {
        errors[error.path] = error.message;
      });
      setValidationErrors(errors);
      return; // Stop submission if validation fails
    }

    // If validation passes, proceed with API call
    try {
      if (editingTag) {
        await tagService.updateTag(editingTag.id, formData);
        showSuccess('Success', 'Tag updated successfully');
      } else {
        await tagService.createTag(formData);
        showSuccess('Success', 'Tag created successfully');
      }
      setShowModal(false);
      setEditingTag(null);
      setFormData({ name: '', colour: '#3B82F6', type: 'general' });
      setValidationErrors({});
      fetchTags();
    } catch (error) {
      showError('Error', 'Failed to save tag');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this tag?')) return;

    try {
      await tagService.deleteTag(id);
      showSuccess('Success', 'Tag deleted successfully');
      fetchTags();
    } catch (error) {
      showError('Error', 'Failed to delete tag. It might be in use.');
    }
  };

  const openEdit = (tag) => {
    setEditingTag(tag);
    setFormData({ name: tag.name, colour: tag.colour, type: tag.type });
    setShowModal(true);
  };

  const columns = [
    {
      header: 'Tag',
      accessor: 'name',
      render: (row) => <TagBadge tag={row} />,
    },
    {
      header: 'Type',
      accessor: 'type',
      render: (row) => (
        <span className="capitalize text-sm text-[rgb(var(--color-text-muted))]">{row.type}</span>
      ),
    },

    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              openEdit(row);
            }}
            className="text-blue-600 hover:text-blue-800 p-1 transition-colors"
            title="Edit Tag"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(row.id);
            }}
            className="text-red-600 hover:text-red-800 p-1 transition-colors"
            title="Delete Tag"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tag Management"
        subtitle="Manage system-wide tags and categories"
        icon={<TagIcon size={20} />}
        actions={
          <button
            onClick={() => {
              setEditingTag(null);
              setFormData({
                name: '',
                colour: '#3B82F6',
                type: activeTab !== 'all' ? activeTab : 'general',
              });
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-[rgb(var(--color-primary))] text-white rounded-xl hover:bg-[rgb(var(--color-primary-dark))] transition shadow-lg font-bold text-sm whitespace-nowrap h-11"
          >
            <Plus size={18} /> New Tag
          </button>
        }
      />

      {/* Tabs */}
      <div className="flex overflow-x-auto pb-2 gap-2 border-b border-[rgb(var(--color-border))] no-scrollbar">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 text-sm font-medium whitespace-nowrap rounded-t-lg transition-colors ${activeTab === 'all' ? 'text-[rgb(var(--color-primary))] border-b-2 border-[rgb(var(--color-primary))] bg-[rgb(var(--color-primary)/0.05)]' : 'text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-background))]'}`}
        >
          All Types
        </button>
        {TAG_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => setActiveTab(type)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap capitalize rounded-t-lg transition-colors ${activeTab === type ? 'text-[rgb(var(--color-primary))] border-b-2 border-[rgb(var(--color-primary))] bg-[rgb(var(--color-primary)/0.05)]' : 'text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-background))]'}`}
          >
            {type}
          </button>
        ))}
      </div>

      <DataTable
        data={tags}
        columns={columns}
        loading={loading}
        searchKeys={['name', 'type']}
        itemsPerPage={preferences.items_per_page || 10}
      />

      {/* Modal */}
      {showModal &&
        createPortal(
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] rounded-2xl w-full max-w-md p-6 shadow-xl animate-in zoom-in-95 duration-200">
              <h2 className="text-xl font-bold mb-4 text-[rgb(var(--color-text))]">
                {editingTag ? 'Edit Tag' : 'Create New Tag'}
              </h2>
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[rgb(var(--color-text-muted))] uppercase tracking-wide mb-1.5">
                    Tag Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`w-full px-4 py-2.5 bg-[rgb(var(--color-background))] border rounded-xl text-sm outline-none focus:ring-4 transition-all placeholder:text-[rgb(var(--color-text-muted))] text-[rgb(var(--color-text))] ${
                      validationErrors.name
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10'
                        : 'border-[rgb(var(--color-border))] focus:border-[rgb(var(--color-primary))] focus:ring-[rgb(var(--color-primary)/0.1)]'
                    }`}
                    placeholder="e.g. urgent, high-priority"
                  />
                  {validationErrors.name && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-[rgb(var(--color-text-muted))] uppercase tracking-wide mb-1.5">
                    Tag Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[rgb(var(--color-background))] border border-[rgb(var(--color-border))] rounded-xl text-sm outline-none focus:border-[rgb(var(--color-primary))] focus:ring-4 focus:ring-[rgb(var(--color-primary)/0.1)] transition-all text-[rgb(var(--color-text))] capitalize cursor-pointer"
                  >
                    {TAG_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[rgb(var(--color-text-muted))] uppercase tracking-wide mb-1.5">
                    Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={formData.colour}
                      onChange={(e) => setFormData({ ...formData, colour: e.target.value })}
                      className={`h-10 w-16 p-1 bg-[rgb(var(--color-background))] border rounded-lg cursor-pointer ${
                        validationErrors.colour
                          ? 'border-red-500'
                          : 'border-[rgb(var(--color-border))]'
                      }`}
                    />
                    <span className="text-sm font-mono text-[rgb(var(--color-text-muted))] uppercase font-medium">
                      {formData.colour}
                    </span>
                  </div>
                  {validationErrors.colour && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.colour}</p>
                  )}
                </div>

                <div className="flex justify-end gap-3 mt-8">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-5 py-2.5 text-sm font-semibold text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-background))] rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-[rgb(var(--color-primary))] text-white hover:bg-[rgb(var(--color-primary-dark))] rounded-xl font-bold text-sm transition-all shadow-lg shadow-[rgb(var(--color-primary)/0.2)]"
                  >
                    {editingTag ? 'Update Tag' : 'Create Tag'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.getElementById('modal-root') || document.body
        )}
    </div>
  );
}
