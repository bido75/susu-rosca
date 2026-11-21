import type { Metadata } from 'next';
import './globals.css';
import SentryInit from '@/components/SentryInit';

export const metadata: Metadata = {
  title: 'SusuFlow | Save together. Grow together.',
  description: 'Transparent community rotating savings circles',
  manifest: '/manifest.webmanifest',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SentryInit />
        {children}
      </body>
    </html>
  );
}