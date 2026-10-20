import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function GlassCard({
  children,
  className = '',
  borderColor = '#E2E8F0',
  hoverBorderColor = '#CBD5E1',
  elevation = 'card', // 'card' | 'flat' | 'elevated'
  style = {},
  onClick,
  ...props
}) {
  const [isHovered, setIsHovered] = useState(false);

  const getElevation = () => {
    if (elevation === 'flat') {
      return 'none';
    }
    if (elevation === 'elevated') {
      return isHovered 
        ? '0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -4px rgba(15, 23, 42, 0.04)' 
        : '0 4px 6px -1px rgba(15, 23, 42, 0.06), 0 2px 4px -2px rgba(15, 23, 42, 0.04)';
    }
    return isHovered
      ? '0 6px 12px -2px rgba(15, 23, 42, 0.06), 0 3px 6px -3px rgba(15, 23, 42, 0.04)'
      : '0 1px 3px 0 rgba(15, 23, 42, 0.04), 0 1px 2px -1px rgba(15, 23, 42, 0.03)';
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      style={{
        position: 'relative',
        borderRadius: '16px',
        background: '#FFFFFF',
        border: `1px solid ${isHovered && onClick ? hoverBorderColor : borderColor}`,
        boxShadow: getElevation(),
        cursor: onClick ? 'pointer' : 'default',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease',
        transform: isHovered && onClick ? 'translateY(-1px)' : 'none',
        ...style,
      }}
      className={`fin-card ${className}`}
      {...props}
    >
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        {children}
      </div>
    </div>
  );
}
