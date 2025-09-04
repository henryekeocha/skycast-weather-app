import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Map, Layers, Eye, EyeOff } from "lucide-react";
import type { WeatherMapLayer } from "@shared/schema";
import "leaflet/dist/leaflet.css";

// Import Leaflet dynamically to avoid SSR issues
let L: any;
if (typeof window !== 'undefined') {
  import('leaflet').then((leaflet) => {
    L = leaflet.default;
    // Fix for default markers in production builds
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
  });
}

interface WeatherMapProps {
  center: { lat: number; lon: number };
  locationName: string;
  onLocationChange?: (location: { lat: number; lon: number; name: string }) => void;
}

export default function WeatherMap({ center, locationName, onLocationChange }: WeatherMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const layerRefs = useRef<{ [key: string]: any }>({});
  const markerRef = useRef<any>(null);
  
  const [availableLayers] = useState<WeatherMapLayer[]>([
    {
      id: "precipitation_new",
      name: "Precipitation",
      description: "Shows current precipitation and rainfall intensity",
      enabled: true,
      opacity: 0.6,
      type: "precipitation"
    },
    {
      id: "clouds_new", 
      name: "Clouds",
      description: "Cloud coverage and density",
      enabled: false,
      opacity: 0.5,
      type: "clouds"
    },
    {
      id: "pressure_new",
      name: "Pressure",
      description: "Atmospheric pressure patterns",
      enabled: false,
      opacity: 0.5,
      type: "pressure"
    },
    {
      id: "temp_new",
      name: "Temperature",
      description: "Temperature variations across regions",
      enabled: false,
      opacity: 0.5,
      type: "temperature"
    },
    {
      id: "wind_new",
      name: "Wind",
      description: "Wind speed and direction patterns",
      enabled: false,
      opacity: 0.6,
      type: "wind"
    }
  ]);

  const [activeLayers, setActiveLayers] = useState<WeatherMapLayer[]>(
    availableLayers.filter(layer => layer.enabled)
  );

  // Get API key from backend config
  const { data: config } = useQuery({
    queryKey: ["/api/config"],
    queryFn: async () => {
      const response = await fetch("/api/config");
      if (!response.ok) throw new Error("Failed to fetch config");
      return response.json();
    },
  });

  const apiKey = config?.apiKey || "";

  useEffect(() => {
    if (!mapRef.current || !L || !apiKey) return;

    try {
      // Initialize map
      const map = L.map(mapRef.current).setView([center.lat, center.lon], 8);
      mapInstanceRef.current = map;

      // Add base tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18,
      }).addTo(map);

      // Add draggable location marker
      const locationMarker = L.marker([center.lat, center.lon], {
        draggable: true,
        title: 'Drag to change location'
      })
        .addTo(map)
        .bindPopup(`<strong>${locationName}</strong><br>Drag marker to change location`)
        .openPopup();
    
    markerRef.current = locationMarker;

    // Handle marker drag events
    locationMarker.on('dragend', async (e: any) => {
      const newPosition = e.target.getLatLng();
      const lat = parseFloat(newPosition.lat.toFixed(6));
      const lon = parseFloat(newPosition.lng.toFixed(6));
      
      if (onLocationChange) {
        // Try to get a readable location name using reverse geocoding
        try {
          const response = await fetch(
            `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${apiKey}`
          );
          
          if (response.ok) {
            const data = await response.json();
            if (data && data.length > 0) {
              const location = data[0];
              const newLocationName = location.state 
                ? `${location.name}, ${location.state}, ${location.country}`
                : `${location.name}, ${location.country}`;
              
              // Update popup with new location name
              locationMarker.setPopupContent(`<strong>${newLocationName}</strong><br>Drag marker to change location`);
              
              onLocationChange({
                lat,
                lon,
                name: newLocationName
              });
            } else {
              // Fallback to coordinates if reverse geocoding fails
              const coordName = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
              locationMarker.setPopupContent(`<strong>${coordName}</strong><br>Drag marker to change location`);
              
              onLocationChange({
                lat,
                lon,
                name: coordName
              });
            }
          }
        } catch (error) {
          console.error('Error with reverse geocoding:', error);
          // Fallback to coordinates
          const coordName = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
          locationMarker.setPopupContent(`<strong>${coordName}</strong><br>Drag marker to change location`);
          
          onLocationChange({
            lat,
            lon,
            name: coordName
          });
        }
      }
    });

    // Add weather layers
    activeLayers.forEach((layer) => {
      const weatherLayer = L.tileLayer(
        `https://tile.openweathermap.org/map/${layer.id}/{z}/{x}/{y}.png?appid=${apiKey}`,
        {
          attribution: 'Weather data © OpenWeatherMap',
          opacity: layer.opacity,
          maxZoom: 18,
        }
      );
      
      layerRefs.current[layer.id] = weatherLayer;
      weatherLayer.addTo(map);
    });

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        layerRefs.current = {};
      }
    };
    } catch (error) {
      console.error('Error initializing map:', error);
      return () => {};
    }
  }, [center.lat, center.lon, locationName, apiKey]);

  // Update active layers when user toggles them
  useEffect(() => {
    if (!mapInstanceRef.current || !L) return;

    // Remove all current weather layers
    Object.values(layerRefs.current).forEach((layer) => {
      if (mapInstanceRef.current && layer) {
        mapInstanceRef.current.removeLayer(layer);
      }
    });

    // Add active layers
    layerRefs.current = {};
    activeLayers.forEach((layer) => {
      const weatherLayer = L.tileLayer(
        `https://tile.openweathermap.org/map/${layer.id}/{z}/{x}/{y}.png?appid=${apiKey}`,
        {
          attribution: 'Weather data © OpenWeatherMap',
          opacity: layer.opacity,
          maxZoom: 18,
        }
      );
      
      layerRefs.current[layer.id] = weatherLayer;
      weatherLayer.addTo(mapInstanceRef.current);
    });
  }, [activeLayers, apiKey]);

  const toggleLayer = (layerId: string) => {
    setActiveLayers(prev => {
      const layer = availableLayers.find(l => l.id === layerId);
      if (!layer) return prev;

      const isActive = prev.some(l => l.id === layerId);
      
      if (isActive) {
        return prev.filter(l => l.id !== layerId);
      } else {
        return [...prev, layer];
      }
    });
  };

  const updateLayerOpacity = (layerId: string, opacity: number) => {
    setActiveLayers(prev => prev.map(layer => 
      layer.id === layerId ? { ...layer, opacity } : layer
    ));

    // Update the actual map layer opacity
    const layer = layerRefs.current[layerId];
    if (layer) {
      layer.setOpacity(opacity);
    }
  };

  if (!apiKey) {
    return (
      <div className="weather-card rounded-3xl p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8" data-testid="card-weather-map-error">
        <h3 className="text-2xl font-semibold mb-4 flex items-center">
          <Map className="w-6 h-6 text-primary mr-3" />
          Weather Map
        </h3>
        <div className="text-center py-8">
          <p className="text-muted-foreground">Weather maps require API configuration</p>
        </div>
      </div>
    );
  }

  return (
    <div className="weather-card rounded-3xl p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8" data-testid="card-weather-map">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
        <h3 className="text-2xl font-semibold mb-4 lg:mb-0 flex items-center">
          <Map className="w-6 h-6 text-primary mr-3" />
          Weather Map & Radar
        </h3>
        
        {/* Layer Controls */}
        <div className="flex items-center space-x-2">
          <Layers className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Layers:</span>
          <div className="flex flex-wrap gap-2">
            {availableLayers.slice(0, 3).map((layer) => {
              const isActive = activeLayers.some(l => l.id === layer.id);
              return (
                <button
                  key={layer.id}
                  onClick={() => toggleLayer(layer.id)}
                  className={`flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    isActive 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                  data-testid={`button-layer-${layer.id}`}
                  title={layer.description}
                >
                  {isActive ? <Eye className="w-3 h-3 mr-1" /> : <EyeOff className="w-3 h-3 mr-1" />}
                  {layer.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative">
        <div 
          ref={mapRef} 
          className="w-full h-[400px] md:h-[500px] rounded-2xl overflow-hidden border border-border"
          data-testid="weather-map-container"
        />
        
        {/* Map Legend */}
        <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur-sm border border-border rounded-lg p-3 max-w-xs">
          <h4 className="text-sm font-semibold mb-2 flex items-center">
            <Layers className="w-3 h-3 mr-1" />
            Active Layers
          </h4>
          {activeLayers.length === 0 ? (
            <p className="text-xs text-muted-foreground">No weather layers active</p>
          ) : (
            <div className="space-y-2">
              {activeLayers.map((layer) => (
                <div key={layer.id} className="flex items-center justify-between">
                  <span className="text-xs font-medium">{layer.name}</span>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.1"
                    value={layer.opacity}
                    onChange={(e) => updateLayerOpacity(layer.id, parseFloat(e.target.value))}
                    className="w-12 h-1 bg-muted rounded-lg appearance-none cursor-pointer"
                    data-testid={`slider-opacity-${layer.id}`}
                    title={`Adjust ${layer.name} opacity`}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Extended Layer Controls */}
        <div className="absolute top-4 right-4 bg-card/90 backdrop-blur-sm border border-border rounded-lg p-3">
          <div className="flex flex-col space-y-2">
            {availableLayers.map((layer) => {
              const isActive = activeLayers.some(l => l.id === layer.id);
              return (
                <button
                  key={layer.id}
                  onClick={() => toggleLayer(layer.id)}
                  className={`flex items-center px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left ${
                    isActive 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                  data-testid={`button-layer-full-${layer.id}`}
                  title={layer.description}
                >
                  {isActive ? <Eye className="w-3 h-3 mr-2" /> : <EyeOff className="w-3 h-3 mr-2" />}
                  {layer.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Map Info */}
      <div className="mt-4 text-center">
        <p className="text-xs text-muted-foreground">
          Interactive weather map showing real-time conditions • Data updates every 10 minutes
        </p>
      </div>
    </div>
  );
}