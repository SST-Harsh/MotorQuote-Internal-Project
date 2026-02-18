'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import * as Yup from 'yup';
import Swal from 'sweetalert2';
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react';
import Input from '../../../components/common/Input';
import Button from '../../../components/common/Button';
import Checkbox from '../../../components/common/Checkbox';
import { useAuth } from '../../../context/AuthContext';

// Dynamically import social login buttons to prevent SSR issues with Google/MSAL hooks
const SocialLoginButtons = dynamic(() => import('../../../components/common/SocialLoginButtons'), {
  ssr: false,
});

import { useTranslation, useLanguage } from '../../../context/LanguageContext';

export default function DealerLoginPage({
  logo = 'MotorQuote',
  companyName = 'MotorQuote Ltd',
  backgroundImage = '/assets/Login-Banner.jpg',
}) {
  const { t } = useTranslation('auth');
  const { t: tCommon } = useLanguage();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const { login, socialLogin } = useAuth();
  const router = useRouter();

  // --- VALIDATION SCHEMA (Localized) ---
  const loginSchema = Yup.object().shape({
    email: Yup.string()
      .trim()
      .matches(/^[a-zA-Z0-9._%+-]+@([a-zA-Z0-9-]+\.)+[A-Za-z]{2,}$/, t('validation.emailInvalid'))
      .required(t('validation.emailRequired')),

    password: Yup.string().required(t('validation.passwordRequired')),
  });

  const handleChange = (field, value) => {
    setFormData((p) => ({ ...p, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validateForm = async () => {
    try {
      await loginSchema.validate(formData, { abortEarly: false });
      setErrors({});
      return true;
    } catch (err) {
      const out = {};
      err.inner.forEach((e) => (out[e.path] = e.message));
      setErrors(out);
      return false;
    }
  };

  const handleSubmit = async () => {
    if (!(await validateForm())) return;

    setLoading(true);

    try {
      const result = await login(formData.email, formData.password, formData.rememberMe);

      if (result.requires2FA) {
        router.push(`/verify-otp?email=${encodeURIComponent(formData.email)}`);
        return;
      }

      const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
      });
      Toast.fire({
        icon: 'success',
        title: t('messages.signinSuccess'),
      });

      // Use role-based routing
      router.push('/dashboard');
    } catch (err) {
      const backendMessage = err.message || t('messages.unexpectedError');
      setErrors({ submit: backendMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => e.key === 'Enter' && handleSubmit();

  return (
    <div className="flex min-h-screen bg-[rgb(var(--color-background))]">
      {/* Floating Language Switcher */}

      {/* --- DESKTOP LEFT SIDE --- */}
      <div className="hidden xl:flex xl:w-1/2 relative bg-[#19223a] text-white flex-col justify-between p-12 overflow-hidden">
        <Image
          src={backgroundImage}
          alt="Car dealership"
          fill
          priority
          className="object-cover mix-blend-overlay opacity-90 z-0"
        />
        <div className="absolute inset-0 z-10 bg-gradient-to-br from-gray-600 via-[#314673] to-[rgb(var(--color-primary))] opacity-30"></div>

        <div className="relative z-20">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-[rgb(var(--color-primary))] rounded-lg flex items-center justify-center font-bold text-white">
              M
            </div>
            <span className="text-xl font-semibold tracking-wide text-white">{logo}</span>
          </div>
        </div>

        <div className="relative z-20 space-y-6 max-w-lg">
          <h1 className="text-4xl font-bold leading-tight text-white">
            {(() => {
              const marker = '___COMPANY___';
              const welcomeStr = t('branding.welcome', { companyName: marker });
              const [prefix, suffix] = welcomeStr.split(marker);
              return (
                <>
                  {prefix}
                  <span className="text-[rgb(var(--color-info))]">{companyName}</span>
                  {suffix}
                </>
              );
            })()}
          </h1>
          <p className="text-gray-300 text-lg leading-relaxed">{t('branding.description')}</p>
        </div>

        <div className="relative z-20 text-sm text-gray-400">{t('branding.trustedBy')}</div>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center bg-gradient-to-br p-0 sm:p-12 relative overflow-y-auto">
        <div className="xl:hidden absolute inset-0 z-0 bg-gradient-to-br from-[#0B0F19] to-[#1a1f35]"></div>

        <div
          className="w-full max-w-4xl bg-[rgb(var(--color-surface))] sm:rounded-3xl sm:shadow-2xl overflow-hidden z-10 
                        grid grid-cols-1 md:grid-cols-2 xl:block xl:bg-transparent xl:shadow-none xl:max-w-md xl:rounded-none xl:overflow-visible min-h-screen sm:min-h-0"
        >
          <div className="relative h-[30vh] min-h-[200px] md:h-auto xl:hidden bg-[#19223a]">
            <Image
              src={backgroundImage}
              alt="Background"
              fill
              className="object-cover mix-blend-overlay opacity-90 z-0"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-br from-[#19223a] via-[#1a1f35] to-[rgb(var(--color-primary))] opacity-40 backdrop-blur-[1px]"></div>

            <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6 text-center z-10">
              <div className="w-12 h-12 bg-[rgb(var(--color-primary))] rounded-xl flex items-center justify-center font-bold text-2xl mb-4 shadow-lg shadow-[rgb(var(--color-primary)/0.3)]">
                M
              </div>
              <h3 className="text-2xl font-bold tracking-tight mb-2">{logo}</h3>
              <p className="text-gray-300 text-sm font-medium">{t('branding.sellMadeSimple')}</p>
            </div>
          </div>

          <div className="p-8 md:p-10 flex flex-col justify-center h-full">
            <div className="mb-8 text-center xl:text-left">
              <h2 className="text-xl md:text-2xl font-bold text-[rgb(var(--color-text))]">
                {t('login.title')}
              </h2>
              <p className="text-gray-500 lg:text-[rgb(var(--color-text-muted))] text-sm mt-2">
                {t('login.subtitle')}
              </p>
            </div>

            <div className="space-y-5">
              <Input
                label={t('login.emailLabel')}
                type="email"
                placeholder={t('login.emailPlaceholder')}
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                icon={Mail}
                error={errors.email}
                inputClassName="!bg-[rgb(var(--color-background))] focus:!bg-[rgb(var(--color-surface))] !border-[rgb(var(--color-border))] !text-[rgb(var(--color-text))] placeholder:!text-[rgb(var(--color-text-muted))]"
                labelClassName="!text-[rgb(var(--color-text))] font-medium"
              />

              <Input
                label={t('login.passwordLabel')}
                type={showPassword ? 'text' : 'password'}
                placeholder={t('login.passwordPlaceholder')}
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                onKeyDown={handleKey}
                icon={Lock}
                rightIcon={showPassword ? EyeOff : Eye}
                onRightIconClick={() => setShowPassword(!showPassword)}
                error={errors.password}
                inputClassName="!bg-[rgb(var(--color-background))] focus:!bg-[rgb(var(--color-surface))] !border-[rgb(var(--color-border))] !text-[rgb(var(--color-text))] placeholder:!text-[rgb(var(--color-text-muted))]"
                labelClassName="!text-[rgb(var(--color-text))] font-medium"
              />

              {errors.submit && (
                <div className="bg-[rgb(var(--color-error)/0.1)] border border-[rgb(var(--color-error)/0.2)] text-[rgb(var(--color-error))] text-sm p-3 rounded-lg flex items-start gap-2">
                  <span className="mt-0.5">⚠️</span>
                  <span>{errors.submit}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <Checkbox
                  label={t('login.rememberMe')}
                  checked={formData.rememberMe}
                  onChange={(e) => handleChange('rememberMe', e.target.checked)}
                  labelClassName="!text-[rgb(var(--color-text))] font-medium"
                  checkboxClassName="!border-[rgb(var(--color-border))]"
                />

                <button
                  type="button"
                  onClick={() => router.push('/forgot-password')}
                  className="text-sm font-semibold text-[rgb(var(--color-primary))] hover:text-[rgb(var(--color-primary-dark))] hover:underline"
                >
                  {t('login.forgotPassword')}
                </button>
              </div>

              <Button onClick={handleSubmit} loading={loading} fullWidth>
                <span>{t('login.signIn')}</span>
                <ArrowRight size={18} />
              </Button>

              <div className="flex items-center gap-4 my-6">
                <div className="h-px flex-1 bg-[rgb(var(--color-border))] "></div>
                <span className="text-xs text-[rgb(var(--color-text-muted))] uppercase tracking-wider font-semibold">
                  {t('login.orContinueWith')}
                </span>
                <div className="h-px flex-1 bg-[rgb(var(--color-border))] "></div>
              </div>

              <SocialLoginButtons setLoading={setLoading} />

              <div className="mt-8 text-center xl:hidden flex flex-col items-center gap-3">
                <p className="text-xs text-[rgb(var(--color-text-muted))]">
                  {t('login.allRightsReserved', { companyName })}
                </p>
                <div className="flex items-center gap-3 text-xs font-medium text-[rgb(var(--color-text-muted))]">
                  <Link
                    href="/terms"
                    className="hover:text-[rgb(var(--color-primary))] transition-colors"
                  >
                    {t('login.termsOfService')}
                  </Link>
                  <span className="w-1 h-1 rounded-full bg-[rgb(var(--color-border))]"></span>
                  <Link
                    href="/privacy"
                    className="hover:text-[rgb(var(--color-primary))] transition-colors"
                  >
                    {t('login.privacyPolicy')}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Footer (outside card) */}
        <div className="hidden xl:flex flex-col items-center mt-8 gap-3">
          <p className="text-xs text-[rgb(var(--color-text-muted))]">
            {t('login.allRightsReserved', { companyName })}
          </p>
          <div className="flex items-center gap-4 text-xs font-medium text-[rgb(var(--color-text-muted))]">
            <Link
              href="/terms"
              className="hover:text-[rgb(var(--color-primary))] transition-colors"
            >
              {t('login.termsOfService')}
            </Link>
            <span className="w-1 h-1 rounded-full bg-gray-300"></span>
            <Link
              href="/privacy"
              className="hover:text-[rgb(var(--color-primary))] transition-colors"
            >
              {t('login.privacyPolicy')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
