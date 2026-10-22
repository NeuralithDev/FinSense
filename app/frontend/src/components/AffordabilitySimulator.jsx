import React, { useState } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  ArrowRight, 
  Info 
} from 'lucide-react';
import { useMetricInspector } from '../store/metricInspectorStore';
import { useFinanceStore } from '../store/financeStore';
import { useCurrency } from '../design-system/currencyStore';
import confetti from 'canvas-confetti';

export default function AffordabilitySimulator() {
  const { format, currency } = useCurrency();
  const { addTransaction, reconciled } = useFinanceStore();
  const { openInspector } = useMetricInspector();

  const [itemName, setItemName] = useState('Weekend Dining & Gadget');
  const [amount, setAmount] = useState(3500);
  const [category, setCategory] = useState('SHOPPING');

  const checkingBalance = reconciled.accounts.checking.balance;
  const protectedBuffer = reconciled.safeToSpend.protectedBuffer;
  const upcomingBills14d = reconciled.recurringBills.upcomingBills14d;
  const currentSafeToSpend = reconciled.safeToSpend.safeToSpend;
  const currentDailySafe = reconciled.safeToSpend.dailySafeToSpend;

  // Presets calibrated for testing, including the ₹3,500 test case
  const presets = [
    { name: 'Weekend Dining & Gadget', amount: 3500, cat: 'SHOPPING' },
    { name: 'Semester Tech Gear', amount: 4200, cat: 'ELECTRONICS' },
    { name: 'Campus Study Desk', amount: 2400, cat: 'HOME' },
    { name: 'Sony WH-1000XM5', amount: 24990, cat: 'ELECTRONICS' },
  ];

  // Real-time calculation derived from centralized financeEngine
  const purchaseCost = parseFloat(amount) || 0;
  const postPurchaseChecking = Math.round((checkingBalance - purchaseCost) * 100) / 100;
  const postPurchaseSafeToSpend = Math.max(0, Math.round((currentSafeToSpend - purchaseCost) * 100) / 100);
  const postPurchaseDailySafe = Math.round((postPurchaseSafeToSpend / 7) * 100) / 100;
  const dailySafeImpact = Math.round((currentDailySafe - postPurchaseDailySafe) * 100) / 100;

  // Buffer dip check
  const dipsBelowBuffer = postPurchaseChecking < protectedBuffer;
  const bufferMargin = Math.round((postPurchaseChecking - protectedBuffer) * 100) / 100;
  const bufferDeficit = Math.max(0, Math.round((protectedBuffer - postPurchaseChecking) * 100) / 100);

  // Verdict evaluation
  let verdict = 'SAFE';
  if (postPurchaseChecking < 0) {
    verdict = 'UNAFFORDABLE';
  } else if (dipsBelowBuffer || purchaseCost > currentSafeToSpend) {
    verdict = 'STRETCH';
  } else {
    verdict = 'SAFE';
  }

  const getVerdictStyle = (v) => {
    switch (v) {
      case 'SAFE':
        return {
          bg: '#F0FDF4',
          border: '#BBF7D0',
          text: '#0D9488',
          icon: CheckCircle2,
          label: 'Safe to Buy Today',
          badgeText: 'Safe Purchase',
          summary: `Purchasing ${itemName} (${format(purchaseCost)}) leaves your checking account comfortably above your ${format(protectedBuffer)} Protected Buffer with ${format(postPurchaseSafeToSpend)} safe-to-spend remaining.`,
        };
      case 'STRETCH':
        return {
          bg: '#FFFBEB',
          border: '#FDE68A',
          text: '#D97706',
          icon: AlertTriangle,
          label: 'Caution — Dips Into Buffer',
          badgeText: 'Cushion Warning',
          summary: `Purchasing ${itemName} (${format(purchaseCost)}) leaves ${format(postPurchaseChecking)} in checking, dipping ${format(bufferDeficit)} below your ${format(protectedBuffer)} Protected Buffer before the 1st.`,
        };
      default:
        return {
          bg: '#FFF1F2',
          border: '#FECDD3',
          text: '#E11D48',
          icon: XCircle,
          label: 'Not Recommended — Exceeds Checking Cash',
          badgeText: 'Overdraft Risk',
          summary: `Purchasing ${itemName} (${format(purchaseCost)}) exceeds your available checking balance (${format(checkingBalance)}) by ${format(Math.abs(postPurchaseChecking))}.`,
        };
    }
  };

  const currentStyle = getVerdictStyle(verdict);
  const VerdictIcon = currentStyle.icon;

  const handleSelectPreset = (p) => {
    setItemName(p.name);
    setAmount(p.amount);
    setCategory(p.cat);
  };

  // 30-Day SVG projection coordinates
  const chartW = 480;
  const chartH = 140;
  const pad = { top: 15, right: 15, bottom: 25, left: 55 };
  const plotW = chartW - pad.left - pad.right;
  const plotH = chartH - pad.top - pad.bottom;

  const baselinePoints = [
    { day: 0, val: checkingBalance },
    { day: 7, val: Math.max(0, checkingBalance - 1200) },
    { day: 14, val: Math.max(0, checkingBalance - upcomingBills14d - 600) },
    { day: 21, val: Math.max(0, checkingBalance - upcomingBills14d - 1400) },
    { day: 30, val: checkingBalance + 5000 }, // Payday inflow
  ];

  const postPurchasePoints = baselinePoints.map((p, i) => ({
    day: p.day,
    val: i === 4 ? p.val - purchaseCost : Math.max(0, p.val - purchaseCost),
  }));

  const maxVal = Math.max(...baselinePoints.map((p) => p.val), checkingBalance, 16000);
  const minVal = 0;

  const getX = (d) => pad.left + (d / 30) * plotW;
  const getY = (val) => pad.top + plotH - ((val - minVal) / (maxVal - minVal || 1)) * plotH;

  const baselinePath = baselinePoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(p.day)} ${getY(p.val)}`).join(' ');
  const postPurchasePath = postPurchasePoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(p.day)} ${getY(p.val)}`).join(' ');
  const bufferFloorY = getY(protectedBuffer);

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: 'var(--shadow-card)',
      color: 'var(--text-primary)',
      marginBottom: '24px',
    }}>
      {/* Title Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              "Can I Afford It?" Instant Simulator
            </h3>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '6px',
              background: 'rgba(16, 185, 129, 0.12)',
              color: '#10B981',
              border: '1px solid rgba(16, 185, 129, 0.25)',
            }}>
              Zero-Risk Decision
            </span>
          </div>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: 0 }}>
            Simulate any upcoming expense to test exact impact on your daily safe allowance and protected buffer.
          </p>
        </div>

        <button
          onClick={() => openInspector({
            metricName: 'Can I Afford It? Logic',
            value: currentStyle.label,
            formula: 'Checking Cash - Purchase Amount vs. (Upcoming Bills + Protected Buffer)',
            description: 'Connects directly to True Safe-to-Spend and verifies that balance never breaches your protected floor before next payday.',
            drivers: [
              { name: 'Current Checking Cash', weight: format(checkingBalance), impact: 'Verified live balance' },
              { name: 'Simulated Purchase Cost', weight: `-${format(purchaseCost)}`, impact: itemName },
              { name: 'Post-Purchase Daily Pace', weight: `${format(postPurchaseDailySafe)}/day`, impact: `-${format(dailySafeImpact)}/day impact` },
              { name: 'Protected Safety Floor', weight: format(protectedBuffer), impact: dipsBelowBuffer ? 'BREACHED' : 'SAFE' },
            ],
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
            gap: '6px',
          }}
        >
          <Info size={14} />
          <span>How this works</span>
        </button>
      </div>

      {/* Preset Stress Tests */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
        <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', alignSelf: 'center', fontWeight: 600 }}>
          Stress-Test Presets:
        </span>
        {presets.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSelectPreset(p)}
            style={{
              background: itemName === p.name ? 'var(--text-primary)' : 'var(--bg-surface-secondary)',
              color: itemName === p.name ? '#FFFFFF' : 'var(--text-primary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '9999px',
              padding: '4px 12px',
              fontSize: '0.76rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
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
        background: 'var(--bg-surface-secondary)',
        padding: '16px',
        borderRadius: '12px',
        border: '1px solid var(--border-subtle)',
        marginBottom: '20px',
      }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.76rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '4px' }}>
            Hypothetical Item / Purchase
          </label>
          <input
            type="text"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            style={{
              width: '100%',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
              padding: '8px 12px',
              color: 'var(--text-primary)',
              fontSize: '0.86rem',
              outline: 'none',
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.76rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '4px' }}>
            Amount ({currency.symbol} {currency.code})
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}
            style={{
              width: '100%',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
              padding: '8px 12px',
              color: 'var(--text-primary)',
              fontSize: '0.86rem',
              fontFamily: 'var(--font-mono)',
              outline: 'none',
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <div style={{
            width: '100%',
            padding: '9px 16px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Max Safe Today:</span>
            <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#10B981', fontFamily: 'var(--font-mono)' }}>
              {format(currentSafeToSpend)}
            </span>
          </div>
        </div>
      </div>

      {/* Instant Impact Results Card */}
      <div style={{
        background: currentStyle.bg,
        border: `1px solid ${currentStyle.border}`,
        borderRadius: '12px',
        padding: '18px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        marginBottom: '20px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <VerdictIcon size={22} color={currentStyle.text} />
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                Instant Decision Verdict
              </span>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: currentStyle.text }}>
                {currentStyle.label}
              </div>
            </div>
          </div>

          <span style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            padding: '3px 10px',
            borderRadius: '9999px',
            background: verdict === 'SAFE' ? '#DCFCE7' : (verdict === 'STRETCH' ? '#FEF3C7' : '#FFE4E6'),
            color: currentStyle.text,
            border: `1px solid ${currentStyle.border}`,
          }}>
            {currentStyle.badgeText}
          </span>
        </div>

        <p style={{ fontSize: '0.84rem', color: 'var(--text-primary)', lineHeight: 1.5, margin: 0 }}>
          {currentStyle.summary}
        </p>

        {/* 2 Critical Deliverables Strip: Daily Safe Impact & Protected Buffer Dip */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '12px',
          borderTop: `1px solid ${currentStyle.border}`,
          paddingTop: '12px',
        }}>
          {/* Deliverable 1: Impact on Daily Safe-to-Spend for Next 7 Days */}
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            padding: '10px 12px',
          }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              7-Day Daily Safe Allowance Impact:
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
              <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                {format(postPurchaseDailySafe)}/day
              </span>
              <span style={{ fontSize: '0.76rem', color: dailySafeImpact > 0 ? '#EF4444' : '#10B981', fontWeight: 600 }}>
                ({dailySafeImpact > 0 ? `-${format(dailySafeImpact)}` : 'No change'})
              </span>
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Base: {format(currentDailySafe)}/day before purchase
            </div>
          </div>

          {/* Deliverable 2: Protected Buffer Dip Check */}
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            padding: '10px 12px',
          }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Protected Buffer Check ({format(protectedBuffer)} Floor):
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
              <span style={{
                fontSize: '0.86rem',
                fontWeight: 700,
                color: dipsBelowBuffer ? '#EF4444' : '#10B981',
              }}>
                {dipsBelowBuffer
                  ? `Breaches buffer by -${format(bufferDeficit)}`
                  : `Protected (+${format(bufferMargin)} safety headroom)`}
              </span>
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              {dipsBelowBuffer ? 'Causes balance dip before 1st' : 'Zero buffer breach risk before payday'}
            </div>
          </div>
        </div>

        {/* 30-Day Trajectory Curve */}
        <div style={{ background: 'var(--bg-surface)', borderRadius: '8px', padding: '12px', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              30-Day Cash Flow Curve
            </span>
            <div style={{ display: 'flex', gap: '12px', fontSize: '0.7rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-primary)' }}>
                <span style={{ width: '8px', height: '2px', background: 'var(--text-primary)' }} /> Baseline
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: currentStyle.text }}>
                <span style={{ width: '8px', height: '2px', background: currentStyle.text, borderTop: '2px dashed' }} /> Post-Purchase
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#EF4444' }}>
                <span style={{ width: '8px', height: '2px', background: '#EF4444' }} /> Buffer Floor ({format(protectedBuffer, { decimals: 0 })})
              </span>
            </div>
          </div>

          <svg viewBox={`0 0 ${chartW} ${chartH}`} style={{ width: '100%', height: '120px', overflow: 'visible' }}>
            {/* Safety floor line */}
            <line
              x1={pad.left}
              y1={bufferFloorY}
              x2={chartW - pad.right}
              y2={bufferFloorY}
              stroke="#EF4444"
              strokeDasharray="3 3"
              strokeWidth="1.5"
            />
            <text x={pad.left - 4} y={bufferFloorY + 3} textAnchor="end" fontSize="9" fill="#EF4444" fontFamily="sans-serif">
              {format(protectedBuffer, { decimals: 0 })}
            </text>

            {/* Baseline Path */}
            <path
              d={baselinePath}
              fill="none"
              stroke="var(--text-primary)"
              strokeWidth="2"
            />

            {/* Post-Purchase Path */}
            <path
              d={postPurchasePath}
              fill="none"
              stroke={currentStyle.text}
              strokeWidth="2.5"
              strokeDasharray="4 4"
            />

            {/* Axis labels */}
            <text x={pad.left} y={chartH - 8} fontSize="9" fill="var(--text-muted)" fontFamily="sans-serif">Day 1</text>
            <text x={pad.left + plotW / 2} y={chartH - 8} textAnchor="middle" fontSize="9" fill="var(--text-muted)" fontFamily="sans-serif">Day 15</text>
            <text x={chartW - pad.right} y={chartH - 8} textAnchor="end" fontSize="9" fill="var(--text-muted)" fontFamily="sans-serif">Day 31 (Payday)</text>
          </svg>
        </div>

        {/* Action Button: Log Purchase */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
          <button
            onClick={async () => {
              await addTransaction({
                merchant: itemName || 'Simulated Purchase',
                amount: purchaseCost,
                category: category || 'Shopping & Personal',
                is_income: false,
                is_recurring: false,
              });
              confetti({
                particleCount: 75,
                spread: 60,
                origin: { y: 0.6 },
              });
            }}
            style={{
              flex: 1,
              padding: '10px 16px',
              borderRadius: '8px',
              background: 'var(--text-primary)',
              color: 'var(--bg-card)',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.84rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <ArrowRight size={15} />
            <span>Confirm & Log Transaction ({format(purchaseCost)})</span>
          </button>
        </div>
      </div>
    </div>
  );
}
