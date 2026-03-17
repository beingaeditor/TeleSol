import { useState } from 'react';
import Header from './components/Header';
import StatsCard from './components/StatsCard';
import ZoneChart from './components/ZoneChart';
import RiskDonut from './components/RiskDonut';
import AlertCard from './components/AlertCard';
import NetworkMap from './components/NetworkMap';
import SensorHealthPanel from './components/SensorHealthPanel';
import LiveSensorDataPanel from './components/LiveSensorDataPanel';
import PredictionConfidencePanel from './components/PredictionConfidencePanel';
import AIModelStatusPanel from './components/AIModelStatusPanel';
import DataPipelineMonitor from './components/DataPipelineMonitor';
import TowerLoadForecast from './components/TowerLoadForecast';
import DeviceDetectionMetrics from './components/DeviceDetectionMetrics';
import EventTimeline from './components/EventTimeline';
import SystemResourceMonitor from './components/SystemResourceMonitor';
import {
  statsData,
  zoneData,
  riskDistribution,
  alertsData,
  towerLocations,
  sensorHealthData,
  liveSensorData,
  predictionData,
  aiModelData,
  pipelineData,
  loadForecastData,
  deviceMetricsData,
  eventTimelineData,
  systemResourceData,
} from './data/mockData';

export default function App() {
  const [debugMode, setDebugMode] = useState(false);
  const [focusedArea, setFocusedArea] = useState('Delhi NCR');
  const [selectedTower, setSelectedTower] = useState(null);

  return (
    <div className="min-h-screen bg-telesol-bg">
      <Header 
        focusedArea={focusedArea}
        debugMode={debugMode}
        onDebugToggle={setDebugMode}
      />

      <main className="p-6">
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <StatsCard
            label="Total Towers"
            value={statsData.totalTowers}
            color="cyan"
          />
          <StatsCard
            label="Active Devices"
            value={statsData.activeDevices}
            color="green"
          />
          <StatsCard
            label="Network Util"
            value={statsData.networkUtil}
            unit="%"
            color="cyan"
          />
          <StatsCard
            label="Risk Score"
            value={statsData.riskScore}
            color="orange"
          />
          <StatsCard
            label="Energy Saved"
            value={statsData.energySaved}
            unit="%"
            color="green"
          />
          <StatsCard
            label="Active Alerts"
            value={statsData.activeAlerts}
            color="red"
          />
        </div>

        {/* Main Content Grid - 3 columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Left Column: Network Map (larger) */}
          <div className="lg:col-span-2">
            <NetworkMap 
              towers={towerLocations}
              onAreaChange={setFocusedArea}
              onTowerSelect={setSelectedTower}
            />
          </div>

          {/* Right Column: Zone + Risk + Alerts stacked */}
          <div className="space-y-4">
            <ZoneChart data={zoneData} />
            <RiskDonut data={riskDistribution} />
          </div>
        </div>

        {/* Alerts Row */}
        <div className="mb-6">
          <div className="bg-telesol-card border border-telesol-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-red-500">🚨</span>
              <h3 className="text-sm text-telesol-red uppercase tracking-wide font-semibold">
                Active Alerts
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {alertsData.map((alert) => (
                <AlertCard key={alert.id} alert={alert} />
              ))}
            </div>
          </div>
        </div>

        {/* Developer Panels Section */}
        <div className="border-t border-telesol-border pt-6 mb-6">
          <h2 className="text-sm text-gray-400 uppercase tracking-wide mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-telesol-purple rounded-full"></span>
            Developer Telemetry
            {debugMode && <span className="text-telesol-orange ml-2">[DEBUG MODE]</span>}
          </h2>
          
          {/* Developer Grid - 4 columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Row 1 */}
            <SensorHealthPanel data={sensorHealthData} />
            <LiveSensorDataPanel data={liveSensorData} debugMode={debugMode} />
            <PredictionConfidencePanel data={predictionData} />
            <AIModelStatusPanel data={aiModelData} debugMode={debugMode} />
            
            {/* Row 2 */}
            <DataPipelineMonitor data={pipelineData} debugMode={debugMode} />
            <TowerLoadForecast data={loadForecastData} />
            <DeviceDetectionMetrics data={deviceMetricsData} />
            <SystemResourceMonitor data={systemResourceData} debugMode={debugMode} />
          </div>
        </div>

        {/* Event Timeline - Full width */}
        <div className="mb-6">
          <EventTimeline events={eventTimelineData} debugMode={debugMode} />
        </div>

        {/* Selected Tower Info (if any) */}
        {selectedTower && (
          <div className="mb-6 p-4 bg-telesol-card border border-telesol-cyan rounded-lg">
            <h3 className="text-telesol-cyan font-semibold mb-2">Selected Tower: {selectedTower.name}</h3>
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Zone:</span>
                <span className="ml-2 text-white">{selectedTower.zone}</span>
              </div>
              <div>
                <span className="text-gray-400">CRS:</span>
                <span className="ml-2 text-telesol-cyan font-mono">{selectedTower.crs}</span>
              </div>
              <div>
                <span className="text-gray-400">Status:</span>
                <span className="ml-2 text-white capitalize">{selectedTower.status}</span>
              </div>
              <div>
                <span className="text-gray-400">Coords:</span>
                <span className="ml-2 text-white font-mono text-xs">{selectedTower.lat.toFixed(4)}, {selectedTower.lng.toFixed(4)}</span>
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
