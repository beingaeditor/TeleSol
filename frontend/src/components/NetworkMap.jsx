import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { getCRSStatus } from '../data/mockData';
import { getGPSLocation } from '../data/api';
import 'leaflet/dist/leaflet.css';

// Component to recenter map when GPS location is obtained
function MapRecenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] !== 0 && center[1] !== 0) {
      map.setView(center, 14);
    }
  }, [center, map]);
  return null;
}

export default function NetworkMap({ towers, onAreaChange, onTowerSelect }) {
  const mapRef = useRef(null);
  const [gpsLocation, setGpsLocation] = useState(null);
  const [nodes, setNodes] = useState(towers);

  // Use the active node's fixed coordinates as the map center
  useEffect(() => {
    const activeNode = nodes.find(n => n.active);
    if (activeNode && activeNode.lat !== 0 && activeNode.lng !== 0) {
      setGpsLocation([activeNode.lat, activeNode.lng]);
      onAreaChange?.('RnD IIITD, Okhla Phase 3');
    }
  }, []);

  // Default center — use GPS if available, else Delhi
  const center = gpsLocation || [28.5459, 77.2732];

  return (
    <div className="bg-telesol-card border border-telesol-border rounded-lg p-4 h-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm text-gray-400 uppercase tracking-wide">Network Node Map</h3>
        <div className="flex items-center gap-2">
          {gpsLocation ? (
            <span className="text-xs text-telesol-green flex items-center gap-1">
              <span className="w-2 h-2 bg-telesol-green rounded-full animate-pulse"></span>
              GPS Locked
            </span>
          ) : (
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
              Locating...
            </span>
          )}
        </div>
      </div>

      {/* Map container */}
      <div className="h-80 rounded-lg overflow-hidden">
        <MapContainer
          ref={mapRef}
          center={center}
          zoom={14}
          style={{ height: '100%', width: '100%', background: '#0D1117' }}
          zoomControl={true}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          />

          <MapRecenter center={gpsLocation} />

          {/* Node markers */}
          {nodes.map((node) => {
            // Skip nodes with no valid coords
            if (node.lat === 0 && node.lng === 0) return null;

            const isActive = node.active;
            const status = isActive ? getCRSStatus(node.crs) : { color: '#FF4444', label: 'Offline' };

            return (
              <CircleMarker
                key={node.id}
                center={[node.lat, node.lng]}
                radius={isActive ? 14 : 8}
                pathOptions={{
                  color: isActive ? '#00FF88' : '#FF4444',
                  weight: isActive ? 3 : 1,
                  fillColor: isActive ? status.color : '#FF4444',
                  fillOpacity: isActive ? 0.9 : 0.4,
                  dashArray: isActive ? '' : '4',
                }}
                eventHandlers={{
                  click: () => onTowerSelect && onTowerSelect(node),
                }}
              >
                <Popup className="telesol-popup">
                  <div className="bg-telesol-card p-2 rounded text-white min-w-[150px]">
                    <div className="font-semibold" style={{ color: isActive ? '#00FFCC' : '#FF4444' }}>
                      {node.name}
                    </div>
                    {isActive ? (
                      <>
                        <div className="text-sm text-gray-300">Zone: {node.zone}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm">CRS:</span>
                          <span className="font-bold" style={{ color: status.color }}>{node.crs}</span>
                          <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: status.color + '33', color: status.color }}>
                            {status.label}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="text-sm text-red-400 mt-1">⊘ Offline — No data</div>
                    )}
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 text-xs">
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-telesol-green animate-pulse" />
          <span className="text-gray-400">Active Node</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-telesol-red opacity-50" />
          <span className="text-gray-400">Offline</span>
        </div>
      </div>
    </div>
  );
}
