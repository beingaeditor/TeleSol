// ═══════════════════════════════════════════════════════
// TeleSol — Utilities + Simulation-Only Constants
// All live data comes from the backend via useRealTimeData
// ═══════════════════════════════════════════════════════

// Risk score thresholds (used everywhere)
export const RISK_THRESHOLDS = {
  SAFE: { min: 0, max: 40, color: '#00FF88', label: 'Safe', bg: 'rgba(0,255,136,0.12)' },
  WARNING: { min: 41, max: 65, color: '#FFB800', label: 'Warning', bg: 'rgba(255,184,0,0.12)' },
  DANGER: { min: 66, max: 100, color: '#FF3B5C', label: 'Critical', bg: 'rgba(255,59,92,0.12)' },
};

export function getRiskLevel(score) {
  if (score <= 40) return RISK_THRESHOLDS.SAFE;
  if (score <= 65) return RISK_THRESHOLDS.WARNING;
  return RISK_THRESHOLDS.DANGER;
}

export function getStatusFromScore(score) {
  if (score <= 40) return 'safe';
  if (score <= 65) return 'warning';
  return 'danger';
}

// ── Simulation-Only Zone Definitions (NOT used in live mode) ──
export const ZONES = [
  {
    id: 'zone-a', name: 'Gate A — Main Entry',
    lat: 28.5469, lng: 77.2710, radius: 120,
    density: 3.2, flowInstability: 22, panicLevel: 8,
    riskScore: 28, status: 'safe', sensorCount: 4,
  },
  {
    id: 'zone-b', name: 'Gate B — East Wing',
    lat: 28.5475, lng: 77.2755, radius: 100,
    density: 5.8, flowInstability: 45, panicLevel: 18,
    riskScore: 52, status: 'warning', sensorCount: 3,
  },
  {
    id: 'zone-c', name: 'Gate C — VIP Corridor',
    lat: 28.5445, lng: 77.2725, radius: 80,
    density: 7.4, flowInstability: 68, panicLevel: 42,
    riskScore: 78, status: 'danger', sensorCount: 5,
  },
  {
    id: 'zone-d', name: 'Gate D — South Exit',
    lat: 28.5440, lng: 77.2695, radius: 110,
    density: 2.1, flowInstability: 12, panicLevel: 5,
    riskScore: 15, status: 'safe', sensorCount: 3,
  },
  {
    id: 'zone-e', name: 'Gate E — Parking Zone',
    lat: 28.5488, lng: 77.2680, radius: 140,
    density: 4.5, flowInstability: 38, panicLevel: 15,
    riskScore: 42, status: 'warning', sensorCount: 4,
  },
  {
    id: 'zone-f', name: 'Gate F — Emergency Exit',
    lat: 28.5453, lng: 77.2765, radius: 90,
    density: 1.5, flowInstability: 8, panicLevel: 3,
    riskScore: 10, status: 'safe', sensorCount: 2,
  },
];

// Simulation-only alerts
export const ALERTS = [];

// ── Utility: Add realistic jitter to data (simulation only) ──
export function jitter(value, range = 2) {
  return Math.max(0, value + (Math.random() - 0.5) * range * 2);
}

export function jitterInt(value, range = 2) {
  return Math.max(0, Math.round(jitter(value, range)));
}
