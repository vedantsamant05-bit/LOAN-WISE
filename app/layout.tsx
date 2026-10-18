import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from '@/components/shell/Sidebar';
import { Header } from '@/components/shell/Header';
import { ThemeProvider } from '@/components/shell/ThemeProvider';
import { NavigationProvider } from '@/components/shell/NavigationContext';

export const metadata: Metadata = {
  title: 'LoanWise — Credit Policy & Decisioning Engine',
  description:
    'Explainable digital lending decisioning engine with configurable credit policy, ML risk scorecard, and safe dependency fallbacks.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Geist:wght@100..900&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
          rel="stylesheet"
        />
        {/* Prevent flash of wrong theme — reads localStorage before first paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var t = localStorage.getItem('loanwise-theme');
                if (t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                }
              } catch(e) {}
            `,
          }}
        />
      </head>
      <body className="bg-page text-primary font-sans antialiased min-h-screen">
        <ThemeProvider>
          <NavigationProvider>
            <Sidebar />
            <div className="lg:pl-64 flex flex-col min-h-screen transition-[padding] duration-300">
              <Header />
              <main className="relative pt-16 flex-1 px-3 sm:px-6 lg:px-gutter py-4 sm:py-6 lg:py-space-lg max-w-full overflow-x-hidden">
                {children}
              </main>
            </div>
          </NavigationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

