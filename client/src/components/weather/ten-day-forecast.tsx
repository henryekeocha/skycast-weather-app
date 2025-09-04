import { useState } from "react";
import { Calendar } from "lucide-react";
import WeatherIcon from "./weather-icon";
import type { Forecast } from "@shared/schema";

interface TenDayForecastProps {
  forecast: Forecast;
}

export default function TenDayForecast({ forecast }: TenDayForecastProps) {
  const [temperatureUnit, setTemperatureUnit] = useState<"celsius" | "fahrenheit">("celsius");

  const convertTemperature = (temp: number) => {
    if (temperatureUnit === "fahrenheit") {
      return Math.round((temp * 9/5) + 32);
    }
    return Math.round(temp);
  };

  const toggleTemperatureUnit = () => {
    setTemperatureUnit(prev => prev === "celsius" ? "fahrenheit" : "celsius");
  };
  // Group forecast data by day and get daily min/max temperatures
  const dailyForecasts = forecast.list.reduce((acc, item) => {
    const date = new Date(item.dt * 1000);
    const dayKey = date.toDateString();
    
    if (!acc[dayKey]) {
      acc[dayKey] = {
        date: date,
        temps: [],
        weather: item.weather[0],
        items: []
      };
    }
    
    acc[dayKey].temps.push(item.main.temp);
    acc[dayKey].items.push(item);
    
    return acc;
  }, {} as Record<string, { date: Date; temps: number[]; weather: any; items: any[] }>);

  // Get the next 10 days (or up to 8 from One Call API)
  const dailyData = Object.values(dailyForecasts)
    .slice(0, 10)
    .map(day => ({
      date: day.date,
      maxTemp: convertTemperature(Math.max(...day.temps)),
      minTemp: convertTemperature(Math.min(...day.temps)),
      weather: day.weather,
      // Use weather condition from midday if available, otherwise first item
      middayWeather: day.items.find(item => {
        const hour = new Date(item.dt * 1000).getHours();
        return hour >= 11 && hour <= 13;
      })?.weather[0] || day.weather
    }));

  const formatDayName = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    } else {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    }
  };

  return (
    <div className="weather-card rounded-3xl p-4 sm:p-6 lg:p-8" data-testid="card-ten-day-forecast">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 space-y-3 sm:space-y-0">
        <h3 className="text-xl sm:text-2xl font-semibold flex items-center">
          <Calendar className="w-5 sm:w-6 h-5 sm:h-6 text-primary mr-2 sm:mr-3" />
          8-Day Forecast
        </h3>
        
        {/* Temperature Unit Toggle */}
        <div className="flex rounded-lg bg-muted p-1">
          <button
            onClick={toggleTemperatureUnit}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              temperatureUnit === "celsius"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
            data-testid="button-forecast-celsius"
          >
            °C
          </button>
          <button
            onClick={toggleTemperatureUnit}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              temperatureUnit === "fahrenheit"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
            data-testid="button-forecast-fahrenheit"
          >
            °F
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-8 gap-3 sm:gap-4">
        {dailyData.map((day, index) => (
          <div
            key={day.date.toDateString()}
            className="forecast-card bg-card border border-border rounded-2xl p-3 sm:p-4 text-center hover:shadow-lg transition-all duration-300 min-h-[160px] sm:min-h-[180px] touch-manipulation"
            data-testid={`forecast-day-${index}`}
          >
            <p className="font-medium text-foreground mb-3" data-testid={`forecast-day-name-${index}`}>
              {formatDayName(day.date)}
            </p>
            <div className="mb-4 flex justify-center items-center h-8">
              <WeatherIcon
                condition={day.middayWeather.main}
                iconCode={day.middayWeather.icon}
                size="md"
                data-testid={`forecast-icon-${index}`}
              />
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-foreground" data-testid={`forecast-max-temp-${index}`}>
                {day.maxTemp}°
              </p>
              <p className="text-sm text-muted-foreground" data-testid={`forecast-min-temp-${index}`}>
                {day.minTemp}°
              </p>
            </div>
            <p className="text-xs text-muted-foreground mt-2" data-testid={`forecast-condition-${index}`}>
              {day.middayWeather.description
                .split(' ')
                .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ')}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
