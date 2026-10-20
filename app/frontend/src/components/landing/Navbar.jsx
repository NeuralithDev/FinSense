import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Compass, Globe, ChevronDown, ArrowRight, LayoutDashboard, Lock } from 'lucide-react';
import { useCurrency } from '../../design-system/currencyStore';

export default function Navbar({ onOpenCockpit, onOpenAuth }) {
  const { currency, setCurrency, availableCurrencies } = useCurrency();
  const [currencyOpen, setCurrencyOpen] = useState(false);

  const navLinks = [
    { label: 'Intelligence Engine', href: '#features' },
    { label: 'Behavioral Graph', href: '#dna' },
    { label: 'Autonomous Vault', href: '#vault' },
    { label: 'Benchmarking', href: '#comparison' },
  ];

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid #E2E8F0',
        padding: '12px 24px',
      }}
    >
      <div
        style={{
          maxWidth: '1360px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Brand Logo */}
        <div
          onClick={onOpenCockpit}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer',
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: '#0D9488',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Compass size={18} color="#FFFFFF" strokeWidth={2.5} />
          </div>
          <div>
            <span style={{ fontSize: '1.2rem', fontWeight: 700, letterSpacing: '-0.02em', color: '#0F172A' }}>
              FinSense<span style={{ color: '#0D9488' }}>.</span>
            </span>
          </div>
        </div>

        {/* Center Nav Links */}
        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '28px',
          }}
          className="hidden lg:flex"
        >
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              style={{
                fontSize: '0.86rem',
                color: '#475569',
                textDecoration: 'none',
                fontWeight: 600,
                transition: 'color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#0F172A')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#475569')}
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right CTA Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Currency Selector */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setCurrencyOpen(!currencyOpen)}
              style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '6px',
                padding: '6px 10px',
                fontSize: '0.78rem',
                fontWeight: 600,
                color: '#475569',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                fontFamily: 'monospace'
              }}
            >
              <Globe size={13} />
              <span>{currency.code}</span>
              <ChevronDown size={12} />
            </button>

            {currencyOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '4px',
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  boxShadow: '0 10px 15px -3px rgba(15, 23, 42, 0.08)',
                  padding: '4px',
                  zIndex: 200,
                  minWidth: '120px',
                }}
              >
                {availableCurrencies.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => {
                      setCurrency(c.code);
                      setCurrencyOpen(false);
                    }}
                    style={{
                      width: '100%',
                      padding: '6px 10px',
                      border: 'none',
                      background: currency.code === c.code ? '#F1F5F9' : 'transparent',
                      color: currency.code === c.code ? '#0D9488' : '#0F172A',
                      fontWeight: 600,
                      fontSize: '0.78rem',
                      borderRadius: '4px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      fontFamily: 'monospace'
                    }}
                  >
                    <span>{c.code}</span>
                    <span style={{ color: '#64748B' }}>{c.symbol}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => onOpenAuth('signin')}
            style={{
              background: 'transparent',
              border: 'none',
              padding: '6px 12px',
              fontSize: '0.84rem',
              fontWeight: 600,
              color: '#475569',
              cursor: 'pointer',
            }}
          >
            Sign In
          </button>

          <button
            onClick={onOpenCockpit}
            style={{
              background: '#0F172A',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '0.84rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 1px 2px rgba(15, 23, 42, 0.08)',
            }}
          >
            <LayoutDashboard size={14} />
            <span>Launch Cockpit</span>
          </button>
        </div>
      </div>
    </header>
  );
}
