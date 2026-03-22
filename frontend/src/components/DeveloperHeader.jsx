import { useState, useEffect } from 'react';
import { LogOut, Code2 } from 'lucide-react';

export default function DeveloperHeader({ focusedArea = 'Delhi NCR', debugMode, onDebugToggle, onLogout }) {
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
        
        {/* Developer Badge */}
        <div className="flex items-center gap-2 px-3 py-1 bg-telesol-purple/10 border border-telesol-purple/30 rounded-full">
          <Code2 className="w-4 h-4 text-telesol-purple" />
          <span className="text-telesol-purple font-medium text-sm">Developer Mode</span>
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

        {/* Logout Button */}
        <button
          onClick={onLogout}
          className="flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-red-400 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm">Exit</span>
        </button>
      </div>
    </header>
  );
}
