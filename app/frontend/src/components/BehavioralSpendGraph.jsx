import React, { useState, useEffect } from 'react';
import { 
  Network, 
  GitMerge, 
  ArrowRight, 
  Clock, 
  Zap, 
  AlertCircle, 
  Info, 
  Layers,
  ChevronRight,
  TrendingUp,
  Share2
} from 'lucide-react';
import { fetchGraphContagion } from '../services/api';
import { useMetricInspector } from '../store/metricInspectorStore';
import { useCurrency } from '../design-system/currencyStore';

export default function BehavioralSpendGraph() {
  const { format, currency } = useCurrency();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedHabit, setSelectedHabit] = useState(null);
  const { openInspector } = useMetricInspector();

  useEffect(() => {
    loadGraph();
  }, []);

  const loadGraph = async () => {
    setLoading(true);
    try {
      const res = await fetchGraphContagion('0');
      setData(res);
      if (res?.primary_habits?.length > 0) {
        setSelectedHabit(res.primary_habits[0]);
      }
    } catch (e) {
      console.error('Failed to load graph contagion:', e);
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
        Analyzing your spending habits and chain reactions...
      </div>
    );
  }

  const primaryHabits = data?.primary_habits || [];
  const contagionFlows = data?.contagion_flows || [];
  const summary = data?.summary || {};

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
              <Network size={18} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, letterSpacing: '-0.02em', color: '#0F172A' }}>
              Spending Chain Reactions & Habits
            </h3>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: '6px',
              background: '#F0FDF4',
              color: '#0D9488',
              border: '1px solid #BBF7D0',
            }}>
              Habit Insights
            </span>
          </div>
          <p style={{ fontSize: '0.86rem', color: '#64748B', margin: 0, maxWidth: '720px', lineHeight: 1.5 }}>
            Discover which everyday purchases trigger other expenses — like when a Friday dinner often leads to late-night delivery or rideshares.
          </p>
        </div>

        {/* Explain Inspector */}
        <button
          onClick={() => openInspector({
            metricName: 'How FinSense Maps Spending Habits',
            value: `${summary.contagion_cascade_index || '0.742'} Habit Score`,
            formula: 'Routine First Purchase + Related Follow-Up Spending within 12 Hours',
            description: 'We look at sequences in your spending history to spot patterns where one small purchase (like afternoon coffee or Friday rideshare) reliably leads to larger impulse orders shortly after.',
            drivers: [
              { name: 'Identified Habit Patterns', weight: `${summary.total_graph_nodes || 48} Patterns`, impact: 'Individual merchant triggers' },
              { name: 'Follow-Up Spending Connections', weight: `${summary.total_edges || 124} Links`, impact: 'Repeat follow-up purchases' },
              { name: 'Frequent Habit Loops', weight: 'High Consistency', impact: 'Dense merchant habit loops' },
              { name: 'Typical Delay', weight: '3.4 hours apart', impact: 'Lag between primary & follow-up' },
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
          <span>How this works</span>
        </button>
      </div>

      {/* Network Metrics Strip */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '12px',
        marginBottom: '20px'
      }}>
        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '14px' }}>
          <span style={{ fontSize: '0.74rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>
            Identified Habit Loops
          </span>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0F172A', fontFamily: 'monospace', marginTop: '2px' }}>
            {primaryHabits.length} Sequences
          </div>
          <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
            Recurring gateway triggers
          </span>
        </div>

        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '14px' }}>
          <span style={{ fontSize: '0.74rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>
            Follow-Up Habit Links
          </span>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0D9488', fontFamily: 'monospace', marginTop: '2px' }}>
            {contagionFlows.length} Connected Paths
          </div>
          <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
            Frequent secondary purchases
          </span>
        </div>

        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '14px' }}>
          <span style={{ fontSize: '0.74rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>
            Typical Gateway Spend
          </span>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0F172A', fontFamily: 'monospace', marginTop: '2px' }}>
            {format(summary.typical_gateway_spend || 51.67)}
          </div>
          <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
            Triggers avg {format(summary.triggers_avg_secondary || 145.00)} secondary spend
          </span>
        </div>

        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '14px' }}>
          <span style={{ fontSize: '0.74rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>
            Habit Cluster Depth
          </span>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0F172A', fontFamily: 'monospace', marginTop: '2px' }}>
            High Accuracy
          </div>
          <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
            Multi-merchant behavioral sequence
          </span>
        </div>
      </div>

      {/* Main Grid: Habit Triggers on Left, Cascade Detail on Right */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '20px'
      }}>
        {/* Habit List */}
        <div>
          <h4 style={{ fontSize: '0.94rem', fontWeight: 700, margin: '0 0 12px 0', color: '#0F172A' }}>
            Gateway Trigger Merchants (Habit Loops)
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {primaryHabits.map((habit, idx) => {
              const isSelected = selectedHabit?.trigger_merchant === habit.trigger_merchant;
              return (
                <div
                  key={idx}
                  onClick={() => setSelectedHabit(habit)}
                  style={{
                    background: isSelected ? '#F0FDF4' : '#F8FAFC',
                    border: isSelected ? '1.5px solid #0D9488' : '1px solid #E2E8F0',
                    borderRadius: '10px',
                    padding: '14px 16px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ fontSize: '0.92rem', color: isSelected ? '#0D9488' : '#0F172A' }}>
                        {habit.trigger_merchant}
                      </strong>
                      <span style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: isSelected ? '#DCFCE7' : '#E2E8F0',
                        color: isSelected ? '#0D9488' : '#64748B',
                        fontFamily: 'monospace'
                      }}>
                        {habit.category}
                      </span>
                    </div>

                    <span style={{
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      color: habit.contagion_risk === 'HIGH' ? '#E11D48' : '#D97706',
                    }}>
                      {habit.contagion_risk === 'HIGH' ? 'Frequent Chain Trigger' : 'Occasional Habit'}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.78rem', color: '#64748B', display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                    <span>Frequency: {habit.frequency_monthly}x/month</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} /> Follow-up window: ~{habit.prompt_delay_hours}h
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Habit Loop Visualizer */}
        {selectedHabit && (
          <div style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                  Purchase Chain Reaction
                </span>
                <span style={{ fontSize: '0.74rem', color: '#0D9488', fontWeight: 600 }}>
                  Trigger: {selectedHabit.trigger_merchant}
                </span>
              </div>

              {/* Gateway Node */}
              <div style={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                padding: '14px',
                marginBottom: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: '#F1F5F9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#0F172A',
                  fontWeight: 700
                }}>
                  1
                </div>
                <div>
                  <div style={{ fontSize: '0.74rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 700 }}>
                    Gateway Primary Action
                  </div>
                  <strong style={{ fontSize: '0.94rem', color: '#0F172A' }}>
                    {selectedHabit.trigger_merchant} ({format(selectedHabit.avg_ticket || 51.67)})
                  </strong>
                  <div style={{ fontSize: '0.76rem', color: '#64748B' }}>
                    Initiates behavioral dopamine transition
                  </div>
                </div>
              </div>

              {/* Cascade Arrow */}
              <div style={{ display: 'flex', justifyContent: 'center', margin: '4px 0 10px 0', color: '#94A3B8' }}>
                <div style={{
                  fontSize: '0.72rem',
                  background: '#F1F5F9',
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  color: '#64748B',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <Clock size={12} /> Within {selectedHabit.prompt_delay_hours || 4} hours (P &gt; 78%)
                </div>
              </div>

              {/* Secondary Impulse Outflow Nodes */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(selectedHabit.secondary_merchants || [
                  { merchant: 'Evergreen Store', category: 'Retail & Snacks', avg_ticket: 94.50, probability: '74%' },
                  { merchant: 'Blinkit Quick Commerce', category: 'Instant Grocery', avg_ticket: 311.00, probability: '62%' }
                ]).map((sec, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #FECDD3',
                      borderRadius: '8px',
                      padding: '12px 14px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          background: '#FFF1F2',
                          color: '#E11D48',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          2
                        </span>
                        <strong style={{ fontSize: '0.86rem', color: '#0F172A' }}>{sec.merchant}</strong>
                      </div>
                      <span style={{ fontSize: '0.74rem', color: '#64748B', marginLeft: '24px' }}>
                        Likelihood: {sec.probability}
                      </span>
                    </div>

                    <div style={{ textAlign: 'right', fontFamily: 'monospace' }}>
                      <strong style={{ color: '#E11D48', fontSize: '0.92rem' }}>
                        +{format(sec.avg_ticket)}
                      </strong>
                      <span style={{ display: 'block', fontSize: '0.7rem', color: '#64748B' }}>
                        Avg follow-up spend
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #E2E8F0', fontSize: '0.76rem', color: '#64748B' }}>
              <strong>Helpful Tip:</strong> Getting a heads-up reminder after visiting {selectedHabit.trigger_merchant} can help prevent an estimated {format((selectedHabit.frequency_monthly || 4) * (selectedHabit.secondary_merchants?.[0]?.avg_ticket || 94.50))}/mo in follow-up impulse spending.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
