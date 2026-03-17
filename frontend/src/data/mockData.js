// Mock data for TeleSol NOC Dashboard
// Replace with real API calls later

export const statsData = {
  totalTowers: 156,
  activeDevices: 89432,
  networkUtil: 67,
  riskScore: 42,
  energySaved: 12.4,
  activeAlerts: 3,
};

export const zoneData = [
  { name: 'North', crs: 72, status: 'elevated' },
  { name: 'South', crs: 45, status: 'normal' },
  { name: 'East', crs: 87, status: 'critical' },
  { name: 'West', crs: 32, status: 'normal' },
];

export const riskDistribution = [
  { name: 'Low', value: 45, color: '#00FF88' },
  { name: 'Medium', value: 35, color: '#FF8C00' },
  { name: 'High', value: 15, color: '#FF4444' },
  { name: 'Critical', value: 5, color: '#FF0000' },
];

export const alertsData = [
  {
    id: 1,
    zone: 'East Zone Tower 7',
    crs: 87,
    severity: 'critical',
    action: 'Pre-activate small cells NOW',
    timestamp: new Date(),
  },
  {
    id: 2,
    zone: 'North Zone Tower 3',
    crs: 72,
    severity: 'high',
    action: 'Begin QoS traffic shaping',
    timestamp: new Date(),
  },
  {
    id: 3,
    zone: 'Central Hub',
    crs: 65,
    severity: 'elevated',
    action: 'Monitor — approaching threshold',
    timestamp: new Date(),
  },
];

// Tower locations for map (Delhi NCR coordinates)
export const towerLocations = [
  { id: 1, lat: 28.6139, lng: 77.2090, name: 'Central Delhi', crs: 65, status: 'elevated', zone: 'Central' },
  { id: 2, lat: 28.5355, lng: 77.3910, name: 'Noida Sector 18', crs: 45, status: 'normal', zone: 'East' },
  { id: 3, lat: 28.4595, lng: 77.0266, name: 'Gurgaon Cyber City', crs: 87, status: 'critical', zone: 'South-West' },
  { id: 4, lat: 28.6692, lng: 77.4538, name: 'Ghaziabad', crs: 32, status: 'normal', zone: 'East' },
  { id: 5, lat: 28.7041, lng: 77.1025, name: 'North Delhi', crs: 72, status: 'elevated', zone: 'North' },
  { id: 6, lat: 28.5244, lng: 77.1855, name: 'South Delhi', crs: 38, status: 'normal', zone: 'South' },
  { id: 7, lat: 28.6304, lng: 77.2177, name: 'Connaught Place', crs: 91, status: 'critical', zone: 'Central' },
  { id: 8, lat: 28.5562, lng: 77.1000, name: 'IGI Airport', crs: 78, status: 'high', zone: 'South-West' },
  { id: 9, lat: 28.6280, lng: 77.0820, name: 'Dwarka', crs: 29, status: 'normal', zone: 'West' },
  { id: 10, lat: 28.5672, lng: 77.3211, name: 'Noida Expressway', crs: 55, status: 'elevated', zone: 'East' },
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
// DEVELOPER PANEL DATA
// ============================================================

// Sensor Health Panel
export const sensorHealthData = {
  radar: 'active',
  camera: 'active',
  mic: 'active',
  wifiScanner: 'active',
  tofSensor: 'delayed',
  lastUpdate: '2s ago',
};

// Live Sensor Data
export const liveSensorData = {
  radarHumans: 147,
  wifiDevices: 523,
  noiseLevel: 72.4,
  distanceTriggers: 34,
  cameraPeopleCount: 189,
};

// Prediction Confidence
export const predictionData = {
  confidence: 94.2,
  modelAgreement: 'High',
  predictionWindow: '5 min',
};

// AI Model Status
export const aiModelData = {
  modelName: 'CrowdPredict',
  modelVersion: 'v2.1',
  inferenceLatency: 180,
  rollingAccuracy: 91.3,
  predictionInterval: '30s',
};

// Data Pipeline Monitor
export const pipelineData = {
  packetsPerSecond: 1247,
  ingestionStatus: 'healthy',
  queueSize: 23,
  serverLatency: 12,
};

// Tower Load Forecast
export const loadForecastData = [
  { time: 'Now', load: 67 },
  { time: '+2m', load: 72 },
  { time: '+4m', load: 78 },
  { time: '+6m', load: 85 },
  { time: '+8m', load: 89 },
  { time: '+10m', load: 91 },
];

// Device Detection Metrics
export const deviceMetricsData = {
  detectedDevices: 523,
  uniqueDevices: 412,
  bluetoothSignals: 87,
  avgSignalStrength: -67,
};

// Event Timeline
export const eventTimelineData = [
  { time: '23:44', event: 'Alert issued', type: 'alert' },
  { time: '23:43', event: 'Prediction triggered', type: 'prediction' },
  { time: '23:42', event: 'Tower load rising', type: 'warning' },
  { time: '23:41', event: 'Crowd spike detected (East)', type: 'detection' },
  { time: '23:40', event: 'Sensor calibration complete', type: 'system' },
  { time: '23:38', event: 'Model inference cycle', type: 'prediction' },
  { time: '23:35', event: 'New device cluster detected', type: 'detection' },
];

// System Resource Monitor
export const systemResourceData = {
  cpuUsage: 34,
  ramUsage: 62,
  apiLatency: 45,
  dbWriteRate: 234,
};
