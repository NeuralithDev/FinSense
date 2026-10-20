import React from 'react';
import { 
  Compass, 
  TrendingUp, 
  ShieldCheck, 
  Layers, 
  DollarSign, 
  Bot, 
  RefreshCw, 
  Zap,
  Activity,
  Sliders
} from 'lucide-react';

export default function Header({ 
  activeTab, 
  setActiveTab, 
  isSyncing, 
  onSync, 
  syncStatus 
}) {
  const navItems = [
    { id: 'cockpit', label: 'Executive Cockpit', icon: Activity },
    { id: 'spending', label: 'Spending Intelligence', icon: Sliders },
    { id: 'forecast', label: 'Cash Flow Forecast', icon: TrendingUp },
    { id: 'autopilot', label: 'Autopilot Savings', icon: ShieldCheck },
    { id: 'subscriptions', label: 'Subscription Creep', icon: Layers },
    { id: 'affordability', label: 'Affordability Lab', icon: DollarSign },
    { id: 'copilot', label: 'AI Copilot Chat', icon: Bot },
  ];

  return (
    <header style={{
      borderBottom: '1px solid var(--bg-card-border)',
      background: 'rgba(11, 17, 28, 0.85)',
      backdropFilter: 'blur(20px)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      padding: '12px 24px',
    }}>
      {/* Top Brand & Status Row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '12px'
      }}>
        {/* Logo and Tagline */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.25)'
          }}>
            <Compass size={22} color="#FFFFFF" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '1.3rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#FFFFFF' }}>
                FinSense<span style={{ color: '#10B981' }}>.</span>
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#94A3B8' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 8px #10B981' }} />
                <span>Live Predictive Engine</span>
              </div>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Forward-Looking Cash Health &bull; Zero Hallucination Standard
            </p>
          </div>
        </div>

        {/* Engine Status & Sync Action */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>

          <button 
            onClick={onSync}
            disabled={isSyncing}
            className="btn btn-secondary"
            style={{ fontSize: '0.8rem', padding: '6px 14px' }}
          >
            <RefreshCw size={14} className={isSyncing ? 'pulse' : ''} style={{
              transform: isSyncing ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.5s ease'
            }} />
            {isSyncing ? 'Syncing Ingestion...' : 'Sync Plaid / ReBIT'}
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        overflowX: 'auto',
        paddingBottom: '4px'
      }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '10px',
                fontSize: '0.85rem',
                fontWeight: isActive ? 700 : 500,
                color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                background: isActive ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                border: isActive ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid transparent',
                cursor: 'pointer',
                transition: 'var(--transition)',
                whiteSpace: 'nowrap'
              }}
            >
              <Icon size={16} color={isActive ? '#818CF8' : 'var(--text-muted)'} />
              {item.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
}
