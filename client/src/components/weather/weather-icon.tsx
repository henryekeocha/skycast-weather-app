import { 
  Sun, 
  Cloud, 
  CloudRain, 
  CloudSnow, 
  Zap, 
  Cloudy,
  CloudDrizzle,
  Wind,
  Haze
} from "lucide-react";

interface WeatherIconProps {
  condition: string;
  iconCode?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export default function WeatherIcon({ 
  condition, 
  iconCode, 
  size = "md", 
  className = "" 
}: WeatherIconProps) {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-12 h-12",
    xl: "w-16 h-16"
  };

  const getIconAndColor = (condition: string, iconCode?: string) => {
    const lowerCondition = condition.toLowerCase();
    const isNight = iconCode?.includes('n');
    
    switch (lowerCondition) {
      case "clear":
        return {
          icon: Sun,
          color: isNight ? "text-slate-300" : "text-accent"
        };
      case "clouds":
        if (iconCode?.includes('02')) {
          return {
            icon: Cloudy,
            color: "text-muted-foreground"
          };
        }
        return {
          icon: Cloud,
          color: "text-muted-foreground"
        };
      case "rain":
        return {
          icon: CloudRain,
          color: "text-rain"
        };
      case "drizzle":
        return {
          icon: CloudDrizzle,
          color: "text-rain"
        };
      case "thunderstorm":
        return {
          icon: Zap,
          color: "text-yellow-500"
        };
      case "snow":
        return {
          icon: CloudSnow,
          color: "text-blue-200"
        };
      case "mist":
      case "fog":
      case "haze":
        return {
          icon: Haze,
          color: "text-gray-400"
        };
      case "dust":
      case "sand":
      case "ash":
        return {
          icon: Wind,
          color: "text-orange-400"
        };
      case "squall":
      case "tornado":
        return {
          icon: Wind,
          color: "text-red-500"
        };
      default:
        return {
          icon: Sun,
          color: "text-accent"
        };
    }
  };

  const { icon: IconComponent, color } = getIconAndColor(condition, iconCode);

  return (
    <IconComponent 
      className={`${sizeClasses[size]} ${color} ${className}`}
      aria-label={`${condition} weather condition`}
    />
  );
}
