import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart, MapPin, Trash2, Plus, History, ChevronLeft, ChevronRight } from "lucide-react";
import { getFavoriteLocations, addFavoriteLocation, removeFavoriteLocation, getLocationHistory } from "@/lib/weather-api";
import type { Location } from "@shared/schema";

interface FavoritesManagerProps {
  onLocationSelect: (location: { lat: number; lon: number; name: string }) => void;
  currentLocation?: { lat: number; lon: number; name: string } | null;
}

export default function FavoritesManager({ onLocationSelect, currentLocation }: FavoritesManagerProps) {
  const [activeTab, setActiveTab] = useState<"favorites" | "history">("favorites");
  const [favoritesPage, setFavoritesPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const queryClient = useQueryClient();
  
  const ITEMS_PER_PAGE = 2; // Temporarily reduced to test pagination
  
  // For now, we'll use undefined userId since we don't have user authentication
  const userId = undefined;

  const { data: favorites = [], isLoading: favoritesLoading } = useQuery({
    queryKey: ["/api/locations/favorites", userId],
    queryFn: () => getFavoriteLocations(userId || undefined),
  });

  const { data: history = [], isLoading: historyLoading } = useQuery({
    queryKey: ["/api/locations/history", userId],
    queryFn: () => getLocationHistory(userId || undefined, 50), // Get more items for pagination
    staleTime: 0, // Always refetch to get the latest data
    gcTime: 0, // Don't cache the data
  });

  const addFavoriteMutation = useMutation({
    mutationFn: addFavoriteLocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/locations/favorites"] });
    },
  });

  const removeFavoriteMutation = useMutation({
    mutationFn: ({ locationId }: { locationId: number }) => 
      removeFavoriteLocation(locationId, userId || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/locations/favorites"] });
    },
  });

  const clearHistoryMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/locations/history", {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to clear history");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/locations/history"] });
      setHistoryPage(1); // Reset to first page
    },
  });

  const handleAddCurrentToFavorites = async () => {
    if (!currentLocation) return;
    
    try {
      await addFavoriteMutation.mutateAsync({
        name: currentLocation.name,
        country: "Unknown", // We'll need to get this from the location data
        state: undefined,
        lat: currentLocation.lat,
        lon: currentLocation.lon,
        userId: undefined,
      });
    } catch (error) {
      console.error("Failed to add favorite:", error);
    }
  };

  const handleRemoveFavorite = async (locationId: number) => {
    try {
      await removeFavoriteMutation.mutateAsync({ locationId });
    } catch (error) {
      console.error("Failed to remove favorite:", error);
    }
  };

  const handleClearHistory = async () => {
    try {
      await clearHistoryMutation.mutateAsync();
    } catch (error) {
      console.error("Failed to clear history:", error);
    }
  };

  const isCurrentLocationFavorited = currentLocation && favorites.some(
    fav => Math.abs(fav.lat - currentLocation.lat) < 0.001 && Math.abs(fav.lon - currentLocation.lon) < 0.001
  );

  const formatLocationName = (location: Location) => {
    let name = location.name;
    if (location.state) {
      name += `, ${location.state}`;
    }
    if (location.country) {
      name += `, ${location.country}`;
    }
    return name;
  };

  // Pagination calculations
  const favoritesPaginated = {
    data: favorites.slice((favoritesPage - 1) * ITEMS_PER_PAGE, favoritesPage * ITEMS_PER_PAGE),
    totalPages: Math.ceil(favorites.length / ITEMS_PER_PAGE),
    currentPage: favoritesPage,
    totalItems: favorites.length
  };

  const historyPaginated = {
    data: history.slice((historyPage - 1) * ITEMS_PER_PAGE, historyPage * ITEMS_PER_PAGE),
    totalPages: Math.ceil(history.length / ITEMS_PER_PAGE),
    currentPage: historyPage,
    totalItems: history.length
  };

  const PaginationControls = ({ 
    currentPage, 
    totalPages, 
    onPageChange,
    totalItems,
    itemName
  }: { 
    currentPage: number; 
    totalPages: number; 
    onPageChange: (page: number) => void;
    totalItems: number;
    itemName: string;
  }) => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-4 pt-4 border-t border-border space-y-2 sm:space-y-0">
        <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
          {totalItems} {itemName}{totalItems !== 1 ? 's' : ''} • Page {currentPage} of {totalPages}
        </div>
        <div className="flex items-center justify-center space-x-2">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 rounded-lg hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid={`button-prev-${itemName}`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium px-2">
            {currentPage}
          </span>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid={`button-next-${itemName}`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="weather-card rounded-3xl p-4 sm:p-6 mb-6 sm:mb-8" data-testid="favorites-manager">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0">
        <h3 className="text-xl sm:text-2xl font-semibold flex items-center">
          <Heart className="w-5 sm:w-6 h-5 sm:h-6 text-red-500 mr-2 sm:mr-3" />
          Locations
        </h3>
        
        {currentLocation && !isCurrentLocationFavorited && (
          <button
            onClick={handleAddCurrentToFavorites}
            disabled={addFavoriteMutation.isPending}
            className="flex items-center px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm"
            data-testid="button-add-current-favorite"
          >
            <Plus className="w-4 h-4 mr-1" />
            {addFavoriteMutation.isPending ? "Adding..." : "Add Current"}
          </button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-4 sm:mb-6 bg-muted p-1 rounded-lg">
        <button
          onClick={() => {
            setActiveTab("favorites");
            setFavoritesPage(1); // Reset to first page when switching tabs
          }}
          className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "favorites"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
          data-testid="tab-favorites"
        >
          <Heart className="w-4 h-4 mr-2" />
          Favorites ({favorites.length})
        </button>
        <button
          onClick={() => {
            setActiveTab("history");
            setHistoryPage(1); // Reset to first page when switching tabs
          }}
          className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "history"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
          data-testid="tab-history"
        >
          <History className="w-4 h-4 mr-2" />
          Recent ({history.length})
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "favorites" && (
        <div data-testid="favorites-list">
          {favoritesLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-pulse text-muted-foreground">Loading favorites...</div>
            </div>
          ) : favorites.length === 0 ? (
            <div className="text-center py-8">
              <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-2">No favorite locations yet</p>
              <p className="text-sm text-muted-foreground">
                Add locations to quickly access their weather
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {favoritesPaginated.data.map((location) => (
                  <div
                    key={location.id}
                    className="flex items-center justify-between p-4 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors"
                    data-testid={`favorite-${location.id}`}
                  >
                    <button
                      onClick={() => onLocationSelect({
                        lat: location.lat,
                        lon: location.lon,
                        name: formatLocationName(location)
                      })}
                      className="flex items-start flex-1 text-left hover:text-primary transition-colors"
                      data-testid={`button-select-favorite-${location.id}`}
                    >
                      <MapPin className="w-4 h-4 mt-1 mr-3 text-muted-foreground flex-shrink-0" />
                      <div>
                        <p className="font-medium">{location.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {location.state && `${location.state}, `}{location.country}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {location.lat.toFixed(4)}, {location.lon.toFixed(4)}
                        </p>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => handleRemoveFavorite(location.id)}
                      disabled={removeFavoriteMutation.isPending}
                      className="text-muted-foreground hover:text-red-500 transition-colors p-1"
                      data-testid={`button-remove-favorite-${location.id}`}
                      title="Remove from favorites"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              
              <PaginationControls
                currentPage={favoritesPaginated.currentPage}
                totalPages={favoritesPaginated.totalPages}
                onPageChange={setFavoritesPage}
                totalItems={favoritesPaginated.totalItems}
                itemName="favorite"
              />
            </>
          )}
        </div>
      )}

      {activeTab === "history" && (
        <div data-testid="history-list">
          {historyLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-pulse text-muted-foreground">Loading history...</div>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8">
              <History className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-2">No location history yet</p>
              <p className="text-sm text-muted-foreground">
                Your recently viewed locations will appear here
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-muted-foreground">
                  {history.length} recent location{history.length !== 1 ? 's' : ''}
                </div>
                <button
                  onClick={handleClearHistory}
                  disabled={clearHistoryMutation.isPending}
                  className="flex items-center px-3 py-2 text-sm text-muted-foreground hover:text-red-500 transition-colors"
                  data-testid="button-clear-history"
                  title="Clear all history"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  {clearHistoryMutation.isPending ? "Clearing..." : "Clear All"}
                </button>
              </div>
              
              <div className="space-y-3">
                {historyPaginated.data.map((location) => (
                  <button
                    key={location.id}
                    onClick={() => onLocationSelect({
                      lat: location.lat,
                      lon: location.lon,
                      name: formatLocationName(location)
                    })}
                    className="flex items-start w-full text-left p-4 bg-muted/30 rounded-xl hover:bg-muted/50 hover:text-primary transition-colors"
                    data-testid={`history-${location.id}`}
                  >
                    <MapPin className="w-4 h-4 mt-1 mr-3 text-muted-foreground flex-shrink-0" />
                    <div>
                      <p className="font-medium">{location.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {location.state && `${location.state}, `}{location.country}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {location.lat.toFixed(4)}, {location.lon.toFixed(4)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
              
              <PaginationControls
                currentPage={historyPaginated.currentPage}
                totalPages={historyPaginated.totalPages}
                onPageChange={setHistoryPage}
                totalItems={historyPaginated.totalItems}
                itemName="location"
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}