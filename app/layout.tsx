import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'N314',
  description: 'Stock Intelligence Platform',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-zinc-950 text-zinc-100 min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}