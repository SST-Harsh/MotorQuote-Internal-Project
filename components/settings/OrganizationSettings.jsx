'use client';
import React, { useState } from 'react';
import { Building2, Palette, Save, Loader2 } from 'lucide-react';
import DealershipInfoSettings from '@/components/views/settings/DealershipInfoSettings';
import { useAuth } from '@/context/AuthContext';
import Swal from 'sweetalert2';

export default function OrganizationSettings() {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [branding, setBranding] = useState({
    primary_color: '#3b82f6', // Default blue-500
    secondary_color: '#1e293b', // Default slate-800
  });

  const isAdmin = ['super_admin'].includes(user?.role);

  if (!isAdmin) return null;

  const handleSaveBranding = async () => {
    setSaving(true);
    try {
      // Mock API call for branding update for now
      await new Promise((resolve) => setTimeout(resolve, 1000));

      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Branding updated',
        showConfirmButton: false,
        timer: 2000,
      });
    } catch (error) {
      Swal.fire('Error', 'Failed to update branding', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div>
        <h2 className="text-xl font-bold text-[rgb(var(--color-text))] mb-2">
          Organization Settings
        </h2>
        <p className="text-sm text-[rgb(var(--color-text-muted))]">
          Manage your company-wide information and branding.
        </p>
      </div>

      <div className="bg-[rgb(var(--color-surface))] rounded-2xl shadow-sm border border-[rgb(var(--color-border))] p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[rgb(var(--color-primary))] flex items-center gap-2">
            <Palette size={18} /> Organization Branding
          </h3>
          <button
            onClick={handleSaveBranding}
            disabled={saving}
            className="flex items-center gap-2 bg-[rgb(var(--color-primary))] text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-[rgb(var(--color-primary-dark))] disabled:opacity-50 transition-all"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save Branding
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[rgb(var(--color-text-muted))]">
              Primary Brand Color
            </label>
            <div className="flex items-center gap-4">
              <input
                type="color"
                value={branding.primary_color}
                onChange={(e) =>
                  setBranding((prev) => ({ ...prev, primary_color: e.target.value }))
                }
                className="w-12 h-12 rounded-lg cursor-pointer border-0 bg-transparent"
              />
              <input
                type="text"
                value={branding.primary_color}
                onChange={(e) =>
                  setBranding((prev) => ({ ...prev, primary_color: e.target.value }))
                }
                className="flex-1 bg-[rgb(var(--color-background))] border border-[rgb(var(--color-border))] rounded-xl px-4 py-2 text-sm font-mono text-[rgb(var(--color-text))] outline-none"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[rgb(var(--color-text-muted))]">
              Secondary Color
            </label>
            <div className="flex items-center gap-4">
              <input
                type="color"
                value={branding.secondary_color}
                onChange={(e) =>
                  setBranding((prev) => ({ ...prev, secondary_color: e.target.value }))
                }
                className="w-12 h-12 rounded-lg cursor-pointer border-0 bg-transparent"
              />
              <input
                type="text"
                value={branding.secondary_color}
                onChange={(e) =>
                  setBranding((prev) => ({ ...prev, secondary_color: e.target.value }))
                }
                className="flex-1 bg-[rgb(var(--color-background))] border border-[rgb(var(--color-border))] rounded-xl px-4 py-2 text-sm font-mono text-[rgb(var(--color-text))] outline-none"
              />
            </div>
          </div>
        </div>

        <div className="p-4 bg-[rgb(var(--color-background))] rounded-xl border border-[rgb(var(--color-border))] border-dashed text-center">
          <p className="text-xs text-[rgb(var(--color-text-muted))]">
            Preview:{' '}
            <span
              className="px-2 py-0.5 rounded"
              style={{ backgroundColor: branding.primary_color, color: 'white' }}
            >
              Primary Button
            </span>{' '}
            &{' '}
            <span
              className="px-2 py-0.5 rounded font-bold"
              style={{ color: branding.secondary_color }}
            >
              Secondary Text
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
