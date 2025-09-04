import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import SearchBar from "@/components/weather/search-bar";
import CurrentWeather from "@/components/weather/current-weather";
import WeatherDetails from "@/components/weather/weather-details";
import TenDayForecast from "@/components/weather/ten-day-forecast";
import AirQuality from "@/components/weather/air-quality";
import WeatherMap from "@/components/weather/weather-map";
import WeatherAlerts from "@/components/weather/weather-alerts";
import FavoritesManager from "@/components/weather/favorites-manager";
import Header from "@/components/weather/header";
import AIInsights from "@/components/weather/ai-insights";
import AIChat from "@/components/weather/ai-chat";
import { getCurrentWeather, getForecast, getAirQuality, getWeatherAlerts, addLocationToHistory } from "@/lib/weather-api";
import type { CurrentWeather as CurrentWeatherType, Forecast, AirQuality as AirQualityType, WeatherAlertsResponse } from "@shared/schema";
import { useQueryClient } from "@tanstack/react-query";

export default function Weather() {
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lon: number; name: string } | null>(null);
  const [weatherCondition, setWeatherCondition] = useState<string>("default");
  const queryClient = useQueryClient();

  const handleLocationSelect = async (locationData: any) => {
    const location = { lat: locationData.lat, lon: locationData.lon, name: locationData.name };
    setSelectedLocation(location);
    
    // Add to location history with better data if available
    try {
      // Parse location name to extract city, state, and country
      let name = locationData.name;
      let country = undefined;
      let state = undefined;
      
      // Check if we have cityData (from search) or need to parse name (from drag)
      if (locationData.cityData) {
        name = locationData.cityData.name || name.split(',')[0].trim();
        country = locationData.cityData.country;
        state = locationData.cityData.state;
      } else {
        // Parse from location name (format: "City, State, Country" or "City, Country")
        const parts = name.split(',').map((part: string) => part.trim());
        if (parts.length >= 2) {
          name = parts[0]; // First part is always the city
          if (parts.length === 3) {
            state = parts[1]; // Middle part is state
            country = parts[2]; // Last part is country
          } else {
            country = parts[1]; // Last part is country (no state)
          }
        }
      }
      
      const historyData = {
        name,
        country,
        state,
        lat: locationData.lat,
        lon: locationData.lon,
        userId: undefined, // No user authentication yet
      };
      
      await addLocationToHistory(historyData);
      
      // Invalidate location history cache to refetch updated list
      queryClient.invalidateQueries({ queryKey: ["/api/locations/history"] });
      // Also refetch immediately to ensure fresh data
      queryClient.refetchQueries({ queryKey: ["/api/locations/history"] });
    } catch (error) {
      console.error("Failed to add location to history:", error);
    }
  };

  // Get user's current location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setSelectedLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
            name: "Current Location"
          });
        },
        () => {
          // Default to New York if geolocation fails
          setSelectedLocation({
            lat: 40.7128,
            lon: -74.0060,
            name: "New York, NY"
          });
        }
      );
    } else {
      // Default to New York if geolocation not supported
      setSelectedLocation({
        lat: 40.7128,
        lon: -74.0060,
        name: "New York, NY"
      });
    }
  }, []);

  const { data: currentWeather, isLoading: currentWeatherLoading, error: currentWeatherError } = useQuery<CurrentWeatherType>({
    queryKey: ["/api/weather/current", selectedLocation?.lat, selectedLocation?.lon],
    queryFn: () => getCurrentWeather(selectedLocation!.lat, selectedLocation!.lon),
    enabled: !!selectedLocation,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: forecast, isLoading: forecastLoading, error: forecastError } = useQuery<Forecast>({
    queryKey: ["/api/weather/forecast", selectedLocation?.lat, selectedLocation?.lon],
    queryFn: () => getForecast(selectedLocation!.lat, selectedLocation!.lon),
    enabled: !!selectedLocation,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: airQuality, isLoading: airQualityLoading, error: airQualityError } = useQuery<AirQualityType>({
    queryKey: ["/api/air-pollution/current", selectedLocation?.lat, selectedLocation?.lon],
    queryFn: () => getAirQuality(selectedLocation!.lat, selectedLocation!.lon),
    enabled: !!selectedLocation,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  const { data: weatherAlerts, isLoading: alertsLoading, error: alertsError } = useQuery<WeatherAlertsResponse>({
    queryKey: ["/api/weather/alerts", selectedLocation?.lat, selectedLocation?.lon],
    queryFn: () => getWeatherAlerts(selectedLocation!.lat, selectedLocation!.lon),
    enabled: !!selectedLocation,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Update weather condition for gradient background
  useEffect(() => {
    if (currentWeather?.weather?.[0]) {
      const mainCondition = currentWeather.weather[0].main.toLowerCase();
      if (mainCondition.includes('clear') || mainCondition.includes('sun')) {
        setWeatherCondition("clear");
      } else if (mainCondition.includes('cloud')) {
        setWeatherCondition("cloudy");
      } else if (mainCondition.includes('rain') || mainCondition.includes('drizzle') || mainCondition.includes('thunderstorm')) {
        setWeatherCondition("rainy");
      } else {
        setWeatherCondition("default");
      }
    }
  }, [currentWeather]);

  const isLoading = currentWeatherLoading || forecastLoading || airQualityLoading || alertsLoading;
  const hasError = currentWeatherError || forecastError || airQualityError || alertsError;

  return (
    <div className="min-h-screen relative">
      {/* Weather Background Gradient */}
      <div className={`fixed inset-0 -z-10 weather-gradient-${weatherCondition}`} />
      
      {/* Loading Overlay with SkyCast Branding */}
      {isLoading && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="weather-card rounded-2xl p-8 text-center">
            <img 
              src="/favicon.png" 
              alt="SkyCast Logo" 
              className="w-16 h-16 mx-auto mb-4 object-contain animate-pulse"
            />
            <h2 className="text-2xl font-bold text-foreground mb-2">SkyCast</h2>
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent mx-auto mb-4" />
            <p className="text-foreground font-medium">Loading weather data...</p>
          </div>
        </div>
      )}

      {/* Navigation Header */}
      <Header className="relative z-10" />
      
      {/* Main Container */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 max-w-7xl">
        
        {/* Search Section */}
        <header className="mb-6 sm:mb-8">
          <div className="text-center mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2">Weather Dashboard</h2>
            <p className="text-white/80 text-base sm:text-lg px-2">Current conditions and 8-day forecast</p>
          </div>
          
          <SearchBar onLocationSelect={handleLocationSelect} />
          
          <div className="mt-4 sm:mt-6">
            <FavoritesManager 
              onLocationSelect={handleLocationSelect}
              currentLocation={selectedLocation}
            />
          </div>
        </header>

        {/* Error State */}
        {hasError && !isLoading && (
          <div className="weather-card rounded-3xl p-8 text-center mb-8">
            <div className="text-destructive mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Unable to load weather data</h3>
            <p className="text-muted-foreground">
              {currentWeatherError?.message || forecastError?.message || "Please check your connection and try again."}
            </p>
            <button 
              className="mt-4 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              onClick={() => window.location.reload()}
              data-testid="button-retry"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Weather Content */}
        {currentWeather && !hasError && (
          <>
            <CurrentWeather 
              weather={currentWeather} 
              locationName={selectedLocation?.name || ""} 
            />
            
            {weatherAlerts?.alerts && weatherAlerts.alerts.length > 0 && (
              <WeatherAlerts 
                alerts={weatherAlerts.alerts} 
                locationName={selectedLocation?.name || "Current Location"}
              />
            )}
            
            <WeatherDetails weather={currentWeather} />
            
            {airQuality && <AirQuality airQuality={airQuality} />}
            
            {/* AI-Powered Insights */}
            <AIInsights 
              currentWeather={currentWeather}
              forecast={forecast}
              locationName={selectedLocation?.name || "Current Location"}
            />
            
            <div className="mb-8" />
            
            <WeatherMap 
              center={{ lat: selectedLocation?.lat || 40.7128, lon: selectedLocation?.lon || -74.006 }}
              locationName={selectedLocation?.name || "Current Location"}
              onLocationChange={handleLocationSelect}
            />
            
            {forecast && <TenDayForecast forecast={forecast} />}
          </>
        )}

        {/* Footer */}
        <footer className="mt-12 text-center">
          <div className="weather-card rounded-2xl p-6">
            <p className="text-muted-foreground text-sm">
              Weather data provided by OpenWeatherMap API
            </p>
            <p className="text-muted-foreground text-xs mt-2">
              Last updated: {new Date().toLocaleTimeString()}
            </p>
          </div>
        </footer>
      </div>
      
      {/* AI Chat Assistant */}
      <AIChat 
        currentWeather={currentWeather}
        forecast={forecast}
        locationName={selectedLocation?.name || "Current Location"}
      />
    </div>
  );
}
