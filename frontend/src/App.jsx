// ═══════════════════════════════════════════════════════
// TeleSol — App Shell
// Live mode → real sensor data from backend
// Simulation mode → simulation engine (offline testing)
// ═══════════════════════════════════════════════════════

import { useState } from 'react';
import Sidebar from './components/layout/Sidebar';
import TopBar from './components/layout/TopBar';
import DashboardPage from './components/dashboard/DashboardPage';
import MapViewPage from './components/map/MapViewPage';
import AnalyticsPage from './components/analytics/AnalyticsPage';
import AlertsPage from './components/alerts/AlertsPage';
import SimulationPage from './components/simulation/SimulationPage';
import { useSimulation } from './hooks/useSimulation';
import { useRealTimeData } from './hooks/useRealTimeData';

const PAGE_TITLES = {
  dashboard: 'Command Center',
  map: 'Zone Map',
  analytics: 'Analytics',
  alerts: 'Alert Management',
  simulation: 'Simulation Lab',
};

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');

  // Real data from backend (ESP sensors + iPhone companion)
  const realTime = useRealTimeData();

  // Simulation engine (for simulation page only)
  const sim = useSimulation();

  // In live mode → use real data. In simulation → use sim data.
  const isSimMode = sim.mode === 'simulation';

  // Zones: real sensor zone in live mode, sim zones in sim mode
  const zones = isSimMode ? sim.zones : [realTime.sensorZone];

  // Alerts: real alerts in live mode, sim alerts in sim mode
  const alerts = isSimMode ? sim.alerts : realTime.realAlerts;

  // KPIs: real in live mode, derived from sim in sim mode
  const kpis = isSimMode ? sim.kpis : {
    activeZones: 1,
    avgRiskScore: realTime.kpis.crsScore,
    highRiskAlerts: realTime.realAlerts.filter(a => a.severity === 'critical').length,
    peakDensity: realTime.kpis.crowdDensity,
  };

  const criticalCount = alerts.filter(a => a.severity === 'critical').length;

  function renderPage() {
    switch (currentPage) {
      case 'dashboard':
        return (
          <DashboardPage
            zones={zones}
            alerts={alerts}
            kpis={kpis}
            phoneFrame={realTime.phoneFrame}
            phonePersonCount={realTime.phonePersonCount}
            phoneNoiseDb={realTime.phoneNoiseDb}
            isPhoneConnected={realTime.isPhoneConnected}
            crsData={realTime.crsData}
            crsHistory={realTime.crsHistory}
            sensorCards={realTime.sensorCards}
            sensorHealth={realTime.sensorHealth}
            liveData={realTime.liveData}
            realKpis={realTime.kpis}
          />
        );
      case 'map':
        return <MapViewPage zones={zones} />;
      case 'analytics':
        return (
          <AnalyticsPage
            zones={zones}
            crsHistory={realTime.crsHistory}
            sensorHistory={realTime.sensorHistory}
            crsData={realTime.crsData}
            liveData={realTime.liveData}
            sensorHealth={realTime.sensorHealth}
          />
        );
      case 'alerts':
        return <AlertsPage alerts={alerts} zones={zones} />;
      case 'simulation':
        return (
          <SimulationPage
            zones={sim.zones}
            alerts={sim.alerts}
            params={sim.params}
            updateParam={sim.updateParam}
            isRunning={sim.isRunning}
            setIsRunning={sim.setIsRunning}
            speed={sim.speed}
            setSpeed={sim.setSpeed}
            simTime={sim.simTime}
            resetSimulation={sim.resetSimulation}
            kpis={sim.kpis}
          />
        );
      default:
        return <DashboardPage zones={zones} alerts={alerts} kpis={kpis} />;
    }
  }

  return (
    <div className="min-h-screen bg-crowd-bg text-crowd-text-primary">
      {/* Ambient glow */}
      <div className="ambient-bg" />

      {/* Sidebar */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={(page) => {
          setCurrentPage(page);
          if (page === 'simulation' && sim.mode !== 'simulation') sim.toggleMode();
          if (page !== 'simulation' && sim.mode === 'simulation') sim.toggleMode();
        }}
        isConnected={realTime.isConnected}
        alertCount={criticalCount}
      />

      {/* Main Content Area */}
      <div className="ml-[68px] lg:ml-[220px] transition-all duration-300">
        <TopBar
          pageTitle={PAGE_TITLES[currentPage] || 'Dashboard'}
          mode={sim.mode}
          onToggleMode={() => {
            sim.toggleMode();
            if (sim.mode === 'live') setCurrentPage('simulation');
          }}
        />

        <main className="p-4 lg:p-5 relative z-10">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
