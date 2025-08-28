import { Wind, Droplets, Thermometer, Eye } from "lucide-react";
import type { CurrentWeather } from "@shared/schema";

interface WeatherDetailsProps {
  weather: CurrentWeather;
}

export default function WeatherDetails({ weather }: WeatherDetailsProps) {
  const details = [
    {
      icon: Wind,
      label: "Wind",
      value: `${Math.round(weather.wind.speed * 3.6)} km/h`,
      color: "text-primary",
      testId: "detail-wind"
    },
    {
      icon: Droplets,
      label: "Humidity",
      value: `${weather.main.humidity}%`,
      color: "text-rain",
      testId: "detail-humidity"
    },
    {
      icon: Thermometer,
      label: "Pressure",
      value: `${weather.main.pressure} hPa`,
      color: "text-accent",
      testId: "detail-pressure"
    },
    {
      icon: Eye,
      label: "Visibility",
      value: `${Math.round(weather.visibility / 1000)} km`,
      color: "text-secondary",
      testId: "detail-visibility"
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
      {details.map((detail) => {
        const Icon = detail.icon;
        return (
          <div 
            key={detail.label} 
            className="weather-card rounded-2xl p-4 text-center"
            data-testid={detail.testId}
          >
            <div className="flex items-center justify-center mb-2">
              <Icon className={`w-5 h-5 ${detail.color}`} />
            </div>
            <p className="text-sm text-muted-foreground mb-1">{detail.label}</p>
            <p className="font-semibold" data-testid={`${detail.testId}-value`}>
              {detail.value}
            </p>
          </div>
        );
      })}
    </div>
  );
}
