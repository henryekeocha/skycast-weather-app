import { db } from "./db";
import { locations, favoriteLocations, locationHistory } from "@shared/schema";
import { eq, desc, and, isNull } from "drizzle-orm";
import type { 
  Location, 
  FavoriteLocation, 
  LocationHistory, 
  InsertLocation,
  InsertFavoriteLocation,
  InsertLocationHistory
} from "@shared/schema";

export interface IStorage {
  // Location operations
  findLocationByCoords(lat: number, lon: number): Promise<Location | undefined>;
  createLocation(location: InsertLocation): Promise<Location>;
  getFavoriteLocations(userId?: string | null): Promise<Location[]>;
  addFavorite(favorite: InsertFavoriteLocation): Promise<FavoriteLocation>;
  removeFavorite(locationId: number, userId?: string | null): Promise<void>;
  isFavorite(locationId: number, userId?: string | null): Promise<boolean>;
  getLocationHistory(userId?: string | null, limit?: number): Promise<Location[]>;
  addToHistory(locationId: number, userId?: string | null): Promise<void>;
  clearHistory(userId?: string | null): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  
  async findLocationByCoords(lat: number, lon: number): Promise<Location | undefined> {
    const [location] = await db
      .select()
      .from(locations)
      .where(and(
        eq(locations.lat, lat),
        eq(locations.lon, lon)
      ))
      .limit(1);
    return location;
  }

  async createLocation(location: InsertLocation): Promise<Location> {
    const [newLocation] = await db
      .insert(locations)
      .values(location)
      .returning();
    return newLocation;
  }

  async getFavoriteLocations(userId?: string | null): Promise<Location[]> {
    const favorites = await db
      .select({
        id: locations.id,
        name: locations.name,
        country: locations.country,
        state: locations.state,
        lat: locations.lat,
        lon: locations.lon,
        createdAt: locations.createdAt,
        updatedAt: locations.updatedAt,
      })
      .from(favoriteLocations)
      .innerJoin(locations, eq(favoriteLocations.locationId, locations.id))
      .where(userId ? eq(favoriteLocations.userId, userId) : isNull(favoriteLocations.userId))
      .orderBy(desc(favoriteLocations.createdAt));
    
    return favorites;
  }

  async addFavorite(favorite: InsertFavoriteLocation): Promise<FavoriteLocation> {
    const [newFavorite] = await db
      .insert(favoriteLocations)
      .values(favorite)
      .returning();
    return newFavorite;
  }

  async removeFavorite(locationId: number, userId?: string | null): Promise<void> {
    await db
      .delete(favoriteLocations)
      .where(and(
        eq(favoriteLocations.locationId, locationId),
        userId ? eq(favoriteLocations.userId, userId) : isNull(favoriteLocations.userId)
      ));
  }

  async isFavorite(locationId: number, userId?: string | null): Promise<boolean> {
    const [favorite] = await db
      .select({ id: favoriteLocations.id })
      .from(favoriteLocations)
      .where(and(
        eq(favoriteLocations.locationId, locationId),
        userId ? eq(favoriteLocations.userId, userId) : isNull(favoriteLocations.userId)
      ))
      .limit(1);
    
    return !!favorite;
  }

  async getLocationHistory(userId?: string | null, limit: number = 10): Promise<Location[]> {
    const history = await db
      .select({
        id: locations.id,
        name: locations.name,
        country: locations.country,
        state: locations.state,
        lat: locations.lat,
        lon: locations.lon,
        createdAt: locations.createdAt,
        updatedAt: locations.updatedAt,
      })
      .from(locationHistory)
      .innerJoin(locations, eq(locationHistory.locationId, locations.id))
      .where(userId ? eq(locationHistory.userId, userId) : isNull(locationHistory.userId))
      .orderBy(desc(locationHistory.lastVisited))
      .limit(limit);
    
    return history;
  }

  async addToHistory(locationId: number, userId?: string | null): Promise<void> {
    // Check if location already exists in history
    const [existingHistory] = await db
      .select()
      .from(locationHistory)
      .where(and(
        eq(locationHistory.locationId, locationId),
        userId ? eq(locationHistory.userId, userId) : isNull(locationHistory.userId)
      ))
      .limit(1);

    if (existingHistory) {
      // Update existing entry
      await db
        .update(locationHistory)
        .set({
          visitCount: existingHistory.visitCount + 1,
          lastVisited: new Date(),
        })
        .where(eq(locationHistory.id, existingHistory.id));
    } else {
      // Create new entry
      await db
        .insert(locationHistory)
        .values({
          locationId,
          userId: userId || null,
          visitCount: 1,
        });
    }
  }

  async clearHistory(userId?: string | null): Promise<void> {
    await db
      .delete(locationHistory)
      .where(userId ? eq(locationHistory.userId, userId) : isNull(locationHistory.userId));
  }
}

export const storage = new DatabaseStorage();
