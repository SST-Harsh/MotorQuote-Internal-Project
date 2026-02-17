import { AuthProvider } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';
import { NotificationProvider } from '../context/NotificationContext';
import './globals.css';

export const metadata = {
  title: 'MotorQuote – Modern Vehicle Quotation Platform',
  description:
    'MotorQuote streamlines the entire vehicle quotation workflow, giving dealers, sellers, and admins a unified digital experience to create, manage, and deliver quotes faster with full transparency.',
  icons: {
    icon: '/assets/motorQuote.png',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default async function RootLayout({ children }) {
  return (
    <html lang="en">
      <head></head>
      <body>
        <script
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
        <ThemeProvider>
          <AuthProvider>
            <NotificationProvider>{children}</NotificationProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
