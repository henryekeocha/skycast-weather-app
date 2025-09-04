import { apiRequest } from "./queryClient";
import type { CurrentWeather, Forecast, CitySearch } from "@shared/schema";

export async function searchCities(query: string): Promise<CitySearch[]> {
  const response = await apiRequest("GET", `/api/cities/search?q=${encodeURIComponent(query)}`);
  return response.json();
}

export async function getCurrentWeather(lat: number, lon: number): Promise<CurrentWeather> {
  const response = await apiRequest("GET", `/api/weather/current?lat=${lat}&lon=${lon}`);
  return response.json();
}

export async function getCurrentWeatherByCity(city: string): Promise<CurrentWeather> {
  const response = await apiRequest("GET", `/api/weather/current/${encodeURIComponent(city)}`);
  return response.json();
}

export async function getForecast(lat: number, lon: number): Promise<Forecast> {
  const response = await apiRequest("GET", `/api/weather/forecast?lat=${lat}&lon=${lon}`);
  return response.json();
}

export async function getForecastByCity(city: string): Promise<Forecast> {
  const response = await apiRequest("GET", `/api/weather/forecast/${encodeURIComponent(city)}`);
  return response.json();
}

// Utility functions for weather data processing
export function kelvinToCelsius(kelvin: number): number {
  return kelvin - 273.15;
}

export function celsiusToFahrenheit(celsius: number): number {
  return (celsius * 9/5) + 32;
}

export function meterPerSecondToKmh(mps: number): number {
  return mps * 3.6;
}

export function meterPerSecondToMph(mps: number): number {
  return mps * 2.237;
}

export function getWeatherGradientClass(condition: string): string {
  const lowerCondition = condition.toLowerCase();
  
  if (lowerCondition.includes('clear') || lowerCondition.includes('sun')) {
    return "weather-gradient-clear";
  } else if (lowerCondition.includes('cloud')) {
    return "weather-gradient-cloudy";
  } else if (lowerCondition.includes('rain') || lowerCondition.includes('drizzle') || lowerCondition.includes('thunderstorm')) {
    return "weather-gradient-rainy";
  } else {
    return "weather-gradient-default";
  }
}

export function formatDateTime(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString();
}

export function formatTime(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString([], {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}
