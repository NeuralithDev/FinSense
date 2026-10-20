/**
 * Metric Inspector Global Store
 * Powers the "Explain This Metric" drawer/modal across any dashboard card.
 */

import { useState, useEffect } from 'react';

let currentInspectorState = {
  isOpen: false,
  metricTitle: '',
  metricValue: '',
  formula: '',
  category: '',
  interpretation: '',
  engineeredFeatures: [],
  weights: [],
};

const listeners = new Set();

function notify() {
  listeners.forEach((fn) => fn(currentInspectorState));
}

export function openMetricInspector({
  title,
  value,
  formula,
  category,
  interpretation,
  engineeredFeatures = [],
  weights = [],
}) {
  currentInspectorState = {
    isOpen: true,
    metricTitle: title,
    metricValue: value,
    formula: formula || 'Engineered Weighted Composite Sum',
    category: category || 'Financial Intelligence',
    interpretation: interpretation || 'Computed by FinSense ML intelligence pipelines.',
    engineeredFeatures,
    weights,
  };
  notify();
}

export function closeMetricInspector() {
  currentInspectorState = { ...currentInspectorState, isOpen: false };
  notify();
}

export function useMetricInspector() {
  const [inspector, setInspector] = useState(currentInspectorState);

  useEffect(() => {
    const handler = (state) => setInspector(state);
    listeners.add(handler);
    return () => listeners.delete(handler);
  }, []);

  return {
    ...inspector,
    open: openMetricInspector,
    close: closeMetricInspector,
  };
}
