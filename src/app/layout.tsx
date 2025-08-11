import './globals.css';
import type { Metadata, Viewport } from 'next';
import ClientBody from './ClientBody';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'SkyStage | Design and book the drone show of your dreams',
  description: 'Create spectacular drone light shows with our advanced formation designer, AI-powered generator, and comprehensive booking platform.',
  keywords: 'drone show, drone light show, aerial display, formation design, skybrush, DSS, blender',
  authors: [{ name: 'SkyStage' }],
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/assets/icons/icon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/assets/icons/icon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/assets/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/assets/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://skystage.com',
    siteName: 'SkyStage',
    title: 'SkyStage - Drone Show Platform',
    description: 'Design and book the drone show of your dreams',
    images: [
      {
        url: 'https://skystage.com/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'SkyStage Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SkyStage - Drone Show Platform',
    description: 'Design and book the drone show of your dreams',
    images: ['https://skystage.com/twitter-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#1a49a7',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="application-name" content="SkyStage" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="SkyStage" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />

        <link rel="apple-touch-icon" href="/assets/icons/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/assets/icons/icon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/assets/icons/icon-16x16.png" />

        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(registration) {
                      console.log('ServiceWorker registration successful');
                    },
                    function(err) {
                      console.log('ServiceWorker registration failed: ', err);
                    }
                  );
                });
              }
            `,
          }}
        />
      </head>
      <ClientBody>
        <Header />
        <main className="min-h-screen">
          {children}
        </main>
        <Footer />
      </ClientBody>
    </html>
  );
}
