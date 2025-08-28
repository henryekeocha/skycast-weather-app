// This storage file is not used by the weather application
// Weather data comes directly from OpenWeatherMap API

export interface IStorage {
  // Placeholder for future storage needs
}

export class MemStorage implements IStorage {
  constructor() {
    // Empty implementation
  }
}

export const storage = new MemStorage();
