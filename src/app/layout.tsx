
import type { Metadata } from 'next';
import Script from 'next/script';
import { Suspense } from 'react';

import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import AppLayout from '@/components/layout/app-layout';
import { AuthProvider } from '@/context/auth-context';
import { ChatProvider } from '@/context/chat-context';
import { GlobalChatWidget } from '@/components/chat/global-chat-widget';
import  Analytics  from '@/components/analytics/analytics';

export const metadata: Metadata = {
  title: 'ReefUA - Аукціон морської акваріумістики',
  description: 'Онлайн-аукціон та маркетплейс для українських морських акваріумістів.',
};

const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uk">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700&display=swap" rel="stylesheet" />
        
        {/* Google Analytics Scripts */}
        <Script
          strategy="afterInteractive"
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
        />
        <Script
          id="gtag-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_TRACKING_ID}', {
                page_path: window.location.pathname,
              });
            `,
          }}
        />
      </head>
      <body className="font-body antialiased">
        <Suspense>
           <Analytics />
        </Suspense>
        <AuthProvider>
          <ChatProvider>
            <AppLayout>{children}</AppLayout>
            <GlobalChatWidget />
          </ChatProvider>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
