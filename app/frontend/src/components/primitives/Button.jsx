import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { springs } from '../../design-system/tokens';

export default function Button({
  children,
  onClick,
  variant = 'primary', // 'primary' | 'secondary' | 'emerald' | 'danger' | 'outline' | 'ghost'
  size = 'md',        // 'sm' | 'md' | 'lg'
  icon: Icon,
  className = '',
  disabled = false,
  magnetic = false,
  href,
  style = {},
  ...props
}) {
  const ref = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e) => {
    if (!magnetic || disabled) return;
    const { clientX, clientY } = e;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const x = (clientX - (left + width / 2)) * 0.2;
    const y = (clientY - (top + height / 2)) * 0.2;
    setPosition({ x, y });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
    setIsHovered(false);
  };

  const sizeStyles = {
    sm: { padding: '7px 12px', fontSize: '0.8rem', borderRadius: '8px' },
    md: { padding: '9px 16px', fontSize: '0.875rem', borderRadius: '10px' },
    lg: { padding: '13px 22px', fontSize: '0.95rem', borderRadius: '12px' },
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          background: isHovered ? '#1E293B' : '#0F172A',
          color: '#FFFFFF',
          border: '1px solid #0F172A',
          boxShadow: isHovered ? '0 4px 6px -1px rgba(15, 23, 42, 0.12)' : '0 1px 2px rgba(15, 23, 42, 0.08)',
        };
      case 'secondary':
        return {
          background: isHovered ? '#E2E8F0' : '#F1F5F9',
          color: '#0F172A',
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
        };
      case 'emerald':
      case 'mint':
        return {
          background: isHovered ? '#0F766E' : '#0D9488',
          color: '#FFFFFF',
          border: '1px solid #0D9488',
          boxShadow: isHovered ? '0 4px 6px -1px rgba(13, 148, 136, 0.2)' : '0 1px 2px rgba(13, 148, 136, 0.12)',
        };
      case 'danger':
      case 'crimson':
        return {
          background: isHovered ? '#BE123C' : '#E11D48',
          color: '#FFFFFF',
          border: '1px solid #E11D48',
          boxShadow: isHovered ? '0 4px 6px -1px rgba(225, 29, 72, 0.2)' : '0 1px 2px rgba(225, 29, 72, 0.1)',
        };
      case 'outline':
      case 'glass':
        return {
          background: isHovered ? '#F8FAFC' : '#FFFFFF',
          color: '#0F172A',
          border: isHovered ? '1px solid #CBD5E1' : '1px solid #E2E8F0',
          boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
        };
      case 'ghost':
      default:
        return {
          background: isHovered ? '#F1F5F9' : 'transparent',
          color: '#475569',
          border: '1px solid transparent',
        };
    }
  };

  const Component = href ? motion.a : motion.button;

  return (
    <Component
      ref={ref}
      href={href}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      disabled={disabled}
      animate={{ x: position.x, y: position.y }}
      whileTap={{ scale: 0.98 }}
      transition={springs.snappy}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '7px',
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        position: 'relative',
        outline: 'none',
        textDecoration: 'none',
        whiteSpace: 'nowrap',
        transition: 'background 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease',
        ...sizeStyles[size],
        ...getVariantStyles(),
        ...style,
      }}
      className={`btn ${className}`}
      {...props}
    >
      {Icon && <Icon size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} />}
      <span>{children}</span>
    </Component>
  );
}
