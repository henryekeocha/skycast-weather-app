import { Calendar } from "lucide-react";
import WeatherIcon from "./weather/weather-icon";
import type { Forecast } from "@shared/schema";

interface FiveDayForecastProps {
  forecast: Forecast;
}

export default function FiveDayForecast({ forecast }: FiveDayForecastProps) {
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

  // Get the next 5 days
  const dailyData = Object.values(dailyForecasts)
    .slice(0, 5)
    .map(day => ({
      date: day.date,
      maxTemp: Math.round(Math.max(...day.temps)),
      minTemp: Math.round(Math.min(...day.temps)),
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
    <div className="weather-card rounded-3xl p-6 md:p-8" data-testid="card-five-day-forecast">
      <h3 className="text-2xl font-semibold mb-6 flex items-center">
        <Calendar className="w-6 h-6 text-primary mr-3" />
        5-Day Forecast
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {dailyData.map((day, index) => (
          <div
            key={day.date.toDateString()}
            className="forecast-card bg-card border border-border rounded-2xl p-4 text-center hover:shadow-lg transition-all duration-300"
            data-testid={`forecast-day-${index}`}
          >
            <p className="font-medium text-foreground mb-3" data-testid={`forecast-day-name-${index}`}>
              {formatDayName(day.date)}
            </p>
            <div className="mb-4">
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
