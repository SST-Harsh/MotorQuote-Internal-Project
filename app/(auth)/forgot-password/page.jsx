'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, CheckCircle2 } from 'lucide-react';
import Input from '../../../components/common/Input';
import api from '../../../utils/api';
import Swal from 'sweetalert2';

import LanguageSwitcher from '../../../components/common/LanguageSwitcher';
import { useTranslation } from '../../../context/LanguageContext';

export default function ForgotPassword() {
  const { t } = useTranslation('auth');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/auth/forgot-password', { email });

      Swal.fire({
        icon: 'success',
        title: t('forgotPassword.checkInbox'),
        text: t('forgotPassword.sentMessage') + ' ' + email,
        timer: 1500,
        showConfirmButton: false,
        position: 'top-end',
        toast: true,
        background: '#fff',
        color: '#000',
      });
      setIsSubmitted(true);
    } catch (error) {
      console.error('Forgot Password Error:', error);
      if (error.response && error.response.status === 404) {
        Swal.fire({
          icon: 'info',
          title: t('messages.demoMode'),
          text: t('messages.demoDesc'),
          timer: 2000,
          position: 'top-end',
          toast: true,
        });
        setIsSubmitted(true);
      } else {
        Swal.fire({
          icon: 'error',
          title: t('forgotPassword.failed'),
          text: error.response?.data?.message || t('messages.unexpectedError'),
          timer: 3000,
          showConfirmButton: false,
          position: 'top-end',
          toast: true,
          background: '#fff',
          color: '#000',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0B0F19] lg:bg-[rgb(var(--color-background))]">
      {/* Floating Language Switcher */}
      <div className="fixed top-6 right-6 z-50">
        <LanguageSwitcher />
      </div>

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

        <div className="relative z-10 space-y-4 max-w-lg mb-20">
          <h1 className="text-4xl font-bold leading-tight">
            {t('forgotPassword.heroTitle')} <br />
            <span className="text-[rgb(var(--color-info))]">
              {t('forgotPassword.heroSubtitle')}
            </span>
          </h1>
          <p className="text-gray-400 text-lg leading-relaxed">{t('forgotPassword.heroDesc')}</p>
        </div>

        <div className="relative z-10 text-sm text-gray-500">
          {t('login.allRightsReserved', { companyName: 'MotorQuote Ltd.' })}
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center p-4 sm:p-12 relative">
        <div className="lg:hidden absolute inset-0 z-0 bg-gradient-to-br from-[#0B0F19] to-[#1a1f35]"></div>

        <div className="w-full max-w-md bg-[rgb(var(--color-surface))] rounded-3xl shadow-2xl p-8 z-10 lg:bg-transparent lg:shadow-none lg:p-0 lg:rounded-none">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm font-medium text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))] transition-colors mb-8"
          >
            <ArrowLeft size={16} />
            {t('common.backToLogin')}
          </Link>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-[rgb(var(--color-text))]">
              {t('forgotPassword.title')}
            </h2>
            <p className="text-[rgb(var(--color-text-muted))] mt-2 text-sm leading-relaxed">
              {t('forgotPassword.subtitle')}
            </p>
          </div>

          {isSubmitted ? (
            <div className="bg-[rgb(var(--color-success)/0.1)] border border-[rgb(var(--color-success)/0.2)] rounded-xl p-6 text-center animate-fade-in">
              <div className="w-12 h-12 bg-[rgb(var(--color-success))] rounded-full flex items-center justify-center mx-auto mb-4 text-white shadow-lg shadow-[rgb(var(--color-success)/0.3)]">
                <CheckCircle2 size={24} />
              </div>
              <h3 className="text-lg font-bold text-[rgb(var(--color-text))] mb-2">
                {t('forgotPassword.checkInbox')}
              </h3>
              <p className="text-sm text-[rgb(var(--color-text-muted))] mb-6">
                {t('forgotPassword.sentMessage')} <br />
                <span className="font-semibold text-[rgb(var(--color-text))]">{email}</span>
              </p>
              <button
                onClick={() => setIsSubmitted(false)}
                className="text-sm font-semibold text-[rgb(var(--color-primary))] hover:underline"
              >
                {t('forgotPassword.tryDifferent')}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                label={t('login.emailLabel')}
                type="email"
                placeholder={t('login.emailPlaceholder')}
                icon={Mail}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <button
                type="submit"
                disabled={loading || !email}
                className={`w-full h-12 bg-[rgb(var(--color-primary))] text-white font-medium rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-[rgb(var(--color-primary)/0.2)] transition-all
                        ${
                          loading || !email
                            ? 'opacity-70 cursor-not-allowed'
                            : 'hover:bg-[rgb(var(--color-primary-dark))] hover:shadow-[rgb(var(--color-primary)/0.4)] active:scale-[0.98]'
                        }`}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    {t('forgotPassword.sending')}
                  </span>
                ) : (
                  t('forgotPassword.submit')
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
