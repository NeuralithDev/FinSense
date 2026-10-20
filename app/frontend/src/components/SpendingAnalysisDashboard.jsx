import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  ShieldCheck, 
  Clock, 
  Flame, 
  Sliders, 
  Calendar, 
  Layers, 
  ArrowRight, 
  CheckCircle2, 
  Lock, 
  Unlock, 
  Zap, 
  X, 
  RefreshCw, 
  Compass, 
  Info,
  DollarSign
} from 'lucide-react';
import { useMetricInspector } from '../store/metricInspectorStore';
import { useCurrency } from '../design-system/currencyStore';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

const formatHourRange = (h) => {
  const start = h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`;
  const next = (h + 1) % 24;
  const end = next === 0 ? '12 AM' : next < 12 ? `${next} AM` : next === 12 ? '12 PM' : `${next - 12} PM`;
  return `${start} – ${end}`;
};

const GENERATE_HEATMAP_DATA = () => {
  const data = {};
  DAYS.forEach((day, dIdx) => {
    data[day] = HOURS.map((hour) => {
      let intensity = 10;
      let spend = 0;
      let trigger = 'Routine Campus Daily Spend';

      if (dIdx < 5 && hour >= 7 && hour <= 9) {
        intensity = 35;
        spend = 65.00;
        trigger = 'Campus Commute & Morning Chai';
      } else if (dIdx < 5 && hour >= 12 && hour <= 13) {
        intensity = 45;
        spend = 140.00;
        trigger = 'Campus Canteen & Midday Lunch';
      } else if ((dIdx === 4 || dIdx === 5) && hour >= 20 && hour <= 23) {
        intensity = dIdx === 4 ? 85 : 92;
        spend = dIdx === 4 ? 650.00 : 840.00;
        trigger = dIdx === 4 ? "Friday Night Dinner & Domino's Order" : 'Weekend Outing & Social Dining';
      } else if (hour >= 23 || hour <= 1) {
        intensity = 65;
        spend = 310.00;
        trigger = 'Late-Night Study Snacks & Blinkit Delivery';
      } else if (dIdx === 6 && hour >= 16 && hour <= 19) {
        intensity = 55;
        spend = 420.00;
        trigger = 'Sunday Grocery Restock (Blinkit & Balaji Provisions)';
      } else if (dIdx === 5 && hour >= 13 && hour <= 17) {
        intensity = 70;
        spend = 550.00;
        trigger = 'Weekend Personal Shopping & Bookstore';
      } else {
        intensity = Math.max(8, Math.floor(Math.sin(hour * 0.3) * 15 + 15));
        spend = intensity > 20 ? 80.00 : 0;
      }

      return { hour, intensity, avgSpend: spend, trigger };
    });
  });
  return data;
};

const HEATMAP_DATA = GENERATE_HEATMAP_DATA();

export default function SpendingAnalysisDashboard({ 
  subscriptionData, 
  onRunwayUpdated 
}) {
  const { currency, format } = useCurrency();
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [selectedCell, setSelectedCell] = useState({
    day: 'Fri',
    hour: 21,
    intensity: 88,
    avgSpend: 650.00,
    trigger: 'Post-Work Fatigue & Food Delivery'
  });
  const [shieldActive, setShieldActive] = useState(false);
  const { openInspector } = useMetricInspector();

  // Counterfactual sliders
  const [diningDriftPct, setDiningDriftPct] = useState(15);
  const [subsPrunedCount, setSubsPrunedCount] = useState(2);
  const [sweepVelocity, setSweepVelocity] = useState(850);

  const simulationResults = useMemo(() => {
    const baseSavings = 10755;
    const baseMonthlyIncome = 28000;
    const baseMonthlyExpenses = 24890;
    
    const diningSavings = (diningDriftPct / 100) * 4500;
    const subsSavings = subsPrunedCount * 299;
    const netSurplusDelta = diningSavings + subsSavings;
    const annualNetGain = netSurplusDelta * 12 + (sweepVelocity * 26 * 0.065);
    
    const baselinePoints = [];
    const simulatedPoints = [];
    let curBase = baseSavings;
    let curSim = baseSavings;

    for (let m = 0; m <= 12; m++) {
      if (m === 0) {
        baselinePoints.push({ month: 0, balance: curBase });
        simulatedPoints.push({ month: 0, balance: curSim });
      } else {
        curBase += (baseMonthlyIncome - baseMonthlyExpenses);
        curSim += (baseMonthlyIncome - (baseMonthlyExpenses - netSurplusDelta));
        baselinePoints.push({ month: m, balance: Math.round(curBase) });
        simulatedPoints.push({ month: m, balance: Math.round(curSim) });
      }
    }

    const runwayExtensionMonths = Math.min(6.5, Math.max(0.5, (netSurplusDelta * 12) / (baseMonthlyExpenses || 1)));

    return {
      annualNetGain: Math.round(annualNetGain),
      monthlyNetDelta: Math.round(netSurplusDelta),
      runwayExtensionMonths: runwayExtensionMonths.toFixed(1),
      baselinePoints,
      simulatedPoints,
      endBaseline: baselinePoints[12].balance,
      endSimulated: simulatedPoints[12].balance,
    };
  }, [diningDriftPct, subsPrunedCount, sweepVelocity]);

  // Chart dimensions
  const chartW = 740;
  const chartH = 180;
  const pad = { top: 15, right: 25, bottom: 25, left: 55 };
  const plotW = chartW - pad.left - pad.right;
  const plotH = chartH - pad.top - pad.bottom;

  const maxVal = Math.max(simulationResults.endSimulated, simulationResults.endBaseline, 8000);
  const minVal = Math.min(simulationResults.baselinePoints[0].balance, 3500);

  const getX = (m) => pad.left + (m / 12) * plotW;
  const getY = (val) => pad.top + plotH - ((val - minVal) / (maxVal - minVal || 1)) * plotH;

  const baselinePath = simulationResults.baselinePoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(p.month)} ${getY(p.balance)}`)
    .join(' ');

  const simulatedPath = simulationResults.simulatedPoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(p.month)} ${getY(p.balance)}`)
    .join(' ');

  const getCellColor = (intensity) => {
    if (intensity < 25) return '#F1F5F9'; // Low
    if (intensity < 50) return '#CCFBF1'; // Emerald 100
    if (intensity < 75) return '#FEF3C7'; // Amber 100
    return '#FEE2E2'; // Crimson 100
  };

  const getCellBorder = (intensity) => {
    if (intensity < 25) return '#E2E8F0';
    if (intensity < 50) return '#99F6E4';
    if (intensity < 75) return '#FDE68A';
    return '#FECDD3';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', color: '#0F172A' }}>
      
      {/* 1. Header Banner */}
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
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
                <Compass size={18} />
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em', margin: 0, color: '#0F172A' }}>
                When & Where You Impulse Spend
              </h2>
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
                Habit Insights
              </span>
            </div>
            <p style={{ fontSize: '0.86rem', color: '#64748B', maxWidth: '740px', lineHeight: 1.5, margin: 0 }}>
              Spot the everyday habits and times of week that quietly drain your wallet.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              padding: '8px 14px',
              textAlign: 'right'
            }}>
              <div style={{ fontSize: '0.7rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>Impulse Spend Rate</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0D9488', fontFamily: 'monospace' }}>
                -4.2% <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 500 }}>Lower than Peers</span>
              </div>
            </div>

            <div style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              padding: '8px 14px',
              textAlign: 'right'
            }}>
              <div style={{ fontSize: '0.7rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>Spending Guard</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0F172A' }}>
                {shieldActive ? 'Active' : 'Ready'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Temporal Vulnerability Matrix (24h x 7d) */}
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Flame size={18} color="#E11D48" />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: '#0F172A' }}>
                Temporal Spending Vulnerability Matrix (24h &times; 7d)
              </h3>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '2px 0 0 0' }}>
              Pinpoints exact hours of decision fatigue and emotional spending risk before transactions occur.
            </p>
          </div>

          {/* Category Tabs */}
          <div style={{ display: 'flex', gap: '4px', background: '#F8FAFC', padding: '3px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
            {[
              { id: 'ALL', label: 'All Discretionary' },
              { id: 'DINING', label: 'Delivery & Dining' },
              { id: 'IMPULSE', label: 'Algorithmic Retail' },
              { id: 'SOCIAL', label: 'Weekend Social' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setFilterCategory(cat.id)}
                style={{
                  background: filterCategory === cat.id ? '#0F172A' : 'transparent',
                  color: filterCategory === cat.id ? '#FFFFFF' : '#475569',
                  fontWeight: 600,
                  fontSize: '0.76rem',
                  border: 'none',
                  padding: '5px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Heatmap Grid & Telemetry Card */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', alignItems: 'start' }}>
          
          {/* Heatmap Grid */}
          <div style={{ overflowX: 'auto', paddingBottom: '8px' }}>
            <div style={{ display: 'flex', marginLeft: '42px', marginBottom: '6px', gap: '3px' }}>
              {HOURS.map((h) => (
                <div 
                  key={h} 
                  style={{
                    flex: 1,
                    minWidth: '20px',
                    textAlign: 'center',
                    fontSize: '0.65rem',
                    fontFamily: 'monospace',
                    color: h % 4 === 0 ? '#64748B' : '#CBD5E1',
                    fontWeight: 600
                  }}
                >
                  {h % 4 === 0 ? `${h}h` : ''}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {DAYS.map((day) => (
                <div key={day} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '36px', fontSize: '0.76rem', fontWeight: 600, color: '#64748B' }}>
                    {day}
                  </div>
                  <div style={{ display: 'flex', flex: 1, gap: '3px' }}>
                    {HEATMAP_DATA[day].map((cell) => {
                      const isSelected = selectedCell.day === day && selectedCell.hour === cell.hour;
                      return (
                        <div
                          key={cell.hour}
                          onClick={() => setSelectedCell({ day, ...cell })}
                          onMouseEnter={() => setSelectedCell({ day, ...cell })}
                          style={{
                            flex: 1,
                            minWidth: '20px',
                            height: '22px',
                            borderRadius: '3px',
                            background: getCellColor(cell.intensity),
                            border: isSelected ? '1.5px solid #0F172A' : `1px solid ${getCellBorder(cell.intensity)}`,
                            cursor: 'pointer',
                            transition: 'all 0.1s ease',
                          }}
                          title={`${day} ${cell.hour}:00 — Risk ${cell.intensity}% (${format(cell.avgSpend)})`}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', marginTop: '14px', fontSize: '0.72rem', color: '#64748B' }}>
              <span>Low Risk</span>
              <div style={{ display: 'flex', gap: '4px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: '#F1F5F9', border: '1px solid #E2E8F0' }} />
                <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: '#CCFBF1', border: '1px solid #99F6E4' }} />
                <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: '#FEF3C7', border: '1px solid #FDE68A' }} />
                <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: '#FEE2E2', border: '1px solid #FECDD3' }} />
              </div>
              <span style={{ color: '#E11D48', fontWeight: 600 }}>High Risk</span>
            </div>
          </div>

          {/* Telemetry Inspection Card */}
          <div style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            padding: '18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0D9488', textTransform: 'uppercase' }}>
                {selectedCell.day} Window ({formatHourRange(selectedCell.hour)})
              </span>
              <span style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '6px',
                background: selectedCell.intensity > 70 ? '#FFF1F2' : '#F0FDF4',
                color: selectedCell.intensity > 70 ? '#E11D48' : '#0D9488',
                border: selectedCell.intensity > 70 ? '1px solid #FECDD3' : '1px solid #BBF7D0',
              }}>
                {selectedCell.intensity > 70 ? 'Elevated Spend Risk' : 'Typical Habit'}
              </span>
            </div>

            <div>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0F172A' }}>
                {selectedCell.day} Pattern ({formatHourRange(selectedCell.hour)})
              </div>
              <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: '4px', lineHeight: 1.4 }}>
                You usually spend around <strong>{format(selectedCell.avgSpend || 80)}</strong> during this window.
              </div>
            </div>

            <div style={{ background: '#FFFFFF', padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '0.7rem', color: '#64748B', textTransform: 'uppercase', marginBottom: '2px', fontWeight: 600 }}>
                What Usually Sparks This
              </div>
              <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#0F172A' }}>
                {selectedCell.trigger || 'Everyday campus spending & UPI payments'}
              </div>
            </div>

            <p style={{ fontSize: '0.78rem', color: '#64748B', lineHeight: 1.4, margin: 0 }}>
              FinSense can send you a gentle notification before this window starts to help keep your student budget on track.
            </p>

            <button
              onClick={() => setShieldActive(!shieldActive)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                background: shieldActive ? '#F0FDF4' : '#0F172A',
                border: shieldActive ? '1px solid #BBF7D0' : 'none',
                color: shieldActive ? '#0D9488' : '#FFFFFF',
                transition: 'all 0.15s ease',
              }}
            >
              {shieldActive ? <ShieldCheck size={14} /> : <Lock size={14} />}
              <span>{shieldActive ? 'Reminder Set for Sundays' : 'Send Me a Heads-Up Reminder on Sundays'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Small Tweaks Simulator */}
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sliders size={18} color="#0D9488" />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: '#0F172A' }}>
                See How Small Tweaks Grow Your Savings
              </h3>
            </div>
            <p style={{ fontSize: '0.84rem', color: '#64748B', margin: '2px 0 0 0' }}>
              Test small changes to your everyday spending to see how much faster your savings can grow.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ background: '#F0FDF4', border: '1.5px solid #BBF7D0', borderRadius: '10px', padding: '8px 16px', textAlign: 'right' }}>
              <div style={{ fontSize: '0.7rem', color: '#0D9488', textTransform: 'uppercase', fontWeight: 700 }}>Extra Yearly Savings</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0D9488' }}>
                You'll save an extra +{format(simulationResults.annualNetGain)} this year!
              </div>
            </div>

            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '8px 14px', textAlign: 'right' }}>
              <div style={{ fontSize: '0.7rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>Emergency Cushion</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0F172A', fontFamily: 'monospace' }}>
                +{simulationResults.runwayExtensionMonths} months
              </div>
            </div>
          </div>
        </div>

        {/* Sliders Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          background: '#F8FAFC',
          border: '1px solid #E2E8F0',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '20px'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
              <span style={{ color: '#475569', fontWeight: 600 }}>Cut back on Dining & Delivery</span>
              <strong style={{ color: '#0D9488', fontFamily: 'monospace' }}>-{diningDriftPct}%</strong>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              step="5"
              value={diningDriftPct}
              onChange={(e) => setDiningDriftPct(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#0D9488' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
              <span style={{ color: '#475569', fontWeight: 600 }}>Cancel Unused Subscriptions</span>
              <strong style={{ color: '#0D9488', fontFamily: 'monospace' }}>{subsPrunedCount} subs</strong>
            </div>
            <input
              type="range"
              min="0"
              max="6"
              step="1"
              value={subsPrunedCount}
              onChange={(e) => setSubsPrunedCount(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#0D9488' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
              <span style={{ color: '#475569', fontWeight: 600 }}>Auto-Save Every Payday</span>
              <strong style={{ color: '#0D9488', fontFamily: 'monospace' }}>{format(sweepVelocity)}</strong>
            </div>
            <input
              type="range"
              min="200"
              max="2500"
              step="50"
              value={sweepVelocity}
              onChange={(e) => setSweepVelocity(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#0D9488' }}
            />
          </div>
        </div>

        {/* Counterfactual SVG Chart */}
        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
              12-Month Net Balance Trajectory Comparison
            </span>
            <div style={{ display: 'flex', gap: '14px', fontSize: '0.72rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#64748B' }}>
                <span style={{ width: '8px', height: '2px', background: '#94A3B8' }} /> Current Spending
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#0D9488', fontWeight: 600 }}>
                <span style={{ width: '8px', height: '2px', background: '#0D9488' }} /> With Your Small Tweaks
              </span>
            </div>
          </div>

          <svg viewBox={`0 0 ${chartW} ${chartH}`} style={{ width: '100%', height: '160px', overflow: 'visible' }}>
            {/* Status Quo Path */}
            <path
              d={baselinePath}
              fill="none"
              stroke="#94A3B8"
              strokeWidth="2"
              strokeDasharray="4 4"
            />

            {/* Simulated Path */}
            <path
              d={simulatedPath}
              fill="none"
              stroke="#0D9488"
              strokeWidth="2.5"
            />

            {/* End Labels */}
            <text x={getX(12) + 6} y={getY(simulationResults.endBaseline)} fontSize="10" fill="#64748B" fontFamily="monospace">
              {format(simulationResults.endBaseline)}
            </text>
            <text x={getX(12) + 6} y={getY(simulationResults.endSimulated)} fontSize="10" fill="#0D9488" fontWeight="700" fontFamily="monospace">
              {format(simulationResults.endSimulated)}
            </text>

            {/* Axis labels */}
            <text x={pad.left} y={chartH - 4} fontSize="9" fill="#94A3B8" fontFamily="monospace">Month 0</text>
            <text x={pad.left + plotW / 2} y={chartH - 4} textAnchor="middle" fontSize="9" fill="#94A3B8" fontFamily="monospace">Month 6</text>
            <text x={chartW - pad.right} y={chartH - 4} textAnchor="end" fontSize="9" fill="#94A3B8" fontFamily="monospace">Month 12</text>
          </svg>
        </div>
      </div>
    </div>
  );
}
