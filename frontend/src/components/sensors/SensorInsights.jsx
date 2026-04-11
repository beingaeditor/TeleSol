// ═══════════════════════════════════════════════════════
// TeleSol — Sensor Insights (REAL DATA)
// Shows actual sensor hardware status + live readings
// ═══════════════════════════════════════════════════════

import {
  Radio, Scan, Activity, Camera, Mic, MapPin, Gauge, Cpu
} from 'lucide-react';
import GlassCard from '../shared/GlassCard';

const ICON_MAP = {
  Radio, Scan, Activity, Camera, Mic, MapPin, Gauge, Cpu,
};

function SensorCard({ sensor }) {
  const Icon = ICON_MAP[sensor.icon] || Activity;
  const isActive = sensor.status === 'active';

  return (
    <GlassCard className="flex flex-col gap-3" glow={isActive ? 'cyan' : undefined}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${isActive ? 'bg-crowd-cyan/10' : 'bg-crowd-text-muted/10'}`}>
            <Icon size={16} className={isActive ? 'text-crowd-cyan' : 'text-crowd-text-muted'} />
          </div>
          <div>
            <p className="text-xs font-semibold text-crowd-text-primary">{sensor.label}</p>
            <p className="text-[10px] text-crowd-text-muted">{sensor.metric}</p>
          </div>
        </div>
        <div className="text-right">
          <span className={`text-lg font-bold font-mono ${isActive ? 'text-crowd-text-primary' : 'text-crowd-text-muted'}`}>
            {sensor.value}
          </span>
          {sensor.unit && (
            <span className="text-[10px] text-crowd-text-muted ml-1">{sensor.unit}</span>
          )}
        </div>
      </div>

      {/* Secondary value + status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-crowd-text-muted">{sensor.secondaryLabel}:</span>
          <span className="text-[10px] font-mono font-medium text-crowd-text-secondary">
            {sensor.secondaryValue}
          </span>
        </div>
        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
          isActive
            ? 'bg-crowd-safe/15 text-crowd-safe'
            : 'bg-crowd-text-muted/15 text-crowd-text-muted'
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full ${
            isActive ? 'bg-crowd-safe animate-pulse' : 'bg-crowd-text-muted'
          }`} style={isActive ? { boxShadow: '0 0 4px #00FF88' } : {}} />
          {isActive ? 'Active' : 'Offline'}
        </div>
      </div>
    </GlassCard>
  );
}

export default function SensorInsights({ sensorCards, crsData }) {
  const sensors = sensorCards || [];
  const activeSensors = sensors.filter(s => s.status === 'active').length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-crowd-text-primary flex items-center gap-2">
          <Activity size={14} className="text-crowd-cyan" />
          Sensor Insights — Live Hardware
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-crowd-text-muted">
            {activeSensors}/{sensors.length} sensors active
          </span>
        </div>
      </div>

      {/* Sensor Cards Grid */}
      {sensors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {sensors.map(sensor => (
            <SensorCard key={sensor.id} sensor={sensor} />
          ))}
        </div>
      ) : (
        <GlassCard className="text-center py-8">
          <Cpu size={24} className="mx-auto mb-2 text-crowd-text-muted opacity-40" />
          <p className="text-sm text-crowd-text-muted">Waiting for sensor connections...</p>
          <p className="text-[10px] text-crowd-text-muted mt-1 opacity-60">
            Connect ESP-12E or open /companion on your iPhone
          </p>
        </GlassCard>
      )}

      {/* CRS Computation Info */}
      {crsData && (
        <GlassCard glow="purple" className="mt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-crowd-purple/10">
                <Gauge size={16} className="text-crowd-purple" />
              </div>
              <div>
                <p className="text-xs font-semibold text-crowd-text-primary">CRS Engine</p>
                <p className="text-[10px] text-crowd-text-muted">Crowd Risk Score Computation</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-sm font-bold font-mono text-crowd-purple">{Math.round(crsData.crs || 0)}</p>
                <p className="text-[10px] text-crowd-text-muted">Score</p>
              </div>
              <div className="text-center">
                <p className={`text-sm font-bold font-mono capitalize ${
                  crsData.level === 'critical' ? 'text-crowd-danger' :
                  crsData.level === 'high' ? 'text-crowd-danger' :
                  crsData.level === 'elevated' ? 'text-crowd-warning' :
                  'text-crowd-safe'
                }`}>{crsData.level || 'normal'}</p>
                <p className="text-[10px] text-crowd-text-muted">Level</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-bold font-mono text-crowd-cyan">
                  {crsData.history?.length || 0}
                </p>
                <p className="text-[10px] text-crowd-text-muted">Readings</p>
              </div>
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
