import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { currentWeatherSchema, forecastSchema, citySearchSchema, airQualitySchema, weatherAlertsResponseSchema, insertLocationSchema, insertFavoriteLocationSchema } from "@shared/schema";
import { storage } from "./storage";

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY || process.env.VITE_OPENWEATHER_API_KEY || "";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENWEATHER_API_KEY) {
  console.warn("Warning: OpenWeatherMap API key not found. Set OPENWEATHER_API_KEY or VITE_OPENWEATHER_API_KEY environment variable.");
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Search cities and addresses endpoint
  app.get("/api/cities/search", async (req, res) => {
    try {
      const { q } = req.query;
      
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ error: "Query parameter 'q' is required" });
      }

      if (!OPENWEATHER_API_KEY) {
        return res.status(500).json({ error: "OpenWeatherMap API key not configured" });
      }

      let results: any[] = [];
      const query = q.trim();

      // Strategy 1: Direct geocoding search
      const directResponse = await fetch(
        `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=8&appid=${OPENWEATHER_API_KEY}`
      );

      if (directResponse.ok) {
        const directData = await directResponse.json();
        results = directData;
      }

      // Strategy 2: If no results and looks like an address, try parsing and searching parts
      if (results.length === 0 && query.length > 5) {
        const searchVariations = [];
        
        // Try removing house numbers for street-level search
        const withoutNumbers = query.replace(/^\d+\s+/, '');
        if (withoutNumbers !== query) {
          searchVariations.push(withoutNumbers);
        }
        
        // Enhanced address parsing for various formats
        const parts = query.split(/[,\s]+/).filter(p => p.trim().length > 0);
        
        // Extract ZIP code if present and try ZIP-based search first
        const zipMatch = query.match(/\b\d{5}(-\d{4})?\b/);
        if (zipMatch) {
          // Try the area around the ZIP code
          const zipResponse = await fetch(
            `https://api.openweathermap.org/geo/1.0/zip?zip=${zipMatch[0]},US&appid=${OPENWEATHER_API_KEY}`
          );
          
          if (zipResponse.ok) {
            const zipData = await zipResponse.json();
            results = [{
              name: zipData.name,
              lat: zipData.lat,
              lon: zipData.lon,
              country: zipData.country,
              state: null
            }];
          }
        }
        
        // If ZIP didn't work or no ZIP found, try address parsing
        if (results.length === 0) {
          // Try searching just the city if comma-separated address
          const commaParts = query.split(',').map(p => p.trim());
          if (commaParts.length >= 2) {
            // Try last part (usually city/state)
            searchVariations.push(commaParts[commaParts.length - 1]);
            // Try second to last + last (city + state/country)
            if (commaParts.length >= 2) {
              searchVariations.push(`${commaParts[commaParts.length - 2]}, ${commaParts[commaParts.length - 1]}`);
            }
            // Try combinations with state abbreviations
            if (commaParts.length >= 3) {
              searchVariations.push(`${commaParts[commaParts.length - 3]}, ${commaParts[commaParts.length - 2]}, ${commaParts[commaParts.length - 1]}`);
            }
          }
          
          // Try extracting city names from space-separated parts
          if (parts.length >= 3) {
            // Common patterns: "123 Main St City State" or "123 Main Street City State ZIP"
            const possibleCities = [];
            
            // Try last 2-3 parts as potential city/state combinations
            if (parts.length >= 3) {
              possibleCities.push(parts.slice(-2).join(' ')); // Last 2 parts
            }
            if (parts.length >= 4) {
              possibleCities.push(parts.slice(-3, -1).join(' ')); // City name before state
              possibleCities.push(parts.slice(-3).join(' ')); // Last 3 parts
            }
            
            searchVariations.push(...possibleCities);
          }
          
          // Try each variation
          for (const variation of searchVariations) {
            if (results.length > 0) break;
            
            if (variation && variation.length >= 2) {
              const variationResponse = await fetch(
                `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(variation)}&limit=5&appid=${OPENWEATHER_API_KEY}`
              );
              
              if (variationResponse.ok) {
                const variationData = await variationResponse.json();
                if (variationData.length > 0) {
                  results = variationData;
                  break;
                }
              }
            }
          }
        }
      }

      // Strategy 3: Fallback to basic text search if still no results
      if (results.length === 0 && query.length >= 3) {
        // Try a very broad search with the full query
        const fallbackResponse = await fetch(
          `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=3&appid=${OPENWEATHER_API_KEY}`
        );
        
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          results = fallbackData;
        }
      }
      
      const validatedData = z.array(citySearchSchema).parse(results);
      
      res.json(validatedData);
    } catch (error) {
      console.error("Error searching locations:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to search locations" 
      });
    }
  });

  // Get current weather by coordinates
  app.get("/api/weather/current", async (req, res) => {
    try {
      const { lat, lon } = req.query;
      
      if (!lat || !lon || typeof lat !== 'string' || typeof lon !== 'string') {
        return res.status(400).json({ error: "Latitude and longitude parameters are required" });
      }

      if (!OPENWEATHER_API_KEY) {
        return res.status(500).json({ error: "OpenWeatherMap API key not configured" });
      }

      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`
      );

      if (!response.ok) {
        throw new Error(`OpenWeatherMap API error: ${response.status}`);
      }

      const data = await response.json();
      const validatedData = currentWeatherSchema.parse(data);
      
      res.json(validatedData);
    } catch (error) {
      console.error("Error fetching current weather:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to fetch current weather" 
      });
    }
  });

  // Get current weather by city name
  app.get("/api/weather/current/:city", async (req, res) => {
    try {
      const { city } = req.params;
      
      if (!city) {
        return res.status(400).json({ error: "City parameter is required" });
      }

      if (!OPENWEATHER_API_KEY) {
        return res.status(500).json({ error: "OpenWeatherMap API key not configured" });
      }

      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${OPENWEATHER_API_KEY}&units=metric`
      );

      if (!response.ok) {
        if (response.status === 404) {
          return res.status(404).json({ error: "City not found" });
        }
        throw new Error(`OpenWeatherMap API error: ${response.status}`);
      }

      const data = await response.json();
      const validatedData = currentWeatherSchema.parse(data);
      
      res.json(validatedData);
    } catch (error) {
      console.error("Error fetching current weather:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to fetch current weather" 
      });
    }
  });

  // Get 10-day forecast by coordinates using One Call API
  app.get("/api/weather/forecast", async (req, res) => {
    try {
      const { lat, lon } = req.query;
      
      if (!lat || !lon || typeof lat !== 'string' || typeof lon !== 'string') {
        return res.status(400).json({ error: "Latitude and longitude parameters are required" });
      }

      if (!OPENWEATHER_API_KEY) {
        return res.status(500).json({ error: "OpenWeatherMap API key not configured" });
      }

      // Use One Call API 3.0 for extended daily forecast (up to 8 days)
      const response = await fetch(
        `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=minutely,hourly,alerts&appid=${OPENWEATHER_API_KEY}&units=metric`
      );

      if (!response.ok) {
        throw new Error(`OpenWeatherMap API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Transform One Call API response to match the expected forecast format
      const transformedData = {
        cod: "200",
        message: 0,
        cnt: data.daily.length,
        list: data.daily.map((day: any, index: number) => ({
          dt: day.dt,
          main: {
            temp: day.temp.day,
            feels_like: day.feels_like.day,
            temp_min: day.temp.min,
            temp_max: day.temp.max,
            pressure: day.pressure,
            humidity: day.humidity,
            temp_kf: 0
          },
          weather: day.weather,
          clouds: {
            all: day.clouds
          },
          wind: {
            speed: day.wind_speed,
            deg: day.wind_deg,
            gust: day.wind_gust || 0
          },
          visibility: 10000,
          pop: day.pop,
          rain: day.rain ? { "3h": day.rain } : undefined,
          snow: day.snow ? { "3h": day.snow } : undefined,
          sys: {
            pod: "d"
          },
          dt_txt: new Date(day.dt * 1000).toISOString()
        })),
        city: {
          id: 0,
          name: "Location",
          coord: {
            lat: parseFloat(lat),
            lon: parseFloat(lon)
          },
          country: "Unknown",
          population: 0,
          timezone: data.timezone_offset,
          sunrise: data.current?.sunrise || 0,
          sunset: data.current?.sunset || 0
        }
      };
      
      const validatedData = forecastSchema.parse(transformedData);
      
      res.json(validatedData);
    } catch (error) {
      console.error("Error fetching forecast:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to fetch forecast" 
      });
    }
  });

  // Get 5-day forecast by city name
  app.get("/api/weather/forecast/:city", async (req, res) => {
    try {
      const { city } = req.params;
      
      if (!city) {
        return res.status(400).json({ error: "City parameter is required" });
      }

      if (!OPENWEATHER_API_KEY) {
        return res.status(500).json({ error: "OpenWeatherMap API key not configured" });
      }

      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${OPENWEATHER_API_KEY}&units=metric`
      );

      if (!response.ok) {
        if (response.status === 404) {
          return res.status(404).json({ error: "City not found" });
        }
        throw new Error(`OpenWeatherMap API error: ${response.status}`);
      }

      const data = await response.json();
      const validatedData = forecastSchema.parse(data);
      
      res.json(validatedData);
    } catch (error) {
      console.error("Error fetching forecast:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to fetch forecast" 
      });
    }
  });

  // Get air quality by coordinates
  app.get("/api/air-pollution/current", async (req, res) => {
    try {
      const { lat, lon } = req.query;
      
      if (!lat || !lon || typeof lat !== 'string' || typeof lon !== 'string') {
        return res.status(400).json({ error: "Latitude and longitude parameters are required" });
      }

      if (!OPENWEATHER_API_KEY) {
        return res.status(500).json({ error: "OpenWeatherMap API key not configured" });
      }

      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}`
      );

      if (!response.ok) {
        throw new Error(`OpenWeatherMap API error: ${response.status}`);
      }

      const data = await response.json();
      const validatedData = airQualitySchema.parse(data);
      
      res.json(validatedData);
    } catch (error) {
      console.error("Error fetching air quality:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to fetch air quality data" 
      });
    }
  });

  // Get weather alerts by coordinates using One Call API 3.0
  app.get("/api/weather/alerts", async (req, res) => {
    try {
      const { lat, lon } = req.query;
      
      if (!lat || !lon || typeof lat !== 'string' || typeof lon !== 'string') {
        return res.status(400).json({ error: "Latitude and longitude parameters are required" });
      }

      if (!OPENWEATHER_API_KEY) {
        return res.status(500).json({ error: "OpenWeatherMap API key not configured" });
      }

      const response = await fetch(
        `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=minutely,hourly,daily&appid=${OPENWEATHER_API_KEY}`
      );

      if (!response.ok) {
        if (response.status === 404) {
          return res.status(404).json({ error: "Location not found" });
        }
        throw new Error(`OpenWeatherMap API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Extract only the alerts data with location info
      const alertsData = {
        lat: data.lat,
        lon: data.lon,
        timezone: data.timezone,
        timezone_offset: data.timezone_offset,
        alerts: data.alerts || []
      };
      
      const validatedData = weatherAlertsResponseSchema.parse(alertsData);
      
      res.json(validatedData);
    } catch (error) {
      console.error("Error fetching weather alerts:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to fetch weather alerts" 
      });
    }
  });

  // Location management endpoints
  
  // Get favorite locations
  app.get("/api/locations/favorites", async (req, res) => {
    try {
      const { userId } = req.query;
      const favorites = await storage.getFavoriteLocations(userId as string);
      res.json(favorites);
    } catch (error) {
      console.error("Error fetching favorites:", error);
      res.status(500).json({ error: "Failed to fetch favorite locations" });
    }
  });

  // Add location to favorites
  app.post("/api/locations/favorites", async (req, res) => {
    try {
      const { name, country, state, lat, lon, userId } = req.body;

      // Validate location data
      const locationData = insertLocationSchema.parse({ name, country, state, lat, lon });

      // Check if location already exists
      let location = await storage.findLocationByCoords(lat, lon);
      if (!location) {
        location = await storage.createLocation(locationData);
      }

      // Check if already favorited
      const isFav = await storage.isFavorite(location.id, userId);
      if (isFav) {
        return res.status(409).json({ error: "Location already in favorites" });
      }

      // Add to favorites
      const favorite = await storage.addFavorite({
        locationId: location.id,
        userId: userId || null,
      });

      res.json({ location, favorite });
    } catch (error) {
      console.error("Error adding favorite:", error);
      res.status(500).json({ error: "Failed to add favorite location" });
    }
  });

  // Remove location from favorites
  app.delete("/api/locations/favorites/:locationId", async (req, res) => {
    try {
      const { locationId } = req.params;
      const { userId } = req.query;

      await storage.removeFavorite(parseInt(locationId), userId as string);
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing favorite:", error);
      res.status(500).json({ error: "Failed to remove favorite location" });
    }
  });

  // Check if location is favorite
  app.get("/api/locations/favorites/check", async (req, res) => {
    try {
      const { locationId, userId } = req.query;
      
      if (!locationId) {
        return res.status(400).json({ error: "locationId is required" });
      }

      const isFav = await storage.isFavorite(parseInt(locationId as string), userId as string);
      res.json({ isFavorite: isFav });
    } catch (error) {
      console.error("Error checking favorite:", error);
      res.status(500).json({ error: "Failed to check favorite status" });
    }
  });

  // Get location history
  app.get("/api/locations/history", async (req, res) => {
    try {
      const { userId, limit } = req.query;
      const history = await storage.getLocationHistory(
        userId as string, 
        limit ? parseInt(limit as string) : undefined
      );
      res.json(history);
    } catch (error) {
      console.error("Error fetching history:", error);
      res.status(500).json({ error: "Failed to fetch location history" });
    }
  });

  // Add location to history
  app.post("/api/locations/history", async (req, res) => {
    try {
      const { name, country, state, lat, lon, userId } = req.body;

      // Validate location data
      const locationData = insertLocationSchema.parse({ name, country, state, lat, lon });

      // Check if location already exists
      let location = await storage.findLocationByCoords(lat, lon);
      if (!location) {
        location = await storage.createLocation(locationData);
      }

      // Add to history
      await storage.addToHistory(location.id, userId || null);

      res.json({ location, success: true });
    } catch (error) {
      console.error("Error adding to history:", error);
      res.status(500).json({ error: "Failed to add location to history" });
    }
  });

  // Clear location history
  app.delete("/api/locations/history", async (req, res) => {
    try {
      const { userId } = req.query;
      await storage.clearHistory(userId as string || null);
      res.json({ success: true, message: "Location history cleared" });
    } catch (error) {
      console.error("Error clearing history:", error);
      res.status(500).json({ error: "Failed to clear location history" });
    }
  });

  // Get configuration for frontend
  app.get("/api/config", (req, res) => {
    res.json({
      hasApiKey: !!OPENWEATHER_API_KEY,
      apiKey: OPENWEATHER_API_KEY || null // Send the actual key for map tiles
    });
  });

  // AI Weather Insights endpoint
  app.post("/api/ai/weather-insights", async (req, res) => {
    try {
      const { weatherData, location, question } = req.body;
      
      if (!OPENAI_API_KEY) {
        return res.status(500).json({ error: "OpenAI API key not configured" });
      }

      const prompt = question ? 
        `Answer this weather question based on the current conditions: "${question}"
        
Weather data for ${location}:
${JSON.stringify(weatherData, null, 2)}

Provide a helpful, conversational response.` :
        `Analyze the weather conditions for ${location} and provide intelligent insights, recommendations, and a brief summary. Include:

1. Current conditions summary
2. What to expect today/tomorrow
3. Activity recommendations
4. What to wear/bring
5. Any notable weather patterns

Weather data:
${JSON.stringify(weatherData, null, 2)}

Keep the response conversational, helpful, and under 200 words.`;

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "You are a helpful weather assistant. Provide clear, practical advice based on weather data. Be conversational and focus on actionable insights."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          max_tokens: 300,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const insight = data.choices[0]?.message?.content || "Unable to generate weather insights at this time.";
      
      res.json({ insight, timestamp: new Date().toISOString() });
    } catch (error) {
      console.error("Error generating AI insights:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to generate AI insights" 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
