'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Lock, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import Input from '../../../components/common/Input';
import Button from '../../../components/common/Button';
import Swal from 'sweetalert2';
import { simulateDelay } from '../../../utils/fakeAuth';

import LanguageSwitcher from '../../../components/common/LanguageSwitcher';
import { useTranslation } from '../../../context/LanguageContext';

export default function ResetPasswordPage() {
  const { t } = useTranslation('auth');
  const router = useRouter();
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;

  const isValidPassword = passwordRegex.test(formData.password);
  const passwordsMatch = formData.password && formData.password === formData.confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isValidPassword) {
      Swal.fire({
        icon: 'error',
        title: t('resetPassword.weakPasswordTitle'),
        text: t('resetPassword.weakPasswordDesc'),
        confirmButtonColor: 'rgb(var(--color-primary))',
      });
      return;
    }

    if (!passwordsMatch) {
      Swal.fire({
        icon: 'error',
        title: t('resetPassword.mismatchTitle'),
        text: t('resetPassword.mismatchDesc'),
        confirmButtonColor: 'rgb(var(--color-primary))',
      });
      return;
    }

    setLoading(true);
    // Simulate API call
    await simulateDelay(1500);
    setLoading(false);
    setIsSuccess(true);

    setTimeout(() => {
      router.push('/login');
    }, 2000);
  };

  return (
    <div className="flex min-h-screen bg-[#0B0F19] lg:bg-[rgb(var(--color-background))]">
      {/* Floating Language Switcher */}
      <div className="fixed top-6 right-6 z-50">
        <LanguageSwitcher />
      </div>

      {/* Left Side - Hero / Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#0B0F19] text-white flex-col justify-between p-12 overflow-hidden">
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-gray-900 via-[#111827] to-[rgb(var(--color-primary))] opacity-90"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-[rgb(var(--color-primary))] rounded-lg flex items-center justify-center font-bold">
              M
            </div>
            <span className="text-xl font-semibold tracking-wide">MotorQuote</span>
          </div>
        </div>

        <div className="relative z-10 space-y-4 max-w-lg mb-20 animate-fade-in">
          <h1 className="text-4xl font-bold leading-tight">
            {t('resetPassword.heroTitle')} <br />
            <span className="text-[rgb(var(--color-success))]">
              {t('resetPassword.heroSubtitle')}
            </span>
          </h1>
          <p className="text-gray-400 text-lg leading-relaxed">{t('resetPassword.heroDesc')}</p>
        </div>

        <div className="relative z-10 text-sm text-gray-500">
          {t('login.allRightsReserved', { companyName: 'MotorQuote Ltd.' })}
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-0 sm:p-12 relative animate-fade-in-up">
        <div className="lg:hidden absolute inset-0 z-0 bg-gradient-to-br from-[#0B0F19] to-[#1a1f35]"></div>

        <div className="w-full max-w-md bg-[rgb(var(--color-surface))] sm:rounded-3xl sm:shadow-2xl p-8 z-10 lg:bg-transparent lg:shadow-none lg:p-0 lg:rounded-none min-h-screen sm:min-h-0 flex flex-col justify-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm font-medium text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))] transition-colors mb-8"
          >
            <ArrowLeft size={16} />
            {t('common.backToLogin')}
          </Link>

          {isSuccess ? (
            <div className="text-center py-8 animate-scale-in">
              <div className="w-16 h-16 bg-[rgb(var(--color-success)/0.1)] rounded-full flex items-center justify-center mx-auto mb-6 text-[rgb(var(--color-success))]">
                <CheckCircle2 size={32} />
              </div>
              <h2 className="text-2xl font-bold text-[rgb(var(--color-text))] mb-2">
                {t('resetPassword.successTitle')}
              </h2>
              <p className="text-[rgb(var(--color-text-muted))] mb-4">
                {t('resetPassword.successDesc')}
              </p>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-[rgb(var(--color-text))]">
                  {t('resetPassword.title')}
                </h2>
                <p className="text-[rgb(var(--color-text-muted))] mt-2 text-sm">
                  {t('resetPassword.subtitle')}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <Input
                  label={t('resetPassword.newLabel')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('resetPassword.newPlaceholder')}
                  icon={Lock}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  rightIcon={showPassword ? EyeOff : Eye}
                  onRightIconClick={() => setShowPassword(!showPassword)}
                />

                <Input
                  label={t('resetPassword.confirmLabel')}
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder={t('resetPassword.confirmPlaceholder')}
                  icon={Lock}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  rightIcon={showConfirmPassword ? EyeOff : Eye}
                  onRightIconClick={() => setShowConfirmPassword(!showConfirmPassword)}
                />

                <div className="space-y-2">
                  <p
                    className={`text-xs flex items-center gap-2 transition-colors ${isValidPassword ? 'text-[rgb(var(--color-success))]' : 'text-[rgb(var(--color-text-muted))]'}`}
                  >
                    <CheckCircle2
                      size={12}
                      className={isValidPassword ? 'opacity-100' : 'opacity-30'}
                    />
                    {t('resetPassword.reqChars')}
                  </p>
                  <p
                    className={`text-xs flex items-center gap-2 transition-colors ${passwordsMatch && formData.password ? 'text-[rgb(var(--color-success))]' : 'text-[rgb(var(--color-text-muted))]'}`}
                  >
                    <CheckCircle2
                      size={12}
                      className={passwordsMatch && formData.password ? 'opacity-100' : 'opacity-30'}
                    />
                    {t('resetPassword.reqMatch')}
                  </p>
                </div>

                <Button
                  type="submit"
                  loading={loading}
                  fullWidth
                  disabled={!isValidPassword || !passwordsMatch}
                >
                  {t('resetPassword.submit')}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
