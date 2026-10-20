import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';

export default function Input({
  label,
  type = 'text',
  value,
  onChange,
  placeholder = '',
  error = '',
  helperText = '',
  icon: Icon,
  required = false,
  autoComplete,
  id,
  className = '',
  disabled = false,
  ...props
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === 'password';
  const effectiveType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', width: '100%' }} className={className}>
      {label && (
        <label
          htmlFor={id}
          style={{
            fontSize: '0.8125rem',
            fontWeight: 600,
            color: '#0F172A',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>
            {label} {required && <span style={{ color: '#E11D48' }}>*</span>}
          </span>
        </label>
      )}

      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          background: disabled ? '#F1F5F9' : '#FFFFFF',
          border: error
            ? '1px solid #E11D48'
            : isFocused
            ? '1px solid #0F172A'
            : '1px solid #E2E8F0',
          borderRadius: '10px',
          boxShadow: error
            ? '0 0 0 1px #E11D48'
            : isFocused
            ? '0 0 0 1px #0F172A, 0 1px 2px rgba(15, 23, 42, 0.04)'
            : '0 1px 2px rgba(15, 23, 42, 0.04)',
          transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
        }}
      >
        {Icon && (
          <div style={{ paddingLeft: '12px', display: 'flex', alignItems: 'center', color: isFocused ? '#0F172A' : '#64748B' }}>
            <Icon size={16} />
          </div>
        )}

        <input
          id={id}
          type={effectiveType}
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          disabled={disabled}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            padding: Icon ? '10px 12px 10px 8px' : '10px 12px',
            color: '#0F172A',
            fontSize: '0.875rem',
            fontFamily: 'inherit',
          }}
          {...props}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={{
              background: 'transparent',
              border: 'none',
              padding: '0 12px',
              color: '#64748B',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
            tabIndex={-1}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>

      {helperText && !error && (
        <span style={{ fontSize: '0.75rem', color: '#64748B', paddingLeft: '2px' }}>
          {helperText}
        </span>
      )}

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -2 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -2 }}
            style={{
              fontSize: '0.75rem',
              color: '#E11D48',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              paddingLeft: '2px',
              fontWeight: 500,
            }}
          >
            <AlertCircle size={12} />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
