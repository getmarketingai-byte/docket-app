import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import Script from 'next/script';
import { ServiceWorkerRegister } from '@/components/pwa/service-worker-register';
import { InstallPrompt as PWAInstallPrompt } from '@/components/pwa/install-prompt';
import { ThemeProvider } from '@/components/theme-provider';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'Docket — AI Receipt Scanner & Expense Tracker for Australian Taxpayers',
    template: '%s | Docket',
  },
  description:
    'AI-powered receipt intelligence for the Australian market. Scan receipts, track tax-deductible expenses, and export clean reports for your accountant.',
  metadataBase: new URL('https://docket.com.au'),
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Docket',
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/dashboard"
    >
      <html
        lang="en"
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col">
          <ThemeProvider>
            {children}
            <PWAInstallPrompt />
            <ServiceWorkerRegister />
          </ThemeProvider>
          <Analytics />
          <SpeedInsights />
          <Script
            src="https://www.googletagmanager.com/gtag/js?id=G-2Q8MGZ47BC"
            strategy="afterInteractive"
          />
          <Script id="gtag-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-2Q8MGZ47BC');
            `}
          </Script>
        </body>
      </html>
    </ClerkProvider>
  );
}
