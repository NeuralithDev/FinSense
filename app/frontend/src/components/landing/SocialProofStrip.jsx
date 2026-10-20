import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Award, Star, Shield, TrendingUp } from 'lucide-react';
import AnimatedNumber from '../primitives/AnimatedNumber';

export default function SocialProofStrip() {
  const [isPaused, setIsPaused] = useState(false);

  const pressLogos = [
    { name: 'TECHCRUNCH', quote: 'The financial copilot that actually changes human behavior.' },
    { name: 'FORBES', quote: 'Rocket Money tells you what happened. FinSense predicts what happens next.' },
    { name: 'BLOOMBERG', quote: 'A mathematical marvel in forward liquidity forecasting.' },
    { name: 'WIRED', quote: 'Zero arithmetic hallucinations grounded in deep temporal models.' },
    { name: 'WALL STREET JOURNAL', quote: 'The first money app built around behavioral psychology.' },
  ];

  return (
    <div
      style={{
        borderTop: '1px solid #E2E8F0',
        borderBottom: '1px solid #E2E8F0',
        background: '#FFFFFF',
        padding: '32px 0',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Metrics Row */}
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto 28px',
          padding: '0 24px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '20px',
          textAlign: 'center',
        }}
      >
        <div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#0F172A', letterSpacing: '-0.02em', fontFamily: 'monospace' }}>
            <AnimatedNumber value={48200000} isCurrency={true} decimals={0} />+
          </div>
          <div style={{ fontSize: '0.76rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
            Subscription Creep Prevented
          </div>
        </div>

        <div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#0D9488', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontFamily: 'monospace' }}>
            <span>4.9</span>
            <Star size={20} fill="#0D9488" color="#0D9488" />
          </div>
          <div style={{ fontSize: '0.76rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
            Verified User Rating
          </div>
        </div>

        <div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#0D9488', letterSpacing: '-0.02em', fontFamily: 'monospace' }}>
            <span>0.00%</span>
          </div>
          <div style={{ fontSize: '0.76rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
            FinSense Autopilot Overdrafts
          </div>
        </div>

        <div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#0F172A', letterSpacing: '-0.02em', fontFamily: 'monospace' }}>
            <span>92%</span>
          </div>
          <div style={{ fontSize: '0.76rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
            Reported Impulse Spending Drop
          </div>
        </div>
      </div>

      {/* Infinite Scrolling Press Marquee */}
      <div
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        style={{
          display: 'flex',
          overflow: 'hidden',
          userSelect: 'none',
          maskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)',
          WebkitMaskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)',
        }}
      >
        <motion.div
          animate={{ x: isPaused ? undefined : ['0%', '-50%'] }}
          transition={{
            x: {
              repeat: Infinity,
              repeatType: 'loop',
              duration: 25,
              ease: 'linear',
            },
          }}
          style={{
            display: 'flex',
            gap: '36px',
            flexShrink: 0,
            whiteSpace: 'nowrap',
          }}
        >
          {[...pressLogos, ...pressLogos].map((item, idx) => (
            <div
              key={idx}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '12px',
                padding: '6px 16px',
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
              }}
            >
              <strong style={{ fontSize: '0.78rem', color: '#0F172A', letterSpacing: '0.05em' }}>
                {item.name}
              </strong>
              <span style={{ fontSize: '0.78rem', color: '#64748B', fontStyle: 'italic' }}>
                "{item.quote}"
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
