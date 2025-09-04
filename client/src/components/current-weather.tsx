import { useState } from "react";
import { MapPin } from "lucide-react";
import WeatherIcon from "./weather/weather-icon";
import type { CurrentWeather } from "@shared/schema";

interface CurrentWeatherProps {
  weather: CurrentWeather;
  locationName: string;
}

export default function CurrentWeather({ weather, locationName }: CurrentWeatherProps) {
  const [temperatureUnit, setTemperatureUnit] = useState<"celsius" | "fahrenheit">("celsius");

  const convertTemperature = (temp: number) => {
    if (temperatureUnit === "fahrenheit") {
      return Math.round((temp * 9/5) + 32);
    }
    return Math.round(temp);
  };

  const convertFeelsLike = (temp: number) => {
    if (temperatureUnit === "fahrenheit") {
      return Math.round((temp * 9/5) + 32);
    }
    return Math.round(temp);
  };

  const toggleTemperatureUnit = () => {
    setTemperatureUnit(prev => prev === "celsius" ? "fahrenheit" : "celsius");
  };

  const temperature = convertTemperature(weather.main.temp);
  const feelsLike = convertFeelsLike(weather.main.feels_like);
  const unit = temperatureUnit === "celsius" ? "°C" : "°F";
  const weatherCondition = weather.weather[0];

  return (
    <div className="weather-card rounded-3xl p-8 mb-8 text-center" data-testid="card-current-weather">
      <div className="mb-6">
        <div className="flex items-center justify-center mb-4">
          <MapPin className="w-5 h-5 text-muted-foreground mr-2" />
          <h2 className="text-2xl font-semibold" data-testid="text-location">
            {locationName}
          </h2>
        </div>
        <p className="text-muted-foreground text-lg" data-testid="text-weather-description">
          {weatherCondition.description
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')}
        </p>
      </div>
      
      {/* Current Weather Icon and Temperature */}
      <div className="flex flex-col items-center mb-8">
        <div className="mb-6">
          <WeatherIcon 
            condition={weatherCondition.main}
            iconCode={weatherCondition.icon}
            size="xl"
            data-testid="icon-weather-condition"
          />
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-6xl md:text-7xl font-light" data-testid="text-temperature">
            {temperature}°
          </span>
          <div className="flex flex-col space-y-1">
            <button
              onClick={toggleTemperatureUnit}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                temperatureUnit === "fahrenheit"
                  ? "bg-muted text-muted-foreground"
                  : "text-muted-foreground hover:bg-muted"
              }`}
              data-testid="button-fahrenheit"
            >
              °F
            </button>
            <button
              onClick={toggleTemperatureUnit}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                temperatureUnit === "celsius"
                  ? "bg-muted text-muted-foreground"
                  : "text-muted-foreground hover:bg-muted"
              }`}
              data-testid="button-celsius"
            >
              °C
            </button>
          </div>
        </div>
        <p className="text-muted-foreground mt-2" data-testid="text-feels-like">
          Feels like {feelsLike}{unit}
        </p>
      </div>
    </div>
  );
}
