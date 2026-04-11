// ═══════════════════════════════════════════════════════
// TeleSol — Real-Time Data Hook
// All data from backend — NO mock data
// Connects via WebSocket + polling, accumulates time series
// ═══════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchDashboardAll, connectWebSocket, disconnectWebSocket } from '../data/api';
import { getStatusFromScore } from '../data/mockData';

const MAX_HISTORY = 60; // Max time series points to keep

export function useRealTimeData() {
  const [isConnected, setIsConnected] = useState(false);
  const [backendData, setBackendData] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Phone live feed state
  const [phoneFrame, setPhoneFrame] = useState(null);
  const [phonePersonCount, setPhonePersonCount] = useState(0);
  const [phoneNoiseDb, setPhoneNoiseDb] = useState(0);
  const [isPhoneConnected, setIsPhoneConnected] = useState(false);

  // Accumulated time series for analytics charts
  const crsHistoryRef = useRef([]);
  const sensorHistoryRef = useRef([]);
  const [crsHistory, setCrsHistory] = useState([]);
  const [sensorHistory, setSensorHistory] = useState([]);

  // Real alerts from backend
  const [realAlerts, setRealAlerts] = useState([]);

  const processBackendData = useCallback((data) => {
    if (!data) return;

    setBackendData(data);
    setLastUpdate(Date.now());

    // Phone connection status
    if (data.phoneFeed) {
      setIsPhoneConnected(data.phoneFeed.hasFrame || false);
      if (data.phoneFeed.personCount !== undefined) {
        setPhonePersonCount(data.phoneFeed.personCount);
      }
      if (data.phoneFeed.noiseDb !== undefined) {
        setPhoneNoiseDb(data.phoneFeed.noiseDb);
      }
    }
    if (data.mobile && data.mobile.connected_count > 0) {
      setIsPhoneConnected(true);
    }

    // Build CRS history from backend history + accumulation
    if (data.crs && data.crs.history && data.crs.history.length > 0) {
      const backendHistory = data.crs.history.map(h => ({
        time: new Date(h.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        crs: h.crs,
        level: h.level,
        timestamp: h.timestamp,
      }));
      crsHistoryRef.current = backendHistory.slice(-MAX_HISTORY);
      setCrsHistory([...crsHistoryRef.current]);
    } else if (data.crs) {
      // Append current CRS reading to accumulated history
      const now = new Date();
      const point = {
        time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        crs: data.crs.crs || 0,
        level: data.crs.level || 'normal',
        timestamp: now.toISOString(),
      };
      crsHistoryRef.current = [...crsHistoryRef.current, point].slice(-MAX_HISTORY);
      setCrsHistory([...crsHistoryRef.current]);
    }

    // Accumulate sensor readings for analytics
    if (data.liveData && data.liveData.status !== 'no_data') {
      const now = new Date();
      const sensorPoint = {
        time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        noiseLevel: data.liveData.noiseLevel || 0,
        peopleCount: data.liveData.cameraPeopleCount || data.liveData.radarHumans || 0,
        tofDistance: data.liveData.tofDistance || 0,
        vibration: data.liveData.vibration || 0,
        temperature: data.liveData.temperature || 0,
        crowdDensity: data.liveData.crowdDensity || 0,
        radarDistance: data.liveData.radarDistance || 0,
        radarEnergy: data.liveData.radarEnergy || 0,
      };
      sensorHistoryRef.current = [...sensorHistoryRef.current, sensorPoint].slice(-MAX_HISTORY);
      setSensorHistory([...sensorHistoryRef.current]);
    }

    // Process alerts from backend
    if (data.alerts && data.alerts.length > 0) {
      setRealAlerts(prev => {
        const existing = new Set(prev.map(a => a.id));
        const newAlerts = data.alerts
          .filter(a => !existing.has(a.id))
          .map(a => ({
            id: a.id || `alert-${Date.now()}-${Math.random()}`,
            zone: a.zone || 'Sensor Hub',
            zoneId: 'sensor-hub',
            severity: a.severity === 'emergency' ? 'critical' :
                      a.severity === 'high' ? 'critical' :
                      a.severity === 'elevated' ? 'warning' : 'info',
            riskScore: a.crs || 0,
            message: a.action || 'Alert triggered by CRS threshold',
            action: getSuggestedAction(a.severity, a.crs),
            timestamp: a.timestamp ? new Date(a.timestamp).getTime() : Date.now(),
          }));
        return [...newAlerts, ...prev].slice(0, 50);
      });
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchDashboardAll().then((data) => {
      if (data) {
        setIsConnected(true);
        processBackendData(data);
      }
    });

    // WebSocket for real-time
    connectWebSocket(
      (msg) => {
        if (msg.type === 'initial' || msg.type === 'sensor_update') {
          processBackendData(msg.data);
        }
        if (msg.type === 'phone_frame') {
          setPhoneFrame(msg.frame || null);
          setPhonePersonCount(msg.personCount || 0);
          setPhoneNoiseDb(msg.noiseDb || 0);
          setIsPhoneConnected(true);
        }
        if (msg.type === 'mobile_update') {
          processBackendData(msg.data);
        }
      },
      (connected) => setIsConnected(connected)
    );

    // Polling fallback
    const interval = setInterval(async () => {
      const data = await fetchDashboardAll();
      if (data) {
        setIsConnected(true);
        processBackendData(data);
      }
    }, 3000);

    return () => {
      disconnectWebSocket();
      clearInterval(interval);
    };
  }, [processBackendData]);

  // ── Derived data for components ──

  const stats = backendData?.stats || {};
  const liveData = backendData?.liveData || {};
  const sensorHealth = backendData?.sensorHealth || {};
  const crsData = backendData?.crs || { crs: 0, level: 'normal', breakdown: {}, history: [] };
  const mobileStatus = backendData?.mobile || { connected_count: 0, devices: [] };

  // Build a single "zone" from the real sensor data for the map
  const phone = mobileStatus.devices?.find(d => d.connected);
  const sensorZone = {
    id: 'sensor-hub',
    name: 'Sensor Hub — ESP-12E',
    lat: phone?.gps?.lat || 28.5459,
    lng: phone?.gps?.lng || 77.2732,
    radius: 80,
    density: parseFloat(liveData.crowdDensity || 0).toFixed(2),
    flowInstability: Math.min(100, Math.round((liveData.vibration || 0) * 10)),
    panicLevel: Math.min(100, Math.round((liveData.noiseLevel || 0) * 1.2)),
    riskScore: Math.round(crsData.crs || 0),
    status: getStatusFromScore(Math.round(crsData.crs || 0)),
    sensorCount: Object.values(sensorHealth).filter(v => v === 'active').length,
  };

  // Build KPIs from real data
  const kpis = {
    crsScore: Math.round(crsData.crs || 0),
    crsLevel: crsData.level || 'normal',
    peopleDetected: liveData.cameraPeopleCount || liveData.radarHumans || 0,
    noiseLevel: Math.round(liveData.noiseLevel || 0),
    activeSensors: Object.entries(sensorHealth).filter(([k, v]) => v === 'active' && k !== 'lastUpdate').length,
    totalSensors: Object.keys(sensorHealth).filter(k => k !== 'lastUpdate').length,
    temperature: liveData.temperature || 0,
    vibration: liveData.vibration || 0,
    tofDistance: liveData.tofDistance || 0,
    tofPassageCount: liveData.tofPassageCount || 0,
    radarDistance: liveData.radarDistance || 0,
    radarEnergy: liveData.radarEnergy || 0,
    crowdDensity: parseFloat(liveData.crowdDensity || 0),
    readingCount: stats.readingCount || 0,
    phoneConnected: isPhoneConnected,
    lastUpdate: stats.lastUpdate || liveData.lastUpdate,
    espConnected: stats.activeNodes > 0,
  };

  // Build sensor cards from real health + live data + phone state
  const sensorCards = buildSensorCards(sensorHealth, liveData, isPhoneConnected, phonePersonCount, phoneNoiseDb);

  return {
    isConnected,
    backendData,
    lastUpdate,
    // Phone live feed
    phoneFrame,
    phonePersonCount,
    phoneNoiseDb,
    isPhoneConnected,
    // Structured data
    stats,
    liveData,
    sensorHealth,
    crsData,
    mobileStatus,
    sensorZone,
    kpis,
    sensorCards,
    // Time series
    crsHistory,
    sensorHistory,
    // Real alerts
    realAlerts,
  };
}

// ── Build sensor insight cards from real backend data ──
function buildSensorCards(health, live, phoneConnected, phonePersonCount = 0, phoneNoiseDb = 0) {
  const cards = [];

  // Radar sensor
  cards.push({
    id: 'radar',
    label: 'Radar LD2420',
    metric: 'Human Detection',
    value: live.radarHumans || 0,
    unit: live.radarHumans === 1 ? 'person' : 'people',
    status: health.radar || 'offline',
    icon: 'Radio',
    secondaryValue: `${live.radarDistance || 0} cm`,
    secondaryLabel: 'Distance',
  });

  // ToF sensor
  cards.push({
    id: 'tof',
    label: 'ToF VL53L0X',
    metric: 'Passage Detection',
    value: live.tofPassageCount || 0,
    unit: 'passages',
    status: health.tof || 'offline',
    icon: 'Scan',
    secondaryValue: `${live.tofDistance || 0} mm`,
    secondaryLabel: 'Range',
  });

  // IMU sensor
  cards.push({
    id: 'imu',
    label: 'IMU MPU6050',
    metric: 'Vibration & Temp',
    value: parseFloat(live.vibration || 0).toFixed(2),
    unit: 'g',
    status: health.imu || 'offline',
    icon: 'Activity',
    secondaryValue: `${parseFloat(live.temperature || 0).toFixed(1)}°C`,
    secondaryLabel: 'Temp',
  });

  // Phone Camera — use direct WebSocket state for latest values
  const camPeople = live.cameraPeopleCount || phonePersonCount || 0;
  cards.push({
    id: 'phone_camera',
    label: 'iPhone Camera',
    metric: 'COCO-SSD Detection',
    value: camPeople,
    unit: camPeople === 1 ? 'person' : 'people',
    status: (phoneConnected || health.phone_camera === 'active') ? 'active' : 'offline',
    icon: 'Camera',
    secondaryValue: phoneConnected ? 'Streaming' : 'Offline',
    secondaryLabel: 'Status',
  });

  // Phone Mic — use direct WebSocket state for latest values
  const micDb = live.noiseLevel || phoneNoiseDb || 0;
  cards.push({
    id: 'phone_mic',
    label: 'iPhone Microphone',
    metric: 'Ambient Noise',
    value: Math.round(micDb),
    unit: 'dB',
    status: (phoneConnected || health.phone_mic === 'active') ? 'active' : 'offline',
    icon: 'Mic',
    secondaryValue: live.isCrowdNoise ? 'Crowd' : micDb > 60 ? 'Loud' : 'Normal',
    secondaryLabel: 'Type',
  });

  // Phone GPS
  cards.push({
    id: 'phone_gps',
    label: 'iPhone GPS',
    metric: 'Location Tracking',
    value: health.phone_gps === 'active' ? 'Active' : '--',
    unit: '',
    status: health.phone_gps || 'offline',
    icon: 'MapPin',
    secondaryValue: health.phone_gps === 'active' ? 'High Accuracy' : 'No Signal',
    secondaryLabel: 'Precision',
  });

  return cards;
}

// ── Suggested actions based on alert severity ──
function getSuggestedAction(severity, crs) {
  if (severity === 'emergency') return 'Activate emergency protocols. Deploy all available resources.';
  if (severity === 'high') return 'Activate additional cells and apply QoS policies.';
  if (severity === 'elevated') return 'Pre-warm resources and increase monitoring frequency.';
  return 'Continue standard monitoring operations.';
}
