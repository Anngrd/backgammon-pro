'use client';

import { Navbar } from './Navbar';
import { LangProvider } from '@/hooks/useLang';
import { ThemeProvider, useTheme } from '@/hooks/useTheme';
import { AuthProvider } from '@/hooks/useAuth';

function Shell({ children }: { children: React.ReactNode }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className={theme === 'light'
      ? 'bg-gray-100 text-gray-900 min-h-screen'
      : 'bg-gray-950 text-white min-h-screen'
    }>
      <Navbar onToggleTheme={toggleTheme} />
      <main>{children}</main>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <LangProvider>
      <ThemeProvider>
        <AuthProvider>
          <Shell>{children}</Shell>
        </AuthProvider>
      </ThemeProvider>
    </LangProvider>
  );
}
