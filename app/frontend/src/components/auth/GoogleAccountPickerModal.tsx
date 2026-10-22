import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  User, 
  Plus, 
  ArrowRight, 
  Check, 
  Sparkles, 
  ShieldCheck, 
  Key, 
  ExternalLink,
  ChevronDown,
  ChevronUp
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

const DEFAULT_ACCOUNTS = [
  {
    name: 'Mudit Sharma',
    email: 'mudit.sharma@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
  },
  {
    name: 'FinSense Preview',
    email: 'user.preview@gmail.com',
    avatar: null,
  },
];

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
  const [customMode, setCustomMode] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [customError, setCustomError] = useState('');
  const [showConfig, setShowConfig] = useState(false);

  // Client ID handling
  const envClientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || '';
  const [clientId, setClientId] = useState(() => {
    return localStorage.getItem('FINSENSE_GOOGLE_CLIENT_ID') || envClientId;
  });

  const [hasRealGsiLoaded, setHasRealGsiLoaded] = useState(false);
  const gsiButtonRef = useRef<HTMLDivElement>(null);

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

    return () => {
      // Keep script active
    };
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

  const completeLogin = (account: { email: string; name: string; avatar?: string; provider: string }) => {
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

  const handleSelectPredefined = (acc: (typeof DEFAULT_ACCOUNTS)[0]) => {
    completeLogin({
      email: acc.email,
      name: acc.name,
      avatar: acc.avatar || undefined,
      provider: 'google',
    });
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail.trim() || !customEmail.includes('@')) {
      setCustomError('Please enter a valid Gmail address (e.g. name@gmail.com)');
      return;
    }

    const nameToUse = customName.trim() || customEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

    completeLogin({
      email: customEmail.trim(),
      name: nameToUse,
      avatar: undefined,
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
          maxWidth: '440px',
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
            <GoogleIcon size={32} />
          </div>

          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#111827', margin: '0 0 6px', letterSpacing: '-0.01em' }}>
            Sign in with Google
          </h3>
          <p style={{ fontSize: '0.84rem', color: '#6B7280', margin: 0 }}>
            Choose an account to continue to <strong>FinSense</strong>
          </p>
        </div>

        {/* Real Google GSI Native Button if Client ID Active */}
        {clientId && (
          <div style={{ padding: '0 28px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div ref={gsiButtonRef} style={{ width: '100%', display: 'flex', justifyContent: 'center' }} />
            <div style={{ display: 'flex', alignItems: 'center', width: '100%', margin: '14px 0 6px' }}>
              <div style={{ flex: 1, height: '1px', background: '#E5E7EB' }} />
              <span style={{ padding: '0 10px', fontSize: '0.72rem', color: '#9CA3AF', textTransform: 'uppercase' }}>
                or pick instant account
              </span>
              <div style={{ flex: 1, height: '1px', background: '#E5E7EB' }} />
            </div>
          </div>
        )}

        {/* Content Body */}
        <div style={{ padding: '0 24px 20px', flex: 1 }}>
          {!customMode ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* Account List */}
              {DEFAULT_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  onClick={() => handleSelectPredefined(acc)}
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
                        background: '#0D9488',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                      }}
                    >
                      {acc.name.charAt(0)}
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

                  <ArrowRight size={15} color="#9CA3AF" />
                </button>
              ))}

              {/* Use Another Account Button */}
              <button
                onClick={() => setCustomMode(true)}
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
                  marginTop: '4px',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F9FAFB')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FFFFFF')}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: '#F3F4F6',
                    color: '#6B7280',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <User size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#111827' }}>
                    Use another account
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                    Enter any personal or work Gmail address
                  </div>
                </div>
                <Plus size={16} color="#6B7280" />
              </button>
            </div>
          ) : (
            /* Custom Gmail Form */
            <form onSubmit={handleCustomSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
                  Gmail Address
                </label>
                <input
                  type="email"
                  placeholder="e.g. yourname@gmail.com"
                  value={customEmail}
                  onChange={(e) => {
                    setCustomEmail(e.target.value);
                    setCustomError('');
                  }}
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: customError ? '1px solid #EF4444' : '1px solid #D1D5DB',
                    fontSize: '0.88rem',
                    color: '#111827',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                {customError && (
                  <div style={{ fontSize: '0.72rem', color: '#EF4444', marginTop: '4px' }}>
                    {customError}
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
                  Full Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mudit Sharma"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #D1D5DB',
                    fontSize: '0.88rem',
                    color: '#111827',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={() => setCustomMode(false)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #D1D5DB',
                    background: '#FFFFFF',
                    color: '#4B5563',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Back
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 2,
                    padding: '10px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#1A73E8',
                    color: '#FFFFFF',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Continue to FinSense
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
                fontSize: '0.72rem',
                color: '#6B7280',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Key size={12} />
                <span>Google Cloud Client ID Settings</span>
              </div>
              {showConfig ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>

            {showConfig && (
              <div style={{ marginTop: '8px', padding: '10px', background: '#F9FAFB', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
                <div style={{ fontSize: '0.72rem', color: '#4B5563', marginBottom: '6px' }}>
                  Paste a real Google OAuth 2.0 Web Client ID to trigger Google's official popup:
                </div>
                <input
                  type="text"
                  placeholder="apps.googleusercontent.com Client ID"
                  value={clientId}
                  onChange={(e) => {
                    const val = e.target.value.trim();
                    setClientId(val);
                    localStorage.setItem('FINSENSE_GOOGLE_CLIENT_ID', val);
                  }}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    borderRadius: '6px',
                    border: '1px solid #D1D5DB',
                    fontSize: '0.72rem',
                    fontFamily: 'monospace',
                    boxSizing: 'border-box',
                  }}
                />
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
            fontSize: '0.7rem',
            color: '#6B7280',
            lineHeight: 1.4,
          }}
        >
          To continue, Google will share your name, email address, language preference, and profile picture with FinSense. See FinSense's Privacy Policy.
        </div>
      </motion.div>
    </div>
  );
}
