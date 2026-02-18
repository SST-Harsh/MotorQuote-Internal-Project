'use client';
import { useState, useRef, useEffect } from 'react';
import { User, Camera, Save, Loader2, Phone } from 'lucide-react';
import Image from 'next/image';
import Swal from 'sweetalert2';
import api from '../../utils/api'; // Added missing import
import userService from '../../services/userService';

import { useAuth } from '../../context/AuthContext';

export default function ProfileSettings({ user }) {
  const { updateProfile } = useAuth();
  const userData = user || {};

  const fileInputRef = useRef(null);
  const [isSaving, setIsSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const [formData, setFormData] = useState({
    firstName:
      userData.first_name ||
      userData.firstName ||
      (userData.name ? userData.name.split(' ')[0] : 'John'),
    lastName:
      userData.last_name ||
      userData.lastName ||
      (userData.name ? userData.name.split(' ').slice(1).join(' ') : 'Doe'),
    email: userData.email || 'admin@example.com',
    phone: userData.phone || userData.phone_number || '1234567890',
  });

  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        firstName:
          user.first_name || user.firstName || (user.name ? user.name.split(' ')[0] : 'John'),
        lastName:
          user.last_name ||
          user.lastName ||
          (user.name ? user.name.split(' ').slice(1).join(' ') : 'Doe'),
        email: user.email || 'admin@example.com',
        phone: user.phone || user.phone_number || '1234567890',
      }));
    }
  }, [user]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await userService.getMyProfile();
        // Resilience: Handle both {success, data} and flat user object
        const profile = response?.data || response;

        if (profile) {
          setFormData((prev) => ({
            ...prev,
            firstName:
              profile.first_name ||
              profile.firstName ||
              (profile.name ? profile.name.split(' ')[0] : ''),
            lastName:
              profile.last_name ||
              profile.lastName ||
              (profile.name ? profile.name.split(' ').slice(1).join(' ') : ''),
            email: profile.email || '',
            phone: profile.phone_number || profile.phone || '1234567890',
          }));

          if (profile.profile_picture || profile.avatar || profile.url) {
            setAvatarPreview(profile.profile_picture || profile.avatar || profile.url);
          }
        }
      } catch (error) {
        console.error('Failed to fetch profile', error);
      }
    };
    fetchProfile();
  }, []);

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
      if (file.size > 5 * 1024 * 1024) {
        // Increased to 5MB as per documentation
        Swal.fire({
          icon: 'error',
          title: 'File too large',
          text: 'Please upload an image smaller than 5MB.',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000,
        });
        return;
      }

      setSelectedFile(file);
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
      if (selectedFile) {
        const result = await userService.uploadProfileImage(selectedFile);
        const imageData = result?.data || result; // Resilience

        if (
          imageData?.profile_picture ||
          imageData?.url ||
          imageData?.avatar ||
          imageData?.profilePicture
        ) {
          uploadedAvatarUrl =
            imageData.profile_picture ||
            imageData.url ||
            imageData.avatar ||
            imageData.profilePicture;
        } else if (result.success || result) {
          uploadedAvatarUrl = avatarPreview;
        } else {
          throw new Error(result.error || result.message || 'Image upload failed');
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 500)); // Small UX delay

      const updates = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone_number: formData.phone,
      };

      const response = await userService.updateMyProfile(updates);
      const updatedUser = response?.data || response; // Resilience

      const normalizedUser = {
        ...updatedUser,
        firstName: updatedUser.first_name || updatedUser.firstName || formData.firstName,
        lastName: updatedUser.last_name || updatedUser.lastName || formData.lastName,
        name: `${updatedUser.first_name || formData.firstName} ${updatedUser.last_name || formData.lastName}`,
        phone_number: updatedUser.phone_number || updatedUser.phone || formData.phone,
        // Explicitly send the new avatar to context to ensure immediate Sidebar update
        ...(uploadedAvatarUrl && {
          profile_picture: `${uploadedAvatarUrl}${uploadedAvatarUrl.includes('?') ? '&' : '?'}t=${Date.now()}`,
          avatar: `${uploadedAvatarUrl}${uploadedAvatarUrl.includes('?') ? '&' : '?'}t=${Date.now()}`,
        }),
      };

      updateProfile(normalizedUser);
      setIsSaving(false);

      setAvatarPreview(null);

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
        text: error.response?.data?.error || 'Could not save profile changes. Please try again.',
        toast: true,
        position: 'top-end',
      });
    }
  };

  const currentAvatar =
    avatarPreview ||
    user?.profile_picture ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.firstName)}&background=random`;
  return (
    <div className="bg-[rgb(var(--color-surface))] rounded-xl shadow-sm border border-[rgb(var(--color-border))] p-8">
      <h2 className="text-lg font-bold text-[rgb(var(--color-text))] mb-6 flex items-center gap-2">
        <User size={20} className="text-[rgb(var(--color-primary))]" />
        Profile Information
      </h2>

      <div className="flex items-start gap-8 flex-col sm:flex-row mb-8">
        <div className="relative group cursor-pointer" onClick={handleImageClick}>
          <div className="w-24 h-24 rounded-full bg-[rgb(var(--color-background))] relative overflow-hidden ring-4 ring-[rgb(var(--color-surface))] shadow-sm border border-[rgb(var(--color-border))]">
            <Image
              src={currentAvatar}
              alt="Profile"
              className="w-full h-full object-cover transition-opacity group-hover:opacity-75"
              width={48}
              height={48}
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
          type="button"
          className="flex items-center gap-2 bg-[rgb(var(--color-primary))] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-[rgb(var(--color-primary-dark))] transition-colors shadow-lg shadow-[rgb(var(--color-primary)/0.3)] disabled:opacity-70 disabled:cursor-wait"
        >
          {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          Save Changes
        </button>
      </div>
    </div>
  );
}
