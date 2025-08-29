import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { currentWeatherSchema, forecastSchema, citySearchSchema, airQualitySchema, weatherAlertsResponseSchema, insertLocationSchema, insertFavoriteLocationSchema } from "@shared/schema";
import { storage } from "./storage";

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY || process.env.VITE_OPENWEATHER_API_KEY || "";

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

      // Enhanced search: try direct geocoding first for addresses/cities
      const response = await fetch(
        `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(q)}&limit=8&appid=${OPENWEATHER_API_KEY}`
      );

      if (!response.ok) {
        throw new Error(`OpenWeatherMap API error: ${response.status}`);
      }

      const data = await response.json();
      
      // If no results found with direct search, also try a broader search by adding common location terms
      let results = data;
      if (results.length === 0 && q.trim().length > 3) {
        // Try searching with additional context for better address matching
        const enhancedQuery = `${q.trim()}`;
        const fallbackResponse = await fetch(
          `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(enhancedQuery)}&limit=8&appid=${OPENWEATHER_API_KEY}`
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

  // Get 5-day forecast by coordinates
  app.get("/api/weather/forecast", async (req, res) => {
    try {
      const { lat, lon } = req.query;
      
      if (!lat || !lon || typeof lat !== 'string' || typeof lon !== 'string') {
        return res.status(400).json({ error: "Latitude and longitude parameters are required" });
      }

      if (!OPENWEATHER_API_KEY) {
        return res.status(500).json({ error: "OpenWeatherMap API key not configured" });
      }

      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`
      );

      if (!response.ok) {
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

  const httpServer = createServer(app);
  return httpServer;
}
