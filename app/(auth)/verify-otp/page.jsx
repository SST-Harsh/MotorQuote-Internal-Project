'use client';

import { useRef, useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Cookies from 'js-cookie';

import api from '../../../utils/api';
import authService from '../../../services/authService';

import LanguageSwitcher from '../../../components/common/LanguageSwitcher';
import { useTranslation } from '../../../context/LanguageContext';

export default function VerifyOtpPage() {
  const { t } = useTranslation('auth');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [email, setEmail] = useState('');
  const inputRefs = useRef([]);

  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get('email');
    setEmail(value || '');

    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (index, value) => {
    if (isNaN(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    if (value && index < 6 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0 && inputRefs.current[index - 1]) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6).split('');
    if (pastedData.every((char) => !isNaN(char))) {
      const newOtp = [...otp];
      pastedData.forEach((val, i) => {
        if (i < 6) newOtp[i] = val;
      });
      setOtp(newOtp);
      if (inputRefs.current[pastedData.length - 1]) {
        inputRefs.current[pastedData.length - 1].focus();
      }
    }
  };

  const handleVerify = async () => {
    const otpString = otp.join('');

    if (otpString.length !== 6) {
      console.warn('OTP incomplete:', otpString);
      return;
    }

    try {
      const tempToken = sessionStorage.getItem('tempToken');

      if (!tempToken) {
        console.error('No tempToken found in sessionStorage');
        throw new Error(t('messages.unexpectedError'));
      }

      const data = await authService.verify2FA(tempToken, otpString);

      const token = data.token || data.accessToken;
      const user = data.user;

      if (token) {
        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(user));

        Cookies.set('authToken', token, { expires: 1 });
        Cookies.set('role', user.role, { expires: 1 });

        sessionStorage.removeItem('tempToken');

        Swal.fire({
          title: t('verifyOtp.verified'),
          text: t('verifyOtp.redirecting'),
          icon: 'success',
          confirmButtonColor: 'rgb(var(--color-primary))',
          timer: 1500,
          showConfirmButton: false,
        });

        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1500);
      }
    } catch (error) {
      console.error('Verification Error:', error);
      const message = error.response?.data?.message || error.message || t('verifyOtp.invalidCode');

      Swal.fire({
        title: t('verifyOtp.failed'),
        text: message,
        icon: 'error',
        confirmButtonColor: 'rgb(var(--color-error))',
      });
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0].focus();
    }
  };

  const hasSentOtp = useRef(false);

  useEffect(() => {
    localStorage.removeItem('authToken');

    const sendOtpOnMount = async () => {
      const tempToken = sessionStorage.getItem('tempToken');
      if (hasSentOtp.current) return;

      if (tempToken) {
        hasSentOtp.current = true;
        try {
          await api.post(
            '/auth/send-login-otp',
            { tempToken },
            {
              headers: { Authorization: `Bearer ${tempToken}` },
            }
          );
        } catch (e) {
          console.error('Auto-send failed', e);
        }
      }
    };
    sendOtpOnMount();
  }, []);

  const [timer, setTimer] = useState(30);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleResend = async () => {
    try {
      const tempToken = sessionStorage.getItem('tempToken');
      if (!tempToken) throw new Error(t('messages.unexpectedError'));

      await api.post(
        '/auth/send-login-otp',
        { tempToken },
        {
          headers: { Authorization: `Bearer ${tempToken}` },
        }
      );

      setTimer(30);

      Swal.fire({
        icon: 'success',
        title: t('verifyOtp.codeResent'),
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000,
      });
    } catch (error) {
      console.error('Resend Error:', error);
      Swal.fire({
        title: t('verifyOtp.failed'),
        text: error.response?.data?.message || t('verifyOtp.invalidCode'),
        icon: 'error',
        confirmButtonColor: 'rgb(var(--color-error))',
      });
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
            {t('verifyOtp.heroTitle')} <br />
            <span className="text-[rgb(var(--color-success))]">{t('verifyOtp.heroSubtitle')}</span>
          </h1>
          <p className="text-gray-400 text-lg leading-relaxed">{t('verifyOtp.heroDesc')}</p>
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

          <div className="text-center lg:text-left mb-8">
            <div className="w-12 h-12 bg-[rgb(var(--color-primary)/0.1)] rounded-full flex items-center justify-center text-[rgb(var(--color-primary))] mb-4 mx-auto lg:mx-0">
              <ShieldCheck size={24} />
            </div>
            <h2 className="text-2xl font-bold text-[rgb(var(--color-text))]">
              {t('verifyOtp.title')}
            </h2>
            <p className="text-[rgb(var(--color-text-muted))] mt-2 text-sm">
              {t('verifyOtp.subtitle')} <br className="lg:hidden" />
              <span className="font-semibold text-[rgb(var(--color-text))]">
                {email || 'your email'}
              </span>
            </p>

            {timer > 0 ? (
              <p className="text-red-500 mt-2 text-sm font-medium animate-pulse">
                {t('verifyOtp.expiresIn', { timer: timer.toString().padStart(2, '0') })}
              </p>
            ) : (
              <p className="text-red-500 mt-2 text-sm font-medium">{t('verifyOtp.expired')}</p>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleVerify();
            }}
          >
            <div className="flex justify-center lg:justify-start gap-2 mb-8" onPaste={handlePaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  type="text"
                  maxLength={1}
                  value={digit}
                  ref={(el) => (inputRefs.current[i] = el)}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  disabled={timer === 0}
                  className={`w-12 h-12 text-center text-xl font-bold rounded-xl border bg-[rgb(var(--color-background))] text-[rgb(var(--color-text))]
                          focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary)/0.2)] focus:border-[rgb(var(--color-primary))] focus:-translate-y-1 transition-all shadow-sm
                          ${timer === 0 ? 'border-red-200 opacity-60 cursor-not-allowed' : 'border-[rgb(var(--color-border))]'}`}
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={timer === 0}
              className="w-full h-12 bg-[rgb(var(--color-primary))] text-white font-medium rounded-lg shadow-lg shadow-[rgb(var(--color-primary)/0.2)] 
                  hover:bg-[rgb(var(--color-primary-dark))] hover:shadow-[rgb(var(--color-primary)/0.4)] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('verifyOtp.submit')}
            </button>
          </form>

          <p className="text-center text-sm text-[rgb(var(--color-text-muted))] mt-6">
            {t('verifyOtp.resendCode')}?{' '}
            <button
              onClick={handleResend}
              className={`font-semibold transition-colors ${timer > 0 ? 'text-gray-400 cursor-not-allowed' : 'text-[rgb(var(--color-primary))] hover:underline'}`}
              disabled={timer > 0}
            >
              {timer > 0 ? t('verifyOtp.resendIn', { timer }) : t('verifyOtp.resend')}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
