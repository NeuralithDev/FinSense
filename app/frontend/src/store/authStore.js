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

export function loginUser({ email, password }) {
  const user = {
    id: 'user_001',
    email,
    name: email.split('@')[0].replace('.', ' ').replace(/^./, (s) => s.toUpperCase()),
    persona: 'Discretionary Builder',
    tier: 'PRO',
    authenticatedAt: new Date().toISOString(),
  };
  currentUser = user;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } catch (e) {}
  notify();
  return user;
}

export function signupUser({ name, email, password }) {
  const user = {
    id: 'user_' + Math.random().toString(36).substr(2, 9),
    email,
    name: name || email.split('@')[0],
    persona: 'New Explorer',
    tier: 'EARLY_ACCESS_BETA',
    authenticatedAt: new Date().toISOString(),
  };
  currentUser = user;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } catch (e) {}
  notify();
  return user;
}

export function logoutUser() {
  currentUser = null;
  try {
    localStorage.removeItem(STORAGE_KEY);
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
