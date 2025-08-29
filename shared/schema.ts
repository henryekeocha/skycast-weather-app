import { z } from "zod";

export const weatherConditionSchema = z.object({
  id: z.number(),
  main: z.string(),
  description: z.string(),
  icon: z.string(),
});

export const currentWeatherSchema = z.object({
  coord: z.object({
    lon: z.number(),
    lat: z.number(),
  }),
  weather: z.array(weatherConditionSchema),
  base: z.string(),
  main: z.object({
    temp: z.number(),
    feels_like: z.number(),
    temp_min: z.number(),
    temp_max: z.number(),
    pressure: z.number(),
    humidity: z.number(),
    sea_level: z.number().optional(),
    grnd_level: z.number().optional(),
  }),
  visibility: z.number(),
  wind: z.object({
    speed: z.number(),
    deg: z.number(),
    gust: z.number().optional(),
  }),
  clouds: z.object({
    all: z.number(),
  }),
  dt: z.number(),
  sys: z.object({
    type: z.number().optional(),
    id: z.number().optional(),
    country: z.string(),
    sunrise: z.number(),
    sunset: z.number(),
  }),
  timezone: z.number(),
  id: z.number(),
  name: z.string(),
  cod: z.number(),
});

export const forecastItemSchema = z.object({
  dt: z.number(),
  main: z.object({
    temp: z.number(),
    feels_like: z.number(),
    temp_min: z.number(),
    temp_max: z.number(),
    pressure: z.number(),
    sea_level: z.number().optional(),
    grnd_level: z.number().optional(),
    humidity: z.number(),
    temp_kf: z.number().optional(),
  }),
  weather: z.array(weatherConditionSchema),
  clouds: z.object({
    all: z.number(),
  }),
  wind: z.object({
    speed: z.number(),
    deg: z.number(),
    gust: z.number().optional(),
  }),
  visibility: z.number(),
  pop: z.number(),
  rain: z.object({
    "3h": z.number(),
  }).optional(),
  snow: z.object({
    "3h": z.number(),
  }).optional(),
  sys: z.object({
    pod: z.string(),
  }),
  dt_txt: z.string(),
});

export const forecastSchema = z.object({
  cod: z.string(),
  message: z.number(),
  cnt: z.number(),
  list: z.array(forecastItemSchema),
  city: z.object({
    id: z.number(),
    name: z.string(),
    coord: z.object({
      lat: z.number(),
      lon: z.number(),
    }),
    country: z.string(),
    population: z.number(),
    timezone: z.number(),
    sunrise: z.number(),
    sunset: z.number(),
  }),
});

export const citySearchSchema = z.object({
  name: z.string(),
  local_names: z.record(z.string()).optional(),
  lat: z.number(),
  lon: z.number(),
  country: z.string(),
  state: z.string().optional(),
});

export const airQualitySchema = z.object({
  coord: z.object({
    lon: z.number(),
    lat: z.number(),
  }),
  list: z.array(z.object({
    main: z.object({
      aqi: z.number(), // Air Quality Index: 1=Good, 2=Fair, 3=Moderate, 4=Poor, 5=Very Poor
    }),
    components: z.object({
      co: z.number(),    // Carbon monoxide (μg/m³)
      no: z.number(),    // Nitrogen monoxide (μg/m³) 
      no2: z.number(),   // Nitrogen dioxide (μg/m³)
      o3: z.number(),    // Ozone (μg/m³)
      so2: z.number(),   // Sulphur dioxide (μg/m³)
      pm2_5: z.number(), // Fine particles matter (μg/m³)
      pm10: z.number(),  // Coarse particulate matter (μg/m³)
      nh3: z.number(),   // Ammonia (μg/m³)
    }),
    dt: z.number(),
  })),
});

export const weatherMapLayerSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  enabled: z.boolean(),
  opacity: z.number().min(0).max(1),
  type: z.enum(["precipitation", "clouds", "pressure", "temperature", "wind"]),
});

export const weatherMapConfigSchema = z.object({
  center: z.object({
    lat: z.number(),
    lon: z.number(),
  }),
  zoom: z.number().min(1).max(18),
  layers: z.array(weatherMapLayerSchema),
});

export const weatherAlertSchema = z.object({
  sender_name: z.string(),
  event: z.string(),
  start: z.number(),
  end: z.number(),
  description: z.string(),
  tags: z.array(z.string()).optional(),
});

export const weatherAlertsResponseSchema = z.object({
  lat: z.number(),
  lon: z.number(),
  timezone: z.string(),
  timezone_offset: z.number(),
  alerts: z.array(weatherAlertSchema).optional(),
});

export type WeatherCondition = z.infer<typeof weatherConditionSchema>;
export type CurrentWeather = z.infer<typeof currentWeatherSchema>;
export type ForecastItem = z.infer<typeof forecastItemSchema>;
export type Forecast = z.infer<typeof forecastSchema>;
export type CitySearch = z.infer<typeof citySearchSchema>;
export type AirQuality = z.infer<typeof airQualitySchema>;
export type WeatherMapLayer = z.infer<typeof weatherMapLayerSchema>;
export type WeatherMapConfig = z.infer<typeof weatherMapConfigSchema>;
export type WeatherAlert = z.infer<typeof weatherAlertSchema>;
export type WeatherAlertsResponse = z.infer<typeof weatherAlertsResponseSchema>;
