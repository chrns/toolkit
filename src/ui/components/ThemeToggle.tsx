import { useEffect, useState } from 'preact/hooks';
import { DarkThemeIcon } from '@/ui/icons/DarkThemeIcon';
import { LightThemeIcon } from '@/ui/icons/LightThemeIcon';

function getInitialTheme(): 'light' | 'dark' {
  try {
    const stored = localStorage.getItem('theme');
    if (stored === 'light' || stored === 'dark') return stored;
    if (window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
  } catch {}
  return 'dark';
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>(getInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('theme', theme);
    } catch {}
    (root as any).style.colorScheme = theme;
  }, [theme]);

  return (
    <button
      class="button ghost"
      aria-label="Toggle color theme"
      onClick={() => setTheme(t => (t === 'light' ? 'dark' : 'light'))}
      title={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
    >
      {theme === 'light' ? ( <DarkThemeIcon /> ) : ( <LightThemeIcon /> )}
    </button>
  );
}