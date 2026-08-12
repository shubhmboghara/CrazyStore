import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ToastProvider } from '@/components/Toast';

export const metadata: Metadata = {
  title: 'CrazyStore - Android Apps Showcase & Reviews',
  description: 'Showcase open-source Android apps built with Kotlin & Jetpack Compose. Download APKs and leave verified user reviews.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body suppressHydrationWarning className="bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 antialiased selection:bg-purple-500 selection:text-white">
        <ThemeProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
