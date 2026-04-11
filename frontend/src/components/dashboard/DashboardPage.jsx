// ═══════════════════════════════════════════════════════
// TeleSol — Dashboard Page (REAL SENSOR DATA)
// All data from backend — ESP-12E + iPhone companion
// ═══════════════════════════════════════════════════════

import { useState, useMemo } from 'react';
import {
  Gauge, Users, Mic, Activity, Radio, Scan, Thermometer,
  Wifi, WifiOff, Cpu, Clock, Smartphone, TrendingUp
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import KPICard from '../shared/KPICard';
import RiskBadge from '../shared/RiskBadge';
import GlassCard from '../shared/GlassCard';
import CrowdMap from '../map/CrowdMap';
import AlertFeed from '../alerts/AlertFeed';
import SensorInsights from '../sensors/SensorInsights';
import LiveFeedPanel from './LiveFeedPanel';
import { getRiskLevel } from '../../data/mockData';

export default function DashboardPage({
  zones, alerts, kpis,
  phoneFrame, phonePersonCount, phoneNoiseDb, isPhoneConnected,
  crsData, crsHistory, sensorCards, sensorHealth, liveData, realKpis,
}) {
  const [selectedZone, setSelectedZone] = useState(null);

  // Use real CRS history for chart (fallback to empty)
  const chartData = useMemo(() => {
    if (crsHistory && crsHistory.length > 0) {
      return crsHistory.map(d => ({ time: d.time, risk: d.crs }));
    }
    return [];
  }, [crsHistory]);

  const crs = realKpis?.crsScore || 0;
  const crsLevel = realKpis?.crsLevel || crsData?.level || 'normal';
  const riskTrendColor = crs > 65 ? '#FF3B5C' : crs > 40 ? '#FFB800' : '#00FF88';

  // CRS breakdown from backend
  const breakdown = crsData?.breakdown || {};

  return (
    <div className="space-y-4 animate-fade-in-up">
      {/* ── KPI Row — Real Sensor Data ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard
          icon={Gauge}
          label="CRS Score"
          value={crs}
          unit="/100"
          color={crs > 65 ? 'red' : crs > 40 ? 'warning' : 'green'}
          trend={crs > 50 ? 'up' : 'stable'}
        />
        <KPICard
          icon={Users}
          label="People Detected"
          value={realKpis?.peopleDetected || 0}
          color="cyan"
          trend="stable"
        />
        <KPICard
          icon={Mic}
          label="Noise Level"
          value={realKpis?.noiseLevel || 0}
          unit=" dB"
          color={realKpis?.noiseLevel > 60 ? 'red' : realKpis?.noiseLevel > 40 ? 'warning' : 'green'}
          trend={realKpis?.noiseLevel > 50 ? 'up' : 'stable'}
        />
        <KPICard
          icon={Activity}
          label="Active Sensors"
          value={`${realKpis?.activeSensors || 0}/${realKpis?.totalSensors || 0}`}
          color={realKpis?.activeSensors > 0 ? 'green' : 'red'}
          trend="stable"
        />
      </div>

      {/* ── Main Grid: Map + Live Feed + Alerts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Map (1/3) */}
        <div className="lg:col-span-1">
          <CrowdMap
            zones={zones}
            selectedZone={selectedZone}
            onSelectZone={setSelectedZone}
            height={420}
          />
        </div>

        {/* Live Feed (1/3) */}
        <div className="lg:col-span-1" style={{ height: 420 }}>
          <LiveFeedPanel
            frame={phoneFrame}
            personCount={phonePersonCount || 0}
            noiseDb={phoneNoiseDb || 0}
            isPhoneConnected={isPhoneConnected || false}
          />
        </div>

        {/* Alerts Feed (1/3) */}
        <div className="lg:col-span-1" style={{ height: 420 }}>
          <AlertFeed alerts={alerts} compact maxItems={15} />
        </div>
      </div>

      {/* ── Bottom Row: CRS Chart + CRS Breakdown + ESP Status ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* CRS Over Time Chart — REAL DATA */}
        <GlassCard className="lg:col-span-1">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-crowd-text-primary flex items-center gap-2">
              <TrendingUp size={14} className="text-crowd-cyan" />
              CRS Trend (Live)
            </h3>
            <span className="text-[10px] font-mono text-crowd-text-muted">
              {chartData.length} readings
            </span>
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={150}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={riskTrendColor} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={riskTrendColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="time" axisLine={false} tickLine={false}
                  tick={{ fontSize: 10, fill: '#64748B' }} interval="preserveStartEnd"
                />
                <YAxis
                  domain={[0, 100]} axisLine={false} tickLine={false}
                  tick={{ fontSize: 10, fill: '#64748B' }} width={28}
                />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(12,18,32,0.95)',
                    border: '1px solid rgba(30,45,74,0.6)',
                    borderRadius: 8, fontSize: 11,
                  }}
                  labelStyle={{ color: '#94A3B8' }}
                />
                <Area
                  type="monotone" dataKey="risk" stroke={riskTrendColor}
                  strokeWidth={2} fill="url(#riskGradient)" dot={false} animationDuration={800}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[150px] text-crowd-text-muted text-xs">
              <div className="text-center">
                <Cpu size={24} className="mx-auto mb-2 opacity-40" />
                <p>Waiting for sensor data...</p>
                <p className="text-[10px] mt-1 opacity-60">CRS chart will populate as readings arrive</p>
              </div>
            </div>
          )}
        </GlassCard>

        {/* CRS Breakdown — REAL COMPUTATION */}
        <GlassCard glow={crs > 60 ? 'red' : crs > 40 ? 'warning' : 'green'} className="flex flex-col items-center justify-center text-center">
          <Gauge size={20} className="text-crowd-cyan mb-2" />
          <p className="text-[10px] text-crowd-text-muted uppercase tracking-wider mb-2">CRS Computation</p>
          <RiskBadge score={crs} size={80} showLabel={false} />
          <p className="text-xs text-crowd-text-secondary mt-2 font-mono capitalize">{crsLevel}</p>
          <div className="w-full mt-3 space-y-1.5">
            <BreakdownBar label="Device Demand" value={breakdown.deviceDemand?.value || 0} weight={0.35} color="#00D4FF" />
            <BreakdownBar label="Growth Rate" value={breakdown.growthRate?.value || 0} weight={0.25} color="#A855F7" />
            <BreakdownBar label="Network Util" value={breakdown.networkUtil?.value || 0} weight={0.30} color="#FFB800" />
            <BreakdownBar label="Temporal" value={breakdown.temporalFactor?.value || 0} weight={0.10} color="#00FF88" />
          </div>
        </GlassCard>

        {/* Connection Status Panel */}
        <GlassCard>
          <h3 className="text-xs font-semibold text-crowd-text-primary flex items-center gap-2 mb-3">
            <Cpu size={14} className="text-crowd-purple" />
            System Status
          </h3>
          <div className="space-y-2.5">
            {/* ESP Connection */}
            <StatusRow
              icon={Cpu}
              label="ESP-12E Sensor Hub"
              connected={realKpis?.espConnected}
              detail={realKpis?.readingCount > 0 ? `${realKpis.readingCount} readings` : 'No data yet'}
            />
            {/* iPhone Connection */}
            <StatusRow
              icon={Smartphone}
              label="iPhone Companion"
              connected={isPhoneConnected}
              detail={isPhoneConnected ? 'Camera + Audio streaming' : 'Open /companion on iPhone'}
            />
            {/* Sensor Summary */}
            <div className="border-t border-crowd-border/50 pt-2 mt-2">
              <div className="grid grid-cols-3 gap-2">
                <MiniStat label="Radar" status={sensorHealth?.radar} />
                <MiniStat label="ToF" status={sensorHealth?.tof} />
                <MiniStat label="IMU" status={sensorHealth?.imu} />
                <MiniStat label="Camera" status={isPhoneConnected ? 'active' : sensorHealth?.phone_camera} />
                <MiniStat label="Mic" status={isPhoneConnected ? 'active' : sensorHealth?.phone_mic} />
                <MiniStat label="GPS" status={sensorHealth?.phone_gps} />
              </div>
            </div>
            {/* Last Update */}
            {realKpis?.lastUpdate && (
              <div className="flex items-center gap-1.5 text-[10px] text-crowd-text-muted pt-1">
                <Clock size={10} />
                <span>Last: {new Date(realKpis.lastUpdate).toLocaleTimeString()}</span>
              </div>
            )}
          </div>
        </GlassCard>
      </div>

      {/* ── Sensor Insights Strip — REAL DATA ── */}
      <SensorInsights sensorCards={sensorCards} crsData={crsData} />
    </div>
  );
}

// ── CRS Breakdown Bar ──
function BreakdownBar({ label, value, weight, color }) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className="flex items-center gap-2 text-[10px]">
      <span className="text-crowd-text-muted w-20 text-right truncate">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-crowd-border overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="font-mono w-8 text-right" style={{ color }}>{Math.round(pct)}</span>
      <span className="text-crowd-text-muted w-8">×{weight}</span>
    </div>
  );
}

// ── Status Row ──
function StatusRow({ icon: Icon, label, connected, detail }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`p-1.5 rounded-lg ${connected ? 'bg-crowd-safe/10' : 'bg-crowd-danger/10'}`}>
        <Icon size={14} className={connected ? 'text-crowd-safe' : 'text-crowd-danger'} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-crowd-text-primary">{label}</p>
        <p className="text-[10px] text-crowd-text-muted truncate">{detail}</p>
      </div>
      <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
        connected ? 'bg-crowd-safe/15 text-crowd-safe' : 'bg-crowd-danger/15 text-crowd-danger'
      }`}>
        {connected ? <Wifi size={10} /> : <WifiOff size={10} />}
        {connected ? 'Online' : 'Offline'}
      </div>
    </div>
  );
}

// ── Mini Sensor Status ──
function MiniStat({ label, status }) {
  const isActive = status === 'active';
  return (
    <div className="text-center">
      <div className={`w-2 h-2 rounded-full mx-auto mb-0.5 ${
        isActive ? 'bg-crowd-safe shadow-[0_0_6px_rgba(0,255,136,0.5)]' : 'bg-crowd-text-muted/30'
      }`} />
      <span className={`text-[9px] ${isActive ? 'text-crowd-safe' : 'text-crowd-text-muted'}`}>{label}</span>
    </div>
  );
}
