import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { ToastProvider } from '@/components/ui/Toast';

export const metadata: Metadata = {
  title: 'Spendly — Interactive Personal Finance Dashboard & Simulator',
  description:
    'Track income, manage expenses, create budgets, monitor savings goals, and simulate future financial scenarios with 100% private client-side storage.',
  keywords: [
    'personal finance',
    'financial simulator',
    'budget tracker',
    'compound interest calculator',
    'savings goals',
    'cash flow dashboard',
    'spendly',
    'indonesian rupiah finance',
  ],
  authors: [{ name: 'Spendly' }],
  openGraph: {
    title: 'Spendly — Interactive Personal Finance & Simulator',
    description:
      'Manage budgets, monitor savings goals, and model future compound wealth projections.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const storedTheme = localStorage.getItem('spendly_theme');
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (storedTheme === 'dark' || ((!storedTheme || storedTheme === 'system') && prefersDark)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 dark:bg-[#090d16] dark:text-slate-100 transition-colors duration-150">
        <ThemeProvider>
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
