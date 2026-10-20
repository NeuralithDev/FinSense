import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, ShieldCheck, Lock } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function FinalCTA({ onStartOnboarding, onOpenCockpit }) {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) return;

    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#0D9488', '#0F172A', '#10B981'],
      });
    } catch (err) {}

    setIsSubmitted(true);
  };

  return (
    <section
      style={{
        padding: '80px 24px',
        position: 'relative',
        background: '#F8FAFC',
        color: '#0F172A',
      }}
    >
      <div style={{ maxWidth: '960px', margin: '0 auto', position: 'relative', zIndex: 10 }}>
        <div
          style={{
            padding: '56px 36px',
            borderRadius: '24px',
            textAlign: 'center',
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            boxShadow: '0 4px 6px -1px rgba(15, 23, 42, 0.05), 0 2px 4px -2px rgba(15, 23, 42, 0.05)',
          }}
        >
          <span
            style={{
              fontSize: '0.74rem',
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: '6px',
              background: '#F0FDF4',
              color: '#0D9488',
              border: '1px solid #BBF7D0',
              fontFamily: 'monospace',
              display: 'inline-block',
              marginBottom: '16px',
            }}
          >
            FINSENSE PLUS MEMBERSHIP &bull; OVERDRAFT PROTECTED
          </span>

          <h2
            style={{
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: '-0.03em',
              color: '#0F172A',
              marginBottom: '14px',
            }}
          >
            Stop looking backward. <br />
            Take control of your forward cash horizon today.
          </h2>

          <p
            style={{
              fontSize: '1rem',
              color: '#64748B',
              maxWidth: '560px',
              margin: '0 auto 32px',
              lineHeight: 1.6,
            }}
          >
            Join thousands of savers using verified balance forecasting, overdraft-protected auto-saving, and proactive subscription tracking.
          </p>

          {isSubmitted ? (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                borderRadius: '8px',
                background: '#F0FDF4',
                border: '1px solid #BBF7D0',
                color: '#0D9488',
                fontWeight: 600,
                fontSize: '0.9rem',
              }}
            >
              <CheckCircle2 size={18} />
              <span>Workspace provisioned. Access link sent to {email}.</span>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              style={{
                display: 'flex',
                gap: '10px',
                maxWidth: '460px',
                margin: '0 auto 24px',
                flexWrap: 'wrap',
              }}
            >
              <input
                type="email"
                placeholder="Enter your email address..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  flex: 1,
                  minWidth: '220px',
                  background: '#F8FAFC',
                  border: '1px solid #CBD5E1',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  fontSize: '0.88rem',
                  color: '#0F172A',
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                style={{
                  background: '#0F172A',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 20px',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>Request Access</span>
                <ArrowRight size={15} />
              </button>
            </form>
          )}

          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '24px',
              flexWrap: 'wrap',
              fontSize: '0.78rem',
              color: '#64748B',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={14} color="#0D9488" />
              <span>Zero credit card required</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Lock size={14} color="#0D9488" />
              <span>256-bit SOC-2 compliant encryption</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
