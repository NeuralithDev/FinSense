/**
 * Scenario State Management Store
 * Manages global macroeconomic and personal financial stress scenarios.
 */

import { useState, useEffect } from 'react';

export const SCENARIOS = {
  baseline: {
    id: 'baseline',
    label: 'Baseline Trajectory',
    badge: 'Standard',
    description: 'Current real-time spending patterns, scheduled paychecks, and active subscriptions.',
    accent: 'emerald',
  },
  conservative: {
    id: 'conservative',
    label: 'Conservative Cushion',
    badge: '+15% Spend Buffer',
    description: 'Assumes +15% variable spending expansion and -15% slower savings accumulation.',
    accent: 'amber',
  },
  aggressive: {
    id: 'aggressive',
    label: 'Aggressive Wealth Sweep',
    badge: 'Max Savings',
    description: 'Prioritizes maximum safe sweep transfers to investment goals and debt paydown.',
    accent: 'blue',
  },
  recession: {
    id: 'recession',
    label: 'Recession Stress-Test',
    badge: '-20% Income Shock',
    description: 'Simulates a 20% income reduction combined with a 10% inflation cost spike.',
    accent: 'crimson',
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
