import { useState, useEffect, useCallback } from 'react';
import StatsCard from './StatsCard';
import ZoneChart from './ZoneChart';
import RiskDonut from './RiskDonut';
import AlertCard from './AlertCard';
import NetworkMap from './NetworkMap';
import TowerLoadForecast from './TowerLoadForecast';
import TelecomHeader from './TelecomHeader';
import NetworkHealthCard from './NetworkHealthCard';
import CongestionPredictionCard from './CongestionPredictionCard';
import QuickActionsPanel from './QuickActionsPanel';
import {
  statsData as defaultStats,
  zoneData as defaultZone,
  riskDistribution,
  alertsData as defaultAlerts,
  towerLocations,
  loadForecastData,
  eventTimelineData as defaultEvents,
} from '../data/mockData';
import { fetchDashboardAll, connectWebSocket, disconnectWebSocket } from '../data/api';

export default function TelecomDashboard({ user, onLogout }) {
  const [focusedArea, setFocusedArea] = useState('My Location');
  const [selectedTower, setSelectedTower] = useState(null);
  const [backendOnline, setBackendOnline] = useState(false);
  const [crowdDetected, setCrowdDetected] = useState(false);
  const [crowdData, setCrowdData] = useState({ humans: 0, density: 0, noise: 0, crs: 0 });
  const [towerAlerted, setTowerAlerted] = useState(false);

  // Live data state (fallback to mock)
  const [stats, setStats] = useState(defaultStats);
  const [zones, setZones] = useState(defaultZone);
  const [alerts, setAlerts] = useState(defaultAlerts);
  const [events, setEvents] = useState(defaultEvents);
  const [forecast, setForecast] = useState(loadForecastData);
  const [towers, setTowers] = useState(towerLocations);

  // Apply dashboard data from backend
  const applyData = useCallback((dashData) => {
    if (!dashData) return;
    const s = dashData.stats;
    const crs = dashData.crs;
    const a = dashData.alerts;

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
      
      // Update active tower CRS
      setTowers(prev => prev.map(t => t.active ? { ...t, crs: crsVal, status: crs.level ?? 'normal' } : t));

      // Check for crowd detection
      if (crsVal > 40) {
        setCrowdDetected(true);
        setCrowdData(prev => ({ ...prev, crs: crsVal }));
      } else {
        setCrowdDetected(false);
        setTowerAlerted(false);
      }
    }

    // Extract live sensor data for crowd detection
    const ld = dashData.liveData;
    if (ld && ld.status !== 'no_data') {
      const humans = ld.radarHumans ?? 0;
      const density = ld.crowdDensity ?? 0;
      const noise = ld.noiseLevel ?? 0;
      const isCrowd = ld.isCrowdNoise ?? false;
      setCrowdData(prev => ({ ...prev, humans, density: parseFloat(density).toFixed(2), noise: parseFloat(noise).toFixed(1) }));
      if (humans >= 2 || isCrowd) {
        setCrowdDetected(true);
      }
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

  // Poll backend on mount and connect WebSocket
  useEffect(() => {
    // Initial fetch
    fetchDashboardAll().then((data) => {
      if (data) {
        setBackendOnline(true);
        applyData(data);
      }
    });

    // WebSocket for real-time updates
    connectWebSocket(
      (msg) => {
        if (msg.type === 'initial' || msg.type === 'sensor_update') {
          applyData(msg.data);
        }
      },
      (connected) => setBackendOnline(connected)
    );

    // Polling fallback every 5s
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

  const criticalAlerts = alerts.filter(a => a.severity === 'critical' || a.severity === 'high');

  return (
    <div className="min-h-screen bg-telesol-bg">
      <TelecomHeader 
        focusedArea={focusedArea}
        user={user}
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
          {backendOnline ? 'Live — Connected to ESP32 backend' : 'Offline — Showing default data. Start backend to connect.'}
        </div>

        {/* 🚨 Crowd Detection Alert Banner */}
        {crowdDetected && (
          <div className="mb-4 p-4 rounded-lg border-2 border-red-500 bg-gradient-to-r from-red-500/20 via-orange-500/15 to-red-500/20 animate-pulse-slow relative overflow-hidden">
            <div className="absolute inset-0 bg-red-500/5 animate-pulse"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-red-500/30 border-2 border-red-500 flex items-center justify-center animate-pulse">
                    <span className="text-2xl">🚨</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-red-400">
                      ⚠ CROWD DETECTED — Alert Nearby Towers
                    </h3>
                    <p className="text-sm text-orange-300">
                      Node <span className="font-mono font-bold text-white">RnD IIITD, Okhla Phase 3</span> has detected crowd activity.
                      Nearby towers should be pre-activated to handle potential congestion surge.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setTowerAlerted(true)}
                  disabled={towerAlerted}
                  className={`px-5 py-2.5 rounded-lg font-semibold text-sm transition-all flex items-center gap-2 flex-shrink-0 ${
                    towerAlerted
                      ? 'bg-telesol-green/20 border border-telesol-green/50 text-telesol-green cursor-default'
                      : 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30'
                  }`}
                >
                  {towerAlerted ? (
                    <><span>✓</span> Towers Alerted</>
                  ) : (
                    <><span>📡</span> Alert Nearby Towers</>
                  )}
                </button>
              </div>

              {/* Crowd metrics strip */}
              <div className="flex items-center gap-6 mt-3 pt-3 border-t border-red-500/30">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">Humans Detected:</span>
                  <span className="text-sm font-bold text-white">{crowdData.humans}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">Crowd Density:</span>
                  <span className="text-sm font-bold text-white">{crowdData.density} /m²</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">Noise Level:</span>
                  <span className="text-sm font-bold text-white">{crowdData.noise} dB</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">CRS:</span>
                  <span className={`text-sm font-bold font-mono ${
                    crowdData.crs > 80 ? 'text-red-400' : crowdData.crs > 60 ? 'text-orange-400' : 'text-yellow-400'
                  }`}>{crowdData.crs}</span>
                </div>
                {towerAlerted && (
                  <div className="ml-auto flex items-center gap-2 text-telesol-green text-xs">
                    <span className="w-2 h-2 bg-telesol-green rounded-full animate-pulse"></span>
                    Alert broadcast sent to 3 nearby towers
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Welcome Banner */}
        <div className="mb-6 p-4 bg-gradient-to-r from-telesol-cyan/10 to-telesol-green/10 border border-telesol-cyan/30 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">
                Welcome, {user.company} Network Operations
              </h2>
              <p className="text-sm text-gray-400">
                Single-node monitoring — {focusedArea}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-telesol-green">{stats.networkUtil}%</div>
              <div className="text-xs text-gray-400">Network Load</div>
            </div>
          </div>
        </div>

        {/* Key Metrics Row */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <StatsCard
            label="Active Nodes"
            value={stats.totalNodes}
            color="cyan"
          />
          <StatsCard
            label="Devices"
            value={stats.activeDevices}
            color="green"
          />
          <StatsCard
            label="Network Load"
            value={stats.networkUtil}
            unit="%"
            color={stats.networkUtil > 80 ? 'red' : stats.networkUtil > 60 ? 'orange' : 'cyan'}
          />
          <StatsCard
            label="Congestion Risk"
            value={stats.riskScore}
            color={stats.riskScore > 60 ? 'red' : stats.riskScore > 40 ? 'orange' : 'green'}
          />
          <StatsCard
            label="Energy Optimized"
            value={stats.energySaved}
            unit="%"
            color="green"
          />
          <StatsCard
            label="Incidents"
            value={criticalAlerts.length}
            color={criticalAlerts.length > 0 ? 'red' : 'green'}
          />
        </div>

        {/* Main Grid - 3 columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <NetworkMap 
              towers={towers}
              onAreaChange={setFocusedArea}
              onTowerSelect={setSelectedTower}
            />
          </div>

          <div className="space-y-4">
            <NetworkHealthCard data={stats} />
            <CongestionPredictionCard forecast={forecast} />
            <ZoneChart data={zones} />
          </div>
        </div>

        {/* Alerts & Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <div className="bg-telesol-card border border-telesol-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${criticalAlerts.length > 0 ? 'bg-telesol-red animate-pulse' : 'bg-telesol-green'}`}></span>
                  <h3 className="text-sm text-white uppercase tracking-wide font-semibold">
                    Network Incidents
                  </h3>
                  {criticalAlerts.length > 0 && (
                    <span className="px-2 py-0.5 bg-telesol-red/20 text-telesol-red text-xs rounded-full">
                      {criticalAlerts.length} Active
                    </span>
                  )}
                </div>
              </div>
              
              {criticalAlerts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {criticalAlerts.map((alert) => (
                    <AlertCard key={alert.id} alert={alert} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-telesol-green text-4xl mb-2">✓</div>
                  <p>No incidents — Node operating normally</p>
                </div>
              )}
            </div>
          </div>

          <QuickActionsPanel selectedTower={selectedTower} />
        </div>

        {/* Forecast & Risk & Events */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-1">
            <TowerLoadForecast data={forecast} />
          </div>
          <div className="lg:col-span-1">
            <RiskDonut data={riskDistribution} />
          </div>
          <div className="lg:col-span-1">
            <div className="bg-telesol-card border border-telesol-border rounded-lg p-4 h-full">
              <h3 className="text-sm text-gray-400 uppercase tracking-wide mb-3">Recent Activity</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {events.slice(0, 5).map((event, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <span className="text-xs text-gray-500 font-mono w-12">{event.time}</span>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      event.type === 'alert' ? 'bg-telesol-red' :
                      event.type === 'warning' ? 'bg-telesol-orange' :
                      'bg-telesol-cyan'
                    }`}></span>
                    <span className="text-gray-300 truncate">{event.event}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Selected Tower Details */}
        {selectedTower && (
          <div className="mb-6 p-4 bg-telesol-card border border-telesol-cyan rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-telesol-cyan font-semibold">
                📡 {selectedTower.name}
              </h3>
              <button 
                onClick={() => setSelectedTower(null)}
                className="text-gray-400 hover:text-white text-sm"
              >
                ✕ Close
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="bg-telesol-bg rounded p-3">
                <span className="text-gray-400 text-xs">Zone</span>
                <div className="text-white font-medium">{selectedTower.zone}</div>
              </div>
              <div className="bg-telesol-bg rounded p-3">
                <span className="text-gray-400 text-xs">Congestion Risk</span>
                <div className={`font-mono font-bold ${
                  selectedTower.crs > 80 ? 'text-telesol-red' :
                  selectedTower.crs > 60 ? 'text-telesol-orange' :
                  selectedTower.active ? 'text-telesol-green' : 'text-telesol-red'
                }`}>{selectedTower.active ? selectedTower.crs + '%' : 'N/A'}</div>
              </div>
              <div className="bg-telesol-bg rounded p-3">
                <span className="text-gray-400 text-xs">Status</span>
                <div className={`capitalize ${selectedTower.active ? 'text-white' : 'text-telesol-red'}`}>
                  {selectedTower.active ? selectedTower.status : 'Offline'}
                </div>
              </div>
              <div className="bg-telesol-bg rounded p-3">
                <span className="text-gray-400 text-xs">Coords</span>
                <div className="text-white font-mono text-xs">
                  {selectedTower.lat.toFixed(4)}, {selectedTower.lng.toFixed(4)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-8 text-center text-sm text-gray-500">
          <p>TELESOL | {user.company} Network Operations Center</p>
          <p className="text-xs mt-1">Enterprise Tier: {user.tier?.toUpperCase()}</p>
        </footer>
      </main>
    </div>
  );
}
