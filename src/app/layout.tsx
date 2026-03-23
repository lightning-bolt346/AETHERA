import type { Metadata } from 'next';
import './globals.css';
import ClientLayout from '@/components/ui/ClientLayout';

export const metadata: Metadata = {
  title: 'AETHERA — Play the Universe',
  description:
    'An immersive browser music playground. Explore instruments, compose in real-time, and play the universe.',
  keywords: ['music', 'interactive', 'browser', 'synthesizer', 'piano', 'drums', 'guitar'],
  authors: [{ name: 'AETHERA' }],
  openGraph: {
    title: 'AETHERA — Play the Universe',
    description: 'An immersive browser music playground',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#07070F" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;700&family=DM+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ background: 'var(--color-void)', cursor: 'none' }}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
