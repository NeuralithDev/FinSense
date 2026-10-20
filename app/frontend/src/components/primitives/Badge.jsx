import React from 'react';

export default function Badge({
  children,
  variant = 'slate', // 'emerald' | 'amber' | 'crimson' | 'slate' | 'blue'
  pulse = false,
  icon: Icon,
  className = '',
  style = {},
}) {
  const variantStyles = {
    emerald: {
      bg: '#ECFDF5',
      border: '#A7F3D0',
      text: '#047857',
      dot: '#10B981',
    },
    mint: {
      bg: '#ECFDF5',
      border: '#A7F3D0',
      text: '#047857',
      dot: '#10B981',
    },
    amber: {
      bg: '#FFFBEB',
      border: '#FDE68A',
      text: '#B45309',
      dot: '#F59E0B',
    },
    crimson: {
      bg: '#FFF1F2',
      border: '#FECDD3',
      text: '#BE123C',
      dot: '#E11D48',
    },
    rose: {
      bg: '#FFF1F2',
      border: '#FECDD3',
      text: '#BE123C',
      dot: '#E11D48',
    },
    blue: {
      bg: '#F0F9FF',
      border: '#BAE6FD',
      text: '#0369A1',
      dot: '#0284C7',
    },
    violet: {
      bg: '#F1F5F9',
      border: '#E2E8F0',
      text: '#334155',
      dot: '#64748B',
    },
    slate: {
      bg: '#F1F5F9',
      border: '#E2E8F0',
      text: '#334155',
      dot: '#64748B',
    },
    neutral: {
      bg: '#F1F5F9',
      border: '#E2E8F0',
      text: '#334155',
      dot: '#64748B',
    },
  };

  const current = variantStyles[variant] || variantStyles.slate;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '3px 8px',
        borderRadius: '9999px',
        fontSize: '0.72rem',
        fontWeight: 600,
        letterSpacing: '0.02em',
        background: current.bg,
        border: `1px solid ${current.border}`,
        color: current.text,
        whiteSpace: 'nowrap',
        ...style,
      }}
      className={`badge ${className}`}
    >
      {pulse && (
        <span style={{ position: 'relative', display: 'flex', width: '6px', height: '6px' }}>
          <span
            style={{
              position: 'relative',
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: current.dot,
            }}
          />
        </span>
      )}
      {Icon && <Icon size={12} />}
      <span>{children}</span>
    </span>
  );
}
