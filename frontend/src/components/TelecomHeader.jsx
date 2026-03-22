import { useState, useEffect } from 'react';
import { LogOut, Bell, Settings, User, Building2 } from 'lucide-react';

export default function TelecomHeader({ focusedArea = 'Delhi NCR', user, onLogout }) {
  const [time, setTime] = useState(new Date());
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-telesol-border bg-telesol-card/50">
      <div className="flex items-center gap-4">
        {/* Logo & Brand */}
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-telesol-green rounded-full animate-pulse"></span>
          <span className="text-telesol-cyan font-semibold">TELESOL</span>
        </div>
        
        <span className="text-gray-600">|</span>
        
        {/* Company Badge */}
        <div className="flex items-center gap-2 px-3 py-1 bg-telesol-cyan/10 border border-telesol-cyan/30 rounded-full">
          <Building2 className="w-4 h-4 text-telesol-cyan" />
          <span className="text-telesol-cyan font-medium text-sm">{user.company}</span>
        </div>
        
        <span className="text-gray-600">|</span>
        
        <span className="text-gray-300">{focusedArea} Operations</span>
        
        <span className="px-2 py-0.5 bg-telesol-green/20 text-telesol-green text-xs rounded font-medium">
          LIVE
        </span>
      </div>
      
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="relative p-2 text-gray-400 hover:text-white transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-telesol-red rounded-full"></span>
        </button>

        {/* Settings */}
        <button className="p-2 text-gray-400 hover:text-white transition-colors">
          <Settings className="w-5 h-5" />
        </button>

        {/* Time Display */}
        <div className="text-right px-4 border-l border-telesol-border">
          <div className="text-xl font-mono text-white">
            {time.toLocaleTimeString('en-IN', { hour12: false })}
          </div>
          <div className="text-xs text-gray-400">IST</div>
        </div>

        {/* User Menu */}
        <div className="relative">
          <button 
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 px-3 py-2 bg-telesol-bg rounded-lg border border-telesol-border hover:border-gray-500 transition-colors"
          >
            <div className="w-8 h-8 bg-telesol-cyan/20 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-telesol-cyan" />
            </div>
            <div className="text-left">
              <div className="text-sm text-white">Operator</div>
              <div className="text-xs text-gray-500">{user.tier}</div>
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-telesol-card border border-telesol-border rounded-lg shadow-xl z-50">
              <div className="p-3 border-b border-telesol-border">
                <div className="text-sm text-white">{user.company}</div>
                <div className="text-xs text-gray-400">Access: {user.code}</div>
              </div>
              <button
                onClick={onLogout}
                className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
