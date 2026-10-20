import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Play, Shield, CheckCircle2, X, Compass, Zap, Activity } from 'lucide-react';
import FallbackCard2D from '../3d/FallbackCard2D';
import { useCurrency } from '../../design-system/currencyStore';
import { useFinanceStore } from '../../store/financeStore';

export default function HeroSection({ onStartOnboarding, onOpenCockpit }) {
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const { format } = useCurrency();
  const { accounts } = useFinanceStore();
  const primaryAccount = accounts?.checking || Object.values(accounts || {})[0];
  const checkingBal = primaryAccount?.balance ?? 10754.62;

  return (
    <section
      style={{
        position: 'relative',
        minHeight: '88vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '60px 24px 40px',
        background: '#F8FAFC',
        color: '#0F172A',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          maxWidth: '1360px',
          margin: '0 auto',
          width: '100%',
          position: 'relative',
          zIndex: 5,
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            alignItems: 'center',
            gap: '48px',
          }}
        >
          {/* Left Column: Copy */}
          <div style={{ maxWidth: '640px' }}>
            {/* Pill Badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 12px',
                borderRadius: '9999px',
                background: '#F0FDF4',
                border: '1px solid #BBF7D0',
                color: '#0D9488',
                fontSize: '0.78rem',
                fontWeight: 700,
                fontFamily: 'monospace',
                marginBottom: '20px'
              }}
            >
              <Shield size={14} />
              <span>PERSONAL FINANCE COMPANION &bull; OVERDRAFT PROTECTED</span>
            </div>

            {/* Headline */}
            <h1
              style={{
                fontSize: 'clamp(2.4rem, 5vw, 3.8rem)',
                fontWeight: 800,
                lineHeight: 1.1,
                letterSpacing: '-0.03em',
                color: '#0F172A',
                marginBottom: '20px',
              }}
            >
              The intelligent financial engine built for certainty.
            </h1>

            <p
              style={{
                fontSize: '1.1rem',
                lineHeight: 1.6,
                color: '#475569',
                marginBottom: '32px',
                maxWidth: '560px',
              }}
            >
              Most budgeting tools look backward and show you where your money went last month. 
              FinSense forecasts your upcoming balance 30 days ahead, eliminates silent subscription creep, and safely auto-saves extra cash with zero risk of overdraft fees.
            </p>

            {/* CTAs */}
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '36px' }}>
              <button
                onClick={onStartOnboarding}
                style={{
                  background: '#0F172A',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '14px 24px',
                  fontSize: '0.94rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 2px 4px rgba(15, 23, 42, 0.1)',
                }}
              >
                <span>Evaluate Spending DNA</span>
                <ArrowRight size={16} />
              </button>

              <button
                onClick={onOpenCockpit}
                style={{
                  background: '#FFFFFF',
                  color: '#0F172A',
                  border: '1px solid #CBD5E1',
                  borderRadius: '8px',
                  padding: '14px 24px',
                  fontSize: '0.94rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span>Launch Live Cockpit</span>
              </button>
            </div>

            {/* Institutional Trust Highlights */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '16px',
                borderTop: '1px solid #E2E8F0',
                paddingTop: '20px',
              }}
            >
              <div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0F172A', fontFamily: 'monospace' }}>
                  0.00%
                </div>
                <div style={{ fontSize: '0.76rem', color: '#64748B' }}>Overdraft Fee Rate</div>
              </div>

              <div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0D9488', fontFamily: 'monospace' }}>
                  99.0%
                </div>
                <div style={{ fontSize: '0.76rem', color: '#64748B' }}>Confidence Bound</div>
              </div>

              <div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0F172A', fontFamily: 'monospace' }}>
                  +2.4 Mo
                </div>
                <div style={{ fontSize: '0.76rem', color: '#64748B' }}>Runway Extension</div>
              </div>
            </div>
          </div>

          {/* Right Column: Titanium EMV Card & Live Telemetry Card */}
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: '100%', maxWidth: '480px' }}>
              <FallbackCard2D />

              {/* Floating Metric Card */}
              <div
                style={{
                  marginTop: '20px',
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '12px',
                  padding: '16px 20px',
                  boxShadow: '0 4px 6px -1px rgba(15, 23, 42, 0.05)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: '#F0FDF4',
                    color: '#0D9488',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Activity size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>
                      30-Day Balance Forecast
                    </div>
                    <div style={{ fontSize: '0.94rem', fontWeight: 700, color: '#0F172A' }}>
                      {format(checkingBal)} &rarr; {format(checkingBal + 4500)}
                    </div>
                  </div>
                </div>

                <span style={{
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  color: '#0D9488',
                  background: '#F0FDF4',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  border: '1px solid #BBF7D0'
                }}>
                  PROTECTED
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
