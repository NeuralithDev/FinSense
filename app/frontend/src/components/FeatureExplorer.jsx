import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  Info, 
  ArrowUpRight,
  ShieldCheck,
  Award
} from 'lucide-react';
import { fetchFeatureExplorer } from '../services/api';
import { useMetricInspector } from '../store/metricInspectorStore';

export default function FeatureExplorer() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { openInspector } = useMetricInspector();

  useEffect(() => {
    loadFeatures();
  }, []);

  const loadFeatures = async () => {
    setLoading(true);
    try {
      const res = await fetchFeatureExplorer('0');
      setData(res);
    } catch (e) {
      console.error('Failed to load money health data:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '16px',
        padding: '32px',
        textAlign: 'center',
        color: '#64748B'
      }}>
        Calculating your personalized Money Health Score...
      </div>
    );
  }

  const score = 86;
  const pillars = [
    { name: '1. Steady Income vs. Bills', score: 100, desc: 'Your regular paychecks comfortably cover your monthly bills with zero deficit.' },
    { name: '2. Emergency Savings Cushion', score: 80, desc: 'You have 4.8 months of living expenses safely set aside in liquid savings.' },
    { name: '3. Protection from Surprise Expenses', score: 80, desc: 'Real-time bill and overdraft protection actively shields your checking balance.' },
    { name: '4. Manageable Monthly Commitments', score: 83, desc: 'Recurring subscriptions and debt obligations remain well below 20% of your take-home pay.' },
  ];

  return (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid #E2E8F0',
      borderRadius: '16px',
      padding: '28px',
      boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
      color: '#0F172A',
      marginBottom: '24px'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '16px',
        borderBottom: '1px solid #F1F5F9',
        paddingBottom: '20px',
        marginBottom: '24px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
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
              <Heart size={18} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, letterSpacing: '-0.02em', color: '#0F172A' }}>
              Your Money Health Score
            </h3>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: '6px',
              background: '#F0FDF4',
              color: '#0D9488',
              border: '1px solid #BBF7D0'
            }}>
              Great Shape!
            </span>
          </div>
          <p style={{ fontSize: '0.86rem', color: '#64748B', margin: 0, maxWidth: '720px', lineHeight: 1.5 }}>
            A comprehensive, transparent view of your day-to-day cash resilience, upcoming bill coverage, and emergency savings peace of mind.
          </p>
        </div>

        <button
          onClick={() => openInspector({
            metricName: 'Money Health Score',
            value: '86 / 100 (Great Shape!)',
            formula: 'Equal balance of income consistency, emergency savings, expense protection, and debt load',
            description: 'We continuously analyze your past 90 days of transactions, bills, and paydays to ensure you remain resilient and overdraft-free.',
            drivers: [
              { name: 'Income vs. Bills', weight: '25%', impact: '100% Inflow covers all commitments' },
              { name: 'Emergency Savings', weight: '25%', impact: '4.8 Months of living costs' },
              { name: 'Surprise Protection', weight: '25%', impact: 'Active bill guard and zero overdraft fees' },
              { name: 'Monthly Commitments', weight: '25%', impact: 'Low subscription overhead' },
            ]
          })}
          style={{
            padding: '8px 14px',
            borderRadius: '8px',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer',
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            color: '#475569',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Info size={14} />
          <span>How this is calculated</span>
        </button>
      </div>

      {/* Main Score Hero Card */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '24px',
        background: '#F8FAFC',
        border: '1px solid #E2E8F0',
        borderRadius: '14px',
        padding: '24px',
        marginBottom: '28px',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            background: '#FFFFFF',
            border: '4px solid #0D9488',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 4px 12px rgba(13, 148, 136, 0.15)'
          }}>
            <span style={{ fontSize: '1.9rem', fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>{score}</span>
            <span style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>/ 100</span>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0F172A' }}>Great Shape!</span>
              <span style={{ fontSize: '0.74rem', fontWeight: 600, color: '#0D9488', background: '#ECFDF5', padding: '2px 8px', borderRadius: '4px' }}>Top 18%</span>
            </div>
            <p style={{ fontSize: '0.84rem', color: '#475569', margin: 0, lineHeight: 1.4 }}>
              Your financial foundation is strong. Your income reliably replenishes your savings, and upcoming bills are comfortably covered.
            </p>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '12px'
        }}>
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '12px 14px' }}>
            <span style={{ fontSize: '0.7rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>Emergency Cushion</span>
            <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0F172A', marginTop: '2px' }}>4.8 Months</div>
            <span style={{ fontSize: '0.7rem', color: '#0D9488', fontWeight: 600 }}>Strong & Safe</span>
          </div>

          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '12px 14px' }}>
            <span style={{ fontSize: '0.7rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>Overdraft Risk</span>
            <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0D9488', marginTop: '2px' }}>0.00%</div>
            <span style={{ fontSize: '0.7rem', color: '#0D9488', fontWeight: 600 }}>Fully Protected</span>
          </div>
        </div>
      </div>

      {/* The 4 Pillars */}
      <div>
        <h4 style={{ fontSize: '0.94rem', fontWeight: 700, color: '#0F172A', marginBottom: '16px' }}>
          The 4 Pillars of Your Financial Health
        </h4>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px'
        }}>
          {pillars.map((p, idx) => (
            <div
              key={idx}
              style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                padding: '18px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#0F172A' }}>{p.name}</span>
                <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#0D9488' }}>{p.score}%</span>
              </div>
              <div style={{ height: '6px', width: '100%', background: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${p.score}%`, height: '100%', background: '#0D9488', borderRadius: '3px' }} />
              </div>
              <p style={{ fontSize: '0.78rem', color: '#64748B', margin: 0, lineHeight: 1.4 }}>
                {p.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
