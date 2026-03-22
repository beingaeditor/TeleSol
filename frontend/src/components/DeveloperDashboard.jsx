import { useState, useEffect, useCallback } from 'react';
import StatsCard from './StatsCard';
import ZoneChart from './ZoneChart';
import RiskDonut from './RiskDonut';
import AlertCard from './AlertCard';
import NetworkMap from './NetworkMap';
import SensorHealthPanel from './SensorHealthPanel';
import LiveSensorDataPanel from './LiveSensorDataPanel';
import PredictionConfidencePanel from './PredictionConfidencePanel';
import AIModelStatusPanel from './AIModelStatusPanel';
import DataPipelineMonitor from './DataPipelineMonitor';
import TowerLoadForecast from './TowerLoadForecast';
import DeviceDetectionMetrics from './DeviceDetectionMetrics';
import EventTimeline from './EventTimeline';
import SystemResourceMonitor from './SystemResourceMonitor';
import DeveloperHeader from './DeveloperHeader';
import {
  statsData as defaultStats,
  zoneData as defaultZone,
  riskDistribution,
  alertsData as defaultAlerts,
  towerLocations,
  sensorHealthData as defaultSensorHealth,
  liveSensorData as defaultLiveData,
  predictionData,
  aiModelData,
  pipelineData as defaultPipeline,
  loadForecastData,
  deviceMetricsData as defaultDeviceMetrics,
  eventTimelineData as defaultEvents,
  systemResourceData,
} from '../data/mockData';
import { fetchDashboardAll, connectWebSocket, disconnectWebSocket } from '../data/api';

export default function DeveloperDashboard({ onLogout }) {
  const [debugMode, setDebugMode] = useState(false);
  const [focusedArea, setFocusedArea] = useState('My Location');
  const [selectedTower, setSelectedTower] = useState(null);
  const [backendOnline, setBackendOnline] = useState(false);

  // Live data state
  const [stats, setStats] = useState(defaultStats);
  const [zones, setZones] = useState(defaultZone);
  const [alerts, setAlerts] = useState(defaultAlerts);
  const [sensorHealth, setSensorHealth] = useState(defaultSensorHealth);
  const [liveData, setLiveData] = useState(defaultLiveData);
  const [pipeline, setPipeline] = useState(defaultPipeline);
  const [deviceMetrics, setDeviceMetrics] = useState(defaultDeviceMetrics);
  const [events, setEvents] = useState(defaultEvents);
  const [towers, setTowers] = useState(towerLocations);

  const applyData = useCallback((dashData) => {
    if (!dashData) return;
    const s = dashData.stats;
    const crs = dashData.crs;
    const a = dashData.alerts;
    const sh = dashData.sensorHealth;
    const ld = dashData.liveData;

    if (s) {
      setStats({
        totalNodes: s.totalNodes ?? 1,
        activeDevices: s.activeDevices ?? 3,
        networkUtil: s.networkUtil ?? 12,
        riskScore: s.riskScore ?? 18,
        energySaved: s.energySaved ?? 0,
        activeAlerts: s.activeAlerts ?? 0,
      });
    }

    if (crs) {
      const crsVal = crs.crs ?? 18;
      setZones([{ name: 'My Node', crs: crsVal, status: crs.level ?? 'normal' }]);
      setTowers(prev => prev.map(t => t.active ? { ...t, crs: crsVal, status: crs.level ?? 'normal' } : t));
    }

    if (sh) {
      setSensorHealth({
        radar: sh.radar ?? 'offline',
        camera: sh.camera ?? 'offline',
        mic: sh.audio ?? 'offline',
        tofSensor: sh.tof ?? 'offline',
        imu: sh.imu ?? 'offline',
        lastUpdate: sh.lastUpdate ?? 'never',
      });
      setPipeline({
        packetsPerSecond: s?.readingCount ? 1 : 0,
        ingestionStatus: sh.radar !== 'offline' ? 'healthy' : 'waiting',
        queueSize: 0,
        serverLatency: 12,
      });
    }

    if (ld && ld.status !== 'no_data') {
      setLiveData({
        radarHumans: ld.radarHumans ?? 0,
        noiseLevel: ld.noiseLevel ?? 0,
        distanceTriggers: ld.tofDistance > 0 ? 1 : 0,
        cameraPeopleCount: ld.cameraPeopleCount ?? 0,
        tofDistance: ld.tofDistance ?? 0,
        vibration: ld.vibration ?? 0,
        temperature: ld.temperature ?? 0,
      });
      setDeviceMetrics({
        detectedDevices: (ld.radarHumans ?? 0) + 2,
        uniqueDevices: (ld.radarHumans ?? 0) + 2,
        bluetoothSignals: 1,
        avgSignalStrength: -45,
      });
    }

    if (a && a.length > 0) {
      setAlerts(a.map((alert, i) => ({
        id: alert.id ?? i + 1,
        zone: alert.zone ?? 'My Node',
        crs: alert.crs ?? 0,
        severity: alert.severity ?? 'normal',
        action: alert.action ?? '',
        timestamp: new Date(alert.timestamp ?? Date.now()),
      })));
    } else {
      setAlerts([]);
    }
  }, []);

  useEffect(() => {
    fetchDashboardAll().then((data) => {
      if (data) {
        setBackendOnline(true);
        applyData(data);
      }
    });

    connectWebSocket(
      (msg) => {
        if (msg.type === 'initial' || msg.type === 'sensor_update') {
          applyData(msg.data);
        }
      },
      (connected) => setBackendOnline(connected)
    );

    const interval = setInterval(async () => {
      const data = await fetchDashboardAll();
      if (data) {
        setBackendOnline(true);
        applyData(data);
      }
    }, 5000);

    return () => {
      disconnectWebSocket();
      clearInterval(interval);
    };
  }, [applyData]);

  return (
    <div className="min-h-screen bg-telesol-bg">
      <DeveloperHeader 
        focusedArea={focusedArea}
        debugMode={debugMode}
        onDebugToggle={setDebugMode}
        onLogout={onLogout}
      />

      <main className="p-6">
        {/* Connection Banner */}
        <div className={`mb-4 px-4 py-2 rounded-lg text-sm flex items-center gap-2 ${
          backendOnline 
            ? 'bg-telesol-green/10 border border-telesol-green/30 text-telesol-green' 
            : 'bg-telesol-orange/10 border border-telesol-orange/30 text-telesol-orange'
        }`}>
          <span className={`w-2 h-2 rounded-full ${backendOnline ? 'bg-telesol-green animate-pulse' : 'bg-telesol-orange'}`}></span>
          {backendOnline ? 'Live — Receiving ESP32 sensor data' : 'Offline — Showing default data. Start backend to connect.'}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <StatsCard label="Active Nodes" value={stats.totalNodes} color="cyan" />
          <StatsCard label="Devices" value={stats.activeDevices} color="green" />
          <StatsCard label="Network Load" value={stats.networkUtil} unit="%" color="cyan" />
          <StatsCard label="Risk Score" value={stats.riskScore} color={stats.riskScore > 40 ? 'orange' : 'green'} />
          <StatsCard label="Energy Saved" value={stats.energySaved} unit="%" color="green" />
          <StatsCard label="Alerts" value={stats.activeAlerts} color={stats.activeAlerts > 0 ? 'red' : 'green'} />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <NetworkMap 
              towers={towers}
              onAreaChange={setFocusedArea}
              onTowerSelect={setSelectedTower}
            />
          </div>
          <div className="space-y-4">
            <ZoneChart data={zones} />
            <RiskDonut data={riskDistribution} />
          </div>
        </div>

        {/* Alerts Row */}
        {alerts.length > 0 && (
          <div className="mb-6">
            <div className="bg-telesol-card border border-telesol-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-red-500">🚨</span>
                <h3 className="text-sm text-telesol-red uppercase tracking-wide font-semibold">
                  Active Alerts
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {alerts.map((alert) => (
                  <AlertCard key={alert.id} alert={alert} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Developer Panels Section */}
        <div className="border-t border-telesol-border pt-6 mb-6">
          <h2 className="text-sm text-gray-400 uppercase tracking-wide mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-telesol-purple rounded-full"></span>
            Developer Telemetry
            {debugMode && <span className="text-telesol-orange ml-2">[DEBUG MODE]</span>}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <SensorHealthPanel data={sensorHealth} />
            <LiveSensorDataPanel data={liveData} debugMode={debugMode} />
            <PredictionConfidencePanel data={predictionData} />
            <AIModelStatusPanel data={aiModelData} debugMode={debugMode} />
            
            <DataPipelineMonitor data={pipeline} debugMode={debugMode} />
            <TowerLoadForecast data={loadForecastData} />
            <DeviceDetectionMetrics data={deviceMetrics} />
            <SystemResourceMonitor data={systemResourceData} debugMode={debugMode} />
          </div>
        </div>

        {/* Event Timeline */}
        <div className="mb-6">
          <EventTimeline events={events} debugMode={debugMode} />
        </div>

        {/* Selected Tower Info */}
        {selectedTower && (
          <div className="mb-6 p-4 bg-telesol-card border border-telesol-cyan rounded-lg">
            <h3 className="text-telesol-cyan font-semibold mb-2">Selected: {selectedTower.name}</h3>
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Zone:</span>
                <span className="ml-2 text-white">{selectedTower.zone}</span>
              </div>
              <div>
                <span className="text-gray-400">CRS:</span>
                <span className="ml-2 text-telesol-cyan font-mono">
                  {selectedTower.active ? selectedTower.crs : 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Status:</span>
                <span className={`ml-2 capitalize ${selectedTower.active ? 'text-white' : 'text-telesol-red'}`}>
                  {selectedTower.active ? selectedTower.status : 'Offline'}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Coords:</span>
                <span className="ml-2 text-white font-mono text-xs">
                  {selectedTower.lat.toFixed(4)}, {selectedTower.lng.toFixed(4)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-8 text-center text-sm text-gray-500">
          <p>TELESOL | Predict the crowd. Prevent the congestion.</p>
          {debugMode && (
            <p className="mt-1 text-telesol-orange font-mono text-xs">
              Build: v2.1.0-dev | Session: {Date.now().toString(36)}
            </p>
          )}
        </footer>
      </main>
    </div>
  );
}
