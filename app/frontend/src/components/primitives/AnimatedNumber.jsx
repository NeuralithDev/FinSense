import React, { useEffect, useState } from 'react';
import { useCurrency } from '../../design-system/currencyStore';

export default function AnimatedNumber({
  value,
  isCurrency = true,
  duration = 900,
  prefix = '',
  suffix = '',
  decimals = 0,
  className = '',
  style = {},
}) {
  const [displayValue, setDisplayValue] = useState(0);
  const { format } = useCurrency();

  useEffect(() => {
    let startTimestamp = null;
    const startVal = 0;
    const targetVal = typeof value === 'number' ? value : parseFloat(value) || 0;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = startVal + (targetVal - startVal) * easeProgress;
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    requestAnimationFrame(step);
  }, [value, duration]);

  const monoStyle = {
    fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
    fontVariantNumeric: 'tabular-nums lining-nums',
    letterSpacing: '-0.02em',
    ...style,
  };

  if (isCurrency) {
    return (
      <span className={`tabular-nums ${className}`} style={monoStyle}>
        {prefix}{format(displayValue, { decimals })}{suffix}
      </span>
    );
  }

  return (
    <span className={`tabular-nums ${className}`} style={monoStyle}>
      {prefix}
      {displayValue.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
}
