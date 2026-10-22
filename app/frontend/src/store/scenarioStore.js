/**
 * Scenario State Management Store
 * Manages global macroeconomic and personal financial stress scenarios.
 * Connects directly to the Unified Finance Engine.
 */

import { useState, useEffect } from 'react';

export const SCENARIOS = {
  baseline: {
    id: 'baseline',
    label: 'Baseline Trajectory',
    badge: 'Standard',
    description: 'Current recurring spend + historical daily velocity.',
    accent: 'emerald',
    protectedBufferMultiplier: 1.0,
    stripDiscretionary: false,
  },
  lockdown: {
    id: 'lockdown',
    label: 'Lean / Lockdown Mode',
    badge: 'Zero Discretionary',
    description: 'Strips all discretionary categories (food delivery, entertainment, shopping) for the rest of the month.',
    accent: 'amber',
    protectedBufferMultiplier: 1.0,
    stripDiscretionary: true,
  },
  aggressive: {
    id: 'aggressive',
    label: 'Aggressive Save Mode',
    badge: '2x Buffer (₹4,000)',
    description: 'Doubles the Protected Buffer from ₹2,000 to ₹4,000 and recalculates daily allowance.',
    accent: 'blue',
    protectedBufferMultiplier: 2.0,
    stripDiscretionary: false,
  },
};

let currentScenario = SCENARIOS.baseline;
const scenarioListeners = new Set();

export function setGlobalScenario(id) {
  if (SCENARIOS[id]) {
    currentScenario = SCENARIOS[id];
    scenarioListeners.forEach((fn) => fn(currentScenario));
  }
}

export function getGlobalScenario() {
  return currentScenario;
}

export function useScenario() {
  const [scenario, setScenario] = useState(currentScenario);

  useEffect(() => {
    const handler = (newScen) => setScenario(newScen);
    scenarioListeners.add(handler);
    return () => scenarioListeners.delete(handler);
  }, []);

  return {
    scenario,
    setScenario: setGlobalScenario,
    availableScenarios: Object.values(SCENARIOS),
  };
}
