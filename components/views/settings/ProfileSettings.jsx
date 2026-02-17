'use client';
import React, { useState, useRef } from 'react';
import { User, Camera, Save, Loader2, Phone } from 'lucide-react';
import Image from 'next/image';
import Swal from 'sweetalert2';

import { useAuth } from '../../../context/AuthContext';

export default function ProfileSettings({ user }) {
  const { updateProfile } = useAuth();
  const userData = user || {};

  const fileInputRef = useRef(null);
  const [isSaving, setIsSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const [formData, setFormData] = useState({
    firstName: userData.name ? userData.name.split(' ')[0] : 'John',
    lastName: userData.name ? userData.name.split(' ').slice(1).join(' ') : 'Doe',
    email: userData.email || 'admin@example.com',
    phone: userData.phone || '1234567890',
  });

  const [selectedFile, setSelectedFile] = useState(null);

  React.useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.name ? user.name.split(' ')[0] : 'John',
        lastName: user.name ? user.name.split(' ').slice(1).join(' ') : 'Doe',
        email: user.email || 'admin@example.com',
        phone: user.phone || '1234567890',
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        Swal.fire({
          icon: 'error',
          title: 'File too large',
          text: 'Please upload an image smaller than 2MB.',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000,
        });
        return;
      }

      setSelectedFile(file); // Store file for upload

      // Preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    let uploadedAvatarUrl = null;

    try {
      // 1. Upload Image if selected
      if (selectedFile) {
        const uploadData = new FormData();
        uploadData.append('file', selectedFile);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: uploadData,
        });

        const result = await response.json();
        if (result.success) {
          uploadedAvatarUrl = result.url;
        } else {
          throw new Error(result.message || 'Image upload failed');
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 500)); // Small UX delay

      const updatedName = `${formData.firstName} ${formData.lastName}`.trim();
      const updates = {
        name: updatedName,
        email: formData.email,
        phone: formData.phone,
        // Use uploaded URL if available, otherwise keep existing preview/avatar
        ...(uploadedAvatarUrl
          ? { avatar: uploadedAvatarUrl }
          : avatarPreview && { avatar: avatarPreview }),
      };

      updateProfile(updates);

      setIsSaving(false);
      Swal.fire({
        icon: 'success',
        title: 'Profile Updated',
        text: 'Your profile information has been saved successfully.',
        timer: 2000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end',
      });
    } catch (error) {
      console.error(error);
      setIsSaving(false);
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: 'Could not save profile changes. Please try again.',
        toast: true,
        position: 'top-end',
      });
    }
  };

  const currentAvatar = avatarPreview || user?.avatar || `https://i.pravatar.cc/80?img=33`;

  return (
    <div className="bg-[rgb(var(--color-surface))] rounded-xl shadow-sm border border-[rgb(var(--color-border))] p-8">
      <h2 className="text-lg font-bold text-[rgb(var(--color-text))] mb-6 flex items-center gap-2">
        <User size={20} className="text-[rgb(var(--color-primary))]" />
        Profile Information
      </h2>

      <div className="flex items-start gap-8 flex-col sm:flex-row mb-8">
        {/* Avatar Section */}
        <div className="relative group cursor-pointer" onClick={handleImageClick}>
          <div className="w-24 h-24 rounded-full bg-[rgb(var(--color-background))] relative overflow-hidden ring-4 ring-[rgb(var(--color-surface))] shadow-sm border border-[rgb(var(--color-border))]">
            <Image
              src={currentAvatar}
              alt="Profile"
              fill
              unoptimized
              className="object-cover transition-opacity group-hover:opacity-75"
            />
          </div>
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera size={24} className="text-white drop-shadow-md" />
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageChange}
            className="hidden"
            accept="image/*"
          />
        </div>

        {/* Form Section */}
        <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="text-sm font-semibold text-[rgb(var(--color-text))]">
              First Name
            </label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              className="w-full px-4 py-2 rounded-lg border border-[rgb(var(--color-border))] bg-[rgb(var(--color-background))] text-[rgb(var(--color-text))] focus:border-[rgb(var(--color-primary))] focus:ring-2 focus:ring-[rgb(var(--color-primary)/0.2)] outline-none transition-all"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-semibold text-[rgb(var(--color-text))]">Last Name</label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              className="w-full px-4 py-2 rounded-lg border border-[rgb(var(--color-border))] bg-[rgb(var(--color-background))] text-[rgb(var(--color-text))] focus:border-[rgb(var(--color-primary))] focus:ring-2 focus:ring-[rgb(var(--color-primary)/0.2)] outline-none transition-all"
            />
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="text-sm font-semibold text-[rgb(var(--color-text))]">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              readOnly
              disabled
              className="w-full px-4 py-2 rounded-lg border border-[rgb(var(--color-border))] bg-[rgb(var(--color-background))] text-[rgb(var(--color-text))] cursor-not-allowed opacity-70 outline-none transition-all"
            />
          </div>
          <div className="space-y-1 md:col-span-1">
            <label className="text-sm font-semibold text-[rgb(var(--color-text))]">
              Phone Number
            </label>
            <div className="relative">
              <Phone
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--color-text-muted))]"
              />
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4  py-2 rounded-lg border border-[rgb(var(--color-border))] bg-[rgb(var(--color-background))] text-[rgb(var(--color-text))] focus:border-[rgb(var(--color-primary))] focus:ring-2 focus:ring-[rgb(var(--color-primary)/0.2)] outline-none transition-all"
              />
            </div>
          </div>
          <div className="space-y-1 md:col-span-1">
            <label className="text-sm font-semibold text-[rgb(var(--color-text))]">Role</label>
            <div className="w-full px-4 py-2 rounded-lg border border-[rgb(var(--color-border))] bg-[rgb(var(--color-background))] text-[rgb(var(--color-text-muted))] capitalize cursor-not-allowed opacity-80">
              {userData.role || 'Visitor'}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 bg-[rgb(var(--color-primary))] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-[rgb(var(--color-primary-dark))] transition-colors shadow-lg shadow-[rgb(var(--color-primary)/0.3)] disabled:opacity-70 disabled:cursor-wait"
        >
          {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          Save Changes
        </button>
      </div>
    </div>
  );
}
