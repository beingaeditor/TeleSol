import { useState, useEffect } from 'react';

export default function Header({ focusedArea = 'Delhi NCR', debugMode, onDebugToggle }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-telesol-border">
      <div className="flex items-center gap-4">
        {/* Live indicator */}
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-telesol-green rounded-full animate-pulse-live"></span>
          <span className="text-telesol-cyan font-semibold">TELESOL NOC</span>
        </div>
        <span className="text-gray-400">|</span>
        <span className="text-gray-300">{focusedArea} Network Operations Center</span>
        <span className="text-gray-400">|</span>
        <span className="text-telesol-green font-medium">LIVE</span>
      </div>
      
      <div className="flex items-center gap-6">
        {/* Debug Toggle */}
        <label className="flex items-center gap-2 cursor-pointer">
          <span className="text-sm text-gray-400">Debug Mode</span>
          <div className="relative">
            <input
              type="checkbox"
              checked={debugMode}
              onChange={(e) => onDebugToggle(e.target.checked)}
              className="sr-only"
            />
            <div className={`w-10 h-5 rounded-full transition-colors ${debugMode ? 'bg-telesol-orange' : 'bg-gray-600'}`}>
              <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${debugMode ? 'translate-x-5' : 'translate-x-0.5'}`}></div>
            </div>
          </div>
        </label>

        <div className="text-right">
          <div className="text-2xl font-mono text-white">
            {time.toLocaleTimeString('en-IN', { hour12: false })}
          </div>
          <div className="text-sm text-gray-400">IST</div>
        </div>
      </div>
    </header>
  );
}
