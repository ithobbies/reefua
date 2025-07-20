
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import AppLayout from '@/components/layout/app-layout';
import { AuthProvider } from '@/context/auth-context';
import { ChatProvider } from '@/context/chat-context';
import { GlobalChatWidget } from '@/components/chat/global-chat-widget';

export const metadata: Metadata = {
  title: 'ReefUA - Аукціон морської акваріумістики',
  description: 'Онлайн-аукціон та маркетплейс для українських морських акваріумістів.',
};

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
      </head>
      <body className="font-body antialiased">
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
