import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Compass,
  ArrowLeft,
  Lock,
  Mail,
  User,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Star,
  Quote
} from 'lucide-react';
import Input from '../primitives/Input';
import Button from '../primitives/Button';
import Badge from '../primitives/Badge';
import PasswordStrengthMeter, { calculatePasswordStrength } from './PasswordStrengthMeter';
import FallbackCard2D from '../3d/FallbackCard2D';
import { useAuth } from '../../store/authStore';
import GoogleAccountPickerModal, { GoogleIcon } from './GoogleAccountPickerModal';

export default function AuthScreen({ onBack, onSuccess, initialMode = 'signup' }) {
  const [mode, setMode] = useState(initialMode); // 'signin' | 'signup'
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(0);

  const { login, signup } = useAuth();

  const testimonials = [
    {
      quote: "Rocket Money sent me notifications after I already spent money. FinSense helped me spot impulse triggers before they happened.",
      author: "Elena Rostova",
      role: "Product Designer, San Francisco",
      rating: 5,
    },
    {
      quote: "Complete peace of mind. Smart Auto-Save automated my savings cushion without causing a single overdraft fee all year.",
      author: "Marcus Vance",
      role: "Architect, New York",
      rating: 5,
    },
    {
      quote: "The 30-day balance forecast gave me total confidence on when I could afford a major purchase without stressing my bills.",
      author: "Dr. Aris Thorne",
      role: "Biotech Scientist, Boston",
      rating: 5,
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [testimonials.length]);

  const validate = () => {
    const errs = {};
    if (mode === 'signup' && !name.trim()) {
      errs.name = 'Please provide your full legal name';
    }
    if (!email.trim() || !email.includes('@')) {
      errs.email = 'Please enter a valid business or personal email';
    }
    if (!password) {
      errs.password = 'Password is required';
    } else if (mode === 'signup') {
      const { score } = calculatePasswordStrength(password);
      if (score < 2) {
        errs.password = 'Please create a stronger password (at least 8 chars + numbers)';
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate() || isLoading) return;

    setIsLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 900));

      if (mode === 'signup') {
        signup({ name, email, password });
      } else {
        login({ email, password });
      }

      setIsSuccess(true);
      setTimeout(() => {
        if (onSuccess) onSuccess({ bypassOnboarding: mode === 'signin' });
      }, 900);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialAuth = async (provider) => {
    if (provider === 'Google') {
      setIsGoogleModalOpen(true);
      return;
    }
    setIsLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 600));
      login({ email: `demo.${provider.toLowerCase()}@finsense.ai`, password: 'mock-oauth-token', provider: provider.toLowerCase() });
      setIsSuccess(true);
      setTimeout(() => {
        if (onSuccess) onSuccess({ bypassOnboarding: true });
      }, 500);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        background: '#F8FAFC',
        color: '#0F172A',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* LEFT PANEL: Executive Titanium Card Showcase (50%) */}
      <div
        style={{
          flex: '1 1 50%',
          borderRight: '1px solid #E2E8F0',
          background: '#0F172A',
          color: '#FFFFFF',
          padding: '48px 40px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden',
        }}
        className="hidden lg:flex"
      >
        {/* Top Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: '#0D9488',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Compass size={20} color="#FFFFFF" />
          </div>
          <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
            FinSense<span style={{ color: '#0D9488' }}>.</span>
          </span>
        </div>

        {/* Center Card */}
        <div style={{ position: 'relative', width: '100%', margin: '20px 0' }}>
          <FallbackCard2D />
        </div>

        {/* Bottom Testimonial */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '20px 24px',
          }}
        >
          <div style={{ display: 'flex', gap: '3px', marginBottom: '10px' }}>
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={14} fill="#0D9488" color="#0D9488" />
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={quoteIndex}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
            >
              <p style={{ fontSize: '0.9rem', color: '#E2E8F0', fontStyle: 'italic', lineHeight: 1.5, marginBottom: '10px' }}>
                "{testimonials[quoteIndex].quote}"
              </p>
              <div>
                <strong style={{ fontSize: '0.84rem', color: '#FFFFFF' }}>{testimonials[quoteIndex].author}</strong>
                <div style={{ fontSize: '0.74rem', color: '#94A3B8' }}>{testimonials[quoteIndex].role}</div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Carousel dots */}
          <div style={{ display: 'flex', gap: '6px', marginTop: '14px' }}>
            {testimonials.map((_, i) => (
              <div
                key={i}
                onClick={() => setQuoteIndex(i)}
                style={{
                  width: quoteIndex === i ? '18px' : '6px',
                  height: '5px',
                  borderRadius: '3px',
                  background: quoteIndex === i ? '#0D9488' : 'rgba(255, 255, 255, 0.2)',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: Institutional Clean Auth Form (50%) */}
      <div
        style={{
          flex: '1 1 50%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '36px 24px',
          position: 'relative',
          background: '#FFFFFF',
          overflowY: 'auto',
        }}
      >
        <div style={{ width: '100%', maxWidth: '440px' }}>
          {/* Top Bar Navigation */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '28px',
            }}
          >
            <button
              onClick={onBack}
              style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                padding: '6px 14px',
                color: '#475569',
                fontSize: '0.82rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                fontWeight: 600,
                transition: 'all 0.15s ease',
              }}
            >
              <ArrowLeft size={14} />
              <span>Back to Overview</span>
            </button>

            <div className="lg:hidden" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  background: '#0D9488',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Compass size={15} color="#FFF" />
              </div>
              <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0F172A' }}>
                FinSense<span style={{ color: '#0D9488' }}>.</span>
              </span>
            </div>
          </div>

          {/* Mode Switcher */}
          <div
            style={{
              display: 'flex',
              background: '#F1F5F9',
              padding: '3px',
              borderRadius: '8px',
              border: '1px solid #E2E8F0',
              marginBottom: '24px',
            }}
          >
            <button
              onClick={() => {
                setMode('signup');
                setErrors({});
              }}
              style={{
                flex: 1,
                padding: '8px 0',
                border: 'none',
                background: mode === 'signup' ? '#FFFFFF' : 'transparent',
                color: mode === 'signup' ? '#0F172A' : '#64748B',
                fontWeight: 600,
                fontSize: '0.84rem',
                borderRadius: '6px',
                cursor: 'pointer',
                boxShadow: mode === 'signup' ? '0 1px 2px rgba(15, 23, 42, 0.08)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              Create Account
            </button>

            <button
              onClick={() => {
                setMode('signin');
                setErrors({});
              }}
              style={{
                flex: 1,
                padding: '8px 0',
                border: 'none',
                background: mode === 'signin' ? '#FFFFFF' : 'transparent',
                color: mode === 'signin' ? '#0F172A' : '#64748B',
                fontWeight: 600,
                fontSize: '0.84rem',
                borderRadius: '6px',
                cursor: 'pointer',
                boxShadow: mode === 'signin' ? '0 1px 2px rgba(15, 23, 42, 0.08)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              Sign In
            </button>
          </div>

          {/* Form Header */}
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 700, color: '#0F172A', letterSpacing: '-0.02em', margin: '0 0 6px 0' }}>
              {mode === 'signup' ? 'Start your 30-day FinSense Plus trial' : 'Welcome back to FinSense'}
            </h2>
            <p style={{ fontSize: '0.86rem', color: '#64748B', margin: 0 }}>
              {mode === 'signup'
                ? 'Create your encrypted workspace in 30 seconds. No credit card required.'
                : 'Enter your credentials to access your live financial cockpit.'}
            </p>
          </div>

          {/* Social Auth */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
            <button
              type="button"
              onClick={() => handleSocialAuth('Google')}
              disabled={isLoading}
              style={{
                background: '#FFFFFF',
                border: '1px solid #CBD5E1',
                borderRadius: '8px',
                padding: '9px 12px',
                color: '#0F172A',
                fontSize: '0.84rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer',
              }}
            >
              <GoogleIcon size={16} />
              <span>Google</span>
            </button>

            <button
              type="button"
              onClick={() => handleSocialAuth('Apple')}
              disabled={isLoading}
              style={{
                background: '#FFFFFF',
                border: '1px solid #CBD5E1',
                borderRadius: '8px',
                padding: '9px 12px',
                color: '#0F172A',
                fontSize: '0.84rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer',
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="#0F172A">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.84c.65-.83 1.1-1.99.97-3.15-1 .04-2.19.67-2.88 1.49-.6.71-1.13 1.88-.99 3.01 1.12.09 2.25-.56 2.9-1.35z" />
              </svg>
              <span>Apple</span>
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '16px 0', color: '#94A3B8', fontSize: '0.78rem' }}>
            <div style={{ flex: 1, height: '1px', background: '#E2E8F0' }} />
            <span>or continue with email</span>
            <div style={{ flex: 1, height: '1px', background: '#E2E8F0' }} />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {mode === 'signup' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', fontWeight: 600, marginBottom: '4px' }}>
                  Full Legal Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.86rem',
                    color: '#0F172A',
                    outline: 'none',
                    background: '#FFFFFF'
                  }}
                />
                {errors.name && <span style={{ color: '#E11D48', fontSize: '0.74rem', marginTop: '2px', display: 'block' }}>{errors.name}</span>}
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', fontWeight: 600, marginBottom: '4px' }}>
                Email Address
              </label>
              <input
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.86rem',
                  color: '#0F172A',
                  outline: 'none',
                  background: '#FFFFFF'
                }}
              />
              {errors.email && <span style={{ color: '#E11D48', fontSize: '0.74rem', marginTop: '2px', display: 'block' }}>{errors.email}</span>}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', fontWeight: 600, marginBottom: '4px' }}>
                Password
              </label>
              <input
                type="password"
                placeholder="At least 8 characters..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.86rem',
                  color: '#0F172A',
                  outline: 'none',
                  background: '#FFFFFF'
                }}
              />
              {mode === 'signup' && <PasswordStrengthMeter password={password} />}
              {errors.password && <span style={{ color: '#E11D48', fontSize: '0.74rem', marginTop: '2px', display: 'block' }}>{errors.password}</span>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '11px',
                borderRadius: '6px',
                border: 'none',
                background: '#0F172A',
                color: '#FFFFFF',
                fontSize: '0.86rem',
                fontWeight: 600,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                marginTop: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              {isLoading ? (
                <span>Authenticating Workspace...</span>
              ) : isSuccess ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10B981' }}>
                  <CheckCircle2 size={16} /> Verified
                </span>
              ) : (
                <>
                  <span>{mode === 'signup' ? 'Create Account' : 'Access Cockpit'}</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          {/* Institutional Security Notice */}
          <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.74rem', color: '#94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <ShieldCheck size={14} color="#0D9488" />
            <span>256-bit TLS Encryption &bull; SOC-2 Type II Grounded &bull; Plaid Ready</span>
          </div>
        </div>
      </div>

      {/* Interactive Google Account Picker Modal */}
      <GoogleAccountPickerModal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
        onAccountAuthenticated={(acc) => {
          setIsGoogleModalOpen(false);
          setIsSuccess(true);
          setTimeout(() => {
            if (onSuccess) onSuccess({ bypassOnboarding: true, user: acc });
          }, 350);
        }}
      />
    </div>
  );
}
