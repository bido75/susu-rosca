import type { Metadata, Viewport } from 'next';
import './globals.css';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';
import InstallPWA from '@/components/InstallPWA';
import SentryUserContext from '@/components/SentryUserContext';

export const metadata: Metadata = {
  title: 'SusuFlow | Save together. Grow together.',
  description: 'Transparent community rotating savings circles',
  applicationName: 'SusuFlow',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'SusuFlow',
    statusBarStyle: 'default',
  },
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/apple-touch-icon.png',
  },
  other: {
    // iOS Safari reads this (not `mobile-web-app-capable`) to launch fullscreen
    // from an "Add to Home Screen" tile.
    'apple-mobile-web-app-capable': 'yes',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#059669',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <ServiceWorkerRegister />
        <InstallPWA />
        <SentryUserContext />
      </body>
    </html>
  );
}