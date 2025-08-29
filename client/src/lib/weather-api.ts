import { apiRequest } from "./queryClient";
import type { CurrentWeather, Forecast, CitySearch, AirQuality, WeatherAlertsResponse } from "@shared/schema";

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

export async function getAirQuality(lat: number, lon: number): Promise<AirQuality> {
  const response = await apiRequest("GET", `/api/air-pollution/current?lat=${lat}&lon=${lon}`);
  return response.json();
}

export async function getWeatherAlerts(lat: number, lon: number): Promise<WeatherAlertsResponse> {
  const response = await apiRequest("GET", `/api/weather/alerts?lat=${lat}&lon=${lon}`);
  return response.json();
}
