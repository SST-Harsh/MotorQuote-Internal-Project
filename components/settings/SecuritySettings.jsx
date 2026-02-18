'use client';
import React, { useState, useEffect } from 'react';
import Switch from '../common/Switch';
import { Shield, Lock, Save, Eye, EyeOff } from 'lucide-react';
import Swal from 'sweetalert2';
import * as yup from 'yup';
import authService from '../../services/authService';
import { useAuth } from '../../context/AuthContext';

export default function SecuritySettings() {
  const { user } = useAuth();
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [initial2FAEnabled, setInitial2FAEnabled] = useState(false);
  const [pending2FAState, setPending2FAState] = useState(false);
  const [has2FAChanges, setHas2FAChanges] = useState(false);
  const [isSaving2FA, setIsSaving2FA] = useState(false);

  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({});
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  // Load 2FA state from localStorage
  useEffect(() => {
    const stored2FA = localStorage.getItem('user_2fa_enabled');
    const enabled = stored2FA ? JSON.parse(stored2FA) : false;

    setIs2FAEnabled(enabled);
    setInitial2FAEnabled(enabled);
    setPending2FAState(enabled);
  }, []);

  // Handle 2FA Toggle - Stage the change
  const handle2FAToggle = (value) => {
    setPending2FAState(value);
    setHas2FAChanges(value !== initial2FAEnabled);
  };

  // Save 2FA Changes
  const handleSave2FA = async () => {
    setIsSaving2FA(true);
    try {
      // If disabling 2FA, ask for verification code
      if (!pending2FAState && initial2FAEnabled) {
        const { value: code } = await Swal.fire({
          title: 'Disable Two-Factor Authentication',
          html: `
                        <p class="text-sm text-gray-600 mb-4">Enter the 6-digit code from your authenticator app to confirm</p>
                    `,
          input: 'text',
          inputPlaceholder: '000000',
          inputAttributes: {
            maxlength: 6,
            autocomplete: 'off',
            style:
              'text-align: center; font-size: 24px; letter-spacing: 0.5em; font-family: monospace;',
          },
          showCancelButton: true,
          confirmButtonText: 'Disable 2FA',
          confirmButtonColor: '#d33',
          cancelButtonText: 'Cancel',
          inputValidator: (value) => {
            if (!value) {
              return 'Verification code is required!';
            }
            if (value.length !== 6 || !/^\d+$/.test(value)) {
              return 'Please enter a valid 6-digit code';
            }
          },
          customClass: {
            input: 'swal2-input-code',
          },
        });

        // If user cancelled or didn't enter code
        if (!code) {
          setPending2FAState(initial2FAEnabled);
          setHas2FAChanges(false);
          setIsSaving2FA(false);
          return;
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 500));

      localStorage.setItem('user_2fa_enabled', JSON.stringify(pending2FAState));

      setIs2FAEnabled(pending2FAState);
      setInitial2FAEnabled(pending2FAState);
      setHas2FAChanges(false);

      Swal.fire({
        icon: 'success',
        title: pending2FAState ? '2FA Enabled' : '2FA Disabled',
        text: `Two-factor authentication has been ${pending2FAState ? 'enabled' : 'disabled'}.`,
        timer: 2000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end',
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Operation Failed',
        text: 'Could not update 2FA settings.',
        toast: true,
        position: 'top-end',
      });
      setPending2FAState(initial2FAEnabled);
      setHas2FAChanges(false);
    } finally {
      setIsSaving2FA(false);
    }
  };

  // Cancel 2FA Changes
  const handleCancel2FA = () => {
    setPending2FAState(initial2FAEnabled);
    setHas2FAChanges(false);
  };

  // Verify 2FA Setup
  const handleVerify2FA = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid Code',
        text: 'Please enter a 6-digit code.',
        toast: true,
        position: 'top-end',
      });
      return;
    }

    setIsVerifying(true);
    try {
      await authService.verify2FASetup(verificationCode);
      setIs2FAEnabled(true);
      setIsSettingUp2FA(false);
      setVerificationCode('');
      setQrCodeUrl('');
      setSecret('');

      Swal.fire({
        icon: 'success',
        title: '2FA Enabled!',
        text: 'Two-factor authentication has been successfully enabled.',
        timer: 2000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end',
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Verification Failed',
        text: error.response?.data?.message || 'Invalid verification code.',
        toast: true,
        position: 'top-end',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // Cancel 2FA Setup
  const cancelSetup = () => {
    setIsSettingUp2FA(false);
    setQrCodeUrl('');
    setSecret('');
    setVerificationCode('');
  };

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
    <section className="bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] rounded-2xl p-6 shadow-sm mb-10">
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[rgb(var(--color-border))]">
        <Shield size={20} className="text-[rgb(var(--color-primary))]" />
        <h2 className="text-lg font-semibold text-[rgb(var(--color-text))]">Security Settings</h2>
      </div>

      <div className="space-y-6">
        {/* Two-Factor Authentication */}
        <div className="bg-[rgb(var(--color-background))] rounded-xl border border-[rgb(var(--color-border))] overflow-hidden">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[rgb(var(--color-info))/0.1] text-[rgb(var(--color-info))] rounded-lg">
                <Lock size={20} />
              </div>
              <div>
                <div className="text-sm font-semibold text-[rgb(var(--color-text))]">
                  Two-Factor Authentication
                </div>
                <div className="text-xs text-[rgb(var(--color-text-muted))]">
                  {is2FAEnabled
                    ? 'Enabled - Your account is protected'
                    : 'Add an extra layer of security'}
                </div>
              </div>
            </div>
            <Switch checked={pending2FAState} onChange={handle2FAToggle} />
          </div>

          {/* Save/Cancel Buttons */}
          {has2FAChanges && (
            <div className="px-4 pb-4 flex gap-2 justify-end border-t border-[rgb(var(--color-border))] pt-4">
              <button
                onClick={handleCancel2FA}
                disabled={isSaving2FA}
                className="px-4 py-2 text-sm font-medium text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-background))] rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave2FA}
                disabled={isSaving2FA}
                className="px-4 py-2 bg-[rgb(var(--color-primary))] text-white text-sm font-bold rounded-lg hover:bg-[rgb(var(--color-primary-dark))] disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {isSaving2FA ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Change Password */}
        <div className="bg-[rgb(var(--color-background))] rounded-xl border border-[rgb(var(--color-border))] overflow-hidden transition-all duration-300">
          <div className="flex items-center justify-between p-4">
            <div>
              <div className="text-sm font-semibold text-[rgb(var(--color-text))]">
                Change Password
              </div>
              <div className="text-xs text-[rgb(var(--color-text-muted))]">
                Update your account password securely.
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
                  disabled={isSaving}
                  type="button"
                  className="flex items-center gap-2 px-6 py-2 bg-[rgb(var(--color-primary))] text-white text-sm font-bold rounded-lg hover:bg-[rgb(var(--color-primary-dark))] disabled:opacity-70 disabled:cursor-wait"
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
      </div>
    </section>
  );
}
