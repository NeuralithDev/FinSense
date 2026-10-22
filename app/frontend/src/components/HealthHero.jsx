import React from 'react';
import { 
  ShieldCheck, 
  Award, 
  ArrowUpRight, 
  Info 
} from 'lucide-react';
import { useMetricInspector } from '../store/metricInspectorStore';
import { useFinanceStore } from '../store/financeStore';
import Badge from './primitives/Badge';

export default function HealthHero() {
  const { openInspector } = useMetricInspector();
  const { reconciled, hasImportedData, openSyncModal } = useFinanceStore();

  const health = reconciled.health;

  const hasScoreData = Boolean(hasImportedData && health.compositeScore !== null && health.compositeScore !== undefined);

  // Derive score directly from the 4 reconciled pillars (25% each)
  const score = hasScoreData ? health.compositeScore : null;
  const tier = hasScoreData ? health.tier : 'Awaiting Ingestion';
  const tierVariant = hasScoreData ? health.tierVariant : 'amber';
  const persona = hasScoreData ? health.persona : 'Calibrate Financial Health Pillars';
  const runway = hasScoreData ? health.emergencyRunwayMonths : 0;
  const narrative = hasScoreData 
    ? health.dynamicNarrative 
    : 'Connect your bank or upload a statement to evaluate your cash flow, emergency cushion, surprise protection, and subscription commitments.';

  const cashFlowScore = hasScoreData ? health.pillars.steadyIncome : null;
  const savingsScore = hasScoreData ? health.pillars.emergencyCushion : null;
  const anomalyScore = hasScoreData ? health.pillars.surpriseProtection : null;
  const debtScore = hasScoreData ? health.pillars.manageableCommitments : null;

  // SVG Gauge calculation
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = hasScoreData 
    ? circumference - (Math.min(Math.max(score, 0), 100) / 100) * circumference
    : circumference;

  const handleExplainScore = () => {
    if (!hasScoreData) {
      openSyncModal();
      return;
    }
    openInspector({
      metricName: 'Your Money Health Score',
      value: `${score} / 100 (${tier})`,
      formula: 'Balanced equally across 4 key pillars (25% each)',
      description: 'We evaluate cash-flow stability, liquid runway resilience, surprise expense insulation, and monthly recurring commitment burdens.',
      drivers: [
        { name: '1. Steady Income vs. Bills', weight: `${cashFlowScore}%`, impact: '25% Weight • Paycheck & inflow coverage' },
        { name: '2. Emergency Savings Cushion', weight: `${savingsScore}%`, impact: `25% Weight • ${runway} months liquid runway (3 mo benchmark)` },
        { name: '3. Surprise Protection', weight: `${anomalyScore}%`, impact: '25% Weight • Floor buffer & anomaly insulation' },
        { name: '4. Manageable Commitments', weight: `${debtScore}%`, impact: '25% Weight • Fixed recurring burden ratio' },
      ],
    });
  };

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '16px',
        padding: '24px 28px',
        boxShadow: 'var(--shadow-card)',
        marginBottom: '24px',
        color: 'var(--text-primary)',
        position: 'relative',
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
                stroke="var(--bg-surface-secondary)"
                strokeWidth="10"
                fill="transparent"
              />
              <circle
                cx="68"
                cy="68"
                r={radius}
                stroke="#10B981"
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                style={{ transition: 'stroke-dashoffset 0.8s ease-in-out' }}
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
                  color: hasScoreData ? 'var(--text-primary)' : 'var(--text-muted)',
                  lineHeight: 1,
                  letterSpacing: '-0.03em',
                }}
              >
                {hasScoreData ? score : '--'}
              </span>
              <span
                style={{
                  fontSize: '0.675rem',
                  color: 'var(--text-muted)',
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
              <Badge variant={tierVariant}>
                <ShieldCheck size={12} />
                <span>{tier}</span>
              </Badge>
              <Badge variant="slate">
                <Award size={12} />
                <span>{hasScoreData ? 'Top 18% of Savers' : 'Awaiting Ingestion'}</span>
              </Badge>
            </div>

            <h2
              style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: '6px',
                letterSpacing: '-0.02em',
              }}
            >
              {persona}
            </h2>

            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5, maxWidth: '380px', margin: 0 }}>
              {narrative}
            </p>

            <button
              onClick={handleExplainScore}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                background: 'transparent',
                border: 'none',
                color: '#10B981',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                marginTop: '10px',
                padding: 0,
              }}
            >
              <Info size={13} />
              <span>{hasScoreData ? 'How we calculate this score' : 'Feed bank data to calibrate score'}</span>
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
            background: 'var(--bg-surface-secondary)',
            padding: '16px 20px',
            borderRadius: '12px',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              4 Key Money Health Pillars
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Balanced 25% each
            </span>
          </div>

          {/* Pillar 1: Steady Income vs Bills */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '4px' }}>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>1. Steady Income vs. Bills</span>
              <span style={{ fontWeight: 700, color: hasScoreData ? '#10B981' : 'var(--text-muted)' }}>
                {hasScoreData ? `${cashFlowScore}%` : '--'}
              </span>
            </div>
            <div style={{ height: '5px', width: '100%', background: 'var(--border-subtle)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: hasScoreData ? `${Math.min(Math.max(cashFlowScore, 0), 100)}%` : '0%', height: '100%', background: '#10B981', borderRadius: '3px', transition: 'width 0.4s ease' }} />
            </div>
          </div>

          {/* Pillar 2: Emergency Savings Cushion */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '4px' }}>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
                2. Emergency Savings Cushion {hasScoreData ? `(${runway} mo)` : ''}
              </span>
              <span style={{ fontWeight: 700, color: !hasScoreData ? 'var(--text-muted)' : savingsScore >= 80 ? '#10B981' : (savingsScore >= 50 ? '#D97706' : '#EF4444') }}>
                {hasScoreData ? `${savingsScore}%` : '--'}
              </span>
            </div>
            <div style={{ height: '5px', width: '100%', background: 'var(--border-subtle)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: hasScoreData ? `${Math.min(Math.max(savingsScore, 0), 100)}%` : '0%', height: '100%', background: savingsScore >= 80 ? '#10B981' : (savingsScore >= 50 ? '#F59E0B' : '#EF4444'), borderRadius: '3px', transition: 'width 0.4s ease' }} />
            </div>
          </div>

          {/* Pillar 3: Protection from Surprise Expenses */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '4px' }}>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>3. Protection from Surprise Expenses</span>
              <span style={{ fontWeight: 700, color: hasScoreData ? '#10B981' : 'var(--text-muted)' }}>
                {hasScoreData ? `${anomalyScore}%` : '--'}
              </span>
            </div>
            <div style={{ height: '5px', width: '100%', background: 'var(--border-subtle)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: hasScoreData ? `${Math.min(Math.max(anomalyScore, 0), 100)}%` : '0%', height: '100%', background: '#10B981', borderRadius: '3px', transition: 'width 0.4s ease' }} />
            </div>
          </div>

          {/* Pillar 4: Manageable Monthly Commitments */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '4px' }}>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>4. Manageable Monthly Commitments</span>
              <span style={{ fontWeight: 700, color: !hasScoreData ? 'var(--text-muted)' : debtScore >= 75 ? '#10B981' : '#F59E0B' }}>
                {hasScoreData ? `${debtScore}%` : '--'}
              </span>
            </div>
            <div style={{ height: '5px', width: '100%', background: 'var(--border-subtle)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: hasScoreData ? `${Math.min(Math.max(debtScore, 0), 100)}%` : '0%', height: '100%', background: debtScore >= 75 ? '#10B981' : '#F59E0B', borderRadius: '3px', transition: 'width 0.4s ease' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
