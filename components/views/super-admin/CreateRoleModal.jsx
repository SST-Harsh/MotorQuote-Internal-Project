import React, { useState } from 'react';
import { X, Save, Shield, CheckCircle } from 'lucide-react';
import { useTranslation } from '@/context/LanguageContext';
import roleService from '../../../services/roleService';
import Swal from 'sweetalert2';

export default function CreateRoleModal({ isOpen, onClose, onSuccess, existingRoles = [] }) {
  const { t } = useTranslation('common');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    cloneFrom: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Basic validation
      if (!formData.name.trim()) {
        throw new Error('Role name is required');
      }

      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
      };

      // If cloning permissions from another role
      if (formData.cloneFrom) {
        const sourceRole = existingRoles.find((r) => String(r.id) === String(formData.cloneFrom));
        if (sourceRole && sourceRole.permissions) {
          // Extract IDs from permission objects or strings
          payload.permissions = sourceRole.permissions.map((p) =>
            typeof p === 'object' ? p.code || p.name : p
          );
        }
      }

      await roleService.createRole(payload);

      Swal.fire({
        icon: 'success',
        title: 'Role Created',
        text: `${formData.name} has been created successfully.`,
        timer: 1500,
        showConfirmButton: false,
      });

      onSuccess?.();
      onClose();
      setFormData({ name: '', description: '', cloneFrom: '' });
    } catch (error) {
      console.error('Create role error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error?.response?.data?.message || error.message || 'Failed to create role',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md bg-[rgb(var(--color-surface))] rounded-2xl shadow-xl border border-[rgb(var(--color-border))] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-[rgb(var(--color-border))] flex items-center justify-between bg-[rgb(var(--color-background))]/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[rgb(var(--color-primary))]/10 rounded-lg text-[rgb(var(--color-primary))]">
              <Shield size={20} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-[rgb(var(--color-text))]">Create New Role</h3>
              <p className="text-xs text-[rgb(var(--color-text-muted))]">
                Define a new system role
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[rgb(var(--color-border))] rounded-full transition-colors text-[rgb(var(--color-text-muted))]"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--color-text))] mb-1">
              Role Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-background))] text-[rgb(var(--color-text))] focus:ring-2 focus:ring-[rgb(var(--color-primary))] focus:border-transparent outline-none transition-all placeholder:text-[rgb(var(--color-text-muted))]/50"
              placeholder="e.g. Sales Manager"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[rgb(var(--color-text))] mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-background))] text-[rgb(var(--color-text))] focus:ring-2 focus:ring-[rgb(var(--color-primary))] focus:border-transparent outline-none transition-all placeholder:text-[rgb(var(--color-text-muted))]/50 resize-none h-24"
              placeholder="Describe the responsibilities of this role..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[rgb(var(--color-text))] mb-1">
              Clone Permissions From (Optional)
            </label>
            <select
              value={formData.cloneFrom}
              onChange={(e) => setFormData({ ...formData, cloneFrom: e.target.value })}
              className="w-full px-4 py-2 rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-background))] text-[rgb(var(--color-text))] focus:ring-2 focus:ring-[rgb(var(--color-primary))] focus:border-transparent outline-none transition-all"
            >
              <option value="">-- Start from Scratch --</option>
              {existingRoles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-[rgb(var(--color-text-muted))] mt-1">
              Select a role to copy its initial permission set.
            </p>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border border-[rgb(var(--color-border))] text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-background))] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.name.trim()}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-[rgb(var(--color-primary))] text-white hover:bg-[rgb(var(--color-primary-dark))] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-[rgb(var(--color-primary))]/20 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle size={18} />
                  Create Role
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
