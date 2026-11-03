/**
 * FinSense Theme Engine (Institutional Crisp Light Mode)
 * Ultra-clean, high-trust fintech palette (Stripe / Wise / Ramp / Apple Wallet).
 * Enforces clean, high-contrast typography and pristine surfaces.
 */

import { useState, useEffect } from 'react';

const STORAGE_KEY = 'finsense_theme';

const applyThemeToDOM = () => {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', 'light');
    document.body.classList.add('light-theme');
    document.body.classList.remove('dark-theme');
  }
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.setItem(STORAGE_KEY, 'light');
    } catch (_) {}
  }
};

// Apply on initial script load
if (typeof window !== 'undefined') {
  applyThemeToDOM();
}

export function setGlobalTheme() {
  applyThemeToDOM();
}

export function toggleGlobalTheme() {
  applyThemeToDOM();
  return 'light';
}

export function getGlobalTheme() {
  return 'light';
}

export function useTheme() {
  const [theme, setThemeState] = useState('light');

  useEffect(() => {
    applyThemeToDOM();
    setThemeState('light');
  }, []);

  return {
    theme: 'light',
    isDark: false,
    toggleTheme: () => 'light',
    setTheme: () => {},
  };
}
