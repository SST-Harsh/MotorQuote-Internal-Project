import { Public_Sans, Racing_Sans_One } from 'next/font/google';
import { AuthProvider } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';
import { NotificationProvider } from '../context/NotificationContext';
import { PreferenceProvider } from '../context/PreferenceContext';
import { ConfigProvider } from '../context/ConfigContext';
import { QueryProvider } from '../lib/react-query/QueryProvider';
import ErrorBoundary from '../components/common/ErrorBoundary';
import SocialProviders from '../components/common/SocialProviders';
import './globals.css';
import Script from 'next/script';

const publicSans = Public_Sans({
  subsets: ['latin'],
  variable: '--font-public-sans',
  display: 'swap',
});

const racingSansOne = Racing_Sans_One({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-racing-sans',
  display: 'swap',
});

export default async function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head></head>
      <body className={`${publicSans.variable} ${racingSansOne.variable}`}>
        <ErrorBoundary>
          <QueryProvider>
            <AuthProvider>
              <ConfigProvider>
                <PreferenceProvider>
                  <ThemeProvider>
                    <SocialProviders>
                      <NotificationProvider>
                        {children}
                        <div id="modal-root"></div>
                      </NotificationProvider>
                    </SocialProviders>
                  </ThemeProvider>
                </PreferenceProvider>
              </ConfigProvider>
            </AuthProvider>
          </QueryProvider>
        </ErrorBoundary>
        <Script
          id="theme-script"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const path = window.location.pathname;
                  const isAuth = path === '/' || 
                                path.startsWith('/login') || 
                                path.startsWith('/forgot-password') || 
                                path.startsWith('/verify-otp') || 
                                path.startsWith('/reset-password');

                  if (isAuth) {
                    document.documentElement.setAttribute('data-theme', 'light');
                    return;
                  }

                  const saved = localStorage.getItem('user_preferences');
                  const theme = saved ? JSON.parse(saved).theme : 'light';
                  document.documentElement.setAttribute('data-theme', theme || 'light');
                } catch (e) {}
              })();
            `,
          }}
        />
      </body>
    </html>
  );
}
