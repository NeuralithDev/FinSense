import React from 'react';
import { Users, TrendingUp, Award, CheckCircle, Info, Sparkles } from 'lucide-react';
import { useMetricInspector } from '../store/metricInspectorStore';
import PeerUniverse3D from './PeerUniverse3D';

export default function TwinBenchmarking({ twinData }) {
  const { openInspector } = useMetricInspector();
  if (!twinData) return null;

  const percentiles = twinData.percentiles || {
    savings_rate: 68,
    discretionary_spend_ratio: 42,
    recurring_bills_load: 54,
    cash_runway: 74,
  };

  const insights = twinData.top_insights || [
    `You save ${percentiles.savings_rate}% of your verified monthly inflow, outperforming peer cohort median.`,
    'Discretionary everyday spending is well-controlled against lifestyle peer benchmarks.',
    `Liquid emergency cushion is stronger than ${percentiles.cash_runway || 70}% of peers in your income tier.`,
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '24px' }}>
      {/* Flagship Interactive 3D Peer Universe ("People Like You") */}
      <PeerUniverse3D />

      {/* Peer Percentile Distribution & Highlights Breakdown Card */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: 'var(--shadow-card)',
        color: 'var(--text-primary)',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '20px',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '16px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'var(--emerald-50)',
                border: '1px solid var(--emerald-100)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10B981'
              }}>
                <Users size={18} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                How You Compare to Peers
              </h3>
              <span style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '6px',
                background: 'var(--emerald-50)',
                color: '#10B981',
                border: '1px solid var(--emerald-100)'
              }}>
                Anonymous & Private
              </span>
            </div>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: 0 }}>
              See how your saving and spending stacks up against people with a similar income and lifestyle.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              fontSize: '0.76rem',
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: '6px',
              background: 'var(--bg-surface-secondary)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-subtle)'
            }}>
              Matched Group: {twinData.cohort_name || 'Verified Income & Lifestyle Cohort'}
            </span>

            <button
              onClick={() => openInspector({
                metricName: 'Peer Group Comparison',
                value: `Better than ${percentiles.savings_rate}% of peers`,
                formula: `Matched anonymously with verified peers in your income tier (${twinData.cohort_name || 'Verified Income Bracket'})`,
                description: 'We compare your monthly savings rate, fixed obligations, and variable burn against anonymous peers with similar cash-flow patterns.',
                drivers: [
                  { name: 'Income Match', weight: 'Exact Bracket', impact: twinData.cohort_name || 'Income Tier & Cash-Flow Cluster' },
                  { name: 'Lifestyle & Discretionary', weight: 'Spending Patterns', impact: 'Adjusted for local living expenses and non-essential burn' },
                  { name: 'Monthly Savings Velocity', weight: `+${percentiles.savings_rate}%`, impact: 'Comparison against cohort median reserve growth' },
                  { name: 'Recurring Commitments', weight: 'Fixed Bills', impact: 'Recurring subscription and bill burden relative to inflow' },
                ]
              })}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                background: 'var(--bg-surface-secondary)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Info size={14} />
              <span>How we match you</span>
            </button>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px'
        }}>
          {/* Percentile Sliders */}
          <div style={{
            background: 'var(--bg-surface-secondary)',
            padding: '18px 20px',
            borderRadius: '12px',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Monthly Savings Rate</span>
                <strong style={{ color: '#10B981' }}>Better than {percentiles.savings_rate}% of peers</strong>
              </div>
              <div style={{ height: '6px', width: '100%', background: 'var(--border-subtle)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(Math.max(percentiles.savings_rate || 0, 0), 100)}%`, height: '100%', background: '#10B981', borderRadius: '3px' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Everyday Fun Spending</span>
                <strong style={{ color: '#10B981' }}>Lower than {100 - (percentiles.discretionary_spend_ratio || 0)}% of peers (Great job!)</strong>
              </div>
              <div style={{ height: '6px', width: '100%', background: 'var(--border-subtle)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(Math.max(percentiles.discretionary_spend_ratio || 0, 0), 100)}%`, height: '100%', background: '#10B981', borderRadius: '3px' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Emergency Cushion</span>
                <strong style={{ color: '#10B981' }}>Stronger than {percentiles.cash_runway || 0}% of peers</strong>
              </div>
              <div style={{ height: '6px', width: '100%', background: 'var(--border-subtle)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(Math.max(percentiles.cash_runway || 0, 0), 100)}%`, height: '100%', background: '#10B981', borderRadius: '3px' }} />
              </div>
            </div>
          </div>

          {/* Peer Insights List */}
          <div style={{
            background: 'var(--bg-surface-secondary)',
            padding: '18px 20px',
            borderRadius: '12px',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Peer Group Highlights
            </span>
            {insights.map((ins, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981', marginTop: '6px', flexShrink: 0 }} />
                <p style={{ margin: 0, lineHeight: 1.4 }}>{ins}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
