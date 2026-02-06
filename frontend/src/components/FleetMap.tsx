import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in React-Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface FleetLocation {
  state: string;
  count: number;
  lat: number;
  lng: number;
  color: string;
}

interface FleetMapProps {
  locations: FleetLocation[];
  onStateClick: (stateName: string) => void;
}

// Custom car marker icon
const createCarIcon = (color: string, count: number) => {
  return L.divIcon({
    className: 'custom-car-marker',
    html: `
      <div style="position: relative;">
        <div style="
          width: 50px;
          height: 50px;
          background: ${color};
          border: 3px solid white;
          border-radius: 50%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          cursor: pointer;
          transition: transform 0.2s;
        ">
          <div style="font-size: 20px;">🚗</div>
          <div style="color: white; font-weight: bold; font-size: 12px; margin-top: 2px;">${count}</div>
        </div>
      </div>
    `,
    iconSize: [50, 50],
    iconAnchor: [25, 50],
    popupAnchor: [0, -50],
  });
};

// Component to set map bounds to show entire US
function SetViewOnLoad() {
  const map = useMap();
  
  useEffect(() => {
    // Set view to center of US with appropriate zoom
    map.setView([39.8283, -98.5795], 4);
  }, [map]);
  
  return null;
}

const FleetMap: React.FC<FleetMapProps> = ({ locations, onStateClick }) => {
  const handleViewVehicles = (stateName: string) => {
    onStateClick(stateName);
  };

  return (
    <div className="w-full h-[500px] rounded-xl overflow-hidden shadow-lg border-2 border-gray-200">
      <MapContainer
        center={[39.8283, -98.5795]}
        zoom={4}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
        scrollWheelZoom={true}
      >
        <SetViewOnLoad />
        
        {/* OpenStreetMap tile layer */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Markers for each state */}
        {locations.map((location, idx) => (
          <Marker
            key={idx}
            position={[location.lat, location.lng]}
            icon={createCarIcon(location.color, location.count)}
          >
            <Popup closeButton={true} autoClose={false} closeOnClick={false}>
              <div className="text-center p-2" style={{ minWidth: '150px' }}>
                <div className="font-bold text-lg mb-1">{location.state}</div>
                <div className="text-gray-700 mb-3">
                  <span className="text-2xl">🚗</span>
                  <span className="font-semibold ml-2">{location.count} vehicles</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewVehicles(location.state);
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition-colors cursor-pointer font-semibold shadow-md"
                >
                  View Vehicles
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default FleetMap;


