import React from 'react';
import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';

export function calculatePasswordStrength(password = '') {
  let score = 0;
  if (!password) return { score: 0, label: 'Enter a password', color: '#64748B', checks: {} };

  const checks = {
    length: password.length >= 8,
    letters: /[a-z]/.test(password) && /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  if (checks.length) score += 1;
  if (checks.letters) score += 1;
  if (checks.number) score += 1;
  if (checks.special) score += 1;

  const tiers = [
    { label: 'Very Weak', color: '#E11D48' },
    { label: 'Weak', color: '#F43F5E' },
    { label: 'Fair', color: '#D97706' },
    { label: 'Strong', color: '#0D9488' },
    { label: 'Bank-Grade', color: '#0D9488' },
  ];

  return {
    score,
    label: tiers[score].label,
    color: tiers[score].color,
    checks,
  };
}

export default function PasswordStrengthMeter({ password = '' }) {
  const { score, label, color, checks } = calculatePasswordStrength(password);

  if (!password) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
      {/* 4 Segmented Progress Bars */}
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
        {[1, 2, 3, 4].map((step) => {
          const isActive = score >= step;
          return (
            <div
              key={step}
              style={{
                flex: 1,
                height: '4px',
                borderRadius: '2px',
                background: '#E2E8F0',
                overflow: 'hidden',
              }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: isActive ? '100%' : '0%' }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                style={{
                  height: '100%',
                  background: color,
                }}
              />
            </div>
          );
        })}
        <span
          style={{
            fontSize: '0.72rem',
            fontWeight: 700,
            color,
            minWidth: '75px',
            textAlign: 'right',
            fontFamily: 'monospace'
          }}
        >
          {label}
        </span>
      </div>

      {/* Micro Requirements Checklist */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '6px',
          paddingTop: '4px',
          fontSize: '0.72rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: checks.length ? '#0D9488' : '#64748B' }}>
          {checks.length ? <Check size={12} color="#0D9488" /> : <div style={{ width: '10px', height: '10px', borderRadius: '50%', border: '1px solid #CBD5E1' }} />}
          <span>8+ characters</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: checks.letters ? '#0D9488' : '#64748B' }}>
          {checks.letters ? <Check size={12} color="#0D9488" /> : <div style={{ width: '10px', height: '10px', borderRadius: '50%', border: '1px solid #CBD5E1' }} />}
          <span>Uppercase & lowercase</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: checks.number ? '#0D9488' : '#64748B' }}>
          {checks.number ? <Check size={12} color="#0D9488" /> : <div style={{ width: '10px', height: '10px', borderRadius: '50%', border: '1px solid #CBD5E1' }} />}
          <span>Numbers (0-9)</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: checks.special ? '#0D9488' : '#64748B' }}>
          {checks.special ? <Check size={12} color="#0D9488" /> : <div style={{ width: '10px', height: '10px', borderRadius: '50%', border: '1px solid #CBD5E1' }} />}
          <span>Special character</span>
        </div>
      </div>
    </div>
  );
}
