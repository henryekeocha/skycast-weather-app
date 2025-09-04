import { Wind } from "lucide-react";
import type { AirQuality } from "@shared/schema";

interface AirQualityProps {
  airQuality: AirQuality;
}

export default function AirQuality({ airQuality }: AirQualityProps) {
  const currentData = airQuality.list[0];
  const aqi = currentData.main.aqi;
  const components = currentData.components;

  const getAQIInfo = (aqi: number) => {
    switch (aqi) {
      case 1:
        return {
          label: "Good",
          color: "bg-green-500",
          textColor: "text-green-500",
          description: "Air quality is satisfactory"
        };
      case 2:
        return {
          label: "Fair",
          color: "bg-yellow-400",
          textColor: "text-yellow-400",
          description: "Air quality is acceptable"
        };
      case 3:
        return {
          label: "Moderate",
          color: "bg-orange-500",
          textColor: "text-orange-500",
          description: "Air quality is moderate"
        };
      case 4:
        return {
          label: "Poor",
          color: "bg-red-500",
          textColor: "text-red-500",
          description: "Air quality is poor"
        };
      case 5:
        return {
          label: "Very Poor",
          color: "bg-purple-600",
          textColor: "text-purple-600",
          description: "Air quality is very poor"
        };
      default:
        return {
          label: "Unknown",
          color: "bg-gray-400",
          textColor: "text-gray-400",
          description: "Air quality data unavailable"
        };
    }
  };

  const aqiInfo = getAQIInfo(aqi);

  const pollutants = [
    { name: "PM2.5", value: components.pm2_5, unit: "μg/m³", description: "Fine particles" },
    { name: "PM10", value: components.pm10, unit: "μg/m³", description: "Coarse particles" },
    { name: "NO₂", value: components.no2, unit: "μg/m³", description: "Nitrogen dioxide" },
    { name: "O₃", value: components.o3, unit: "μg/m³", description: "Ozone" },
  ];

  return (
    <div className="weather-card rounded-3xl p-6 md:p-8 mb-8" data-testid="card-air-quality">
      <h3 className="text-2xl font-semibold mb-6 flex items-center">
        <Wind className="w-6 h-6 text-primary mr-3" />
        Air Quality
      </h3>
      
      {/* AQI Display */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center mb-4">
          <div className="relative">
            <div className="w-24 h-24 rounded-full border-8 border-gray-200 dark:border-gray-700">
              <div 
                className={`w-full h-full rounded-full ${aqiInfo.color} flex items-center justify-center`}
                data-testid="aqi-indicator"
              >
                <span className="text-2xl font-bold text-white" data-testid="aqi-value">
                  {aqi}
                </span>
              </div>
            </div>
          </div>
        </div>
        <h4 className={`text-xl font-semibold ${aqiInfo.textColor} mb-2`} data-testid="aqi-label">
          {aqiInfo.label}
        </h4>
        <p className="text-muted-foreground" data-testid="aqi-description">
          {aqiInfo.description}
        </p>
      </div>

      {/* Pollutants Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {pollutants.map((pollutant) => (
          <div 
            key={pollutant.name}
            className="bg-card border border-border rounded-2xl p-4 text-center"
            data-testid={`pollutant-${pollutant.name.toLowerCase()}`}
          >
            <p className="text-sm text-muted-foreground mb-1">{pollutant.name}</p>
            <p className="font-semibold text-foreground" data-testid={`${pollutant.name.toLowerCase()}-value`}>
              {Math.round(pollutant.value)}
            </p>
            <p className="text-xs text-muted-foreground">{pollutant.unit}</p>
            <p className="text-xs text-muted-foreground mt-1" title={pollutant.description}>
              {pollutant.description}
            </p>
          </div>
        ))}
      </div>

      {/* AQI Scale */}
      <div className="mt-6">
        <p className="text-sm text-muted-foreground mb-3">Air Quality Index Scale</p>
        <div className="flex rounded-lg overflow-hidden h-3 mb-2">
          <div className="bg-green-500 flex-1" title="Good (1)"></div>
          <div className="bg-yellow-400 flex-1" title="Fair (2)"></div>
          <div className="bg-orange-500 flex-1" title="Moderate (3)"></div>
          <div className="bg-red-500 flex-1" title="Poor (4)"></div>
          <div className="bg-purple-600 flex-1" title="Very Poor (5)"></div>
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Good</span>
          <span>Fair</span>
          <span>Moderate</span>
          <span>Poor</span>
          <span>Very Poor</span>
        </div>
      </div>
    </div>
  );
}