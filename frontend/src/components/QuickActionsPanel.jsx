import { Zap, RefreshCw, Shield, Phone, Server, Activity } from 'lucide-react';

export default function QuickActionsPanel({ selectedTower }) {
  const actions = [
    {
      id: 'activate-backup',
      label: 'Activate Backup',
      icon: Server,
      color: 'cyan',
      description: 'Enable standby capacity',
    },
    {
      id: 'qos-shape',
      label: 'QoS Shaping',
      icon: Activity,
      color: 'purple',
      description: 'Apply traffic shaping',
    },
    {
      id: 'load-balance',
      label: 'Load Balance',
      icon: RefreshCw,
      color: 'green',
      description: 'Redistribute load',
    },
    {
      id: 'emergency',
      label: 'Emergency Protocol',
      icon: Shield,
      color: 'red',
      description: 'Activate emergency mode',
    },
  ];

  const handleAction = (actionId) => {
    // In production, this would call the backend API
    console.log(`Action triggered: ${actionId}`, selectedTower);
    alert(`Action "${actionId}" triggered${selectedTower ? ` for ${selectedTower.name}` : ''}`);
  };

  return (
    <div className="bg-telesol-card border border-telesol-border rounded-lg p-4">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-5 h-5 text-telesol-yellow" />
        <h3 className="text-sm text-white uppercase tracking-wide font-semibold">
          Quick Actions
        </h3>
      </div>

      {selectedTower && (
        <div className="mb-4 p-2 bg-telesol-cyan/10 border border-telesol-cyan/30 rounded-lg">
          <div className="text-xs text-gray-400">Target Zone</div>
          <div className="text-sm text-telesol-cyan font-medium">{selectedTower.name}</div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              onClick={() => handleAction(action.id)}
              className={`p-3 rounded-lg border transition-all hover:scale-105 active:scale-95 text-left ${
                action.color === 'cyan' ? 'border-telesol-cyan/30 hover:bg-telesol-cyan/10' :
                action.color === 'purple' ? 'border-telesol-purple/30 hover:bg-telesol-purple/10' :
                action.color === 'green' ? 'border-telesol-green/30 hover:bg-telesol-green/10' :
                'border-telesol-red/30 hover:bg-telesol-red/10'
              }`}
            >
              <Icon className={`w-5 h-5 mb-2 ${
                action.color === 'cyan' ? 'text-telesol-cyan' :
                action.color === 'purple' ? 'text-telesol-purple' :
                action.color === 'green' ? 'text-telesol-green' :
                'text-telesol-red'
              }`} />
              <div className="text-sm text-white font-medium">{action.label}</div>
              <div className="text-xs text-gray-500">{action.description}</div>
            </button>
          );
        })}
      </div>

      {/* Emergency Contact */}
      <div className="mt-4 pt-4 border-t border-telesol-border">
        <button className="w-full p-2 bg-telesol-bg rounded-lg flex items-center justify-center gap-2 text-gray-400 hover:text-white transition-colors">
          <Phone className="w-4 h-4" />
          <span className="text-sm">Contact NOC Support</span>
        </button>
      </div>
    </div>
  );
}
