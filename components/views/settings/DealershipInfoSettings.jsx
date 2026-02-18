'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Building2, MapPin, Phone, Globe, Save, Loader2 } from 'lucide-react';
import dealershipService from '@/services/dealershipService';
import userService from '@/services/userService';
import Swal from 'sweetalert2';
import Loader from '@/components/common/Loader';
import { useAuth } from '@/context/AuthContext';

export default function DealershipInfoSettings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [info, setInfo] = useState({
    name: '',
    address: '',
    phone: '',
    website: '',
    email: '',
    logo_url: '',
  });
  const fileInputRef = React.useRef(null);
  const [logoPreview, setLogoPreview] = useState(null);

  const [dealershipId, setDealershipId] = useState(
    user?.dealership_id || user?.roleDetails?.dealership_id || user?.dealer_id
  );

  useEffect(() => {
    const loadInfo = async (idToUse) => {
      const id = idToUse || dealershipId;
      if (!id) return;

      try {
        console.log('Loading info for dealershipId:', id);
        // Use dealer-specific endpoint instead of admin endpoint
        const data = await dealershipService.getDealershipSettings(id);
        // console.log("Dealership Settings Data:", data);

        // Unwrap data if nested - project pattern uses .data or .dealership
        const d = data.data || data.dealership || data;

        setInfo({
          name: d.name || '',
          address: d.address || '',
          phone: d.phone || d.contact_phone || '',
          website: d.website || '',
          email: d.email || d.contact_email || '',
          logo_url: d.logo_url || '',
        });
        if (d.logo_url && typeof d.logo_url === 'string') setLogoPreview(d.logo_url);
      } catch (error) {
        console.error('Failed to load dealership info', error);
        Swal.fire({
          icon: 'error',
          title: 'Data Load Error',
          text: 'Could not fetch dealership information.',
        });
      } finally {
        setLoading(false);
      }
    };

    const resolveIdAndLoad = async () => {
      let currentId = dealershipId;

      if (!currentId) {
        try {
          console.log('Dealer ID missing in state, fetching profile...');
          const profile = await userService.getMyProfile();
          currentId = profile.dealership_id || profile.dealer_id;
          if (currentId) {
            setDealershipId(currentId);
          }
        } catch (err) {
          console.error('Could not fetch profile to resolve dealer ID', err);
        }
      }

      if (currentId) {
        loadInfo(currentId);
      } else {
        setLoading(false);
      }
    };

    resolveIdAndLoad();
  }, [user?.id, dealershipId]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!dealershipId) {
      Swal.fire('Error', 'No dealership associated with this account.', 'error');
      return;
    }

    setSaving(true);
    try {
      // Prepare payload matching API expectations
      const payload = {
        name: info.name,
        phone: info.phone,
        email: info.email,
        website: info.website,
        address: info.address,
        // Add any other fields supported by GET /dealer/settings/:id
      };

      await dealershipService.updateDealershipSettings(dealershipId, payload);

      if (info.logo_url instanceof File) {
        const logoPayload = new FormData();
        logoPayload.append('logo', info.logo_url);
        await dealershipService.uploadDealershipLogo(dealershipId, logoPayload);
      }

      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Dealership info updated',
        showConfirmButton: false,
        timer: 1500,
      });
    } catch (error) {
      console.error('Failed to update info', error);
      Swal.fire('Error', 'Failed to update dealership info', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="p-8">
        <Loader />
      </div>
    );

  if (!dealershipId && !loading) {
    return (
      <div className="bg-[rgb(var(--color-surface))] rounded-xl shadow-sm border border-[rgb(var(--color-border))] p-8 text-center">
        <Building2 size={48} className="mx-auto text-[rgb(var(--color-text-muted))] mb-4" />
        <h3 className="text-xl font-bold text-[rgb(var(--color-text))]">No Dealership Found</h3>
        <p className="text-[rgb(var(--color-text-muted))]">
          Your account is not associated with a dealership.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[rgb(var(--color-surface))] rounded-xl shadow-sm border border-[rgb(var(--color-border))] p-8 animate-fade-in">
      <h2 className="text-lg font-bold text-[rgb(var(--color-text))] mb-6 flex items-center gap-2">
        <Building2 size={20} className="text-[rgb(var(--color-primary))]" />
        Dealership Information
      </h2>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="flex flex-col items-center sm:items-start mb-8">
          <label className="block text-sm font-medium text-[rgb(var(--color-text))] mb-4 text-center sm:text-left">
            Dealership Logo
          </label>
          <div
            onClick={() => fileInputRef.current?.click()}
            className="relative group cursor-pointer"
          >
            <div className="w-24 h-24 rounded-2xl bg-[rgb(var(--color-background))] border-2 border-dashed border-[rgb(var(--color-border))] overflow-hidden flex items-center justify-center transition-all group-hover:border-[rgb(var(--color-primary))] group-hover:bg-[rgb(var(--color-background))]/50">
              {logoPreview ? (
                <div className="relative w-full h-full p-2">
                  <Image src={logoPreview} alt="Logo Preview" fill className="object-contain" />
                </div>
              ) : (
                <Building2 size={32} className="text-[rgb(var(--color-text-muted))]" />
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl">
                <span className="text-white text-xs font-bold px-2 py-1 bg-white/20 rounded-lg backdrop-blur-sm">
                  Change Logo
                </span>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setInfo({ ...info, logo_url: file });
                  const reader = new FileReader();
                  reader.onloadend = () => setLogoPreview(reader.result);
                  reader.readAsDataURL(file);
                }
              }}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[rgb(var(--color-text))] mb-1">
            Dealership Name
          </label>
          <input
            type="text"
            value={info.name}
            onChange={(e) => setInfo({ ...info, name: e.target.value })}
            className="w-full p-3 bg-[rgb(var(--color-background))] border border-[rgb(var(--color-border))] rounded-lg outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))/0.2]"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--color-text))] mb-1">
              Phone Number
            </label>
            <div className="relative">
              <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="tel"
                value={info.phone}
                onChange={(e) => setInfo({ ...info, phone: e.target.value })}
                className="w-full pl-10 p-3 bg-[rgb(var(--color-background))] border border-[rgb(var(--color-border))] rounded-lg outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))/0.2]"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--color-text))] mb-1">
              Website
            </label>
            <div className="relative">
              <Globe size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="url"
                value={info.website}
                onChange={(e) => setInfo({ ...info, website: e.target.value })}
                className="w-full pl-10 p-3 bg-[rgb(var(--color-background))] border border-[rgb(var(--color-border))] rounded-lg outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))/0.2]"
                placeholder="https://"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[rgb(var(--color-text))] mb-1">
            Address
          </label>
          <div className="relative">
            <MapPin size={16} className="absolute left-3 top-3 text-gray-400" />
            <textarea
              value={info.address}
              onChange={(e) => setInfo({ ...info, address: e.target.value })}
              rows={3}
              className="w-full pl-10 p-3 bg-[rgb(var(--color-background))] border border-[rgb(var(--color-border))] rounded-lg outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))/0.2] resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-[rgb(var(--color-border))]">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-[rgb(var(--color-primary))] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-[rgb(var(--color-primary-dark))] transition-colors shadow-lg shadow-[rgb(var(--color-primary)/0.3)] disabled:opacity-70 disabled:cursor-wait"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            Save Information
          </button>
        </div>
      </form>
    </div>
  );
}
