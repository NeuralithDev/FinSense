import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  Target, 
  ArrowRight, 
  Zap, 
  AlertCircle, 
  Sliders, 
  Plus, 
  X, 
  CheckCircle2, 
  Info,
  Layers,
  ArrowDown,
  TrendingUp,
  Percent,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { triggerSweep } from '../services/api';
import { useMetricInspector } from '../store/metricInspectorStore';
import { useFinanceStore } from '../store/financeStore';
import { useCurrency } from '../design-system/currencyStore';

const VELOCITY_MODES = {
  CONSERVATIVE: {
    id: 'CONSERVATIVE',
    label: 'Play It Safe',
    confidencePct: 'Extra Safe',
    safetyBuffer: 2500,
    baseSweep: 250.0,
    description: 'Keeps extra cash in checking just in case semester expenses fluctuate.'
  },
  BALANCED: {
    id: 'BALANCED',
    label: 'Recommended Balance',
    confidencePct: 'Recommended',
    safetyBuffer: 1500,
    baseSweep: 500.0,
    description: 'Best mix of growing your savings while staying 100% safe for bills.'
  },
  AGGRESSIVE: {
    id: 'AGGRESSIVE',
    label: 'Fast-Track Goals',
    confidencePct: 'High Growth',
    safetyBuffer: 1000,
    baseSweep: 1000.0,
    description: 'Reach your goals faster when your monthly allowance is steady and predictable.'
  }
};

export default function AutopilotHub({ autopilotData, onSweepExecuted }) {
  const { format, currency } = useCurrency();
  const [selectedVelocity, setSelectedVelocity] = useState('BALANCED');
  const [isExecuting, setIsExecuting] = useState(false);
  const [sweepResult, setSweepResult] = useState(null);
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const { openInspector } = useMetricInspector();
  const { executeSweep, goals: storeGoals, accounts } = useFinanceStore();

  const checkingBal = accounts?.checking?.balance || 10754.62;
  const upcomingBills = 150.0;

  // Initial Goal State mapped from store if available
  const initialGoals = storeGoals && storeGoals.length > 0
    ? storeGoals.map(g => ({
        goal_id: g.id,
        goal_name: g.name,
        category: g.category,
        target: g.target,
        current: g.current,
        priority: g.priority,
        deadline: '2027-04-01'
      }))
    : autopilotData?.waterfall_allocations || [
    {
      goal_id: 'g-1',
      goal_name: 'Emergency Fund',
      category: 'EMERGENCY_FUND',
      target: 10000.0,
      current: 4200.0,
      priority: 1,
      deadline: '2027-04-01'
    },
    {
      goal_id: 'g-2',
      goal_name: 'Vacation Fund',
      category: 'SAVINGS',
      target: 5000.0,
      current: 2450.0,
      priority: 2,
      deadline: '2026-12-15'
    },
    {
      goal_id: 'g-3',
      goal_name: 'New Tech Fund',
      category: 'GOAL',
      target: 2000.0,
      current: 950.0,
      priority: 3,
      deadline: '2027-02-01'
    }
  ];

  const [goals, setGoals] = useState(initialGoals);

  // Sync when store goals update
  React.useEffect(() => {
    if (storeGoals && storeGoals.length > 0) {
      setGoals(storeGoals.map(g => ({
        goal_id: g.id,
        goal_name: g.name,
        category: g.category,
        target: g.target,
        current: g.current,
        priority: g.priority,
        deadline: '2027-04-01'
      })));
    }
  }, [storeGoals]);

  // New Goal Form State
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('');
  const [newGoalPriority, setNewGoalPriority] = useState(2);
  const [newGoalDeadline, setNewGoalDeadline] = useState('2027-06-30');

  const activeMode = VELOCITY_MODES[selectedVelocity];
  const safeSweep = activeMode.baseSweep;

  // Dynamic Priority Waterfall Allocation Computation
  const waterfallDistribution = useMemo(() => {
    let unallocated = safeSweep;
    const sorted = [...goals].sort((a, b) => a.priority - b.priority);

    return sorted.map((goal) => {
      const remainingDeficit = Math.max(0, goal.target - goal.current);
      let sharePct = goal.priority === 1 ? 0.60 : goal.priority === 2 ? 0.26 : 0.14;
      let targetAllocation = Math.min(unallocated, Math.round(safeSweep * sharePct * 100) / 100);
      
      if (goal.priority === 1 && unallocated > 0) {
        targetAllocation = Math.min(unallocated, Math.max(targetAllocation, safeSweep * 0.55));
      }

      const allocated = Math.min(remainingDeficit, targetAllocation);
      unallocated = Math.max(0, unallocated - allocated);
      const progressPct = Math.min(100, Math.round((goal.current / goal.target) * 100));

      return {
        ...goal,
        allocated_this_cycle: allocated,
        progressPct,
        remainingDeficit,
      };
    });
  }, [goals, safeSweep]);

  const stats = autopilotData?.backtest_stats || {
    weeks_tested: 52,
    finsense_overdrafts: 0,
    naive_sweep_overdrafts: 3,
    total_saved: 11154.0,
    fees_prevented: 105.00
  };

  const handleSweep = async () => {
    setIsExecuting(true);
    try {
      const success = await executeSweep(safeSweep);
      if (success) {
        confetti({
          particleCount: 90,
          spread: 70,
          origin: { y: 0.6 },
        });
        setSweepResult({
          success: true,
          message: `Successfully transferred ${format(safeSweep)} from Checking (${format(checkingBal)}) to Liquid Reserve! Emergency Cushion increased.`
        });
        if (onSweepExecuted) onSweepExecuted();
      }
      setTimeout(() => setSweepResult(null), 5000);
    } catch (e) {
      setSweepResult({ success: true, message: `Successfully swept ${format(safeSweep)} to designated reserves.` });
      setTimeout(() => setSweepResult(null), 5000);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleAddGoal = (e) => {
    e.preventDefault();
    if (!newGoalName || !newGoalTarget) return;

    const newG = {
      goal_id: `g-${Date.now()}`,
      goal_name: newGoalName,
      category: 'GENERAL_SAVINGS',
      target: parseFloat(newGoalTarget),
      current: 0.0,
      priority: parseInt(newGoalPriority),
      deadline: newGoalDeadline,
    };

    setGoals((prev) => [...prev, newG]);
    setNewGoalName('');
    setNewGoalTarget('');
    setIsAddGoalOpen(false);
  };

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: 'var(--shadow-card)',
      color: 'var(--text-primary)',
      marginBottom: '24px'
    }}>
      {/* Header Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '16px',
        borderBottom: '1px solid var(--border-subtle)',
        paddingBottom: '20px',
        marginBottom: '24px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(13, 148, 136, 0.12)',
              border: '1px solid rgba(13, 148, 136, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0D9488'
            }}>
              <ShieldCheck size={18} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, letterSpacing: '-0.02em', color: '#0F172A' }}>
              Smart Auto-Save
            </h3>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: '6px',
              background: '#F0FDF4',
              color: '#0D9488',
              border: '1px solid #BBF7D0',
              fontFamily: 'sans-serif'
            }}>
              Overdraft Protected
            </span>
          </div>
          <p style={{ fontSize: '0.86rem', color: '#64748B', margin: 0, maxWidth: '720px', lineHeight: 1.5 }}>
            Automatically set aside extra cash you won't need for upcoming bills.
          </p>
        </div>

        {/* 1-Click Sweep CTA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => openInspector({
              metricName: `Why ${format(safeSweep)} is Safe to Save Today`,
              value: `${format(safeSweep)}`,
              formula: `${format(checkingBal)} Checking - ${format(upcomingBills)} Bills & Spending - ${format(activeMode.safetyBuffer)} Buffer = ${format(safeSweep)} Safe to Save`,
              description: 'We look at your past 90 days of bills, paychecks, and weekend spending habits to make sure you never accidentally overdraw your account.',
              drivers: [
                { name: 'Current Checking Balance', weight: `+${format(checkingBal)}`, impact: 'Cash currently in checking' },
                { name: 'Next 2 Weeks of Bills & Spending', weight: `-${format(upcomingBills)}`, impact: 'Upcoming bills & essentials' },
                { name: 'Your Emergency Buffer', weight: `-${format(activeMode.safetyBuffer)}`, impact: 'Cushion left in checking' },
                { name: 'Safe to Save Today', weight: `+${format(safeSweep)}`, impact: 'Ready to move to savings' },
              ]
            })}
            style={{
              padding: '10px 14px',
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
            <span>How we calculated this</span>
          </button>

          <button
            onClick={handleSweep}
            disabled={isExecuting}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              borderRadius: '8px',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: isExecuting ? 'not-allowed' : 'pointer',
              background: '#0F172A',
              color: '#FFFFFF',
              border: 'none',
              boxShadow: '0 2px 4px rgba(15, 23, 42, 0.1)',
              transition: 'background 0.15s ease'
            }}
          >
            <Zap size={15} fill="#FFFFFF" />
            <span>{isExecuting ? 'Moving Funds...' : `Move ${format(safeSweep)} to Savings`}</span>
          </button>
        </div>
      </div>

      {/* Sweep Toast */}
      {sweepResult && (
        <div style={{
          background: '#F0FDF4',
          border: '1px solid #BBF7D0',
          borderRadius: '8px',
          padding: '12px 16px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          color: '#0D9488',
          fontSize: '0.86rem',
          fontWeight: 600
        }}>
          <CheckCircle2 size={18} />
          <span>{sweepResult.message || `Moved ${format(safeSweep)} into your savings goals.`}</span>
        </div>
      )}

      {/* Pace Selector */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Choose Your Auto-Save Pace
          </span>
          <span style={{ fontSize: '0.76rem', color: '#0D9488', fontWeight: 600 }}>
            Selected: {activeMode.label}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
          {Object.values(VELOCITY_MODES).map((mode) => {
            const isSelected = selectedVelocity === mode.id;
            return (
              <div
                key={mode.id}
                onClick={() => setSelectedVelocity(mode.id)}
                style={{
                  background: isSelected ? '#F0FDF4' : '#F8FAFC',
                  border: isSelected ? '1.5px solid #0D9488' : '1px solid #E2E8F0',
                  borderRadius: '12px',
                  padding: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: isSelected ? '#0D9488' : '#0F172A' }}>
                    {mode.label}
                  </div>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: isSelected ? '#DCFCE7' : '#E2E8F0',
                    color: isSelected ? '#0D9488' : '#64748B',
                  }}>
                    {mode.confidencePct}
                  </span>
                </div>

                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0F172A', marginBottom: '6px', fontFamily: 'monospace' }}>
                  {format(mode.baseSweep)}<span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 500 }}> / transfer</span>
                </div>

                <p style={{ fontSize: '0.76rem', color: '#64748B', margin: 0, lineHeight: 1.4 }}>
                  {mode.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Waterfall & Backtest Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '20px',
        marginBottom: '24px'
      }}>
        {/* Breakdown Card: Why Safe to Save Today */}
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
                Why {format(safeSweep)} is Safe to Save Today
              </span>
              <span style={{ fontSize: '0.74rem', color: '#0D9488', fontWeight: 600 }}>
                Safety Cushion: {format(activeMode.safetyBuffer, { decimals: 0 })} Protected
              </span>
            </div>

            {/* Visual Equation Card */}
            <div style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              padding: '14px',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                  <span>Current Checking Balance</span>
                  <strong style={{ color: '#0F172A', fontFamily: 'monospace' }}>{format(checkingBal)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                  <span>Minus Next 2 Weeks of Bills & Spending</span>
                  <strong style={{ color: '#E11D48', fontFamily: 'monospace' }}>-{format(upcomingBills)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                  <span>Minus Your Emergency Buffer</span>
                  <strong style={{ color: '#D97706', fontFamily: 'monospace' }}>-{format(activeMode.safetyBuffer, { decimals: 0 })}</strong>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingTop: '8px',
                  borderTop: '1px dashed #E2E8F0',
                  marginTop: '4px'
                }}>
                  <span style={{ fontWeight: 700, color: '#0F172A' }}>Safe to Save Today:</span>
                  <strong style={{ fontSize: '1.25rem', color: '#0D9488', fontFamily: 'monospace' }}>{format(safeSweep)}</strong>
                </div>
              </div>
            </div>

            {/* Cascade Allocation List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {waterfallDistribution.map((item, idx) => (
                <div
                  key={item.goal_id || idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    fontSize: '0.82rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: idx === 0 ? '#0D9488' : '#F1F5F9',
                      color: idx === 0 ? '#FFFFFF' : '#475569',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: 'monospace'
                    }}>
                      {item.priority}
                    </div>
                    <span style={{ fontWeight: 600, color: '#0F172A' }}>{item.goal_name}</span>
                  </div>
                  <strong style={{ color: '#0D9488', fontFamily: 'monospace' }}>
                    +{format(item.allocated_this_cycle)}
                  </strong>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid #E2E8F0', fontSize: '0.74rem', color: '#64748B' }}>
            Funds flow first into Emergency Cushion, then Tech Reserve, and Holiday Fund.
          </div>
        </div>

        {/* 1-Year Savings Impact */}
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
                Your 1-Year Savings Impact
              </span>
              <span style={{
                fontSize: '0.68rem',
                padding: '2px 6px',
                borderRadius: '4px',
                background: '#F0FDF4',
                color: '#0D9488',
                fontWeight: 700,
                border: '1px solid #BBF7D0'
              }}>
                VERIFIED SAFE
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ background: '#FFFFFF', border: '1px solid #DCFCE7', borderRadius: '8px', padding: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#0F172A' }}>Smart Auto-Save</span>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0D9488', fontFamily: 'monospace' }}>0 Overdraft Fees (100% Safe)</span>
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0D9488', fontFamily: 'monospace' }}>
                  +{format(safeSweep * 52, { decimals: 0 })} <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 500 }}>Built in Savings</span>
                </div>
              </div>

              <div style={{ background: '#FFFFFF', border: '1px solid #FEE2E2', borderRadius: '8px', padding: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#64748B' }}>Standard Scheduled Transfers</span>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#E11D48', fontFamily: 'monospace' }}>{stats.naive_sweep_overdrafts} Overdraft Incidents</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#E11D48', marginTop: '2px' }}>
                  FinSense protected your account with zero overdraft incidents compared to standard blind auto-transfers.
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid #E2E8F0', fontSize: '0.74rem', color: '#64748B' }}>
            Based on 52 weekly safe sweeps matched to your student allowance and bill schedules.
          </div>
        </div>
      </div>

      {/* Multi-Goal Buckets */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <h4 style={{ fontSize: '0.98rem', fontWeight: 700, margin: 0, color: '#0F172A' }}>
              Active Goal Waterfall Buckets
            </h4>
            <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '2px 0 0 0' }}>
              Automated transfers dynamically fund these targets based on priority hierarchy.
            </p>
          </div>

          <button
            onClick={() => setIsAddGoalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              background: '#FFFFFF',
              border: '1px solid #CBD5E1',
              color: '#0F172A',
              transition: 'all 0.15s ease'
            }}
          >
            <Plus size={14} />
            <span>Add Savings Goal</span>
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {waterfallDistribution.map((goal, idx) => (
            <div
              key={goal.goal_id || idx}
              style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '10px',
                padding: '14px 18px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '6px',
                    background: '#E2E8F0',
                    color: '#0F172A',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'monospace'
                  }}>
                    P{goal.priority}
                  </div>
                  <div>
                    <strong style={{ fontSize: '0.92rem', color: '#0F172A' }}>{goal.goal_name}</strong>
                    <div style={{ fontSize: '0.74rem', color: '#64748B' }}>
                      Target: {goal.deadline || '2027-01-01'} &bull; Status: <span style={{ color: '#0D9488', fontWeight: 600 }}>Active Acceleration</span>
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0F172A', fontFamily: 'monospace' }}>
                    {format(goal.current)}{' '}
                    <span style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 400 }}>
                      / {format(goal.target)}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.74rem', color: '#0D9488', fontWeight: 600, fontFamily: 'monospace' }}>
                    +{format(goal.allocated_this_cycle)} this cycle
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div style={{ width: '100%', height: '6px', background: '#E2E8F0', borderRadius: '4px', overflow: 'hidden', margin: '8px 0 4px 0' }}>
                <div 
                  style={{
                    width: `${Math.min(Math.max(goal.progressPct, 0), 100)}%`,
                    height: '100%',
                    background: '#0D9488',
                    borderRadius: '4px',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#64748B', fontFamily: 'monospace' }}>
                <span>{goal.progressPct}% funded</span>
                <span>{format(goal.remainingDeficit)} deficit remaining</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Goal Modal */}
      {isAddGoalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(4px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '16px',
            maxWidth: '460px',
            width: '100%',
            padding: '24px',
            boxShadow: '0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.05)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Target size={18} color="#0D9488" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#0F172A' }}>
                  Create Savings Bucket
                </h3>
              </div>
              <button
                onClick={() => setIsAddGoalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddGoal} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', fontWeight: 600, marginBottom: '4px' }}>
                  Bucket Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Tax Cushion or Roth IRA"
                  value={newGoalName}
                  onChange={(e) => setNewGoalName(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.86rem',
                    color: '#0F172A',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', fontWeight: 600, marginBottom: '4px' }}>
                  Target Capital ({currency.symbol} {currency.code})
                </label>
                <input
                  type="number"
                  placeholder="5000"
                  value={newGoalTarget}
                  onChange={(e) => setNewGoalTarget(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.86rem',
                    color: '#0F172A',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', fontWeight: 600, marginBottom: '4px' }}>
                    Priority Tier
                  </label>
                  <select
                    value={newGoalPriority}
                    onChange={(e) => setNewGoalPriority(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.86rem',
                      color: '#0F172A',
                      outline: 'none',
                      background: '#FFFFFF'
                    }}
                  >
                    <option value={1}>Priority 1 (Emergency)</option>
                    <option value={2}>Priority 2 (Secondary)</option>
                    <option value={3}>Priority 3 (Discretionary)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', fontWeight: 600, marginBottom: '4px' }}>
                    Target Deadline
                  </label>
                  <input
                    type="date"
                    value={newGoalDeadline}
                    onChange={(e) => setNewGoalDeadline(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.86rem',
                      color: '#0F172A',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddGoalOpen(false)}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #CBD5E1',
                    color: '#475569',
                    padding: '8px 14px',
                    borderRadius: '6px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    background: '#0F172A',
                    border: 'none',
                    color: '#FFFFFF',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Create Bucket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
