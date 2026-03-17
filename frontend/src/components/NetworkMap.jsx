import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { getCRSStatus } from '../data/mockData';
import 'leaflet/dist/leaflet.css';

// Component to handle map click and update focused area
function MapClickHandler({ onAreaChange }) {
  const map = useMap();
  
  useEffect(() => {
    map.on('moveend', () => {
      const center = map.getCenter();
      // Determine area based on center position
      if (center.lat > 28.65 && center.lng < 77.15) {
        onAreaChange('North Delhi');
      } else if (center.lat < 28.55 && center.lng > 77.3) {
        onAreaChange('Noida');
      } else if (center.lat < 28.5 && center.lng < 77.1) {
        onAreaChange('Gurgaon');
      } else if (center.lng > 77.4) {
        onAreaChange('Ghaziabad');
      } else if (center.lat > 28.6 && center.lat < 28.65) {
        onAreaChange('Central Delhi');
      } else {
        onAreaChange('Delhi NCR');
      }
    });
  }, [map, onAreaChange]);

  return null;
}

export default function NetworkMap({ towers, onAreaChange, onTowerSelect }) {
  const mapRef = useRef(null);
  
  // Delhi NCR center
  const center = [28.6139, 77.2090];

  return (
    <div className="bg-telesol-card border border-telesol-border rounded-lg p-4 h-full">
      <h3 className="text-sm text-gray-400 mb-3 uppercase tracking-wide">City Network Map</h3>
      
      {/* Map container */}
      <div className="h-80 rounded-lg overflow-hidden">
        <MapContainer
          ref={mapRef}
          center={center}
          zoom={11}
          style={{ height: '100%', width: '100%', background: '#0D1117' }}
          zoomControl={true}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          />
          
          <MapClickHandler onAreaChange={onAreaChange} />
          
          {/* Tower markers */}
          {towers.map((tower) => {
            const status = getCRSStatus(tower.crs);
            
            return (
              <CircleMarker
                key={tower.id}
                center={[tower.lat, tower.lng]}
                radius={tower.crs > 80 ? 12 : tower.crs > 60 ? 10 : 8}
                pathOptions={{
                  color: '#ffffff',
                  weight: 2,
                  fillColor: status.color,
                  fillOpacity: 0.9,
                }}
                eventHandlers={{
                  click: () => onTowerSelect && onTowerSelect(tower),
                }}
              >
                <Popup className="telesol-popup">
                  <div className="bg-telesol-card p-2 rounded text-white min-w-[150px]">
                    <div className="font-semibold text-telesol-cyan">{tower.name}</div>
                    <div className="text-sm text-gray-300">Zone: {tower.zone}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm">CRS:</span>
                      <span className="font-bold" style={{ color: status.color }}>{tower.crs}</span>
                      <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: status.color + '33', color: status.color }}>
                        {status.label}
                      </span>
                    </div>
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
          <span className="w-3 h-3 rounded-full bg-telesol-green" />
          <span className="text-gray-400">Normal</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-telesol-orange" />
          <span className="text-gray-400">Elevated</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-telesol-red" />
          <span className="text-gray-400">Critical</span>
        </div>
      </div>
    </div>
  );
}
