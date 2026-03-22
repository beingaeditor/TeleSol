import { useState } from 'react';
import { Radio, Building2, Code2, Shield, ArrowRight, AlertCircle } from 'lucide-react';

// Valid telecom access codes (in production, validate against backend)
const VALID_TELECOM_CODES = {
  'JIO-2024-ALPHA': { company: 'Jio', tier: 'enterprise' },
  'AIRTEL-NOC-001': { company: 'Airtel', tier: 'enterprise' },
  'VI-NETWORK-2024': { company: 'Vi', tier: 'standard' },
  'BSNL-GOVT-ACC': { company: 'BSNL', tier: 'government' },
  'DEMO-ACCESS-123': { company: 'Demo Corp', tier: 'demo' },
};

export default function LoginScreen({ onLogin }) {
  const [selectedRole, setSelectedRole] = useState(null);
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = () => {
    setError('');
    
    if (!selectedRole) {
      setError('Please select a user type');
      return;
    }

    if (selectedRole === 'developer') {
      // Developers can access directly
      onLogin({ role: 'developer', company: null });
      return;
    }

    if (selectedRole === 'telecom') {
      // Validate access code for telecom users
      const codeUpper = accessCode.trim().toUpperCase();
      
      if (!codeUpper) {
        setError('Please enter your access code');
        return;
      }

      setIsLoading(true);
      
      // Simulate API validation delay
      setTimeout(() => {
        if (VALID_TELECOM_CODES[codeUpper]) {
          const { company, tier } = VALID_TELECOM_CODES[codeUpper];
          onLogin({ role: 'telecom', company, tier, code: codeUpper });
        } else {
          setError('Invalid access code. Please contact your administrator.');
        }
        setIsLoading(false);
      }, 800);
    }
  };

  return (
    <div className="min-h-screen bg-telesol-bg flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-telesol-cyan to-telesol-green flex items-center justify-center">
              <Radio className="w-7 h-7 text-telesol-bg" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">TeleSol</h1>
              <p className="text-xs text-telesol-cyan tracking-wider">NETWORK OPERATIONS CENTER</p>
            </div>
          </div>
          <p className="text-gray-400 text-sm">Predictive Telecom Congestion Intelligence</p>
        </div>

        {/* Selection Card */}
        <div className="bg-telesol-card border border-telesol-border rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-1">Welcome Back</h2>
          <p className="text-sm text-gray-400 mb-6">Select your account type to continue</p>

          {/* Role Selection */}
          <div className="space-y-3 mb-6">
            {/* Developer Option */}
            <button
              onClick={() => {
                setSelectedRole('developer');
                setError('');
              }}
              className={`w-full p-4 rounded-lg border-2 transition-all text-left flex items-center gap-4 ${
                selectedRole === 'developer'
                  ? 'border-telesol-purple bg-telesol-purple/10'
                  : 'border-telesol-border hover:border-gray-500 bg-telesol-bg/50'
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                selectedRole === 'developer' ? 'bg-telesol-purple' : 'bg-telesol-border'
              }`}>
                <Code2 className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-white">Developer</div>
                <div className="text-xs text-gray-400">Access sensor telemetry & debug tools</div>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                selectedRole === 'developer' ? 'border-telesol-purple' : 'border-gray-500'
              }`}>
                {selectedRole === 'developer' && (
                  <div className="w-2.5 h-2.5 rounded-full bg-telesol-purple" />
                )}
              </div>
            </button>

            {/* Telecom User Option */}
            <button
              onClick={() => {
                setSelectedRole('telecom');
                setError('');
              }}
              className={`w-full p-4 rounded-lg border-2 transition-all text-left flex items-center gap-4 ${
                selectedRole === 'telecom'
                  ? 'border-telesol-cyan bg-telesol-cyan/10'
                  : 'border-telesol-border hover:border-gray-500 bg-telesol-bg/50'
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                selectedRole === 'telecom' ? 'bg-telesol-cyan' : 'bg-telesol-border'
              }`}>
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-white">Telecom Operator</div>
                <div className="text-xs text-gray-400">NOC dashboard for network management</div>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                selectedRole === 'telecom' ? 'border-telesol-cyan' : 'border-gray-500'
              }`}>
                {selectedRole === 'telecom' && (
                  <div className="w-2.5 h-2.5 rounded-full bg-telesol-cyan" />
                )}
              </div>
            </button>
          </div>

          {/* Access Code Input (for Telecom users) */}
          {selectedRole === 'telecom' && (
            <div className="mb-6 animate-fadeIn">
              <label className="block text-sm text-gray-400 mb-2">
                <Shield className="w-4 h-4 inline mr-1" />
                Enterprise Access Code
              </label>
              <input
                type="text"
                value={accessCode}
                onChange={(e) => {
                  setAccessCode(e.target.value.toUpperCase());
                  setError('');
                }}
                placeholder="Enter your access code"
                className="w-full px-4 py-3 bg-telesol-bg border border-telesol-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-telesol-cyan font-mono tracking-wider"
              />
              <p className="text-xs text-gray-500 mt-2">
                Contact your administrator if you don't have an access code
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Continue Button */}
          <button
            onClick={handleContinue}
            disabled={isLoading}
            className={`w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all ${
              selectedRole
                ? selectedRole === 'developer'
                  ? 'bg-telesol-purple hover:bg-telesol-purple/80 text-white'
                  : 'bg-telesol-cyan hover:bg-telesol-cyan/80 text-telesol-bg'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Validating...
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* Demo Codes Hint (for testing) */}
        <div className="mt-6 p-4 bg-telesol-card/50 border border-dashed border-telesol-border rounded-lg">
          <p className="text-xs text-gray-500 text-center mb-2">Demo Access Codes (for testing)</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {['DEMO-ACCESS-123', 'JIO-2024-ALPHA'].map((code) => (
              <code
                key={code}
                onClick={() => {
                  setSelectedRole('telecom');
                  setAccessCode(code);
                }}
                className="px-2 py-1 bg-telesol-bg rounded text-xs text-telesol-cyan cursor-pointer hover:bg-telesol-border transition-colors"
              >
                {code}
              </code>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-600 mt-6">
          TeleSol v2.1 | Predictive Network Intelligence
        </p>
      </div>
    </div>
  );
}
