// Realistic single-node mock data for TeleSol NOC Dashboard
// Used as fallback when backend is offline

export const statsData = {
  totalNodes: 1,
  activeDevices: 3,
  networkUtil: 12,
  riskScore: 18,
  energySaved: 0,
  activeAlerts: 0,
};

export const zoneData = [
  { name: 'My Node', crs: 18, status: 'normal' },
];

export const riskDistribution = [
  { name: 'Low', value: 85, color: '#00FF88' },
  { name: 'Medium', value: 10, color: '#FF8C00' },
  { name: 'High', value: 4, color: '#FF4444' },
  { name: 'Critical', value: 1, color: '#FF0000' },
];

export const alertsData = [];

// Tower/node locations
// First node uses placeholder coords — replaced at runtime by browser GPS
export const towerLocations = [
  { id: 1, lat: 28.5459, lng: 77.2732, name: 'RnD IIITD, Okhla Phase 3', crs: 18, status: 'normal', zone: 'IIITD', active: true },
  { id: 2, lat: 28.6139, lng: 77.2090, name: 'Node 2', crs: 0, status: 'offline', zone: 'Delhi', active: false },
  { id: 3, lat: 28.5355, lng: 77.3910, name: 'Node 3', crs: 0, status: 'offline', zone: 'Noida', active: false },
  { id: 4, lat: 28.4595, lng: 77.0266, name: 'Node 4', crs: 0, status: 'offline', zone: 'Gurgaon', active: false },
  { id: 5, lat: 28.7041, lng: 77.1025, name: 'Node 5', crs: 0, status: 'offline', zone: 'North', active: false },
  { id: 6, lat: 28.5244, lng: 77.1855, name: 'Node 6', crs: 0, status: 'offline', zone: 'South', active: false },
];

// CRS thresholds
export const CRS_THRESHOLDS = {
  NORMAL: { min: 0, max: 40, color: '#00FF88', label: 'Normal' },
  ELEVATED: { min: 41, max: 60, color: '#FF8C00', label: 'Elevated' },
  HIGH: { min: 61, max: 80, color: '#FF4444', label: 'High' },
  CRITICAL: { min: 81, max: 100, color: '#FF0000', label: 'Critical' },
};

export function getCRSStatus(crs) {
  if (crs <= 40) return CRS_THRESHOLDS.NORMAL;
  if (crs <= 60) return CRS_THRESHOLDS.ELEVATED;
  if (crs <= 80) return CRS_THRESHOLDS.HIGH;
  return CRS_THRESHOLDS.CRITICAL;
}

// ============================================================
// DEVELOPER PANEL DATA (realistic single-node)
// ============================================================

export const sensorHealthData = {
  radar: 'active',
  camera: 'active',
  mic: 'active',
  tofSensor: 'active',
  imu: 'active',
  lastUpdate: 'waiting...',
};

export const liveSensorData = {
  radarHumans: 2,
  noiseLevel: 38.5,
  distanceTriggers: 1,
  cameraPeopleCount: 1,
  tofDistance: 450,
  vibration: 0.12,
  temperature: 28.5,
};

export const predictionData = {
  confidence: 72.0,
  modelAgreement: 'Moderate',
  predictionWindow: '5 min',
};

export const aiModelData = {
  modelName: 'CrowdPredict',
  modelVersion: 'v2.1',
  inferenceLatency: 180,
  rollingAccuracy: 78.0,
  predictionInterval: '2s',
};

export const pipelineData = {
  packetsPerSecond: 1,
  ingestionStatus: 'waiting',
  queueSize: 0,
  serverLatency: 0,
};

export const loadForecastData = [
  { time: 'Now', load: 12 },
  { time: '+2m', load: 14 },
  { time: '+4m', load: 15 },
  { time: '+6m', load: 18 },
  { time: '+8m', load: 16 },
  { time: '+10m', load: 14 },
];

export const deviceMetricsData = {
  detectedDevices: 3,
  uniqueDevices: 3,
  bluetoothSignals: 1,
  avgSignalStrength: -45,
};

export const eventTimelineData = [
  { time: '--:--', event: 'Waiting for sensor data...', type: 'system' },
];

export const systemResourceData = {
  cpuUsage: 8,
  ramUsage: 15,
  apiLatency: 0,
  dbWriteRate: 0,
};
