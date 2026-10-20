import React from 'react';
import { motion } from 'framer-motion';

export default function Tabs({
  tabs = [], // [{ id: 'tab1', label: 'Tab 1', icon: Icon, badge: 3 }]
  activeTab,
  onChange,
  className = '',
  size = 'md', // 'sm' | 'md'
}) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        background: '#F1F5F9',
        border: '1px solid #E2E8F0',
        borderRadius: size === 'sm' ? '8px' : '10px',
        padding: '3px',
        gap: '2px',
      }}
      className={className}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            style={{
              position: 'relative',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: size === 'sm' ? '5px 10px' : '7px 14px',
              borderRadius: size === 'sm' ? '6px' : '8px',
              fontSize: size === 'sm' ? '0.75rem' : '0.8125rem',
              fontWeight: isActive ? 600 : 500,
              color: isActive ? '#0F172A' : '#64748B',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              outline: 'none',
              whiteSpace: 'nowrap',
              transition: 'color 0.15s ease',
              zIndex: 1,
            }}
          >
            {isActive && (
              <motion.div
                layoutId="activeTabPill"
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: '#FFFFFF',
                  borderRadius: size === 'sm' ? '6px' : '8px',
                  boxShadow: '0 1px 3px rgba(15, 23, 42, 0.08)',
                  zIndex: -1,
                }}
                transition={{ type: 'spring', stiffness: 450, damping: 32 }}
              />
            )}
            {Icon && <Icon size={size === 'sm' ? 13 : 15} />}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                style={{
                  fontSize: '0.675rem',
                  padding: '1px 6px',
                  borderRadius: '9999px',
                  background: isActive ? '#F1F5F9' : '#E2E8F0',
                  color: isActive ? '#0F172A' : '#64748B',
                  fontWeight: 600,
                }}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
