import * as THREE from 'three';
import { BlockType, DroppedItemEntity } from '../types/game';
import { CHUNK_SIZE_X, CHUNK_SIZE_Y, CHUNK_SIZE_Z, SEA_LEVEL, ITEMS } from './constants';
import { Chunk } from './chunk';
import { WorldGenerator } from './worldGen';
import { sounds } from './audio';

export class World {
  public scene: THREE.Scene;
  public generator: WorldGenerator;
  public chunks: Map<string, Chunk> = new Map();
  public deltas: Map<string, BlockType> = new Map(); // key: "x,y,z"
  public renderDistance: number = 3; // radius in chunks
  public particleGroup: THREE.Group;
  public droppedItemGroup: THREE.Group;
  public droppedItems: DroppedItemEntity[] = [];

  // Dynamic point lights for torches
  public torchLightGroup: THREE.Group;
  public torchLocations: Set<string> = new Set();
  private activePointLights: THREE.PointLight[] = [];
  public onChunkLoaded?: (cx: number, cz: number) => void;

  private activeParticles: {
    mesh: THREE.Mesh;
    vx: number;
    vy: number;
    vz: number;
    life: number;
    maxLife: number;
  }[] = [];

  constructor(scene: THREE.Scene, seed: number = 12345) {
    this.scene = scene;
    this.generator = new WorldGenerator(seed);

    this.particleGroup = new THREE.Group();
    this.scene.add(this.particleGroup);

    this.droppedItemGroup = new THREE.Group();
    this.scene.add(this.droppedItemGroup);

    this.torchLightGroup = new THREE.Group();
    this.scene.add(this.torchLightGroup);

    // Prepare pool of 6 dynamic point lights for torches near player
    for (let i = 0; i < 6; i++) {
      const pl = new THREE.PointLight(0xffa500, 0, 14, 1.5);
      this.torchLightGroup.add(pl);
      this.activePointLights.push(pl);
    }
  }

  public getChunkKey(cx: number, cz: number): string {
    return `${cx},${cz}`;
  }

  public getBlockKey(wx: number, wy: number, wz: number): string {
    return `${wx},${wy},${wz}`;
  }

  public getChunk(cx: number, cz: number): Chunk | undefined {
    return this.chunks.get(this.getChunkKey(cx, cz));
  }

  public getBlock(wx: number, wy: number, wz: number): BlockType {
    if (wy < 0 || wy >= CHUNK_SIZE_Y) return BlockType.AIR;

    // Check deltas first
    const key = this.getBlockKey(wx, wy, wz);
    if (this.deltas.has(key)) {
      return this.deltas.get(key)!;
    }

    const cx = Math.floor(wx / CHUNK_SIZE_X);
    const cz = Math.floor(wz / CHUNK_SIZE_Z);
    const chunk = this.getChunk(cx, cz);
    if (chunk) {
      const lx = ((wx % CHUNK_SIZE_X) + CHUNK_SIZE_X) % CHUNK_SIZE_X;
      const lz = ((wz % CHUNK_SIZE_Z) + CHUNK_SIZE_Z) % CHUNK_SIZE_Z;
      return chunk.getBlock(lx, wy, lz);
    }

    // Fallback: estimate from generator if chunk not loaded yet
    const surfaceY = this.generator.getHeight(wx, wz);
    if (wy === 0) return BlockType.BEDROCK;
    if (wy < surfaceY - 3) return BlockType.STONE;
    if (wy < surfaceY) return wy <= SEA_LEVEL + 1 ? BlockType.SAND : BlockType.DIRT;
    if (wy === surfaceY) return wy <= SEA_LEVEL + 1 ? BlockType.SAND : BlockType.GRASS;
    if (wy <= SEA_LEVEL) return BlockType.WATER;
    return BlockType.AIR;
  }

  public setBlock(wx: number, wy: number, wz: number, type: BlockType): void {
    if (wy < 0 || wy >= CHUNK_SIZE_Y) return;

    const key = this.getBlockKey(wx, wy, wz);
    this.deltas.set(key, type);

    if (type === BlockType.TORCH) {
      this.torchLocations.add(key);
    } else {
      this.torchLocations.delete(key);
    }

    const cx = Math.floor(wx / CHUNK_SIZE_X);
    const cz = Math.floor(wz / CHUNK_SIZE_Z);
    const chunk = this.getChunk(cx, cz);

    const lx = ((wx % CHUNK_SIZE_X) + CHUNK_SIZE_X) % CHUNK_SIZE_X;
    const lz = ((wz % CHUNK_SIZE_Z) + CHUNK_SIZE_Z) % CHUNK_SIZE_Z;

    if (chunk) {
      chunk.setBlock(lx, wy, lz, type);
      this.rebuildChunkMesh(chunk);
    }

    // If modified block is on the edge of chunk, also rebuild neighbor chunk mesh
    if (lx === 0) {
      const neighbor = this.getChunk(cx - 1, cz);
      if (neighbor) this.rebuildChunkMesh(neighbor);
    } else if (lx === CHUNK_SIZE_X - 1) {
      const neighbor = this.getChunk(cx + 1, cz);
      if (neighbor) this.rebuildChunkMesh(neighbor);
    }
    if (lz === 0) {
      const neighbor = this.getChunk(cx, cz - 1);
      if (neighbor) this.rebuildChunkMesh(neighbor);
    } else if (lz === CHUNK_SIZE_Z - 1) {
      const neighbor = this.getChunk(cx, cz + 1);
      if (neighbor) this.rebuildChunkMesh(neighbor);
    }
  }

  // Spawn a 3D dropped item entity that spins and floats towards the player
  public spawnDroppedItem(itemId: string, count: number, x: number, y: number, z: number): void {
    const def = ITEMS[itemId];
    const color = def?.color || '#ffd166';

    const geom = new THREE.BoxGeometry(0.24, 0.24, 0.24);
    const mat = new THREE.MeshLambertMaterial({ color });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.set(x, y, z);
    this.droppedItemGroup.add(mesh);

    this.droppedItems.push({
      id: Math.random().toString(36).substring(2, 9),
      itemId,
      count,
      x,
      y,
      z,
      vx: (Math.random() - 0.5) * 2,
      vy: 2.5 + Math.random() * 1.5,
      vz: (Math.random() - 0.5) * 2,
      life: 0,
      mesh,
    });
  }

  // Update floating dropped items (physics, magnetic pull, and pickup)
  public updateDroppedItems(
    dt: number,
    playerPos: THREE.Vector3,
    onPickup: (itemId: string, count: number) => boolean
  ): void {
    for (let i = this.droppedItems.length - 1; i >= 0; i--) {
      const item = this.droppedItems[i];
      item.life += dt;

      // Distance to player
      const dx = playerPos.x - item.x;
      const dy = playerPos.y + 0.8 - item.y;
      const dz = playerPos.z - item.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      // Magnetic attraction within 3.0 blocks
      if (dist < 3.0 && item.life > 0.4) {
        const pullSpeed = 9.0;
        item.vx += (dx / dist) * pullSpeed * dt;
        item.vy += (dy / dist) * pullSpeed * dt;
        item.vz += (dz / dist) * pullSpeed * dt;

        // Pickup threshold
        if (dist < 0.75) {
          const success = onPickup(item.itemId, item.count);
          if (success) {
            sounds.playPop();
            this.droppedItemGroup.remove(item.mesh);
            item.mesh.geometry.dispose();
            this.droppedItems.splice(i, 1);
            continue;
          }
        }
      } else {
        // Normal physics
        item.vy -= 14 * dt; // gravity
        item.vx *= 0.95; // air drag
        item.vz *= 0.95;

        // Simple ground collision
        const groundY = Math.floor(item.y);
        const groundBlock = this.getBlock(Math.floor(item.x), groundY, Math.floor(item.z));
        if (groundBlock !== BlockType.AIR && groundBlock !== BlockType.WATER && item.y < groundY + 1.15) {
          item.y = groundY + 1.15;
          item.vy = 0;
        }
      }

      item.x += item.vx * dt;
      item.y += item.vy * dt;
      item.z += item.vz * dt;

      if (item.mesh) {
        const bob = Math.sin(item.life * 4) * 0.05;
        item.mesh.position.set(item.x, item.y + bob, item.z);
        item.mesh.rotation.y += 3.5 * dt;
        item.mesh.rotation.x += 1.2 * dt;
      }
    }
  }

  // Update dynamic torch light flickering
  public updateTorchLighting(playerX: number, playerY: number, playerZ: number, time: number): void {
    let lightIdx = 0;

    for (const key of this.torchLocations) {
      if (lightIdx >= this.activePointLights.length) break;

      const [tx, ty, tz] = key.split(',').map(Number);
      const distSq = (tx - playerX) ** 2 + (ty - playerY) ** 2 + (tz - playerZ) ** 2;

      // Only illuminate torches within 24 blocks of player
      if (distSq < 24 * 24) {
        const pl = this.activePointLights[lightIdx];
        pl.position.set(tx + 0.5, ty + 0.6, tz + 0.5);

        // Flame flicker
        const flicker = Math.sin(time * 15 + tx) * 0.15 + Math.cos(time * 22 + tz) * 0.1;
        pl.intensity = 1.4 + flicker;
        lightIdx++;
      }
    }

    // Turn off unused lights
    for (let i = lightIdx; i < this.activePointLights.length; i++) {
      this.activePointLights[i].intensity = 0;
    }
  }

  private rebuildChunkMesh(chunk: Chunk): void {
    chunk.dispose(this.scene);
    const mesh = chunk.buildMesh((x, y, z) => this.getBlock(x, y, z));
    this.scene.add(mesh);
  }

  // Load a single chunk and apply any world deltas
  public loadChunk(cx: number, cz: number): Chunk {
    const key = this.getChunkKey(cx, cz);
    let chunk = this.chunks.get(key);
    if (!chunk) {
      const rawData = this.generator.generateChunkData(cx, cz);
      chunk = new Chunk(cx, cz, rawData);

      // Apply saved block changes
      const worldBaseX = cx * CHUNK_SIZE_X;
      const worldBaseZ = cz * CHUNK_SIZE_Z;
      for (let x = 0; x < CHUNK_SIZE_X; x++) {
        for (let z = 0; z < CHUNK_SIZE_Z; z++) {
          for (let y = 0; y < CHUNK_SIZE_Y; y++) {
            const dKey = this.getBlockKey(worldBaseX + x, y, worldBaseZ + z);
            if (this.deltas.has(dKey)) {
              chunk.setBlock(x, y, z, this.deltas.get(dKey)!);
            }
          }
        }
      }

      this.chunks.set(key, chunk);
      const mesh = chunk.buildMesh((x, y, z) => this.getBlock(x, y, z));
      this.scene.add(mesh);

      // Notify chunk loaded (e.g. for village entity spawning)
      this.onChunkLoaded?.(cx, cz);
    }
    return chunk;
  }

  // Unload chunk and free resources
  public unloadChunk(cx: number, cz: number): void {
    const key = this.getChunkKey(cx, cz);
    const chunk = this.chunks.get(key);
    if (chunk) {
      chunk.dispose(this.scene);
      this.chunks.delete(key);
    }
  }

  // Update chunks around player position
  public update(playerX: number, playerZ: number): void {
    const playerChunkX = Math.floor(playerX / CHUNK_SIZE_X);
    const playerChunkZ = Math.floor(playerZ / CHUNK_SIZE_Z);

    const neededKeys = new Set<string>();

    for (let dx = -this.renderDistance; dx <= this.renderDistance; dx++) {
      for (let dz = -this.renderDistance; dz <= this.renderDistance; dz++) {
        const cx = playerChunkX + dx;
        const cz = playerChunkZ + dz;
        neededKeys.add(this.getChunkKey(cx, cz));

        if (!this.chunks.has(this.getChunkKey(cx, cz))) {
          this.loadChunk(cx, cz);
        }
      }
    }

    // Unload chunks outside radius + 1
    const unloadDist = this.renderDistance + 1;
    for (const [key, chunk] of this.chunks.entries()) {
      if (
        Math.abs(chunk.chunkX - playerChunkX) > unloadDist ||
        Math.abs(chunk.chunkZ - playerChunkZ) > unloadDist
      ) {
        chunk.dispose(this.scene);
        this.chunks.delete(key);
      }
    }
  }

  // Spawn breaking particles
  public spawnBreakParticles(wx: number, wy: number, wz: number, color: number = 0x888888): void {
    const count = 10;
    const geom = new THREE.BoxGeometry(0.12, 0.12, 0.12);
    const mat = new THREE.MeshBasicMaterial({ color });

    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.set(
        wx + 0.2 + Math.random() * 0.6,
        wy + 0.2 + Math.random() * 0.6,
        wz + 0.2 + Math.random() * 0.6
      );
      this.particleGroup.add(mesh);

      this.activeParticles.push({
        mesh,
        vx: (Math.random() - 0.5) * 4,
        vy: 2 + Math.random() * 3,
        vz: (Math.random() - 0.5) * 4,
        life: 0,
        maxLife: 0.6 + Math.random() * 0.4,
      });
    }
  }

  // Update particles physics and remove dead ones
  public updateParticles(dt: number): void {
    for (let i = this.activeParticles.length - 1; i >= 0; i--) {
      const p = this.activeParticles[i];
      p.life += dt;
      p.vy -= 15 * dt; // gravity

      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y += p.vy * dt;
      p.mesh.position.z += p.vz * dt;

      const scale = Math.max(0, 1 - p.life / p.maxLife);
      p.mesh.scale.set(scale, scale, scale);

      if (p.life >= p.maxLife) {
        this.particleGroup.remove(p.mesh);
        p.mesh.geometry.dispose();
        this.activeParticles.splice(i, 1);
      }
    }
  }

  // Find a safe spawn position (ground surface at 0, 0)
  public getSafeSpawn(): { x: number; y: number; z: number } {
    let spawnX = 8;
    let spawnZ = 8;
    let height = this.generator.getHeight(spawnX, spawnZ);

    // If underwater, scan around for dry land
    if (height <= SEA_LEVEL) {
      for (let offset = 4; offset <= 32; offset += 4) {
        const testH = this.generator.getHeight(spawnX + offset, spawnZ + offset);
        if (testH > SEA_LEVEL + 1) {
          spawnX += offset;
          spawnZ += offset;
          height = testH;
          break;
        }
      }
    }

    return {
      x: spawnX + 0.5,
      y: height + 2.5,
      z: spawnZ + 0.5,
    };
  }

  // Serialize modified blocks for saving
  public serializeDeltas(): Record<string, number> {
    const obj: Record<string, number> = {};
    for (const [k, v] of this.deltas.entries()) {
      obj[k] = v;
    }
    return obj;
  }

  // Restore modified blocks from save
  public loadDeltas(savedDeltas: Record<string, number>): void {
    this.deltas.clear();
    for (const [k, v] of Object.entries(savedDeltas)) {
      this.deltas.set(k, v as BlockType);
    }
  }

  // Clean up all chunks
  public clear(): void {
    for (const chunk of this.chunks.values()) {
      chunk.dispose(this.scene);
    }
    this.chunks.clear();
    this.deltas.clear();

    // Clean particles
    for (const p of this.activeParticles) {
      this.particleGroup.remove(p.mesh);
      p.mesh.geometry.dispose();
    }
    this.activeParticles = [];
  }
}
