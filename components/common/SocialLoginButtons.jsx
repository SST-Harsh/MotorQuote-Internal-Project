'use client';

import { useGoogleLogin } from '@react-oauth/google';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '@/utils/msalConfig';
import Swal from 'sweetalert2';
import Button from './Button';
import { useTranslation } from '../../context/LanguageContext';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';

const GoogleButton = ({ setLoading, socialLogin, router, t }) => {
  const googleLoginHandler = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      try {
        const result = await socialLogin(
          'google',
          tokenResponse.access_token,
          tokenResponse.access_token
        );
        if (result.requires2FA) {
          router.push(`/verify-otp?provider=google`);
          return;
        }
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: t('messages.signinSuccess'),
          showConfirmButton: false,
          timer: 2000,
        });
        router.push('/dashboard');
      } catch (err) {
        console.error('Google login error:', err);
        Swal.fire({
          icon: 'error',
          title: t('messages.loginFailed'),
          text: err.message || t('messages.socialLoginFailed'),
        });
      } finally {
        setLoading(false);
      }
    },
    onError: (error) => {
      console.error('Google Login Failed:', error);
      Swal.fire({ icon: 'error', title: 'Login Failed', text: 'Google authentication failed.' });
    },
  });

  return (
    <Button
      type="button"
      variant="secondary"
      onClick={() => googleLoginHandler()}
      className="flex-1 flex items-center justify-center gap-3 !bg-[rgb(var(--color-surface))] !text-[rgb(var(--color-text))] !border-[rgb(var(--color-border))] hover:!bg-[rgb(var(--color-background))] hover:!border-[rgb(var(--color-primary)/0.3)] hover:shadow-sm transition-all duration-300 py-2.5 rounded-xl h-11"
    >
      <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
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
      <span className="font-medium">{t('login.google')}</span>
    </Button>
  );
};

const MicrosoftButton = ({ setLoading, socialLogin, router, t }) => {
  const { instance } = useMsal();

  const handleMicrosoftLogin = async () => {
    setLoading(true);
    try {
      const loginResponse = await instance.loginPopup(loginRequest);

      // Send idToken and accessToken to backend
      const result = await socialLogin(
        'azure-ad',
        loginResponse.idToken,
        loginResponse.accessToken
      );

      if (result.requires2FA) {
        router.push(`/verify-otp?provider=azure-ad`);
        return;
      }

      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: t('messages.signinSuccess'),
        showConfirmButton: false,
        timer: 2000,
      });
      router.push('/dashboard');
    } catch (err) {
      // Handle user cancel or other errors
      if (err.name !== 'BrowserAuthError' || !err.message.includes('user_cancelled')) {
        console.error('Microsoft login error:', err);
        Swal.fire({
          icon: 'error',
          title: t('messages.loginFailed'),
          text: err.message || t('messages.socialLoginFailed'),
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="secondary"
      onClick={handleMicrosoftLogin}
      className="flex-1 flex items-center justify-center gap-3 !bg-[rgb(var(--color-surface))] !text-[rgb(var(--color-text))] !border-[rgb(var(--color-border))] hover:!bg-[rgb(var(--color-background))] hover:!border-[rgb(var(--color-primary)/0.3)] hover:shadow-sm transition-all duration-300 py-2.5 rounded-xl h-11"
    >
      <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
        <path fill="#f25022" d="M1 1h9v9H1z" />
        <path fill="#7fbb00" d="M11 1h9v9h-9z" />
        <path fill="#00a1f1" d="M1 11h9v9H1z" />
        <path fill="#ffb900" d="M11 11h9v9h-9z" />
      </svg>
      <span className="font-medium">{t('login.microsoft')}</span>
    </Button>
  );
};

export default function SocialLoginButtons({ setLoading }) {
  const { t } = useTranslation('auth');
  const { socialLogin } = useAuth();
  const router = useRouter();

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const azureClientId = process.env.NEXT_PUBLIC_AZURE_AD_CLIENT_ID;

  return (
    <div className="w-full flex flex-row gap-4 mt-2">
      {googleClientId && (
        <GoogleButton setLoading={setLoading} socialLogin={socialLogin} router={router} t={t} />
      )}
      {azureClientId && (
        <MicrosoftButton setLoading={setLoading} socialLogin={socialLogin} router={router} t={t} />
      )}
    </div>
  );
}
