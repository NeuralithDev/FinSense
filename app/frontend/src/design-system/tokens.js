/**
 * FinSense Design System Tokens & Physics
 * Institutional "Million-Dollar Fintech" Aesthetic (Copilot Money, Stripe, Ramp, Wise).
 */

export const colors = {
  bg: {
    base: '#F8FAFC',        // Warm Alabaster
    surface1: '#FFFFFF',    // Pure Crisp White
    surface2: '#F1F5F9',    // Subtle Slate
    surface3: '#E2E8F0',    // Slate Border
    overlay: 'rgba(15, 23, 42, 0.45)',
  },
  accent: {
    primary: '#0F172A',     // Deep Obsidian Slate CTA
    emerald: '#0D9488',     // Institutional Emerald
    emeraldLight: '#ECFDF5',
    amber: '#D97706',       // Caution Amber
    amberLight: '#FFFBEB',
    crimson: '#E11D48',     // Anomaly / Risk Crimson
    crimsonLight: '#FFF1F2',
    blue: '#0284C7',
    blueLight: '#F0F9FF',
  },
  text: {
    primary: '#0F172A',     // Obsidian Slate
    secondary: '#475569',   // Muted Slate
    muted: '#64748B',       // Light Muted
    subtle: '#94A3B8',      // Border / Inactive
    inverse: '#FFFFFF',
  },
  border: {
    hairline: '#E2E8F0',    // Standard 1px hairline
    subtle: '#F1F5F9',
    strong: '#CBD5E1',
    active: '#0F172A',
  },
  shadow: {
    subtle: '0 1px 2px 0 rgba(15, 23, 42, 0.04)',
    card: '0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 1px 2px -1px rgba(15, 23, 42, 0.03)',
    elevated: '0 4px 6px -1px rgba(15, 23, 42, 0.06), 0 2px 4px -2px rgba(15, 23, 42, 0.04)',
    modal: '0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.05)',
  }
};

export const springs = {
  snappy: { type: 'spring', stiffness: 420, damping: 28, mass: 0.8 },
  smooth: { type: 'spring', stiffness: 220, damping: 24, mass: 1 },
  gentle: { type: 'spring', stiffness: 120, damping: 20, mass: 1.1 },
};

export const cardRecipe = {
  background: '#FFFFFF',
  border: '1px solid #E2E8F0',
  borderRadius: '16px',
  boxShadow: '0 1px 3px 0 rgba(15, 23, 42, 0.04), 0 1px 2px -1px rgba(15, 23, 42, 0.03)',
};
