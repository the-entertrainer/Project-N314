import type { Metadata, Viewport } from 'next';
import { Suspense } from 'react';
import './globals.css';
import AppRoot from '../components/AppRoot';

export const metadata: Metadata = {
  title: 'N314 — Stock Intelligence',
  description: 'Real-time Indian market insights, stock screener, AI advisor, and portfolio tracking.',
  icons: { icon: '/favicon.svg' },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'N314',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#09090b',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark overflow-x-hidden">
      <body className="app-gradient text-zinc-100 h-[100dvh] w-full max-w-[100vw] overflow-x-hidden overflow-y-hidden antialiased">
        <Suspense fallback={null}>
          <AppRoot>{children}</AppRoot>
        </Suspense>
      </body>
    </html>
  );
}