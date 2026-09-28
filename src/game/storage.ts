import { WorldSaveMeta } from '../types/game';

const INDEX_KEY = 'buildre_world_index_v1';
const WORLD_PREFIX = 'buildre_world_data_v1_';

export interface WorldDataRecord {
  meta: WorldSaveMeta;
  deltas: Record<string, number>;
}

export class WorldStorage {
  // Get all saved worlds metadata
  public static listWorlds(): WorldSaveMeta[] {
    try {
      const indexRaw = localStorage.getItem(INDEX_KEY);
      if (!indexRaw) return [];
      const list: WorldSaveMeta[] = JSON.parse(indexRaw);
      return list.sort((a, b) => b.lastPlayed - a.lastPlayed);
    } catch (e) {
      console.error('Failed to list worlds', e);
      return [];
    }
  }

  // Save or update a world
  public static saveWorld(meta: WorldSaveMeta, deltas: Record<string, number>): boolean {
    try {
      meta.lastPlayed = Date.now();

      // Save payload
      const payload: WorldDataRecord = { meta, deltas };
      localStorage.setItem(`${WORLD_PREFIX}${meta.id}`, JSON.stringify(payload));

      // Update index
      const list = this.listWorlds();
      const existingIdx = list.findIndex((w) => w.id === meta.id);
      if (existingIdx >= 0) {
        list[existingIdx] = meta;
      } else {
        list.push(meta);
      }
      localStorage.setItem(INDEX_KEY, JSON.stringify(list));
      return true;
    } catch (e) {
      console.error('Failed to save world', e);
      return false;
    }
  }

  // Load a world data by ID
  public static loadWorld(worldId: string): WorldDataRecord | null {
    try {
      const dataRaw = localStorage.getItem(`${WORLD_PREFIX}${worldId}`);
      if (!dataRaw) return null;
      return JSON.parse(dataRaw);
    } catch (e) {
      console.error('Failed to load world', e);
      return null;
    }
  }

  // Delete a world by ID
  public static deleteWorld(worldId: string): boolean {
    try {
      localStorage.removeItem(`${WORLD_PREFIX}${worldId}`);
      const list = this.listWorlds().filter((w) => w.id !== worldId);
      localStorage.setItem(INDEX_KEY, JSON.stringify(list));
      return true;
    } catch (e) {
      console.error('Failed to delete world', e);
      return false;
    }
  }

  // Create a brand new world metadata record
  public static createNewWorld(name: string, seed?: number, gameMode: 'survival' | 'creative' = 'survival'): WorldSaveMeta {
    const worldSeed = seed !== undefined && !isNaN(seed) ? seed : Math.floor(Math.random() * 1000000);
    const id = `world_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const meta: WorldSaveMeta = {
      id,
      name: name.trim() || 'My World',
      seed: worldSeed,
      createdAt: Date.now(),
      lastPlayed: Date.now(),
      gameTime: 60, // starts at morning sunrise (0 = night, 60 = morning, 300 = noon, 600 = sunset, etc.)
      player: {
        x: 8.5,
        y: 28,
        z: 8.5,
        pitch: 0,
        yaw: 0,
        health: 20,
        hunger: 20,
        inventory: new Array(36).fill(null),
        hotbar: [
          { itemId: 'wooden_pickaxe', count: 1 },
          { itemId: 'wooden_axe', count: 1 },
          { itemId: 'torch', count: 16 },
          { itemId: 'apple', count: 5 },
          null,
          null,
          null,
          null,
          null,
        ],
        selectedHotbarIndex: 0,
      },
      gameMode,
    };

    this.saveWorld(meta, {});
    return meta;
  }
}
