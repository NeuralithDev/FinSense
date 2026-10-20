import React from 'react';
import { Compass, Shield, Cpu, Lock, CheckCircle2 } from 'lucide-react';
import { useCurrency } from '../../design-system/currencyStore';

export default function Footer({ onOpenCockpit }) {
  const { currency, setCurrency, availableCurrencies } = useCurrency();

  return (
    <footer
      style={{
        borderTop: '1px solid #E2E8F0',
        background: '#FFFFFF',
        color: '#0F172A',
        padding: '56px 24px 36px',
        position: 'relative',
        zIndex: 10,
      }}
    >
      <div style={{ maxWidth: '1360px', margin: '0 auto' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '40px',
            marginBottom: '40px',
          }}
        >
          {/* Col 1: Brand & Positioning */}
          <div style={{ maxWidth: '320px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
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
                <Compass size={16} color="#FFFFFF" />
              </div>
              <span style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0F172A' }}>
                FinSense<span style={{ color: '#0D9488' }}>.</span>
              </span>
            </div>
            <p style={{ fontSize: '0.84rem', color: '#64748B', lineHeight: 1.6, marginBottom: '14px' }}>
              The forward-looking personal finance intelligence platform designed to eliminate rear-view anxiety with zero arithmetic hallucinations.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.76rem', color: '#0D9488', fontWeight: 600 }}>
              <CheckCircle2 size={14} />
              <span>FastAPI Backend 8000 &bull; 18 ML Suites Verified</span>
            </div>
          </div>

          {/* Col 2: Product Capabilities */}
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
              Core Features
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.84rem', color: '#64748B' }}>
              <li>Upcoming Balance Forecast (30D)</li>
              <li>Unusual Activity & Bill Guard</li>
              <li>Recurring Bills & Subscriptions</li>
              <li>Smart Auto-Save & Goal Funds</li>
              <li>People Like You (Peer Comparison)</li>
            </ul>
          </div>

          {/* Col 3: Comparison */}
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
              Smart Comparison
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.84rem', color: '#64748B' }}>
              <li>Rocket Money vs. FinSense Balance Forecaster</li>
              <li>Copilot Money vs. FinSense Spending Habits</li>
              <li>Overdraft Protected vs. Blind Fixed Roundups</li>
              <li>Verified Account Math vs. Generic Budgets</li>
              <li>Bank-Grade 256-Bit Encrypted Security</li>
            </ul>
          </div>

          {/* Col 4: Currency & Security */}
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
              Currency & Region
            </div>
            <p style={{ fontSize: '0.82rem', color: '#64748B', marginBottom: '10px' }}>
              Active Ledger Currency: <strong style={{ color: '#0F172A', fontFamily: 'monospace' }}>{currency.code}</strong>
            </p>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {availableCurrencies.map((c) => (
                <button
                  key={c.code}
                  onClick={() => setCurrency(c.code)}
                  style={{
                    background: currency.code === c.code ? '#0F172A' : '#F8FAFC',
                    border: '1px solid #CBD5E1',
                    color: currency.code === c.code ? '#FFFFFF' : '#475569',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'monospace'
                  }}
                >
                  {c.code}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Hairline Bottom Bar */}
        <div
          style={{
            borderTop: '1px solid #F1F5F9',
            paddingTop: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            fontSize: '0.76rem',
            color: '#94A3B8',
          }}
        >
          <div>
            &copy; {new Date().getFullYear()} FinSense Technologies Inc. All rights reserved.
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <span>Privacy Policy</span>
            <span>Security Architecture</span>
            <span>API Documentation</span>
            <span>Terms of Service</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
