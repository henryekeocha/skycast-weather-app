import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { currentWeatherSchema, forecastSchema, citySearchSchema, airQualitySchema } from "@shared/schema";

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY || process.env.VITE_OPENWEATHER_API_KEY || "";

if (!OPENWEATHER_API_KEY) {
  console.warn("Warning: OpenWeatherMap API key not found. Set OPENWEATHER_API_KEY or VITE_OPENWEATHER_API_KEY environment variable.");
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Search cities endpoint
  app.get("/api/cities/search", async (req, res) => {
    try {
      const { q } = req.query;
      
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ error: "Query parameter 'q' is required" });
      }

      if (!OPENWEATHER_API_KEY) {
        return res.status(500).json({ error: "OpenWeatherMap API key not configured" });
      }

      const response = await fetch(
        `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(q)}&limit=5&appid=${OPENWEATHER_API_KEY}`
      );

      if (!response.ok) {
        throw new Error(`OpenWeatherMap API error: ${response.status}`);
      }

      const data = await response.json();
      const validatedData = z.array(citySearchSchema).parse(data);
      
      res.json(validatedData);
    } catch (error) {
      console.error("Error searching cities:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to search cities" 
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
