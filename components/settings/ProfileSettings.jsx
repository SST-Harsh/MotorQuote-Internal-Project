'use client';
import { useState, useRef, useEffect } from 'react';
import { User, Camera, Save, Loader2, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import Swal from 'sweetalert2';
import userService from '../../services/userService';
import { useAuth } from '../../context/AuthContext';
import CustomPhoneInput from '../common/PhoneInput';

// ── Inline error helper ──────────────────────────────────────────────────────
const FieldError = ({ message }) => {
  if (!message) return null;
  return (
    <div className="flex items-center gap-1.5 mt-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
      <AlertCircle size={12} className="text-[rgb(var(--color-error))] shrink-0" />
      <p className="text-xs font-medium text-[rgb(var(--color-error))]">{message}</p>
    </div>
  );
};

// ── Validation rules ─────────────────────────────────────────────────────────
const validate = (formData) => {
  const errs = {};
  if (!formData.firstName?.trim()) {
    errs.firstName = 'First name is required.';
  } else if (!/^[A-Za-z\s'-]+$/.test(formData.firstName.trim())) {
    errs.firstName = 'First name can only contain letters.';
  }
  if (!formData.lastName?.trim()) {
    errs.lastName = 'Last name is required.';
  } else if (!/^[A-Za-z\s'-]+$/.test(formData.lastName.trim())) {
    errs.lastName = 'Last name can only contain letters.';
  }

  if (!formData.email?.trim()) {
    errs.email = 'Email address is required.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
    errs.email = 'Please enter a valid email address.';
  }

  const rawPhone = formData.phone || '';
  const phoneDigits = rawPhone.replace(/\D/g, '');

  if (!phoneDigits) {
    errs.phone = 'Phone number is required.';
  } else {
    // Detect country and required length
    let requiredLength = 7; // Default minimum
    let countryName = '';

    if (rawPhone.startsWith('+1')) {
      requiredLength = 10;
      countryName = 'US';
    } else if (rawPhone.startsWith('+91')) {
      requiredLength = 10;
      countryName = 'India';
    }

    // Get the length of the number without the country code
    // US (+1) -> digits after the 1
    // India (+91) -> digits after the 91
    const countryCodePrefix = rawPhone.startsWith('+91')
      ? '91'
      : rawPhone.startsWith('+1')
        ? '1'
        : '';
    const localDigits = countryCodePrefix
      ? phoneDigits.slice(countryCodePrefix.length)
      : phoneDigits;

    if (countryName && localDigits.length !== requiredLength) {
      errs.phone = `${countryName} phone numbers must be exactly ${requiredLength} digits.`;
    } else if (localDigits.length < 7) {
      errs.phone = 'Please enter a valid phone number (minimum 7 digits).';
    }
  }

  return errs;
};

// ── Name parser — handles first_name, name, full_name ───────────────────────
const parseName = (src) => ({
  first:
    src.first_name || src.firstName || (src.full_name || src.name || '').trim().split(' ')[0] || '',
  last:
    src.last_name ||
    src.lastName ||
    (src.full_name || src.name || '').trim().split(' ').slice(1).join(' ') ||
    '',
});

export default function ProfileSettings({ user }) {
  const { updateProfile } = useAuth();
  const userData = user || {};

  const fileInputRef = useRef(null);
  const [isSaving, setIsSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const [formData, setFormData] = useState(() => {
    const n = parseName(userData);
    return {
      firstName: n.first,
      lastName: n.last,
      email: userData.email || '',
      phone: userData.phone || userData.phone_number || '',
    };
  });

  // Track original saved values to detect changes
  const [originalData, setOriginalData] = useState(() => {
    const n = parseName(userData);
    return {
      firstName: n.first,
      lastName: n.last,
      email: userData.email || '',
      phone: userData.phone || userData.phone_number || '',
    };
  });

  const [selectedFile, setSelectedFile] = useState(null);

  // True when any field differs from saved values OR a new avatar was selected
  const isDirty =
    selectedFile !== null ||
    formData.firstName !== originalData.firstName ||
    formData.lastName !== originalData.lastName ||
    formData.email !== originalData.email ||
    formData.phone !== originalData.phone;

  useEffect(() => {
    if (user) {
      const n = parseName(user);
      setFormData((prev) => ({
        ...prev,
        firstName: n.first || prev.firstName,
        lastName: n.last || prev.lastName,
        email: user.email || prev.email,
        phone: user.phone || user.phone_number || prev.phone,
      }));
    }
  }, [user]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await userService.getMyProfile();
        const profile = response?.data || response;

        if (profile) {
          const n = parseName(profile);
          const fetched = {
            // Never overwrite with empty — fall back to current formData value
            firstName: n.first || '',
            lastName: n.last || '',
            email: profile.email || '',
            phone: profile.phone_number || profile.phone || '',
          };
          setFormData((prev) => ({
            firstName: fetched.firstName || prev.firstName,
            lastName: fetched.lastName || prev.lastName,
            email: fetched.email || prev.email,
            phone: fetched.phone || prev.phone,
          }));
          setOriginalData((prev) => ({
            firstName: fetched.firstName || prev.firstName,
            lastName: fetched.lastName || prev.lastName,
            email: fetched.email || prev.email,
            phone: fetched.phone || prev.phone,
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

  // Re-validate fields that have already been touched when form data changes
  useEffect(() => {
    if (Object.keys(touched).length > 0) {
      const allErrors = validate(formData);
      const relevantErrors = {};
      Object.keys(touched).forEach((key) => {
        if (allErrors[key]) relevantErrors[key] = allErrors[key];
      });
      setErrors(relevantErrors);
    }
  }, [formData, touched]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const allErrors = validate(formData);
    setErrors((prev) => ({ ...prev, [field]: allErrors[field] }));
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
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
    // Touch all validated fields so errors appear
    setTouched({ firstName: true, lastName: true, email: true, phone: true });

    const allErrors = validate(formData);
    setErrors(allErrors);

    if (Object.keys(allErrors).length > 0) return; // Block save

    setIsSaving(true);
    let uploadedAvatarUrl = null;

    try {
      if (selectedFile) {
        const result = await userService.uploadProfileImage(selectedFile);
        const imageData = result?.data || result;

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
      await new Promise((resolve) => setTimeout(resolve, 500));

      const updates = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone_number: formData.phone,
      };

      const response = await userService.updateMyProfile(updates);
      const updatedUser = response?.data || response;

      const normalizedUser = {
        ...updatedUser,
        firstName: updatedUser.first_name || updatedUser.firstName || formData.firstName,
        lastName: updatedUser.last_name || updatedUser.lastName || formData.lastName,
        name: `${updatedUser.first_name || formData.firstName} ${updatedUser.last_name || formData.lastName}`,
        phone: updatedUser.phone_number || updatedUser.phone || formData.phone,
        phone_number: updatedUser.phone_number || updatedUser.phone || formData.phone,
        ...(uploadedAvatarUrl && {
          profile_picture: `${uploadedAvatarUrl}${uploadedAvatarUrl.includes('?') ? '&' : '?'}t=${Date.now()}`,
          avatar: `${uploadedAvatarUrl}${uploadedAvatarUrl.includes('?') ? '&' : '?'}t=${Date.now()}`,
        }),
      };

      updateProfile(normalizedUser);
      // Reset dirty tracking after successful save
      setOriginalData({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
      });
      setIsSaving(false);
      setSelectedFile(null);
      setAvatarPreview(null);
      setTouched({});
      setErrors({});

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

  const inputClass = (field) =>
    `w-full px-4 py-2 rounded-lg border ${
      errors[field] && touched[field]
        ? 'border-[rgb(var(--color-error))] bg-[rgb(var(--color-error)/0.03)]'
        : 'border-[rgb(var(--color-border))]'
    } bg-[rgb(var(--color-background))] text-[rgb(var(--color-text))] focus:border-[rgb(var(--color-primary))] focus:ring-2 focus:ring-[rgb(var(--color-primary)/0.2)] outline-none transition-all`;

  const currentAvatar = avatarPreview || user?.profile_picture || '/assets/avatar-placeholder.png';

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
              width={96}
              height={96}
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
          {/* First Name */}
          <div className="space-y-1">
            <label className="text-sm font-semibold text-[rgb(var(--color-text))]">
              First Name
            </label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              onBlur={() => handleBlur('firstName')}
              className={inputClass('firstName')}
              placeholder="John"
            />
            <FieldError message={touched.firstName && errors.firstName} />
          </div>

          {/* Last Name */}
          <div className="space-y-1">
            <label className="text-sm font-semibold text-[rgb(var(--color-text))]">Last Name</label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              onBlur={() => handleBlur('lastName')}
              className={inputClass('lastName')}
              placeholder="Doe"
            />
            <FieldError message={touched.lastName && errors.lastName} />
          </div>

          {/* Email */}
          <div className="space-y-1 md:col-span-2">
            <label className="text-sm font-semibold text-[rgb(var(--color-text))]">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              onBlur={() => handleBlur('email')}
              className={inputClass('email')}
            />
            <FieldError message={touched.email && errors.email} />
          </div>

          {/* Phone */}
          <div className="space-y-1 md:col-span-1">
            <CustomPhoneInput
              label="Phone Number"
              value={formData.phone}
              onChange={(val) => {
                setFormData((prev) => ({ ...prev, phone: val }));
              }}
              onBlur={() => handleBlur('phone')}
              error={touched.phone ? errors.phone : undefined}
            />
          </div>

          {/* Role */}
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
          disabled={isSaving || !isDirty}
          type="button"
          className="flex items-center gap-2 bg-[rgb(var(--color-primary))] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-[rgb(var(--color-primary-dark))] transition-colors shadow-lg shadow-[rgb(var(--color-primary)/0.3)] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          Save Changes
        </button>
      </div>
    </div>
  );
}
