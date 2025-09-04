import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, MapPin, Loader2 } from "lucide-react";
import { searchCities } from "@/lib/weather-api";
import type { CitySearch } from "@shared/schema";

interface SearchBarProps {
  onLocationSelect: (location: { lat: number; lon: number; name: string; cityData?: { name: string; country: string; state: string | null } }) => void;
}

export default function SearchBar({ onLocationSelect }: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: cities, isLoading } = useQuery<CitySearch[]>({
    queryKey: ["/api/cities/search", debouncedQuery],
    queryFn: () => searchCities(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setIsOpen(value.length >= 2);
  };

  const handleLocationSelect = (city: CitySearch) => {
    const locationName = city.state 
      ? `${city.name}, ${city.state}, ${city.country}`
      : `${city.name}, ${city.country}`;
    
    onLocationSelect({
      lat: city.lat,
      lon: city.lon,
      name: locationName,
      // Pass additional data for better history tracking
      cityData: {
        name: city.name,
        country: city.country,
        state: city.state || null
      }
    });
    
    setSearchQuery("");
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          onLocationSelect({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
            name: "Current Location",
            cityData: {
              name: "Current Location",
              country: "Unknown",
              state: null
            }
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          alert("Unable to get your location. Please check your browser permissions.");
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  };

  return (
    <div className="max-w-md sm:max-w-lg mx-auto relative px-2 sm:px-0">
      <div className="relative">
        <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 sm:w-5 h-4 sm:h-5" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search for a city or address..."
          className="search-input w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-3 sm:py-4 rounded-2xl bg-card border border-border focus:ring-ring focus:border-ring outline-none text-foreground placeholder-muted-foreground text-base sm:text-lg"
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={() => searchQuery.length >= 2 && setIsOpen(true)}
          data-testid="input-search-city"
        />
        <button
          onClick={handleCurrentLocation}
          className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
          title="Use current location"
          data-testid="button-current-location"
        >
          <MapPin className="w-4 sm:w-5 h-4 sm:h-5" />
        </button>
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-2 bg-card rounded-xl shadow-lg border border-border z-50 max-h-80 overflow-y-auto"
          data-testid="dropdown-search-results"
        >
          <div className="p-2">
            {isLoading && debouncedQuery && (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                <span className="text-muted-foreground">Searching...</span>
              </div>
            )}
            
            {cities && cities.length > 0 && (
              <>
                {cities.map((city, index) => (
                  <div
                    key={`${city.lat}-${city.lon}-${index}`}
                    onClick={() => handleLocationSelect(city)}
                    className="p-3 hover:bg-muted rounded-lg cursor-pointer transition-colors"
                    data-testid={`option-city-${index}`}
                  >
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 text-muted-foreground mr-3 flex-shrink-0" />
                      <div>
                        <div className="font-medium">
                          {city.name}
                          {city.state && `, ${city.state}`}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {city.country}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
            
            {cities && cities.length === 0 && debouncedQuery && !isLoading && (
              <div className="p-4 text-center">
                <div className="text-muted-foreground mb-2">
                  No locations found for "{debouncedQuery}"
                </div>
                <div className="text-sm text-muted-foreground">
                  Try searching for:
                  <ul className="text-left mt-1 space-y-1">
                    <li>• City name: "New York"</li>
                    <li>• City, State: "Austin, TX"</li>
                    <li>• ZIP code: "10001"</li>
                    <li>• Landmark: "Central Park"</li>
                  </ul>
                </div>
              </div>
            )}
            
            {debouncedQuery.length < 2 && searchQuery.length >= 2 && (
              <div className="p-4 text-center text-muted-foreground">
                Keep typing to search for locations...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
