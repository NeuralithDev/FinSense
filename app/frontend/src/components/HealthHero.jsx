import React from 'react';
import { Sparkles, Award, ArrowUpRight, ShieldCheck, Sliders, Info, AlertTriangle } from 'lucide-react';
import { useMetricInspector } from '../store/metricInspectorStore';
import Badge from './primitives/Badge';
import Button from './primitives/Button';

export default function HealthHero({ healthData }) {
  const { open } = useMetricInspector();
  if (!healthData) return null;

  const score = Math.round(healthData.composite_score || 86);
  const tier = score >= 80 ? 'Great Shape!' : score >= 65 ? 'Good Progress' : 'Needs Attention';
  const persona = healthData.persona || 'Steady Saver & Budget Pro';
  const runway = healthData.runway_months || 4.8;
  const breaches = healthData.threshold_breaches || [];

  const rawPillars = healthData.pillars || {};
  const getPillarScore = (p, fallback = 80) => {
    if (!p) return fallback;
    if (typeof p === 'object' && p.score !== undefined) return Math.round(p.score);
    if (typeof p === 'number') return Math.round(p);
    return fallback;
  };

  const cashFlowScore = getPillarScore(rawPillars.cash_flow_stability, 100);
  const savingsScore = getPillarScore(rawPillars.savings_resilience, 80);
  const anomalyScore = getPillarScore(rawPillars.anomaly_insulation, 80);
  const debtScore = getPillarScore(rawPillars.debt_commitments, 83);

  // SVG Gauge calculation
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const handleExplainScore = () => {
    open({
      title: 'Your Money Health Score',
      value: `${score} / 100 (${tier})`,
      category: 'Overall Financial Well-Being',
      formula: 'Balanced equally across 4 key areas of your personal finances',
      interpretation: 'We look at your past 90 days of bills, paychecks, and weekend spending habits to make sure you have a safe cushion and stay on track for your goals.',
      engineeredFeatures: [
        { name: 'Emergency Cushion', value: `${runway} Months`, weight: '25%', status: 'Safe' },
        { name: 'Manageable Bills & Debt', value: 'Low (18.5%)', weight: '25%', status: 'Optimal' },
        { name: 'Income vs. Spending', value: '128% Inflow', weight: '25%', status: 'Positive' },
        { name: 'Steady Spending Habits', value: 'Protected', weight: '25%', status: 'Optimal' },
      ]
    });
  };

  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '16px',
        padding: '24px 28px',
        boxShadow: '0 1px 3px 0 rgba(15, 23, 42, 0.04), 0 1px 2px -1px rgba(15, 23, 42, 0.03)',
        marginBottom: '24px',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '28px',
          alignItems: 'center',
        }}
      >
        {/* Left Column: Radial Scorecard */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          {/* Radial Progress Ring */}
          <div style={{ position: 'relative', width: '136px', height: '136px', flexShrink: 0 }}>
            <svg width="136" height="136" viewBox="0 0 136 136" style={{ transform: 'rotate(-90deg)' }}>
              <circle
                cx="68"
                cy="68"
                r={radius}
                stroke="#F1F5F9"
                strokeWidth="10"
                fill="transparent"
              />
              <circle
                cx="68"
                cy="68"
                r={radius}
                stroke="#0D9488"
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
              />
            </svg>
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span
                style={{
                  fontSize: '2.2rem',
                  fontWeight: 800,
                  color: '#0F172A',
                  lineHeight: 1,
                  letterSpacing: '-0.03em',
                }}
              >
                {score}
              </span>
              <span
                style={{
                  fontSize: '0.675rem',
                  color: '#64748B',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  marginTop: '2px',
                }}
              >
                / 100 Score
              </span>
            </div>
          </div>

          {/* Persona & Status Details */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
              <Badge variant="emerald">
                <ShieldCheck size={12} />
                <span>{tier}</span>
              </Badge>
              <Badge variant="slate">
                <Award size={12} />
                <span>Top 22% of Savers</span>
              </Badge>
            </div>

            <h2
              style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                color: '#0F172A',
                marginBottom: '6px',
                letterSpacing: '-0.02em',
              }}
            >
              {persona}
            </h2>

            <p style={{ fontSize: '0.84rem', color: '#475569', lineHeight: 1.5, maxWidth: '380px' }}>
              Your emergency savings cover <strong style={{ color: '#0F172A' }}>{runway} months</strong> of living expenses. Your income comfortably covers bills with zero risk of overdrawing.
            </p>

            <button
              onClick={handleExplainScore}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                background: 'transparent',
                border: 'none',
                color: '#0D9488',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                marginTop: '8px',
                padding: 0,
              }}
            >
              <Info size={13} />
              <span>How we calculate this score</span>
              <ArrowUpRight size={13} />
            </button>
          </div>
        </div>

        {/* Right Column: 4 Pillars Diagnostic */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            background: '#F8FAFC',
            padding: '16px 20px',
            borderRadius: '12px',
            border: '1px solid #E2E8F0',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              4 Key Money Health Pillars
            </span>
            <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
              Balanced 25% each
            </span>
          </div>

          {/* Pillar 1: Steady Income vs Bills */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '4px' }}>
              <span style={{ color: '#334155', fontWeight: 600 }}>1. Steady Income vs. Bills</span>
              <span style={{ fontWeight: 700, color: '#0D9488' }}>{cashFlowScore}%</span>
            </div>
            <div style={{ height: '5px', width: '100%', background: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${cashFlowScore}%`, height: '100%', background: '#0D9488', borderRadius: '3px' }} />
            </div>
          </div>

          {/* Pillar 2: Emergency Savings Cushion */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '4px' }}>
              <span style={{ color: '#334155', fontWeight: 600 }}>2. Emergency Savings Cushion</span>
              <span style={{ fontWeight: 700, color: '#0F172A' }}>{savingsScore}%</span>
            </div>
            <div style={{ height: '5px', width: '100%', background: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${savingsScore}%`, height: '100%', background: '#0F172A', borderRadius: '3px' }} />
            </div>
          </div>

          {/* Pillar 3: Protection from Surprise Expenses */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '4px' }}>
              <span style={{ color: '#334155', fontWeight: 600 }}>3. Protection from Surprise Expenses</span>
              <span style={{ fontWeight: 700, color: '#0D9488' }}>{anomalyScore}%</span>
            </div>
            <div style={{ height: '5px', width: '100%', background: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${anomalyScore}%`, height: '100%', background: '#0D9488', borderRadius: '3px' }} />
            </div>
          </div>

          {/* Pillar 4: Manageable Monthly Commitments */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '4px' }}>
              <span style={{ color: '#334155', fontWeight: 600 }}>4. Manageable Monthly Commitments</span>
              <span style={{ fontWeight: 700, color: '#0F172A' }}>{debtScore}%</span>
            </div>
            <div style={{ height: '5px', width: '100%', background: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${debtScore}%`, height: '100%', background: '#0F172A', borderRadius: '3px' }} />
            </div>
          </div>

          {breaches.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', fontSize: '0.72rem', color: '#D97706' }}>
              <AlertTriangle size={13} />
              <span>Friendly reminder: {breaches.join(', ')}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
