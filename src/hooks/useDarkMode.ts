import { useEffect, useState } from 'react';

const DARK_MODE_KEY = 'google_ambassador_dark_mode';

function readInitialDarkMode(): boolean {
  try {
    const stored = localStorage.getItem(DARK_MODE_KEY);
    if (stored !== null) return stored === 'true';
  } catch {}
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
}

export function useDarkMode() {
  const [isDarkMode, setIsDarkMode] = useState(readInitialDarkMode);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    try {
      localStorage.setItem(DARK_MODE_KEY, String(isDarkMode));
    } catch {}
  }, [isDarkMode]);

  return { isDarkMode, toggleDarkMode: () => setIsDarkMode((prev) => !prev) };
}
