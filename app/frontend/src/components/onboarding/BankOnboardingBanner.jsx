import React from 'react';
import { 
  Building, 
  FileText, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight, 
  Zap, 
  Database,
  Lock,
  CheckCircle2,
  AlertCircle,
  Trash2
} from 'lucide-react';
import { useFinanceStore } from '../../store/financeStore';
import { useAuth } from '../../store/authStore';

export default function BankOnboardingBanner() {
  const { 
    hasImportedData, 
    isDemoMode, 
    openSyncModal, 
    loadDemoData, 
    clearImportedData,
    activeStatementMeta,
    transactions
  } = useFinanceStore();
  const { user } = useAuth();

  const userName = user?.name ? user.name.split(' ')[0] : 'there';

  // If already has real data, show discrete active statement management banner
  if (hasImportedData) {
    return (
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(15, 23, 42, 0.03) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.28)',
          borderRadius: '12px',
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.16)',
              color: '#10B981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <FileText size={17} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Active Statement: {activeStatementMeta?.fileName || 'Uploaded Bank Statement'}
              </span>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '6px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#10B981',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                }}
              >
                REAL DATA ACTIVE
              </span>
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {activeStatementMeta?.institution || 'Bank'} &bull; {transactions?.length || activeStatementMeta?.rowsCount || 0} Transactions &bull; Account: {userName}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={openSyncModal}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              fontSize: '0.76rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Sparkles size={13} color="#0D9488" />
            <span>Upload New Statement</span>
          </button>

          <button
            onClick={() => {
              if (window.confirm('Delete this statement and remove all associated transactions and account data from FinSense?')) {
                clearImportedData();
              }
            }}
            title="Delete this uploaded statement and reset to clean zero-state"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.28)',
              color: '#EF4444',
              fontSize: '0.76rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Trash2 size={13} />
            <span>Delete Statement</span>
          </button>
        </div>
      </div>
    );
  }


  // ROCKET MONEY / COPILOT STYLE ZERO-STATE ONBOARDING ACTION CENTER
  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(13, 148, 136, 0.08) 0%, rgba(15, 23, 42, 0.04) 100%)',
        border: '1px solid rgba(13, 148, 136, 0.25)',
        borderRadius: '18px',
        padding: '28px 32px',
        marginBottom: '28px',
        boxShadow: 'var(--shadow-card)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle background glow */}
      <div
        style={{
          position: 'absolute',
          top: '-40px',
          right: '-40px',
          width: '240px',
          height: '240px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(13, 148, 136, 0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Header Info */}
      <div style={{ maxWidth: '820px', marginBottom: '24px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '3px 10px', borderRadius: '20px', background: 'rgba(13, 148, 136, 0.12)', border: '1px solid rgba(13, 148, 136, 0.25)', color: '#0D9488', fontSize: '0.74rem', fontWeight: 700, marginBottom: '10px' }}>
          <Zap size={13} />
          <span>Awaiting Financial Ingestion</span>
        </div>

        <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>
          Welcome, {userName}! Feed your transaction ledger to unlock FinSense.
        </h2>

        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
          FinSense is designed to run 100% on real customer banking data. Once connected, our forecast models automatically calculate your <strong>True Safe-to-Spend</strong>, detect silent price hikes on subscriptions, and protect you from surprise charges.
        </p>
      </div>

      {/* 2 Interactive Ingestion Channels */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '16px',
        }}
      >
        {/* Channel 1: Automatic Bank Sync */}
        <div
          onClick={openSyncModal}
          style={{
            background: 'var(--bg-card)',
            border: '2px solid rgba(13, 148, 136, 0.4)',
            borderRadius: '14px',
            padding: '20px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: 'var(--shadow-sm)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#0D9488';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(13, 148, 136, 0.4)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'rgba(13, 148, 136, 0.12)',
                  color: '#0D9488',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Building size={20} />
              </div>
              <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '2px 8px', borderRadius: '4px', background: '#0D9488', color: '#FFFFFF' }}>
                RECOMMENDED
              </span>
            </div>

            <h4 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
              Instant Bank Sync (Account Aggregator / Plaid)
            </h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4, margin: '0 0 16px 0' }}>
              Link directly with HDFC, ICICI, SBI, Axis, Kotak, or Chase via RBI-regulated Setu AA with 256-bit encryption.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0D9488', fontSize: '0.82rem', fontWeight: 700 }}>
            <span>Connect via Open Banking</span>
            <ArrowRight size={14} />
          </div>
        </div>

        {/* Channel 2: Drop Bank Statement */}
        <div
          onClick={openSyncModal}
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '14px',
            padding: '20px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: 'var(--shadow-sm)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#0D9488';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-subtle)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'rgba(59, 130, 246, 0.12)',
                  color: '#3B82F6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FileText size={20} />
              </div>
              <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: 'var(--bg-surface-secondary)', color: 'var(--text-secondary)' }}>
                CSV / PDF / UPI
              </span>
            </div>

            <h4 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
              Upload Bank Statement Export
            </h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4, margin: '0 0 16px 0' }}>
              Zero-credential dropzone. Auto-maps columns from HDFC, ICICI, SBI, Axis, Zerodha, Google Pay, or PhonePe.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary)', fontSize: '0.82rem', fontWeight: 700 }}>
            <span>Drop Statement File</span>
            <ArrowRight size={14} />
          </div>
        </div>
      </div>
    </div>
  );
}
