/**
 * Dual-Theme Engine (Editorial Light Mode + Obsidian Luxury Dark Mode)
 * Inspired by Linear, Apple Wallet, and Copilot Money Dark Mode.
 * Persists user preference to localStorage and updates document root data-theme attribute.
 */

import { useState, useEffect } from 'react';

const STORAGE_KEY = 'finsense_theme';

const getInitialTheme = () => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
    // Default to dark mode for luxury fintech feel
    return 'dark';
  }
  return 'dark';
};

let currentTheme = getInitialTheme();
const listeners = new Set();

const applyThemeToDOM = (theme) => {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      document.body.classList.add('dark-theme');
      document.body.classList.remove('light-theme');
    } else {
      document.body.classList.add('light-theme');
      document.body.classList.remove('dark-theme');
    }
  }
};

// Apply on initial script load
if (typeof window !== 'undefined') {
  applyThemeToDOM(currentTheme);
}

export function setGlobalTheme(theme) {
  if (theme !== 'dark' && theme !== 'light') return;
  currentTheme = theme;
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, theme);
  }
  applyThemeToDOM(theme);
  listeners.forEach((fn) => fn(currentTheme));
}

export function toggleGlobalTheme() {
  const next = currentTheme === 'dark' ? 'light' : 'dark';
  setGlobalTheme(next);
  return next;
}

export function getGlobalTheme() {
  return currentTheme;
}

export function useTheme() {
  const [theme, setThemeState] = useState(currentTheme);

  useEffect(() => {
    const handler = (newTheme) => setThemeState(newTheme);
    listeners.add(handler);
    return () => listeners.delete(handler);
  }, []);

  return {
    theme,
    isDark: theme === 'dark',
    toggleTheme: toggleGlobalTheme,
    setTheme: setGlobalTheme,
  };
}
