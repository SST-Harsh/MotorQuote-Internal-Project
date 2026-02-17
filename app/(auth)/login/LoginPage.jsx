'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import * as Yup from 'yup';
import Swal from 'sweetalert2';
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react';
import Input from '../../../components/common/Input';
import { useAuth } from '../../../context/AuthContext';

// --- VALIDATION SCHEMA ---
const loginSchema = Yup.object().shape({
  email: Yup.string()
    .trim()
    .matches(/^[a-zA-Z0-9._%+-]+@([a-zA-Z0-9-]+\.)+[A-Za-z]{2,}$/, 'Enter a valid email address')
    .required('Email is required'),

  password: Yup.string().required('Password is required'),
});

export default function DealerLoginPage({
  logo = 'MotorQuote',
  companyName = 'MotorQuote UK Ltd',
  backgroundImage = '/assets/Login-Banner.jpg',
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const router = useRouter();

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
      // 1. Call Login from Context
      const result = await login(formData.email, formData.password, formData.rememberMe);

      // 2. Check for 2FA requirement
      if (result.requires2FA) {
        router.push(`/verify-otp?email=${encodeURIComponent(formData.email)}`);
        return;
      }

      // 3. Success Alert (Optional, makes it feel smoother)
      const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
      });
      Toast.fire({
        icon: 'success',
        title: 'Signed in successfully',
      });

      // 4. Redirect to unified dashboard
      router.push('/dashboard');
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Login Failed',
        text: err.message || 'Invalid credentials',
        confirmButtonColor: 'rgb(var(--color-primary))',
      });
      setErrors({ submit: err.message || 'Invalid credentials' });
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider) => {
    Swal.fire({
      title: `Connecting to ${provider.charAt(0).toUpperCase() + provider.slice(1)}...`,
      text: 'Please wait while we authenticate your account.',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    await new Promise((resolve) => setTimeout(resolve, 1500));

    try {
      const result = await login('admin@dealership.co.uk', 'admin123', true);
      Swal.fire({
        icon: 'success',
        title: 'Authentication Successful',
        text: `Welcome back, Dylan! You have logged in with ${provider}.`,
        timer: 1500,
        showConfirmButton: false,
        position: 'top-end',
        toast: true,
      });

      // 5. Redirect to unified dashboard
      router.push('/dashboard');
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Authentication Failed',
        text: 'Could not connect to provider.',
      });
    }
  };

  const handleKey = (e) => e.key === 'Enter' && handleSubmit();

  return (
    <div className="flex min-h-screen bg-[rgb(var(--color-background))]">
      {/* --- DESKTOP LEFT SIDE --- */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#19223a] text-white flex-col justify-between p-12 overflow-hidden">
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
            Welcome to <span className="text-[rgb(var(--color-info))]">{companyName}</span>
          </h1>
          <p className="text-gray-300 text-lg leading-relaxed">
            The all-in-one platform designed to streamline your dealership operations.
          </p>
        </div>

        <div className="relative z-20 text-sm text-gray-400">
          Trusted by top dealership groups across Ahmedabad, Delhi, and Mumbai.
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center bg-gradient-to-br   p-4 sm:p-12 relative overflow-y-auto">
        <div className="lg:hidden absolute inset-0 z-0 "></div>

        <div
          className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden z-10 
                        grid grid-cols-1 md:grid-cols-2 lg:block lg:bg-transparent lg:shadow-none lg:max-w-md lg:rounded-none lg:overflow-visible"
        >
          <div className="relative h-64 md:h-auto lg:hidden bg-[#19223a]">
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
              <p className="text-gray-300 text-sm font-medium">Sell Made Simple.</p>
            </div>
          </div>

          <div className="p-8 md:p-10 lg:p-0 flex flex-col justify-center h-full">
            <div className="mb-8 text-center lg:text-left">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 lg:text-[rgb(var(--color-text))]">
                Welcome back
              </h2>
              <p className="text-gray-500 lg:text-[rgb(var(--color-text-muted))] text-sm mt-2">
                Sign in to manage your platform
              </p>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-900 lg:text-[rgb(var(--color-text))] mb-1.5">
                  Work Email
                </label>
                <div className="relative group">
                  <Mail
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[rgb(var(--color-primary))] transition-colors"
                    size={18}
                  />
                  <input
                    type="email"
                    placeholder="name@dealership.co.uk"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className={`w-full h-11 pl-10 pr-4 bg-gray-50 lg:bg-[rgb(var(--color-background))] border rounded-lg text-gray-900 lg:text-[rgb(var(--color-text))] text-sm placeholder-gray-400 lg:placeholder-[rgb(var(--color-text-muted))] 
                    focus:bg-white focus:ring-4 focus:ring-[rgb(var(--color-primary)/0.1)] focus:border-[rgb(var(--color-primary))] outline-none transition-all
                    ${
                      errors.email
                        ? 'border-[rgb(var(--color-error))] bg-[rgb(var(--color-error)/0.05)]'
                        : 'border-gray-200 lg:border-[rgb(var(--color-border))] hover:border-gray-300'
                    }`}
                  />
                </div>
                {errors.email && (
                  <p className="text-[rgb(var(--color-error))] text-xs mt-1.5 font-medium flex items-center gap-1">
                    ⚠️ {errors.email}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 lg:text-[rgb(var(--color-text))] mb-1.5">
                  Password
                </label>
                <div className="relative group">
                  <Lock
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[rgb(var(--color-primary))] transition-colors"
                    size={18}
                  />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter password"
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    onKeyDown={handleKey}
                    className={`w-full h-11 pl-10 pr-10 bg-gray-50 lg:bg-[rgb(var(--color-background))] border rounded-lg text-gray-900 lg:text-[rgb(var(--color-text))] text-sm placeholder-gray-400 lg:placeholder-[rgb(var(--color-text-muted))] 
                    focus:bg-white focus:ring-4 focus:ring-[rgb(var(--color-primary)/0.1)] focus:border-[rgb(var(--color-primary))] outline-none transition-all
                    ${
                      errors.password
                        ? 'border-[rgb(var(--color-error))] bg-[rgb(var(--color-error)/0.05)]'
                        : 'border-gray-200 lg:border-[rgb(var(--color-border))] hover:border-gray-300'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-[rgb(var(--color-error))] text-xs mt-1.5 font-medium flex items-center gap-1">
                    ⚠️ {errors.password}
                  </p>
                )}
              </div>

              {errors.submit && (
                <div className="bg-[rgb(var(--color-error)/0.1)] border border-[rgb(var(--color-error)/0.2)] text-[rgb(var(--color-error))] text-sm p-3 rounded-lg flex items-start gap-2">
                  <span className="mt-0.5">⚠️</span>
                  <span>{errors.submit}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={formData.rememberMe}
                    onChange={(e) => handleChange('rememberMe', e.target.checked)}
                    className="w-4 h-4 rounded border-[rgb(var(--color-border))] text-[rgb(var(--color-primary))] focus:ring-[rgb(var(--color-primary))] cursor-pointer accent-[rgb(var(--color-primary))]"
                  />
                  <span className="text-sm text-gray-500 lg:text-[rgb(var(--color-text-muted))] group-hover:text-gray-900 lg:group-hover:text-[rgb(var(--color-text))] transition-colors">
                    Keep me logged in
                  </span>
                </label>

                <button
                  type="button"
                  onClick={() => router.push('/forgot-password')}
                  className="text-sm font-semibold text-[rgb(var(--color-primary))] hover:text-[rgb(var(--color-primary-dark))] hover:underline"
                >
                  Forgot password?
                </button>
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading}
                className={`w-full h-12 bg-[rgb(var(--color-primary))] text-white font-medium rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-[rgb(var(--color-primary)/0.2)] hover:bg-[rgb(var(--color-primary-dark))] hover:shadow-[rgb(var(--color-primary)/0.4)] active:scale-[0.98] transition-all
                ${loading ? 'opacity-70 cursor-wait' : ''}`}
              >
                {loading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>

              <div className="relative flex items-center justify-center my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[rgb(var(--color-border))]"></div>
                </div>
                <span className="relative bg-[rgb(var(--color-surface))] lg:bg-transparent px-4 text-xs text-[rgb(var(--color-text-muted))] uppercase tracking-wider font-semibold">
                  Or continue with
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => handleSocialLogin('google')}
                  className="flex items-center justify-center gap-2 h-11 border border-[rgb(var(--color-border))] rounded-lg hover:bg-[rgb(var(--color-background))] hover:border-[rgb(var(--color-text-muted))] transition-all bg-white text-gray-700 font-medium text-sm"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  <span>Google</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSocialLogin('microsoft')}
                  className="flex items-center justify-center gap-2 h-11 border border-[rgb(var(--color-border))] rounded-lg hover:bg-[rgb(var(--color-background))] hover:border-[rgb(var(--color-text-muted))] transition-all bg-white text-gray-700 font-medium text-sm"
                >
                  <svg className="w-5 h-5" viewBox="0 0 23 23" xmlns="http://www.w3.org/2000/svg">
                    <path fill="#f35325" d="M1 1h10v10H1z" />
                    <path fill="#81bc06" d="M12 1h10v10H12z" />
                    <path fill="#05a6f0" d="M1 12h10v10H1z" />
                    <path fill="#ffba08" d="M12 12h10v10H12z" />
                  </svg>
                  <span>Microsoft</span>
                </button>
              </div>

              <div className="mt-8 text-center lg:hidden">
                <p className="text-xs text-[rgb(var(--color-text-muted))] opacity-70">
                  © 2025 {companyName}. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Footer (outside card) */}
        <div className="hidden lg:block mt-8 text-center">
          <p className="text-xs text-[rgb(var(--color-text-muted))] opacity-70">
            © 2025 {companyName}. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
