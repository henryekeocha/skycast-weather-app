import { apiRequest } from "./queryClient";
import type { CurrentWeather, Forecast, CitySearch, AirQuality, WeatherAlertsResponse, Location } from "@shared/schema";

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

// Location management functions
export async function getFavoriteLocations(userId?: string): Promise<Location[]> {
  const url = userId ? `/api/locations/favorites?userId=${userId}` : "/api/locations/favorites";
  const response = await apiRequest("GET", url);
  return response.json();
}

export async function addFavoriteLocation(location: {
  name: string;
  country: string;
  state?: string;
  lat: number;
  lon: number;
  userId?: string;
}): Promise<{ location: Location; favorite: any }> {
  const response = await apiRequest("POST", "/api/locations/favorites", location);
  return response.json();
}

export async function removeFavoriteLocation(locationId: number, userId?: string): Promise<void> {
  const url = userId 
    ? `/api/locations/favorites/${locationId}?userId=${userId}` 
    : `/api/locations/favorites/${locationId}`;
  await apiRequest("DELETE", url);
}

export async function checkIsFavorite(locationId: number, userId?: string): Promise<boolean> {
  const url = userId 
    ? `/api/locations/favorites/check?locationId=${locationId}&userId=${userId}`
    : `/api/locations/favorites/check?locationId=${locationId}`;
  const response = await apiRequest("GET", url);
  const data = await response.json();
  return data.isFavorite;
}

export async function getLocationHistory(userId?: string, limit?: number): Promise<Location[]> {
  let url = "/api/locations/history";
  const params = new URLSearchParams();
  if (userId) params.append("userId", userId);
  if (limit) params.append("limit", limit.toString());
  if (params.toString()) url += `?${params.toString()}`;
  
  const response = await apiRequest("GET", url);
  return response.json();
}

export async function addLocationToHistory(location: {
  name: string;
  country: string;
  state?: string;
  lat: number;
  lon: number;
  userId?: string;
}): Promise<void> {
  await apiRequest("POST", "/api/locations/history", location);
}
