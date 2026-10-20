import React, { useState } from 'react';
import { 
  CalendarClock, 
  AlertTriangle, 
  TrendingUp, 
  CheckCircle2, 
  Layers, 
  DollarSign, 
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import Badge from './primitives/Badge';
import Button from './primitives/Button';
import Modal from './primitives/Modal';
import confetti from 'canvas-confetti';
import { useFinanceStore } from '../store/financeStore';
import { useCurrency } from '../design-system/currencyStore';

export default function SubscriptionCommander({ subscriptionData }) {
  const { format } = useCurrency();
  const [selectedSubForAction, setSelectedSubForAction] = useState(null);
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'CREEP' | 'DISCRETIONARY' | 'ESSENTIAL'
  const {
    subscriptions: storeSubs,
    cancelSubscription,
    pauseSubscription,
  } = useFinanceStore();

  const rawSubs = (storeSubs && storeSubs.length > 0)
    ? storeSubs.map(s => ({
        subscription_id: s.subscription_id,
        merchant: s.merchant_name || s.merchant,
        amount: s.amount,
        category: s.category,
        cadence: s.cadence || 'MONTHLY',
        status: s.status || 'ACTIVE',
        annualized_cost: s.annual_cost || (s.amount * 12),
        is_essential: s.category?.toLowerCase().includes('cloud') || s.category?.toLowerCase().includes('util'),
        next_expected_date: 'Nov 01, 2026',
        action_plan: '1-click cancellation will remove this monthly commitment from your projected burn and boost your savings rate.'
      }))
    : subscriptionData?.active_subscriptions || subscriptionData?.subscriptions || [];

  const creepAlerts = subscriptionData?.price_creep_alerts || [];
  const overlapAlerts = subscriptionData?.overlap_alerts || [];
  const radar30d = subscriptionData?.next_30_day_projected_charges || [];

  const subs = rawSubs;
  const activeSubs = subs.filter(s => s.status === 'ACTIVE');
  const totalMonthly = activeSubs.reduce((acc, s) => acc + Number(s.amount), 0);
  const totalAnnual = totalMonthly * 12;
  const discretionarySavings = totalAnnual * 0.35;

  const filteredSubs = subs.filter((s) => {
    if (activeFilter === 'CREEP') return s.is_price_crept || s.price_change_pct > 0;
    if (activeFilter === 'DISCRETIONARY') return !s.is_essential;
    if (activeFilter === 'ESSENTIAL') return s.is_essential;
    return true;
  });

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
      {/* Action Plan Modal */}
      <Modal
        isOpen={!!selectedSubForAction}
        onClose={() => setSelectedSubForAction(null)}
        title={selectedSubForAction ? `Action Plan: ${selectedSubForAction.merchant}` : ''}
        subtitle="1-Click Cancellation & Downgrade Strategy"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setSelectedSubForAction(null)}>
              Dismiss
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={async () => {
                if (selectedSubForAction) {
                  await pauseSubscription(selectedSubForAction.subscription_id);
                  setSelectedSubForAction(null);
                }
              }}
            >
              Pause Tracking
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={async () => {
                if (selectedSubForAction) {
                  await cancelSubscription(selectedSubForAction.subscription_id);
                  confetti({
                    particleCount: 80,
                    spread: 60,
                    origin: { y: 0.6 },
                  });
                  setSelectedSubForAction(null);
                }
              }}
            >
              Confirm Cancellation (+{format(selectedSubForAction?.annualized_cost || (selectedSubForAction?.amount || 0) * 12)}/yr)
            </Button>
          </>
        }
      >
        {selectedSubForAction && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div
              style={{
                padding: '16px',
                background: '#F8FAFC',
                borderRadius: '10px',
                border: '1px solid #E2E8F0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontSize: '0.72rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>
                  Annual Commitment Burn
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0F172A', fontFamily: 'var(--font-mono)' }}>
                  {format(selectedSubForAction.annualized_cost || selectedSubForAction.amount * 12)}/yr
                </div>
              </div>
              <Badge variant={selectedSubForAction.is_essential ? 'slate' : 'amber'}>
                {selectedSubForAction.is_essential ? 'ESSENTIAL SERVICE' : 'DISCRETIONARY EXPENSE'}
              </Badge>
            </div>

            <div>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>
                Recommended Action Plan
              </h4>
              <p style={{ fontSize: '0.84rem', color: '#475569', lineHeight: 1.5 }}>
                {selectedSubForAction.action_plan || 'Review account settings to cancel or downgrade to a lower-tier plan.'}
              </p>
            </div>

            {selectedSubForAction.is_price_crept && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 14px',
                  background: '#FFF1F2',
                  border: '1px solid #FECDD3',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  color: '#BE123C',
                }}
              >
                <AlertTriangle size={15} flexShrink={0} />
                <span>
                  Price crept by <strong>+{selectedSubForAction.price_change_pct}%</strong> from {format(selectedSubForAction.previous_amount)} to {format(selectedSubForAction.amount)}.
                </span>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Header & Stat Cards */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '20px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ fontSize: '1.18rem', fontWeight: 700, color: '#0F172A', letterSpacing: '-0.02em', margin: 0 }}>
              Recurring Bills & Subscriptions
            </h3>
            <Badge variant="emerald">Creep Defense Active</Badge>
            <Badge variant="slate">Auto-Tracked</Badge>
          </div>
          <p style={{ fontSize: '0.8125rem', color: '#64748B', margin: '4px 0 0' }}>
            Automatically tracks recurring charges, alerts you to silent price creep, and uncovers unused subscriptions you can pause or cancel.
          </p>
        </div>

        {/* Metric Badges Strip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '8px 14px', textAlign: 'right' }}>
            <div style={{ fontSize: '0.675rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>
              Monthly Commitments
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>
              {format(totalMonthly)}
            </div>
          </div>

          <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '10px', padding: '8px 14px', textAlign: 'right' }}>
            <div style={{ fontSize: '0.675rem', color: '#047857', textTransform: 'uppercase', fontWeight: 600 }}>
              Potential Annual Savings
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#047857' }}>
              {format(discretionarySavings)}/yr
            </div>
          </div>
        </div>
      </div>

      {/* 30-Day Upcoming Renewal Radar */}
      {radar30d.length > 0 && (
        <div style={{ marginBottom: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CalendarClock size={15} style={{ color: '#0D9488' }} />
              <span>Upcoming Bills & Renewals (Next 30 Days)</span>
            </span>
            <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
              Directly factored into your upcoming balance forecast
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
              gap: '10px',
            }}
          >
            {radar30d.slice(0, 6).map((item, idx) => (
              <div
                key={idx}
                style={{
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.72rem', color: '#64748B', fontFamily: 'var(--font-mono)' }}>
                    {item.expected_date}
                  </span>
                  <Badge variant={item.is_essential ? 'slate' : 'amber'}>
                    {item.is_essential ? 'BILL' : 'SUB'}
                  </Badge>
                </div>
                <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.merchant}
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A', fontFamily: 'var(--font-mono)' }}>
                  {format(Number(item.amount))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Creep & Overlap Warning Banners */}
      {(creepAlerts.length > 0 || overlapAlerts.length > 0) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
          {creepAlerts.map((alert, i) => (
            <div
              key={`creep-${i}`}
              style={{
                background: '#FFF1F2',
                border: '1px solid #FECDD3',
                borderRadius: '8px',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.8125rem',
                color: '#BE123C',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={15} flexShrink={0} />
                <span>
                  <strong>Price Creep Alarm:</strong> {alert.merchant} increased from {format(alert.previous_amount)} to {format(alert.amount)} (+{alert.price_change_pct}%) adding +{format(alert.annualized_creep_cost)}/yr.
                </span>
              </div>
              <button
                onClick={() => setSelectedSubForAction(alert)}
                style={{
                  background: '#BE123C',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                1-Click Action
              </button>
            </div>
          ))}

          {overlapAlerts.map((warn, i) => (
            <div
              key={`overlap-${i}`}
              style={{
                background: '#FFFBEB',
                border: '1px solid #FDE68A',
                borderRadius: '8px',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.8125rem',
                color: '#B45309',
              }}
            >
              <Layers size={15} flexShrink={0} />
              <span>
                <strong>Redundant Cluster Detected:</strong> {warn.recommended_action || warn}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Filter Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ display: 'inline-flex', background: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '2px' }}>
          {[
            { id: 'ALL', label: `All Commitments (${subs.length})` },
            { id: 'CREEP', label: `Price Creep (${creepAlerts.length})` },
            { id: 'DISCRETIONARY', label: 'Discretionary' },
            { id: 'ESSENTIAL', label: 'Essential Bills' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              style={{
                background: activeFilter === tab.id ? '#FFFFFF' : 'transparent',
                color: activeFilter === tab.id ? '#0F172A' : '#64748B',
                border: 'none',
                borderRadius: '6px',
                padding: '5px 12px',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: activeFilter === tab.id ? '0 1px 2px rgba(15, 23, 42, 0.06)' : 'none',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
          Showing {filteredSubs.length} active recurring accounts
        </span>
      </div>

      {/* Subscriptions Table */}
      <div style={{ border: '1px solid #E2E8F0', borderRadius: '10px', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B' }}>
              <th style={{ padding: '10px 14px', fontWeight: 600 }}>Merchant Service</th>
              <th style={{ padding: '10px 14px', fontWeight: 600 }}>Category & Cadence</th>
              <th style={{ padding: '10px 14px', fontWeight: 600 }}>Current Charge</th>
              <th style={{ padding: '10px 14px', fontWeight: 600 }}>Annual Burn</th>
              <th style={{ padding: '10px 14px', fontWeight: 600 }}>Price Trend</th>
              <th style={{ padding: '10px 14px', fontWeight: 600 }}>Next Charge</th>
              <th style={{ padding: '10px 14px', fontWeight: 600, textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredSubs.map((sub, idx) => (
              <tr
                key={sub.subscription_id || idx}
                style={{
                  borderBottom: idx < filteredSubs.length - 1 ? '1px solid #F1F5F9' : 'none',
                  background: sub.is_price_crept ? '#FFFDFD' : 'transparent',
                }}
              >
                <td style={{ padding: '12px 14px', fontWeight: 600, color: '#0F172A' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{sub.merchant}</span>
                    {sub.is_essential ? (
                      <Badge variant="slate">Essential</Badge>
                    ) : sub.overlap_group ? (
                      <Badge variant="amber">Overlap</Badge>
                    ) : null}
                  </div>
                </td>
                <td style={{ padding: '12px 14px', color: '#64748B' }}>
                  <span style={{ fontSize: '0.78rem' }}>
                    {sub.category} · {sub.cadence}
                  </span>
                </td>
                <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0F172A', fontFamily: 'var(--font-mono)' }}>
                  {format(Number(sub.amount))}
                </td>
                <td style={{ padding: '12px 14px', fontWeight: 600, color: '#475569', fontFamily: 'var(--font-mono)' }}>
                  {format(sub.annualized_cost || sub.amount * 12)}/yr
                </td>
                <td style={{ padding: '12px 14px' }}>
                  {sub.is_price_crept ? (
                    <span style={{ color: '#E11D48', fontWeight: 700, fontSize: '0.78rem' }}>
                      +{sub.price_change_pct}% hike
                    </span>
                  ) : (
                    <span style={{ color: '#0D9488', fontSize: '0.78rem', fontWeight: 500 }}>
                      Stable
                    </span>
                  )}
                </td>
                <td style={{ padding: '12px 14px', color: '#64748B', fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
                  {sub.next_expected_date || sub.next_charge_date || 'Upcoming'}
                </td>
                <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                  {sub.status === 'CANCELLED' ? (
                    <Badge variant="slate">Cancelled</Badge>
                  ) : sub.status === 'PAUSED' ? (
                    <Badge variant="amber">Paused</Badge>
                  ) : (
                    <button
                      onClick={() => setSelectedSubForAction(sub)}
                      style={{
                        background: '#FFF1F2',
                        border: '1px solid #FECDD3',
                        borderRadius: '6px',
                        padding: '4px 10px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: '#BE123C',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      <span>Cancel or Pause</span>
                      <ArrowRight size={12} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
