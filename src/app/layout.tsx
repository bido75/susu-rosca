import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SusuFlow | Save together. Grow together.',
  description: 'Transparent community rotating savings circles',
  manifest: '/manifest.webmanifest',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
