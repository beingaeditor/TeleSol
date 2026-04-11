// ═══════════════════════════════════════════════════════
// TeleSol — Analytics Page (REAL SENSOR DATA)
// Charts from accumulated live sensor readings
// ═══════════════════════════════════════════════════════

import { useState, useMemo } from 'react';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { BarChart3, Cpu, Activity } from 'lucide-react';
import GlassCard from '../shared/GlassCard';

const CHART_TOOLTIP_STYLE = {
  contentStyle: {
    background: 'rgba(12,18,32,0.95)',
    border: '1px solid rgba(30,45,74,0.6)',
    borderRadius: 8,
    fontSize: 11,
    color: '#F1F5F9',
  },
  labelStyle: { color: '#94A3B8' },
};

export default function AnalyticsPage({ zones, crsHistory, sensorHistory, crsData, liveData, sensorHealth }) {
  // CRS history chart data
  const crsChartData = useMemo(() => {
    if (crsHistory && crsHistory.length > 0) {
      return crsHistory.map(d => ({ time: d.time, crs: d.crs }));
    }
    return [];
  }, [crsHistory]);

  // Noise level over time
  const noiseChartData = useMemo(() => {
    if (sensorHistory && sensorHistory.length > 0) {
      return sensorHistory.map(d => ({ time: d.time, noise: d.noiseLevel }));
    }
    return [];
  }, [sensorHistory]);

  // People count over time
  const peopleChartData = useMemo(() => {
    if (sensorHistory && sensorHistory.length > 0) {
      return sensorHistory.map(d => ({ time: d.time, people: d.peopleCount }));
    }
    return [];
  }, [sensorHistory]);

  // Vibration over time
  const vibrationChartData = useMemo(() => {
    if (sensorHistory && sensorHistory.length > 0) {
      return sensorHistory.map(d => ({ time: d.time, vibration: parseFloat(d.vibration.toFixed(3)) }));
    }
    return [];
  }, [sensorHistory]);

  // Radar comparison data for radar chart
  const radarData = useMemo(() => {
    const health = sensorHealth || {};
    const live = liveData || {};
    return [
      {
        sensor: 'Radar',
        value: health.radar === 'active' ? Math.min(100, (live.radarHumans || 0) * 25) : 0,
      },
      {
        sensor: 'ToF',
        value: health.tof === 'active' ? Math.min(100, ((live.tofPassageCount || 0) * 20)) : 0,
      },
      {
        sensor: 'IMU',
        value: health.imu === 'active' ? Math.min(100, (live.vibration || 0) * 50) : 0,
      },
      {
        sensor: 'Camera',
        value: health.phone_camera === 'active' ? Math.min(100, (live.cameraPeopleCount || 0) * 25) : 0,
      },
      {
        sensor: 'Mic',
        value: health.phone_mic === 'active' ? Math.min(100, live.noiseLevel || 0) : 0,
      },
      {
        sensor: 'GPS',
        value: health.phone_gps === 'active' ? 80 : 0,
      },
    ];
  }, [sensorHealth, liveData]);

  const hasData = crsChartData.length > 0 || sensorHistory?.length > 0;

  return (
    <div className="space-y-4 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-crowd-text-primary flex items-center gap-2">
          <BarChart3 size={16} className="text-crowd-cyan" />
          Live Sensor Analytics
        </h3>
        <div className="flex items-center gap-2 text-[10px] text-crowd-text-muted font-mono">
          <Activity size={12} className="text-crowd-safe" />
          {crsChartData.length} CRS readings · {sensorHistory?.length || 0} sensor readings
        </div>
      </div>

      {!hasData && (
        <GlassCard className="text-center py-16">
          <Cpu size={32} className="mx-auto mb-3 text-crowd-text-muted opacity-40" />
          <p className="text-sm text-crowd-text-muted">Waiting for sensor data...</p>
          <p className="text-[10px] text-crowd-text-muted mt-1 opacity-60">
            Charts will populate as ESP-12E and iPhone send readings
          </p>
        </GlassCard>
      )}

      {hasData && (
        <>
          {/* Main Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* CRS Over Time */}
            <GlassCard>
              <h4 className="text-xs font-semibold text-crowd-text-secondary mb-3">CRS Score Over Time</h4>
              {crsChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={crsChartData}>
                    <defs>
                      <linearGradient id="analyticsRiskGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#FF3B5C" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#FF3B5C" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E2D4A" />
                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} interval="preserveStartEnd" />
                    <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} width={32} />
                    <Tooltip {...CHART_TOOLTIP_STYLE} />
                    <Area type="monotone" dataKey="crs" stroke="#FF3B5C" strokeWidth={2} fill="url(#analyticsRiskGrad)" dot={false} animationDuration={800} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart message="Waiting for CRS data..." />
              )}
            </GlassCard>

            {/* Noise Level Over Time */}
            <GlassCard>
              <h4 className="text-xs font-semibold text-crowd-text-secondary mb-3">Noise Level (dB)</h4>
              {noiseChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={noiseChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E2D4A" />
                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} interval="preserveStartEnd" />
                    <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} width={32} />
                    <Tooltip {...CHART_TOOLTIP_STYLE} />
                    <Line type="monotone" dataKey="noise" stroke="#FFB800" strokeWidth={2} dot={false} animationDuration={800} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart message="Waiting for audio data..." />
              )}
            </GlassCard>

            {/* People Count Over Time */}
            <GlassCard>
              <h4 className="text-xs font-semibold text-crowd-text-secondary mb-3">People Detected</h4>
              {peopleChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={peopleChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E2D4A" />
                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} interval={Math.max(1, Math.floor(peopleChartData.length / 8))} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} width={32} />
                    <Tooltip {...CHART_TOOLTIP_STYLE} />
                    <Bar dataKey="people" fill="#00D4FF" radius={[2, 2, 0, 0]} animationDuration={800} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart message="Waiting for detection data..." />
              )}
            </GlassCard>

            {/* Sensor Activity Radar */}
            <GlassCard>
              <h4 className="text-xs font-semibold text-crowd-text-secondary mb-3">Sensor Activity Overview</h4>
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#1E2D4A" />
                  <PolarAngleAxis dataKey="sensor" tick={{ fontSize: 10, fill: '#94A3B8' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Activity" dataKey="value" stroke="#00D4FF" fill="#00D4FF" fillOpacity={0.2} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </GlassCard>
          </div>

          {/* Live Readings Table */}
          <GlassCard>
            <h4 className="text-xs font-semibold text-crowd-text-secondary mb-3">Live Sensor Readings</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-crowd-border">
                    <th className="text-left py-2 text-crowd-text-muted font-medium">Sensor</th>
                    <th className="text-right py-2 text-crowd-text-muted font-medium">Value</th>
                    <th className="text-right py-2 text-crowd-text-muted font-medium">Unit</th>
                    <th className="text-right py-2 text-crowd-text-muted font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-crowd-border/50">
                  <ReadingRow label="Radar Humans" value={liveData?.radarHumans || 0} unit="detected" status={sensorHealth?.radar} />
                  <ReadingRow label="Radar Distance" value={liveData?.radarDistance || 0} unit="cm" status={sensorHealth?.radar} />
                  <ReadingRow label="Radar Energy" value={liveData?.radarEnergy || 0} unit="level" status={sensorHealth?.radar} />
                  <ReadingRow label="ToF Distance" value={liveData?.tofDistance || 0} unit="mm" status={sensorHealth?.tof} />
                  <ReadingRow label="ToF Passages" value={liveData?.tofPassageCount || 0} unit="count" status={sensorHealth?.tof} />
                  <ReadingRow label="Vibration" value={parseFloat(liveData?.vibration || 0).toFixed(3)} unit="g" status={sensorHealth?.imu} />
                  <ReadingRow label="Temperature" value={parseFloat(liveData?.temperature || 0).toFixed(1)} unit="°C" status={sensorHealth?.imu} />
                  <ReadingRow label="Camera People" value={liveData?.cameraPeopleCount || 0} unit="detected" status={sensorHealth?.phone_camera} />
                  <ReadingRow label="Noise Level" value={Math.round(liveData?.noiseLevel || 0)} unit="dB" status={sensorHealth?.phone_mic} />
                  <ReadingRow label="Crowd Noise" value={liveData?.isCrowdNoise ? 'Yes' : 'No'} unit="" status={sensorHealth?.phone_mic} />
                  <ReadingRow label="Crowd Density" value={parseFloat(liveData?.crowdDensity || 0).toFixed(4)} unit="ppl/m²" status={sensorHealth?.radar} />
                </tbody>
              </table>
            </div>
          </GlassCard>
        </>
      )}
    </div>
  );
}

function EmptyChart({ message }) {
  return (
    <div className="flex items-center justify-center h-[220px] text-crowd-text-muted text-xs">
      <p>{message}</p>
    </div>
  );
}

function ReadingRow({ label, value, unit, status }) {
  const isActive = status === 'active';
  return (
    <tr className="hover:bg-white/[0.02] transition-colors">
      <td className="py-2.5 text-crowd-text-primary font-medium">{label}</td>
      <td className={`py-2.5 text-right font-mono font-bold ${isActive ? 'text-crowd-text-primary' : 'text-crowd-text-muted'}`}>
        {value}
      </td>
      <td className="py-2.5 text-right font-mono text-crowd-text-muted">{unit}</td>
      <td className="py-2.5 text-right">
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
          isActive ? 'bg-crowd-safe/15 text-crowd-safe' : 'bg-crowd-text-muted/15 text-crowd-text-muted'
        }`}>
          {isActive ? 'Live' : 'Offline'}
        </span>
      </td>
    </tr>
  );
}
