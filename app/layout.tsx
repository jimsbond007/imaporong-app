import './globals.css';

import type { Metadata, Viewport } from 'next';
import { Lato, Pixelify_Sans } from 'next/font/google';
import imapMark from '@/assets/illustrations/imap.svg';

const pixelSans = Pixelify_Sans({
  variable: '--font-pixel-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const lato = Lato({
  variable: '--font-lato',
  subsets: ['latin'],
  weight: ['400', '700', '900'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'iMaporong · Barangay Maporong community portal',
    template: '%s · iMaporong',
  },
  description:
    'The online front desk of Barangay Maporong, Oas, Albay. Request documents, follow your request slip, and keep your resident record in one place.',
  applicationName: 'iMaporong',
  icons: {
    icon: imapMark.src,
    apple: imapMark.src,
  },
};

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#386B48',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${pixelSans.variable} ${lato.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-canvas text-forest">{children}</body>
    </html>
  );
}
