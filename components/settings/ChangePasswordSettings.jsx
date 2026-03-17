'use client';
import React, { useState } from 'react';
import { Lock, Save, Eye, EyeOff } from 'lucide-react';
import Swal from 'sweetalert2';
import * as yup from 'yup';
import authService from '../../services/authService';

export default function ChangePasswordSettings() {
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({});
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  // isDirty: all three password fields must have some content
  const isDirty =
    passwordData.currentPassword.length > 0 &&
    passwordData.newPassword.length > 0 &&
    passwordData.confirmPassword.length > 0;

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const passwordSchema = yup.object().shape({
    currentPassword: yup.string().required('Current password is required'),
    newPassword: yup
      .string()
      .min(8, 'Must be at least 8 characters')
      .matches(/[A-Z]/, 'Must contain uppercase')
      .matches(/[a-z]/, 'Must contain lowercase')
      .matches(/[0-9]/, 'Must contain number')
      .required('New password is required'),
    confirmPassword: yup
      .string()
      .oneOf([yup.ref('newPassword'), null], 'Passwords must match')
      .required('Confirm password is required'),
  });

  const handleSavePassword = async () => {
    setIsSaving(true);
    setErrors({});
    try {
      await passwordSchema.validate(passwordData, { abortEarly: false });
      await authService.changePassword({
        current_password: passwordData.currentPassword,
        new_password: passwordData.newPassword,
        new_password_confirmation: passwordData.confirmPassword,
      });
      Swal.fire({
        icon: 'success',
        title: 'Password Updated',
        text: 'Your password has been changed successfully.',
        timer: 2000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end',
      });
      setIsChangingPassword(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      if (err instanceof yup.ValidationError) {
        const validationErrors = {};
        err.inner.forEach((error) => {
          validationErrors[error.path] = error.message;
        });
        setErrors(validationErrors);
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Update Failed',
          text: err.response?.data?.message || 'Could not update password.',
          toast: true,
          position: 'top-end',
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[rgb(var(--color-border))]">
        <Lock size={20} className="text-[rgb(var(--color-primary))]" />
        <h2 className="text-lg font-semibold text-[rgb(var(--color-text))]">Change Password</h2>
      </div>

      <div className="bg-[rgb(var(--color-background))] rounded-xl border border-[rgb(var(--color-border))] overflow-hidden">
        <div className="flex items-center justify-between p-4">
          <div>
            <div className="text-sm font-semibold text-[rgb(var(--color-text))]">
              Update your account password
            </div>
            <div className="text-xs text-[rgb(var(--color-text-muted))]">
              Choose a strong, unique password to keep your account secure.
            </div>
          </div>
          {!isChangingPassword && (
            <button
              onClick={() => setIsChangingPassword(true)}
              className="px-4 py-2 text-sm font-medium text-[rgb(var(--color-primary))] bg-[rgb(var(--color-primary))/0.1] hover:bg-[rgb(var(--color-primary))/0.2] rounded-lg transition-colors"
            >
              Change Password
            </button>
          )}
        </div>

        {isChangingPassword && (
          <div className="p-4 pt-0 border-t border-[rgb(var(--color-border))] animate-fade-in-down">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <input type="password" style={{ display: 'none' }} tabIndex="-1" />
              {['currentPassword', 'newPassword', 'confirmPassword'].map((field) => (
                <div key={field} className="space-y-1">
                  <label className="text-xs font-semibold text-[rgb(var(--color-text-muted))] uppercase">
                    {field.replace(/([A-Z])/g, ' $1').trim()}
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords[field] ? 'text' : 'password'}
                      name={field}
                      value={passwordData[field]}
                      onChange={handlePasswordChange}
                      autoComplete="off"
                      className={`w-full px-4 py-2 pr-10 text-sm bg-[rgb(var(--color-surface))] border rounded-lg outline-none transition-all
                                                ${errors[field] ? 'border-[rgb(var(--color-error))] focus:ring-1 focus:ring-[rgb(var(--color-error))]' : 'border-[rgb(var(--color-border))] focus:ring-2 focus:ring-[rgb(var(--color-primary))]'}
                                            `}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility(field)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))]"
                    >
                      {showPasswords[field] ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors[field] && (
                    <p className="text-xs text-[rgb(var(--color-error))]">{errors[field]}</p>
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setIsChangingPassword(false);
                  setErrors({});
                  setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                }}
                type="button"
                className="px-4 py-2 text-sm font-medium text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-surface))] rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePassword}
                disabled={isSaving || !isDirty}
                type="button"
                className="flex items-center gap-2 px-6 py-2.5 bg-[rgb(var(--color-primary))] text-white text-sm font-bold rounded-lg hover:bg-[rgb(var(--color-primary-dark))] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {isSaving ? (
                  'Saving...'
                ) : (
                  <>
                    <Save size={16} /> Save New Password
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
