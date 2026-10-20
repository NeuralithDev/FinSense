import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Link2, 
  BrainCircuit, 
  ShieldCheck, 
  Zap, 
  ArrowRight, 
  TrendingUp, 
  Layers, 
  Clock, 
  Calendar,
  CheckCircle2
} from 'lucide-react';
import { useCurrency } from '../../design-system/currencyStore';

export default function ScrollStory({ onOpenCockpit }) {
  const [activeStep, setActiveStep] = useState(0);
  const { format } = useCurrency();

  const chapters = [
    {
      id: 'connect',
      title: 'Zero-Latency Account Streaming',
      subtitle: 'Open Banking + Plaid Real-Time Core',
      description: 'Connect your accounts in seconds. FinSense streams and normalizes raw transaction narrations with high-precision merchant de-duplication, category tagging, and sign correction.',
      badge: 'Step 01 • Ingestion',
      icon: Link2,
      statLabel: 'Transaction Sync Latency',
      statValue: '< 420ms',
      features: [
        'Instant bank-direct transaction synchronization',
        'Automatic ledger narration sanitization',
        'Direct connection to 11,000+ financial institutions',
      ],
      previewContent: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', color: '#64748B' }}>
            <span>Normalized Ingestion Stream</span>
            <span style={{ color: '#0D9488', fontWeight: 600 }}>● Active Plaid Connection</span>
          </div>
          {[
            { merchant: 'Whole Foods Market', amount: 84.20, cat: 'Groceries', time: '12m ago' },
            { merchant: 'Spotify Premium', amount: 11.99, cat: 'Subscription', time: '1h ago', alert: '+9% creep detected' },
            { merchant: 'Blue Bottle Coffee', amount: 6.75, cat: 'Impulse Gateway', time: '3h ago' },
          ].map((tx, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 14px',
                borderRadius: '8px',
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                fontSize: '0.82rem',
              }}
            >
              <div>
                <div style={{ fontWeight: 600, color: '#0F172A' }}>{tx.merchant}</div>
                <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{tx.cat} &bull; {tx.time}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, color: '#0F172A', fontFamily: 'monospace' }}>${tx.amount.toFixed(2)}</div>
                {tx.alert && <span style={{ fontSize: '0.68rem', color: '#E11D48', fontWeight: 600 }}>{tx.alert}</span>}
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: 'behavior',
      title: 'Spotting Everyday Habits & Triggers',
      subtitle: 'Understand What Drives Your Impulse Spending',
      description: 'FinSense helps you spot the everyday moments and times of week where spending quietly adds up — like Friday post-work dinners, late-night food deliveries, or impulse phone orders.',
      badge: 'Step 02 • Habits',
      icon: BrainCircuit,
      statLabel: 'Spending Habit Accuracy',
      statValue: '99.4%',
      features: [
        'Weekly spending heatmap by day and time of day',
        'See which purchases trigger other unplanned expenses',
        'Compare savings & habits with people like you',
      ],
      previewContent: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A' }}>Everyday Habit: Friday Night Delivery</span>
            <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', background: '#FFFBEB', color: '#D97706', fontWeight: 700, border: '1px solid #FDE68A' }}>
              Heads-Up Alert
            </span>
          </div>
          <div style={{
            background: '#FFFBEB',
            border: '1px solid #FDE68A',
            borderRadius: '8px',
            padding: '12px',
            fontSize: '0.8rem',
            color: '#B45309',
            lineHeight: 1.5,
          }}>
            ⚡ <strong>Habit Identified:</strong> You typically spend around {format(650)} on food delivery on Friday evenings between 8:00 PM and 11:30 PM.
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', color: '#64748B' }}>
            <span>Savings Cushion: <strong style={{ color: '#0F172A' }}>4.8 Months</strong></span>
            <span>Peer Benchmark: <strong style={{ color: '#0D9488' }}>Top 24% of Savers</strong></span>
          </div>
        </div>
      ),
    },
    {
      id: 'automate',
      title: 'Smart Auto-Save With Overdraft Protection',
      subtitle: 'Move Extra Cash Safely Into Your Goals',
      description: 'FinSense automatically sets aside extra money you won’t need for upcoming bills, calculating your safe cushion so you never accidentally overdraw.',
      badge: 'Step 03 • Action',
      icon: ShieldCheck,
      statLabel: 'Overdrafts (52-Week History)',
      statValue: '0 Fees',
      features: [
        'Always leaves a healthy buffer for upcoming bills',
        'Directly fills your emergency and vacation funds',
        'Easy 1-click plan to pause or cancel unused subscriptions',
      ],
      previewContent: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: '#64748B' }}>Safe to Save Today:</span>
            <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0D9488' }}>+{format(850)}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748B' }}>
              <span>Emergency Fund (Priority 1)</span>
              <span style={{ color: '#0D9488', fontWeight: 600 }}>+{format(510)}</span>
            </div>
            <div style={{ height: '6px', background: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: '60%', height: '100%', background: '#0D9488', borderRadius: '3px' }} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748B' }}>
              <span>Vacation Fund (Priority 2)</span>
              <span style={{ color: '#0F172A', fontWeight: 600 }}>+{format(340)}</span>
            </div>
            <div style={{ height: '6px', background: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: '40%', height: '100%', background: '#0F172A', borderRadius: '3px' }} />
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <section
      id="features"
      style={{
        padding: '80px 24px',
        maxWidth: '1360px',
        margin: '0 auto',
        position: 'relative',
        color: '#0F172A'
      }}
    >
      {/* Section Header */}
      <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 48px' }}>
        <span
          style={{
            fontSize: '0.74rem',
            fontWeight: 700,
            padding: '3px 10px',
            borderRadius: '6px',
            background: '#F0FDF4',
            color: '#0D9488',
            border: '1px solid #BBF7D0',
            display: 'inline-block',
            marginBottom: '12px'
          }}
        >
          HOW FINSENSE WORKS FOR YOU
        </span>
        <h2
          style={{
            fontSize: 'clamp(2rem, 3.8vw, 3rem)',
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: '-0.025em',
            color: '#0F172A',
            marginBottom: '16px',
          }}
        >
          Three steps from financial anxiety to total peace of mind.
        </h2>
        <p style={{ fontSize: '1rem', color: '#64748B', lineHeight: 1.6, margin: 0 }}>
          Unlike static budgeting spreadsheets or retrospective trackers, FinSense combines forward balance forecasting with proactive habit nudges to keep you protected before money leaves your account.
        </p>
      </div>

      {/* Chapter Selection Pills */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '10px',
          flexWrap: 'wrap',
          marginBottom: '36px',
        }}
      >
        {chapters.map((ch, idx) => {
          const Icon = ch.icon;
          const isActive = activeStep === idx;
          return (
            <button
              key={ch.id}
              onClick={() => setActiveStep(idx)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 18px',
                borderRadius: '8px',
                background: isActive ? '#0F172A' : '#FFFFFF',
                border: isActive ? '1px solid #0F172A' : '1px solid #CBD5E1',
                color: isActive ? '#FFFFFF' : '#475569',
                fontWeight: 600,
                fontSize: '0.84rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Icon size={15} />
              <span>{ch.title}</span>
            </button>
          );
        })}
      </div>

      {/* Selected Step Display Card */}
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '16px',
          padding: '36px',
          boxShadow: '0 4px 6px -1px rgba(15, 23, 42, 0.05)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '36px',
          alignItems: 'center',
        }}
      >
        <div>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0D9488', textTransform: 'uppercase', fontFamily: 'monospace' }}>
            {chapters[activeStep].badge}
          </span>
          <h3 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#0F172A', margin: '6px 0 10px 0' }}>
            {chapters[activeStep].title}
          </h3>
          <p style={{ fontSize: '0.92rem', color: '#64748B', lineHeight: 1.6, marginBottom: '20px' }}>
            {chapters[activeStep].description}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
            {chapters[activeStep].features.map((feat, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem', color: '#334155' }}>
                <CheckCircle2 size={16} color="#0D9488" />
                <span>{feat}</span>
              </div>
            ))}
          </div>

          <button
            onClick={onOpenCockpit}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 18px',
              borderRadius: '8px',
              background: '#0F172A',
              color: '#FFFFFF',
              border: 'none',
              fontSize: '0.84rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <span>Explore in Live Cockpit</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* Live Preview Column */}
        <div
          style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            padding: '24px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #E2E8F0', paddingBottom: '10px' }}>
            <span style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>
              {chapters[activeStep].statLabel}
            </span>
            <span style={{ fontSize: '1rem', fontWeight: 700, color: '#0D9488', fontFamily: 'monospace' }}>
              {chapters[activeStep].statValue}
            </span>
          </div>

          {chapters[activeStep].previewContent}
        </div>
      </div>
    </section>
  );
}
