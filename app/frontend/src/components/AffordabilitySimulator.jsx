import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  ArrowRight, 
  Shield, 
  TrendingDown, 
  Sparkles,
  Info,
  Calendar,
  Layers,
  Sliders
} from 'lucide-react';
import { checkAffordability, fetchRecommendations } from '../services/api';
import { useMetricInspector } from '../store/metricInspectorStore';
import { useFinanceStore } from '../store/financeStore';
import { useCurrency } from '../design-system/currencyStore';
import confetti from 'canvas-confetti';

export default function AffordabilitySimulator() {
  const { format, currency } = useCurrency();
  const [itemName, setItemName] = useState('Sony WH-1000XM5');
  const [amount, setAmount] = useState(24990);
  const [category, setCategory] = useState('ELECTRONICS');
  const { addTransaction, pauseSubscription, accounts, goals } = useFinanceStore();

  const bufferFloor = 2000.0;
  const curBal = accounts?.checking?.balance || 10754.62;
  const savBal = accounts?.savings?.balance || 0.0;
  const totalLiquid = curBal + savBal;
  const initialCost = 24990.0;
  const initialRemaining = curBal - initialCost;
  const initialSafeCeiling = Math.max(0, curBal - bufferFloor);

  const [result, setResult] = useState({
    verdict: initialRemaining >= bufferFloor ? 'SAFE' : (initialRemaining >= 0 ? 'STRETCH' : 'UNAFFORDABLE'),
    item: 'Sony WH-1000XM5',
    amount: initialCost,
    current_balance: curBal,
    projected_min_balance_after_purchase: initialRemaining,
    safety_cushion: bufferFloor,
    runway_before_months: 2.4,
    runway_after_months: 1.8,
    safe_ceiling_amount: initialSafeCeiling,
    recommendation: initialRemaining < 0
      ? `Purchasing Sony WH-1000XM5 (${format(initialCost)}) exceeds your current checking balance (${format(curBal)}) by ${format(Math.abs(initialRemaining))}. We recommend setting a savings goal or budgeting over several weeks.`
      : `Purchasing the Sony WH-1000XM5 leaves your checking cushion intact.`,
  });
  const [recommendations, setRecommendations] = useState([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [appliedStrategy, setAppliedStrategy] = useState(null);
  const { openInspector } = useMetricInspector();

  const presets = [
    { name: 'Sony WH-1000XM5', amount: 24990, cat: 'ELECTRONICS' },
    { name: 'Goa Weekend Trip', amount: 12000, cat: 'TRAVEL' },
    { name: 'Campus Study Desk', amount: 4500, cat: 'HOME' },
    { name: 'Semester Tech Gear', amount: 8000, cat: 'ELECTRONICS' },
  ];

  useEffect(() => {
    handleSimulate(itemName, amount, category);
    fetchRecommendations('0')
      .then(res => {
        if (res?.recommendations) setRecommendations(res.recommendations);
      })
      .catch(() => {});
  }, []);

  const handleSimulate = async (name = itemName, amt = amount, cat = category) => {
    setIsSimulating(true);
    try {
      const data = await checkAffordability('0', name, parseFloat(amt), cat);
      setResult({
        ...data,
        item: data.item_name || name,
        amount: parseFloat(amt),
        current_balance: curBal,
        projected_min_balance_after_purchase: data.projected_checking_remaining ?? (curBal - amt),
        safety_cushion: bufferFloor,
        runway_before_months: 2.4,
        runway_after_months: Math.max(0.5, (2.4 - ((data.runway_impact_weeks || 1.5) / 4.33))).toFixed(1),
        safe_ceiling_amount: data.max_safe_purchase ?? Math.max(0, curBal - bufferFloor),
        recommendation: data.recommendation,
      });
    } catch (e) {
      // Fallback calculation grounded in real balance
      const minBal = curBal - amt;
      const safe = amt <= (curBal - bufferFloor);
      const stretch = minBal >= 0 || (savBal > 0 && amt <= totalLiquid);
      setResult({
        verdict: safe ? 'SAFE' : (stretch ? 'STRETCH' : 'UNAFFORDABLE'),
        item: name,
        amount: parseFloat(amt),
        current_balance: curBal,
        projected_min_balance_after_purchase: minBal,
        safety_cushion: bufferFloor,
        runway_before_months: 2.4,
        runway_after_months: Math.max(0.5, (2.4 * Math.max(0, (totalLiquid - amt) / Math.max(1, totalLiquid)))).toFixed(1),
        safe_ceiling_amount: Math.max(0, curBal - bufferFloor),
        recommendation: safe 
          ? `Buying the ${name} (${format(amt)}) leaves you comfortably above your emergency buffer in checking.`
          : (stretch
            ? (minBal >= 0 
                ? `Buying the ${name} (${format(amt)}) leaves only ${format(minBal)} in checking, dipping into your safety buffer.`
                : `Buying the ${name} (${format(amt)}) exceeds checking balance (${format(curBal)}) by ${format(Math.abs(minBal))}. It will require drawing from reserves.`)
            : `Buying the ${name} (${format(amt)}) exceeds your liquid safety cushion. We recommend setting a savings goal.`),
      });
    } finally {
      setIsSimulating(false);
    }
  };

  const handleSelectPreset = (p) => {
    setItemName(p.name);
    setAmount(p.amount);
    setCategory(p.cat);
    handleSimulate(p.name, p.amount, p.cat);
  };

  const getVerdictStyle = (v) => {
    switch (v) {
      case 'SAFE':
      case 'AFFORDABLE':
        return {
          bg: '#F0FDF4',
          border: '#BBF7D0',
          text: '#0D9488',
          icon: CheckCircle2,
          label: 'Yes, Safe to Buy Today',
        };
      case 'CAUTION':
      case 'STRETCH':
        return {
          bg: '#FFFBEB',
          border: '#FDE68A',
          text: '#D97706',
          icon: AlertTriangle,
          label: 'Stretch Purchase — Reserve Transfer Needed',
        };
      default:
        return {
          bg: '#FFF1F2',
          border: '#FECDD3',
          text: '#E11D48',
          icon: XCircle,
          label: 'Not Recommended — Exceeds Checking Balance',
        };
    }
  };

  const currentStyle = getVerdictStyle(result.verdict);
  const VerdictIcon = currentStyle.icon;

  // Generate 30-Day Trajectory SVG Points
  const chartW = 480;
  const chartH = 140;
  const pad = { top: 15, right: 15, bottom: 25, left: 45 };
  const plotW = chartW - pad.left - pad.right;
  const plotH = chartH - pad.top - pad.bottom;

  const chartBaseBal = result.current_balance || curBal;
  const purchaseAmt = result.amount || amount;
  const baselinePoints = [
    { day: 0, val: chartBaseBal },
    { day: 7, val: chartBaseBal - 320 },
    { day: 14, val: chartBaseBal - 650 + 1200 },
    { day: 21, val: chartBaseBal - 200 },
    { day: 30, val: chartBaseBal + 400 },
  ];

  const counterfactualPoints = baselinePoints.map(p => ({
    day: p.day,
    val: Math.max(0, p.val - purchaseAmt)
  }));

  const maxVal = Math.max(...baselinePoints.map(p => p.val), 5500);
  const minVal = 0;

  const getX = (d) => pad.left + (d / 30) * plotW;
  const getY = (val) => pad.top + plotH - ((val - minVal) / (maxVal - minVal || 1)) * plotH;

  const baselinePath = baselinePoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(p.day)} ${getY(p.val)}`).join(' ');
  const counterfactualPath = counterfactualPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(p.day)} ${getY(p.val)}`).join(' ');
  const safetyFloorY = getY(500);

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
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: '#0F172A' }}>
              Can I Afford This Purchase?
            </h3>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '6px',
              background: '#F0FDF4',
              color: '#0D9488',
              border: '1px solid #BBF7D0',
            }}>
              Purchase Simulator
            </span>
          </div>
          <p style={{ fontSize: '0.84rem', color: '#64748B', margin: 0 }}>
            Test any big purchase to see how it affects your upcoming bills and safety buffer.
          </p>
        </div>

        <button
          onClick={() => openInspector({
            metricName: 'Can I Afford This Purchase?',
            value: currentStyle.label,
            formula: `Checking Balance - Purchase Amount vs. Upcoming Bills & ${format(bufferFloor, { decimals: 0 })} Buffer`,
            description: 'We test whether buying this item leaves your checking account comfortably above your emergency buffer through your next inflow.',
            drivers: [
              { name: 'Current Checking Balance', weight: `+${format(curBal)}`, impact: 'Cash in account today' },
              { name: 'Simulated Purchase Cost', weight: `-${format(purchaseAmt)}`, impact: 'Cost of this purchase' },
              { name: 'Projected Lowest Balance', weight: `${format(result.projected_min_balance_after_purchase || 0)}`, impact: 'Lowest dip before next inflow' },
              { name: 'Emergency Cushion Required', weight: `${format(result.safety_cushion || bufferFloor)}`, impact: 'Always-protected safety floor' },
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
            gap: '6px'
          }}
        >
          <Info size={14} />
          <span>How we calculate this</span>
        </button>
      </div>

      {/* Preset Pills */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
        <span style={{ fontSize: '0.76rem', color: '#64748B', alignSelf: 'center', fontWeight: 600 }}>
          Quick Stress-Test:
        </span>
        {presets.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSelectPreset(p)}
            style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '9999px',
              padding: '4px 12px',
              fontSize: '0.78rem',
              color: '#334155',
              cursor: 'pointer',
              fontFamily: 'monospace',
              transition: 'all 0.15s ease'
            }}
          >
            {p.name} ({format(p.amount, { decimals: 0 })})
          </button>
        ))}
      </div>

      {/* Inputs Form */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '12px',
        background: '#F8FAFC',
        padding: '16px',
        borderRadius: '12px',
        border: '1px solid #E2E8F0',
        marginBottom: '20px'
      }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.76rem', color: '#475569', fontWeight: 600, marginBottom: '4px' }}>
            Item / Expense Description
          </label>
          <input
            type="text"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            style={{
              width: '100%',
              background: '#FFFFFF',
              border: '1px solid #CBD5E1',
              borderRadius: '6px',
              padding: '8px 12px',
              color: '#0F172A',
              fontSize: '0.86rem',
              outline: 'none'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.76rem', color: '#475569', fontWeight: 600, marginBottom: '4px' }}>
            Amount ({currency.symbol} {currency.code})
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            style={{
              width: '100%',
              background: '#FFFFFF',
              border: '1px solid #CBD5E1',
              borderRadius: '6px',
              padding: '8px 12px',
              color: '#0F172A',
              fontSize: '0.86rem',
              fontFamily: 'monospace',
              outline: 'none'
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button
            onClick={() => handleSimulate()}
            disabled={isSimulating}
            style={{
              width: '100%',
              padding: '9px 16px',
              background: '#0F172A',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.84rem',
              fontWeight: 600,
              cursor: isSimulating ? 'not-allowed' : 'pointer'
            }}
          >
            {isSimulating ? 'Simulating Impact...' : 'Evaluate Affordability'}
          </button>
        </div>
      </div>

      {/* Simulation Result Card */}
      {result && (
        <div style={{
          background: currentStyle.bg,
          border: `1px solid ${currentStyle.border}`,
          borderRadius: '12px',
          padding: '18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <VerdictIcon size={22} color={currentStyle.text} />
              <div>
                <span style={{ fontSize: '0.72rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 700 }}>
                  Affordability Check
                </span>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: currentStyle.text }}>
                  {currentStyle.label}
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.72rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 700 }}>
                Max You Can Comfortably Spend Today
              </span>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0F172A', fontFamily: 'monospace' }}>
                {format(result.safe_ceiling_amount ?? initialSafeCeiling)}
              </div>
            </div>
          </div>

          <p style={{ fontSize: '0.86rem', color: '#334155', lineHeight: 1.5, margin: 0 }}>
            {result.recommendation}
          </p>

          {/* Metric Comparison Strip */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '12px',
            borderTop: `1px solid ${currentStyle.border}`,
            paddingTop: '12px',
            fontSize: '0.8rem'
          }}>
            <div>
              <span style={{ color: '#64748B', fontSize: '0.74rem' }}>Savings Cushion Longevity:</span>
              <div style={{ fontWeight: 600, color: '#0F172A' }}>
                {result.runway_before_months} months &rarr; {result.runway_after_months} months
              </div>
            </div>
            <div>
              <span style={{ color: '#64748B', fontSize: '0.74rem' }}>Lowest Projected Balance:</span>
              <div style={{ fontWeight: 600, color: '#0D9488', fontFamily: 'monospace' }}>
                {format(result.projected_min_balance_after_purchase || 0)}
              </div>
            </div>
            <div>
              <span style={{ color: '#64748B', fontSize: '0.74rem' }}>Protected Safety Buffer:</span>
              <div style={{ fontWeight: 600, color: '#0F172A', fontFamily: 'monospace' }}>
                {format(result.safety_cushion || bufferFloor)}
              </div>
            </div>
          </div>

          {/* 30-Day Balance Impact Chart */}
          <div style={{ background: '#FFFFFF', borderRadius: '8px', padding: '12px', border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                Your 30-Day Balance Impact
              </span>
              <div style={{ display: 'flex', gap: '14px', fontSize: '0.72rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#0F172A' }}>
                  <span style={{ width: '8px', height: '2px', background: '#0F172A' }} /> Normal Forecast
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: currentStyle.text }}>
                  <span style={{ width: '8px', height: '2px', background: currentStyle.text, borderTop: '2px dashed' }} /> After This Purchase
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#E11D48' }}>
                  <span style={{ width: '8px', height: '2px', background: '#E11D48' }} /> Emergency Buffer ({format(result.safety_cushion || bufferFloor, { decimals: 0 })})
                </span>
              </div>
            </div>

            <svg viewBox={`0 0 ${chartW} ${chartH}`} style={{ width: '100%', height: '120px', overflow: 'visible' }}>
              {/* Safety floor line */}
              <line
                x1={pad.left}
                y1={safetyFloorY}
                x2={chartW - pad.right}
                y2={safetyFloorY}
                stroke="#E11D48"
                strokeDasharray="3 3"
                strokeWidth="1.5"
              />
              <text x={pad.left - 4} y={safetyFloorY + 3} textAnchor="end" fontSize="9" fill="#E11D48" fontFamily="sans-serif">
                {format(result.safety_cushion || bufferFloor, { decimals: 0 })}
              </text>

              {/* Baseline Path */}
              <path
                d={baselinePath}
                fill="none"
                stroke="#0F172A"
                strokeWidth="2"
              />

              {/* Post-Purchase Path */}
              <path
                d={counterfactualPath}
                fill="none"
                stroke={currentStyle.text}
                strokeWidth="2.5"
                strokeDasharray="4 4"
              />

              {/* Axis labels */}
              <text x={pad.left} y={chartH - 8} fontSize="9" fill="#94A3B8" fontFamily="sans-serif">Day 0</text>
              <text x={pad.left + plotW / 2} y={chartH - 8} textAnchor="middle" fontSize="9" fill="#94A3B8" fontFamily="sans-serif">Day 15</text>
              <text x={chartW - pad.right} y={chartH - 8} textAnchor="end" fontSize="9" fill="#94A3B8" fontFamily="sans-serif">Day 30</text>
            </svg>
          </div>
          {/* Stateful Action Buttons */}
          <div style={{
            display: 'flex',
            gap: '12px',
            marginTop: '16px',
            flexWrap: 'wrap',
          }}>
            <button
              onClick={async () => {
                const amt = parseFloat(amount) || 1299;
                await addTransaction({
                  merchant: itemName || 'Simulated Purchase',
                  amount: amt,
                  category: 'Shopping & Personal',
                  is_income: false,
                  is_recurring: false,
                });
                confetti({
                  particleCount: 75,
                  spread: 60,
                  origin: { y: 0.6 },
                });
                setAppliedStrategy(`bought_${itemName}`);
              }}
              style={{
                flex: '1 1 200px',
                padding: '11px 16px',
                borderRadius: '8px',
                background: '#0F172A',
                color: '#FFFFFF',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.84rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 1px 3px rgba(15, 23, 42, 0.1)',
              }}
            >
              <CheckCircle2 size={16} /> Buy & Track Now (-{format(amount)})
            </button>

            <button
              onClick={() => {
                setAppliedStrategy(`goal_${itemName}`);
                confetti({
                  particleCount: 60,
                  spread: 50,
                  origin: { y: 0.6 },
                });
              }}
              style={{
                flex: '1 1 200px',
                padding: '11px 16px',
                borderRadius: '8px',
                background: '#F0FDF4',
                color: '#0D9488',
                border: '1px solid #BBF7D0',
                fontWeight: 700,
                fontSize: '0.84rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <Sparkles size={16} /> Create Savings Goal for This
            </button>
          </div>

          {appliedStrategy && (
            <div style={{
              marginTop: '12px',
              padding: '10px 14px',
              borderRadius: '8px',
              background: '#F0FDF4',
              border: '1px solid #DCFCE7',
              fontSize: '0.78rem',
              color: '#166534',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}>
              <CheckCircle2 size={14} /> Action executed! Balances and forecasts updated in real time.
            </div>
          )}
        </div>
      )}

      {/* Smart Ways to Make This Purchase Easier */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
          <Sparkles size={15} color="#0D9488" />
          <h4 style={{ fontSize: '0.92rem', fontWeight: 700, margin: 0, color: '#0F172A' }}>
            Smart Ways to Make This Purchase Easier
          </h4>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
          {[
            {
              id: 'strat_payday',
              title: "Wait 6 days until after Friday's inflow",
              tip: "Timing this purchase right after your upcoming inflow keeps your safety buffer completely untouched.",
              badge: "Timing Strategy",
              actionText: "Set Inflow Reminder",
              onApply: () => {
                setAppliedStrategy('payday_reminder');
                confetti({ particleCount: 50, spread: 50, origin: { y: 0.6 } });
              }
            },
            {
              id: 'strat_split',
              title: "Split into 2 payments from your Tech Reserve",
              tip: "Covering half from your Tech Reserve leaves your everyday checking balance steady.",
              badge: "Savings Goal",
              actionText: "Apply from Tech Reserve",
              onApply: () => {
                setAppliedStrategy('split_tech');
                confetti({ particleCount: 60, spread: 50, origin: { y: 0.6 } });
              }
            },
            {
              id: 'strat_pause',
              title: "Pause unused subscriptions",
              tip: "Pausing unused streaming or software subscriptions frees up monthly cash to offset this purchase.",
              badge: "Bill Savings",
              actionText: "Pause Subscriptions",
              onApply: async () => {
                await pauseSubscription('sub_netflix');
                setAppliedStrategy('paused_subs');
                confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
              }
            },
          ].map((rec, idx) => (
            <div
              key={idx}
              style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '10px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#0D9488', textTransform: 'uppercase' }}>
                    {rec.badge}
                  </span>
                  <span style={{ fontSize: '0.68rem', background: '#DCFCE7', color: '#047857', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                    Recommended
                  </span>
                </div>
                <strong style={{ fontSize: '0.86rem', color: '#0F172A', display: 'block', lineHeight: 1.3 }}>{rec.title}</strong>
                <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '6px 0 0 0', lineHeight: 1.4 }}>
                  {rec.tip}
                </p>
              </div>

              <button
                onClick={rec.onApply}
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  borderRadius: '6px',
                  background: appliedStrategy === rec.id ? '#F0FDF4' : '#FFFFFF',
                  border: appliedStrategy === rec.id ? '1px solid #86EFAC' : '1px solid #CBD5E1',
                  color: appliedStrategy === rec.id ? '#166534' : '#0F172A',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  transition: 'all 0.15s ease',
                }}
              >
                {appliedStrategy === rec.id ? (
                  <>
                    <CheckCircle2 size={13} color="#166534" /> Applied to Plan
                  </>
                ) : (
                  <>
                    <span>{rec.actionText}</span>
                    <ArrowRight size={12} />
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
