import React from 'react';
import { Users, TrendingUp, Award, CheckCircle, Info } from 'lucide-react';
import { useMetricInspector } from '../store/metricInspectorStore';

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
    'You save 18% more allowance than your campus peer cluster median.',
    'Your recurring subscription footprint is ₹75/mo (peer avg: ₹380/mo).',
    'Dining and food delivery account for 38% of non-essential outflow (peer avg: 42%).',
  ];

  return (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid #E2E8F0',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
      color: '#0F172A',
      marginBottom: '24px'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '20px',
        borderBottom: '1px solid #F1F5F9',
        paddingBottom: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: '#F0FDF4',
              border: '1px solid #DCFCE7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0D9488'
            }}>
              <Users size={18} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#0F172A' }}>
              How You Compare to Peers
            </h3>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '6px',
              background: '#F0FDF4',
              color: '#0D9488',
              border: '1px solid #BBF7D0'
            }}>
              Anonymous & Private
            </span>
          </div>
          <p style={{ fontSize: '0.84rem', color: '#64748B', margin: 0 }}>
            See how your saving and spending stacks up against people with a similar income and lifestyle.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            fontSize: '0.76rem',
            fontWeight: 700,
            padding: '4px 10px',
            borderRadius: '6px',
            background: '#F8FAFC',
            color: '#475569',
            border: '1px solid #E2E8F0'
          }}>
            Matched Group: {twinData.cohort_name || 'University Students & Young Scholars (₹15,000 - ₹30,000/mo Allowance)'}
          </span>

          <button
            onClick={() => openInspector({
              metricName: 'Peer Group Comparison',
              value: `Better than ${percentiles.savings_rate}% of peers`,
              formula: 'Matched anonymously with students in your allowance bracket and campus cohort',
              description: 'We compare your monthly savings, recurring bills, and everyday spending against anonymous student peers with similar allowance and campus lifestyle patterns.',
              drivers: [
                { name: 'Income Match', weight: 'Exact Bracket', impact: 'Student allowance of ₹15,000–₹30,000/mo' },
                { name: 'Campus Living', weight: 'Hostel & Local', impact: 'Adjusted for campus food and student transit' },
                { name: 'Monthly Savings Rate', weight: `+${percentiles.savings_rate}%`, impact: 'Ahead of typical student savings buffer' },
                { name: 'Dining & Delivery Habits', weight: 'Moderate', impact: 'In line with campus food delivery averages' },
              ]
            })}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              color: '#475569',
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
          background: '#F8FAFC',
          padding: '18px 20px',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
              <span style={{ color: '#0F172A', fontWeight: 600 }}>Monthly Savings Rate</span>
              <strong style={{ color: '#0D9488' }}>Better than {percentiles.savings_rate}% of peers</strong>
            </div>
            <div style={{ height: '6px', width: '100%', background: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${percentiles.savings_rate}%`, height: '100%', background: '#0D9488', borderRadius: '3px' }} />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
              <span style={{ color: '#0F172A', fontWeight: 600 }}>Everyday Fun Spending</span>
              <strong style={{ color: '#0D9488' }}>Lower than {100 - percentiles.discretionary_spend_ratio}% of peers (Great job!)</strong>
            </div>
            <div style={{ height: '6px', width: '100%', background: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${percentiles.discretionary_spend_ratio}%`, height: '100%', background: '#0D9488', borderRadius: '3px' }} />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
              <span style={{ color: '#0F172A', fontWeight: 600 }}>Emergency Cushion</span>
              <strong style={{ color: '#0D9488' }}>Stronger than {percentiles.cash_runway}% of peers</strong>
            </div>
            <div style={{ height: '6px', width: '100%', background: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${percentiles.cash_runway}%`, height: '100%', background: '#0D9488', borderRadius: '3px' }} />
            </div>
          </div>
        </div>

        {/* Peer Insights List */}
        <div style={{
          background: '#F8FAFC',
          padding: '18px 20px',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Peer Group Highlights
          </span>
          {insights.map((ins, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.82rem', color: '#334155' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0D9488', marginTop: '6px', flexShrink: 0 }} />
              <p style={{ margin: 0, lineHeight: 1.4 }}>{ins}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
