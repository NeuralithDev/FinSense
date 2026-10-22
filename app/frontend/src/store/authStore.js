/**
 * FinSense Authentication Store
 * Mock auth session layer with clean drop-in interface for Supabase/Auth.js.
 */

import { useState, useEffect } from 'react';

const STORAGE_KEY = 'finsense_auth_user';

let currentUser = null;
const authListeners = new Set();

try {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    currentUser = JSON.parse(saved);
  }
} catch (e) {
  // localStorage may be disabled
}

function notify() {
  authListeners.forEach((fn) => fn(currentUser));
}

export function loginUser({ email, password, name, avatar, provider = 'credentials' }) {
  const derivedName = name || (email ? email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (s) => s.toUpperCase()) : 'FinSense User');
  const user = {
    id: 'user_' + Math.random().toString(36).substr(2, 9),
    email,
    name: derivedName,
    avatar: avatar || null,
    provider,
    persona: 'Discretionary Builder',
    tier: 'PRO',
    authenticatedAt: new Date().toISOString(),
  };
  currentUser = user;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('finsense_auth_changed', { detail: user }));
    }
  } catch (e) {}
  notify();
  return user;
}

export function signupUser({ name, email, password, avatar, provider = 'credentials' }) {
  const derivedName = name || (email ? email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (s) => s.toUpperCase()) : 'New Explorer');
  const user = {
    id: 'user_' + Math.random().toString(36).substr(2, 9),
    email,
    name: derivedName,
    avatar: avatar || null,
    provider,
    persona: 'New Explorer',
    tier: 'EARLY_ACCESS_BETA',
    authenticatedAt: new Date().toISOString(),
  };
  currentUser = user;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('finsense_auth_changed', { detail: user }));
    }
  } catch (e) {}
  notify();
  return user;
}

export function logoutUser() {
  currentUser = null;
  try {
    localStorage.removeItem(STORAGE_KEY);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('finsense_auth_changed', { detail: null }));
    }
  } catch (e) {}
  notify();
}

export function useAuth() {
  const [user, setUser] = useState(currentUser);

  useEffect(() => {
    const handler = (u) => setUser(u);
    authListeners.add(handler);
    return () => authListeners.delete(handler);
  }, []);

  return {
    user,
    isAuthenticated: !!user,
    login: loginUser,
    signup: signupUser,
    logout: logoutUser,
  };
}
