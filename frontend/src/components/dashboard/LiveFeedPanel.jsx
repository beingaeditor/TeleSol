// ═══════════════════════════════════════════════════════
// TeleSol — Live Feed Panel
// Shows real-time iPhone camera feed + audio levels
// ═══════════════════════════════════════════════════════

import { useState, useEffect, useRef } from 'react';
import { Camera, Mic, Users, Wifi, WifiOff, Smartphone, Volume2 } from 'lucide-react';
import GlassCard from '../shared/GlassCard';

export default function LiveFeedPanel({ frame, personCount, noiseDb, isPhoneConnected }) {
  const [isLive, setIsLive] = useState(false);
  const [frameAge, setFrameAge] = useState(null);
  const imgRef = useRef(null);

  // Track if we're receiving frames
  useEffect(() => {
    if (frame) {
      setIsLive(true);
      setFrameAge(Date.now());
    }
  }, [frame]);

  // Check for stale frames (no update in 5s = offline)
  useEffect(() => {
    const interval = setInterval(() => {
      if (frameAge && Date.now() - frameAge > 5000) {
        setIsLive(false);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [frameAge]);

  const noiseColor = noiseDb < 40 ? '#00FF88' : noiseDb < 60 ? '#FFB800' : '#FF3B5C';
  const noisePct = Math.min(100, (noiseDb / 100) * 100);
  const noiseLabel = noiseDb < 40 ? 'Quiet' : noiseDb < 60 ? 'Moderate' : noiseDb < 80 ? 'Loud' : 'Very Loud';

  return (
    <GlassCard className="overflow-hidden" glow={isLive ? 'cyan' : undefined}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-crowd-cyan/10">
            <Camera size={14} className="text-crowd-cyan" />
          </div>
          <h3 className="text-xs font-semibold text-crowd-text-primary">Live Camera Feed</h3>
        </div>
        <div className="flex items-center gap-2">
          {/* Phone Connection Status */}
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-mono font-bold ${
            isPhoneConnected
              ? 'bg-crowd-safe/15 text-crowd-safe'
              : 'bg-crowd-danger/15 text-crowd-danger'
          }`}>
            {isPhoneConnected ? <Wifi size={10} /> : <WifiOff size={10} />}
            {isPhoneConnected ? 'Phone Live' : 'Phone Offline'}
          </div>
          {/* Live indicator */}
          {isLive && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" style={{ boxShadow: '0 0 6px #FF3B5C' }} />
              <span className="text-[10px] font-mono font-bold text-red-400">LIVE</span>
            </div>
          )}
        </div>
      </div>

      {/* Video Frame */}
      <div className="relative rounded-lg overflow-hidden bg-black mb-3" style={{ aspectRatio: '4/3' }}>
        {frame ? (
          <img
            ref={imgRef}
            src={`data:image/jpeg;base64,${frame}`}
            alt="Live camera feed"
            className="w-full h-full object-cover"
            style={{ imageRendering: 'auto' }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3" style={{ minHeight: 200 }}>
            <Smartphone size={32} className="text-crowd-text-muted opacity-40" />
            <div className="text-center">
              <p className="text-xs text-crowd-text-muted font-mono">No Camera Feed</p>
              <p className="text-[10px] text-crowd-text-muted mt-1 opacity-60">
                Open <span className="text-crowd-cyan">/companion</span> on your iPhone
              </p>
            </div>
          </div>
        )}

        {/* Person count overlay on video */}
        {frame && (
          <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded-lg
                         bg-crowd-cyan/20 backdrop-blur-sm border border-crowd-cyan/30">
            <Users size={12} className="text-crowd-cyan" />
            <span className="text-xs font-mono font-bold text-crowd-cyan">
              {personCount} {personCount === 1 ? 'person' : 'people'}
            </span>
          </div>
        )}

        {/* Noise badge overlay on video */}
        {frame && (
          <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-1 rounded-lg
                         backdrop-blur-sm border"
               style={{ background: `${noiseColor}20`, borderColor: `${noiseColor}40` }}>
            <Volume2 size={12} style={{ color: noiseColor }} />
            <span className="text-xs font-mono font-bold" style={{ color: noiseColor }}>
              {Math.round(noiseDb)} dB
            </span>
          </div>
        )}
      </div>

      {/* Audio Level Meter */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <Mic size={12} className="text-crowd-text-muted" />
            <span className="text-[10px] text-crowd-text-muted font-mono uppercase">Audio Level</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold" style={{ color: noiseColor }}>{noiseLabel}</span>
            <span className="text-xs font-mono font-bold" style={{ color: noiseColor }}>{Math.round(noiseDb)} dB</span>
          </div>
        </div>
        <div className="h-2 rounded-full bg-crowd-border overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-200"
            style={{
              width: `${noisePct}%`,
              background: `linear-gradient(90deg, #00FF88, ${noiseColor})`,
              boxShadow: `0 0 8px ${noiseColor}40`,
            }}
          />
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center gap-2 p-2 rounded-lg bg-crowd-border/30">
          <Users size={14} className="text-crowd-cyan" />
          <div>
            <p className="text-sm font-bold font-mono text-crowd-text-primary">{personCount}</p>
            <p className="text-[9px] text-crowd-text-muted">People Detected</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-2 rounded-lg bg-crowd-border/30">
          <Mic size={14} style={{ color: noiseColor }} />
          <div>
            <p className="text-sm font-bold font-mono text-crowd-text-primary">{Math.round(noiseDb)}<span className="text-[10px] text-crowd-text-muted ml-0.5">dB</span></p>
            <p className="text-[9px] text-crowd-text-muted">Noise Level</p>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
