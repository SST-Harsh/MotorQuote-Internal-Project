import { Plus_Jakarta_Sans } from 'next/font/google';
import { AuthProvider } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';
import { NotificationProvider } from '../context/NotificationContext';
import { LanguageProvider } from '../context/LanguageContext';
import { PreferenceProvider } from '../context/PreferenceContext';
import { QueryProvider } from '../lib/react-query/QueryProvider';
import ErrorBoundary from '../components/common/ErrorBoundary';
import SocialProviders from '../components/common/SocialProviders';
import './globals.css';
import Script from 'next/script';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  display: 'swap',
});

export default async function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head></head>
      <body className={`${plusJakarta.variable} font-sans bg-[#F5F5F7]`}>
        <ErrorBoundary>
          <QueryProvider>
            <ThemeProvider>
              <AuthProvider>
                <PreferenceProvider>
                  <SocialProviders>
                    <NotificationProvider>
                      <LanguageProvider>
                        {children}
                        <div id="modal-root"></div>
                      </LanguageProvider>
                    </NotificationProvider>
                  </SocialProviders>
                </PreferenceProvider>
              </AuthProvider>
            </ThemeProvider>
          </QueryProvider>
        </ErrorBoundary>
        <Script
          id="theme-script"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const storedTheme = localStorage.getItem('theme') || 'light';
                  document.documentElement.setAttribute('data-theme', storedTheme);
                } catch (e) {}
              })();
            `,
          }}
        />
      </body>
    </html>
  );
}
