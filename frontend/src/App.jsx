import { useState, useEffect } from 'react';
import LoginScreen from './components/LoginScreen';
import DeveloperDashboard from './components/DeveloperDashboard';
import TelecomDashboard from './components/TelecomDashboard';

export default function App() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for saved session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('telesol_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('telesol_user');
      }
    }
    setIsLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('telesol_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('telesol_user');
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-telesol-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-telesol-cyan border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading TeleSol...</p>
        </div>
      </div>
    );
  }

  // Not logged in - show login screen
  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  // Logged in - show appropriate dashboard
  if (user.role === 'developer') {
    return <DeveloperDashboard onLogout={handleLogout} />;
  }

  if (user.role === 'telecom') {
    return <TelecomDashboard user={user} onLogout={handleLogout} />;
  }

  // Fallback
  return <LoginScreen onLogin={handleLogin} />;
}
