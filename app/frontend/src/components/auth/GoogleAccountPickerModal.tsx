import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  User, 
  Plus, 
  ArrowRight, 
  ShieldCheck, 
  Key, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Trash2,
  CheckCircle2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../../store/authStore';

// Google Multicolor G SVG
export function GoogleIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        fill="#EA4335"
      />
    </svg>
  );
}

interface SavedGoogleAccount {
  email: string;
  name: string;
  avatar?: string;
  lastUsed?: string;
}

const REMEMBERED_ACCOUNTS_KEY = 'FINSENSE_REMEMBERED_GOOGLE_ACCOUNTS';

export default function GoogleAccountPickerModal({
  isOpen,
  onClose,
  onAccountAuthenticated,
}: {
  isOpen: boolean;
  onClose: () => void;
  onAccountAuthenticated: (account: { email: string; name: string; avatar?: string; provider: string }) => void;
}) {
  const { login } = useAuth();
  
  // Stored recent accounts
  const [savedAccounts, setSavedAccounts] = useState<SavedGoogleAccount[]>(() => {
    try {
      const raw = localStorage.getItem(REMEMBERED_ACCOUNTS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [customError, setCustomError] = useState('');
  const [showConfig, setShowConfig] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Client ID handling
  const envClientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || '';
  const [clientId, setClientId] = useState(() => {
    return localStorage.getItem('FINSENSE_GOOGLE_CLIENT_ID') || envClientId;
  });

  const [hasRealGsiLoaded, setHasRealGsiLoaded] = useState(false);
  const gsiButtonRef = useRef<HTMLDivElement>(null);

  // If no saved accounts exist, default to enter mode
  useEffect(() => {
    if (savedAccounts.length === 0) {
      setIsAddingNew(true);
    }
  }, [savedAccounts.length]);

  // Load Google Identity Services SDK dynamically
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if ((window as any).google?.accounts?.id) {
      setHasRealGsiLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setHasRealGsiLoaded(true);
    };
    document.body.appendChild(script);
  }, []);

  // Initialize GSI if client ID is valid
  useEffect(() => {
    if (!isOpen || !hasRealGsiLoaded || !clientId || !(window as any).google?.accounts?.id) return;

    try {
      (window as any).google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGsiCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      if (gsiButtonRef.current) {
        gsiButtonRef.current.innerHTML = '';
        (window as any).google.accounts.id.renderButton(gsiButtonRef.current, {
          theme: 'outline',
          size: 'large',
          width: 320,
          text: 'signin_with',
          shape: 'rectangular',
        });
      }
    } catch (e) {
      console.warn('Google GSI initialization error:', e);
    }
  }, [isOpen, hasRealGsiLoaded, clientId]);

  const handleGsiCredentialResponse = (response: any) => {
    if (!response || !response.credential) return;

    try {
      const base64Url = response.credential.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const payload = JSON.parse(jsonPayload);

      completeLogin({
        email: payload.email,
        name: payload.name || payload.email.split('@')[0],
        avatar: payload.picture,
        provider: 'google',
      });
    } catch (e) {
      console.error('Failed to parse Google OAuth JWT payload:', e);
    }
  };

  const saveRememberedAccount = (acc: SavedGoogleAccount) => {
    try {
      const updated = [
        acc,
        ...savedAccounts.filter((a) => a.email.toLowerCase() !== acc.email.toLowerCase()),
      ].slice(0, 5);
      setSavedAccounts(updated);
      localStorage.setItem(REMEMBERED_ACCOUNTS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Could not save remembered account:', e);
    }
  };

  const removeRememberedAccount = (e: React.MouseEvent, email: string) => {
    e.stopPropagation();
    const updated = savedAccounts.filter((a) => a.email.toLowerCase() !== email.toLowerCase());
    setSavedAccounts(updated);
    try {
      localStorage.setItem(REMEMBERED_ACCOUNTS_KEY, JSON.stringify(updated));
    } catch {}
    if (updated.length === 0) {
      setIsAddingNew(true);
    }
  };

  const completeLogin = (account: { email: string; name: string; avatar?: string; provider: string }) => {
    saveRememberedAccount({
      email: account.email,
      name: account.name,
      avatar: account.avatar,
      lastUsed: new Date().toISOString(),
    });

    login({
      email: account.email,
      name: account.name,
      avatar: account.avatar,
      provider: 'google',
      password: 'google-oauth-session',
    });

    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.6 },
    });

    onAccountAuthenticated(account);
  };

  const handleSelectAccount = (acc: SavedGoogleAccount) => {
    completeLogin({
      email: acc.email,
      name: acc.name,
      avatar: acc.avatar,
      provider: 'google',
    });
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail.trim() || !customEmail.includes('@')) {
      setCustomError('Please enter your valid Google email address (e.g. name@gmail.com)');
      return;
    }

    const email = customEmail.trim().toLowerCase();
    const derivedName = customName.trim() || email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

    completeLogin({
      email,
      name: derivedName,
      provider: 'google',
    });
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.18 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '460px',
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          boxShadow: '0 20px 40px -8px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          border: '1px solid #E2E8F0',
          color: '#1F2937',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div style={{ padding: '24px 28px 16px', textAlign: 'center', position: 'relative' }}>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#9CA3AF',
              padding: '6px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
            <GoogleIcon size={36} />
          </div>

          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', margin: '0 0 6px', letterSpacing: '-0.01em' }}>
            Sign in with Google
          </h3>
          <p style={{ fontSize: '0.84rem', color: '#6B7280', margin: 0, lineHeight: 1.4 }}>
            Link your Google account to access your personal <strong>FinSense</strong> cockpit.
          </p>
        </div>

        {/* Real Google GSI Native Button if Client ID Active */}
        {clientId && (
          <div style={{ padding: '0 28px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div ref={gsiButtonRef} style={{ width: '100%', display: 'flex', justifyContent: 'center' }} />
            <div style={{ display: 'flex', alignItems: 'center', width: '100%', margin: '14px 0 6px' }}>
              <div style={{ flex: 1, height: '1px', background: '#E5E7EB' }} />
              <span style={{ padding: '0 10px', fontSize: '0.72rem', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                or enter Google account
              </span>
              <div style={{ flex: 1, height: '1px', background: '#E5E7EB' }} />
            </div>
          </div>
        )}

        {/* Content Body */}
        <div style={{ padding: '0 24px 20px', flex: 1 }}>
          {/* Saved Accounts List (if available and not adding new) */}
          {!isAddingNew && savedAccounts.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '0.76rem', fontWeight: 600, color: '#4B5563', marginBottom: '4px' }}>
                Choose an account from this browser:
              </div>

              {savedAccounts.map((acc) => (
                <div
                  key={acc.email}
                  onClick={() => handleSelectAccount(acc)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: '1px solid #E5E7EB',
                    background: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                    boxSizing: 'border-box',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F9FAFB')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FFFFFF')}
                >
                  {acc.avatar ? (
                    <img
                      src={acc.avatar}
                      alt={acc.name}
                      style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: '#1A73E8',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        flexShrink: 0,
                      }}
                    >
                      {acc.name ? acc.name.charAt(0).toUpperCase() : 'G'}
                    </div>
                  )}

                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#111827' }}>
                      {acc.name}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {acc.email}
                    </div>
                  </div>

                  <button
                    onClick={(e) => removeRememberedAccount(e, acc.email)}
                    title="Remove saved account"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#9CA3AF',
                      cursor: 'pointer',
                      padding: '4px',
                      borderRadius: '4px',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#EF4444')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#9CA3AF')}
                  >
                    <Trash2 size={14} />
                  </button>

                  <ArrowRight size={15} color="#9CA3AF" />
                </div>
              ))}

              {/* Add Account Button */}
              <button
                onClick={() => setIsAddingNew(true)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: '1px dashed #CBD5E1',
                  background: '#F8FAFC',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                  marginTop: '4px',
                  boxSizing: 'border-box',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#F1F5F9';
                  e.currentTarget.style.borderColor = '#1A73E8';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#F8FAFC';
                  e.currentTarget.style.borderColor = '#CBD5E1';
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    color: '#1A73E8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Plus size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#111827' }}>
                    Use another Google account
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#6B7280' }}>
                    Connect any Google Workspace or personal Gmail
                  </div>
                </div>
              </button>
            </div>
          ) : (
            /* Direct Google Account Form */
            <form onSubmit={handleCustomSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                  Google / Gmail Address
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    placeholder="you@gmail.com or you@company.com"
                    value={customEmail}
                    onChange={(e) => {
                      setCustomEmail(e.target.value);
                      setCustomError('');
                    }}
                    autoFocus
                    style={{
                      width: '100%',
                      padding: '11px 12px',
                      borderRadius: '8px',
                      border: customError ? '1px solid #EF4444' : '1px solid #D1D5DB',
                      fontSize: '0.9rem',
                      color: '#111827',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                {customError && (
                  <div style={{ fontSize: '0.74rem', color: '#EF4444', marginTop: '4px' }}>
                    {customError}
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                  Account Display Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Alex Morgan"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 12px',
                    borderRadius: '8px',
                    border: '1px solid #D1D5DB',
                    fontSize: '0.9rem',
                    color: '#111827',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                {savedAccounts.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsAddingNew(false)}
                    style={{
                      flex: 1,
                      padding: '11px',
                      borderRadius: '8px',
                      border: '1px solid #D1D5DB',
                      background: '#FFFFFF',
                      color: '#4B5563',
                      fontSize: '0.86rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Saved Accounts
                  </button>
                )}
                <button
                  type="submit"
                  style={{
                    flex: 2,
                    padding: '11px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#1A73E8',
                    color: '#FFFFFF',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 2px 6px rgba(26, 115, 232, 0.3)',
                  }}
                >
                  <GoogleIcon size={18} />
                  <span>Link Google Account</span>
                </button>
              </div>
            </form>
          )}

          {/* Expandable Google Cloud Client ID Config */}
          <div style={{ marginTop: '16px', borderTop: '1px solid #F3F4F6', paddingTop: '12px' }}>
            <button
              type="button"
              onClick={() => setShowConfig(!showConfig)}
              style={{
                background: 'none',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '4px 0',
                cursor: 'pointer',
                fontSize: '0.74rem',
                color: '#6B7280',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Key size={13} color="#1A73E8" />
                <span>Google Cloud OAuth 2.0 Client ID (Production Mode)</span>
              </div>
              {showConfig ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>

            {showConfig && (
              <div style={{ marginTop: '8px', padding: '12px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.74rem', color: '#475569', lineHeight: 1.4, marginBottom: '8px' }}>
                  Paste a real Google Cloud OAuth 2.0 Web Client ID to trigger Google's native One-Tap and popup sign-in:
                </div>
                <input
                  type="text"
                  placeholder="e.g. 123456789-abc.apps.googleusercontent.com"
                  value={clientId}
                  onChange={(e) => {
                    const val = e.target.value.trim();
                    setClientId(val);
                    localStorage.setItem('FINSENSE_GOOGLE_CLIENT_ID', val);
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.75rem',
                    fontFamily: 'monospace',
                    boxSizing: 'border-box',
                    background: '#FFFFFF',
                  }}
                />
                <div style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: '6px' }}>
                  Or set <code>VITE_GOOGLE_CLIENT_ID</code> in your <code>.env</code> file.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Disclaimer */}
        <div
          style={{
            padding: '12px 24px',
            background: '#F9FAFB',
            borderTop: '1px solid #E5E7EB',
            fontSize: '0.72rem',
            color: '#6B7280',
            lineHeight: 1.4,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <ShieldCheck size={16} color="#0D9488" style={{ flexShrink: 0 }} />
          <span>
            FinSense enforces strict zero-knowledge account isolation. Your statement uploads and AI insights are cryptographically scoped to your Google identity.
          </span>
        </div>
      </motion.div>
    </div>
  );
}
