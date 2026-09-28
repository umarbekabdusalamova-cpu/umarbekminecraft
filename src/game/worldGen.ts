import { createNoise2D, createNoise3D } from 'simplex-noise';
import { BlockType } from '../types/game';
import { CHUNK_SIZE_X, CHUNK_SIZE_Y, CHUNK_SIZE_Z, SEA_LEVEL } from './constants';

export class WorldGenerator {
  private noise2D: (x: number, y: number) => number;
  private caveNoise3D: (x: number, y: number, z: number) => number;
  private biomeNoise: (x: number, y: number) => number;
  private seed: number;

  constructor(seed: number = 12345) {
    this.seed = seed;
    // Simple PRNG function from seed for simplex-noise
    const rng = this.createSeededRNG(seed);
    this.noise2D = createNoise2D(rng);
    this.caveNoise3D = createNoise3D(rng);
    this.biomeNoise = createNoise2D(this.createSeededRNG(seed + 999));
  }

  private createSeededRNG(seed: number) {
    let s = seed % 2147483647;
    if (s <= 0) s += 2147483646;
    return () => {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
  }

  // Get surface height at world (x, z)
  public getHeight(wx: number, wz: number): number {
    // Biome weight: plains (-1 to 0), hills (0 to 0.5), mountains (0.5 to 1)
    const biome = this.biomeNoise(wx * 0.003, wz * 0.003);

    // Multi-octave continental terrain
    const n1 = this.noise2D(wx * 0.008, wz * 0.008);
    const n2 = this.noise2D(wx * 0.02, wz * 0.02) * 0.5;
    const n3 = this.noise2D(wx * 0.06, wz * 0.06) * 0.25;
    const combined = (n1 + n2 + n3) / 1.75; // roughly -1 to 1

    let height = SEA_LEVEL + 4 + combined * 8; // base plains 18-26

    if (biome > 0.2) {
      // Mountains
      const mountainBoost = (biome - 0.2) * 20;
      height += mountainBoost;
    } else if (biome < -0.3) {
      // Lakes / Oceans / Lowlands
      height -= 5;
    }

    return Math.floor(Math.max(3, Math.min(CHUNK_SIZE_Y - 8, height)));
  }

  // Check if chunk at (chunkX, chunkZ) should contain a generated village
  public isVillageChunk(chunkX: number, chunkZ: number): boolean {
    // Guaranteed village near spawn at (1, 1) and recurring every 5 chunks
    if (chunkX === 1 && chunkZ === 1) return true;
    if (chunkX === -3 && chunkZ === 2) return true;
    const hash = Math.sin(chunkX * 37.13 + chunkZ * 59.41 + this.seed) * 10000;
    const rand = hash - Math.floor(hash);
    return Math.abs(chunkX) % 5 === 2 && Math.abs(chunkZ) % 5 === 2 && rand > 0.35;
  }

  // Generate voxel block data for a single chunk at (chunkX, chunkZ)
  public generateChunkData(chunkX: number, chunkZ: number): Uint8Array {
    const data = new Uint8Array(CHUNK_SIZE_X * CHUNK_SIZE_Y * CHUNK_SIZE_Z);
    const worldStartX = chunkX * CHUNK_SIZE_X;
    const worldStartZ = chunkZ * CHUNK_SIZE_Z;

    const setBlock = (x: number, y: number, z: number, type: BlockType) => {
      if (x < 0 || x >= CHUNK_SIZE_X || y < 0 || y >= CHUNK_SIZE_Y || z < 0 || z >= CHUNK_SIZE_Z) return;
      data[x + y * CHUNK_SIZE_X + z * CHUNK_SIZE_X * CHUNK_SIZE_Y] = type;
    };

    const getBlock = (x: number, y: number, z: number): BlockType => {
      if (x < 0 || x >= CHUNK_SIZE_X || y < 0 || y >= CHUNK_SIZE_Y || z < 0 || z >= CHUNK_SIZE_Z) return BlockType.AIR;
      return data[x + y * CHUNK_SIZE_X + z * CHUNK_SIZE_X * CHUNK_SIZE_Y];
    };

    // 1. Terrain column generation
    for (let x = 0; x < CHUNK_SIZE_X; x++) {
      for (let z = 0; z < CHUNK_SIZE_Z; z++) {
        const wx = worldStartX + x;
        const wz = worldStartZ + z;
        const surfaceY = this.getHeight(wx, wz);

        // Bedrock at base
        setBlock(x, 0, z, BlockType.BEDROCK);

        for (let y = 1; y < CHUNK_SIZE_Y; y++) {
          if (y < surfaceY - 3) {
            // Underground Stone & Ores & Caves
            const caveVal = this.caveNoise3D(wx * 0.04, y * 0.06, wz * 0.04);
            const isCave = caveVal > 0.42 && y > 3 && y < surfaceY - 2;

            if (isCave) {
              setBlock(x, y, z, BlockType.AIR);
            } else {
              // Ores distribution by depth
              const oreRand = Math.sin(wx * 17.13 + y * 31.41 + wz * 43.19 + this.seed);
              if (y <= 4 && oreRand > 0.88) {
                setBlock(x, y, z, BlockType.OBSIDIAN);
              } else if (y < 10 && oreRand > 0.95) {
                setBlock(x, y, z, BlockType.DIAMOND_ORE);
              } else if ((y < 14 || surfaceY > 32) && oreRand > 0.93) {
                setBlock(x, y, z, BlockType.EMERALD_ORE);
              } else if (y < 18 && oreRand > 0.90) {
                setBlock(x, y, z, BlockType.GOLD_ORE);
              } else if (y < 30 && oreRand > 0.83) {
                setBlock(x, y, z, BlockType.IRON_ORE);
              } else if (y < 36 && oreRand > 0.77) {
                setBlock(x, y, z, BlockType.COPPER_ORE);
              } else if (oreRand > 0.72) {
                setBlock(x, y, z, BlockType.COAL_ORE);
              } else if (oreRand > 0.68 && y > 15) {
                setBlock(x, y, z, BlockType.GRAVEL);
              } else {
                setBlock(x, y, z, BlockType.STONE);
              }
            }
          } else if (y < surfaceY) {
            // Subsurface Dirt or Sand/Clay if near water
            if (surfaceY <= SEA_LEVEL + 1) {
              setBlock(x, y, z, Math.sin(wx * 5 + wz * 7) > 0.3 ? BlockType.CLAY : BlockType.SAND);
            } else {
              setBlock(x, y, z, BlockType.DIRT);
            }
          } else if (y === surfaceY) {
            // Top layer
            if (surfaceY <= SEA_LEVEL + 1) {
              setBlock(x, y, z, BlockType.SAND);
            } else {
              setBlock(x, y, z, BlockType.GRASS);
            }
          } else if (y <= SEA_LEVEL) {
            // Water bodies
            setBlock(x, y, z, BlockType.WATER);
          } else {
            setBlock(x, y, z, BlockType.AIR);
          }
        }
      }
    }

    // 2. Decorate with Trees (Oak and Birch) & Wildflowers
    for (let x = 2; x < CHUNK_SIZE_X - 2; x++) {
      for (let z = 2; z < CHUNK_SIZE_Z - 2; z++) {
        const wx = worldStartX + x;
        const wz = worldStartZ + z;
        const surfaceY = this.getHeight(wx, wz);

        // Check if top block is Grass and above sea level
        if (surfaceY > SEA_LEVEL + 1 && getBlock(x, surfaceY, z) === BlockType.GRASS) {
          const plantHash = Math.sin(wx * 73.123 + wz * 91.567 + this.seed) * 10000;
          const plantRand = plantHash - Math.floor(plantHash);

          // Wildflowers (poppy & dandelion)
          if (plantRand > 0.94 && getBlock(x, surfaceY + 1, z) === BlockType.AIR) {
            setBlock(x, surfaceY + 1, z, plantRand > 0.97 ? BlockType.RED_FLOWER : BlockType.YELLOW_FLOWER);
          }
          // Trees (~2.5% chance per block)
          else if (plantRand < 0.025) {
            const isBirch = plantRand < 0.01; // ~40% of trees are birch
            const woodType = isBirch ? BlockType.BIRCH_WOOD : BlockType.WOOD;
            const leafType = isBirch ? BlockType.BIRCH_LEAVES : BlockType.LEAVES;

            const trunkHeight = 4 + Math.floor(plantRand * 40) % 3; // 4 to 6

            // Wood Trunk
            for (let ty = 1; ty <= trunkHeight; ty++) {
              setBlock(x, surfaceY + ty, z, woodType);
            }

            // Leaves Canopy
            const topY = surfaceY + trunkHeight;
            for (let ly = -2; ly <= 1; ly++) {
              const radius = ly >= 0 ? 1 : 2;
              for (let lx = -radius; lx <= radius; lx++) {
                for (let lz = -radius; lz <= radius; lz++) {
                  if (lx === 0 && lz === 0 && ly <= 0) continue;
                  if (Math.abs(lx) === radius && Math.abs(lz) === radius && Math.random() > 0.6) continue;

                  const targetY = topY + ly;
                  if (getBlock(x + lx, targetY, z + lz) === BlockType.AIR) {
                    setBlock(x + lx, targetY, z + lz, leafType);
                  }
                }
              }
            }
          }
        }
      }
    }

    // 3. Village Generation
    if (this.isVillageChunk(chunkX, chunkZ)) {
      // Find average surface height for the village square
      const centerY = this.getHeight(worldStartX + 8, worldStartZ + 8);
      const baseY = Math.max(18, Math.min(28, centerY));

      // Level out ground in chunk to baseY
      for (let x = 0; x < CHUNK_SIZE_X; x++) {
        for (let z = 0; z < CHUNK_SIZE_Z; z++) {
          const curY = this.getHeight(worldStartX + x, worldStartZ + z);
          // Fill below baseY with dirt/stone
          for (let y = Math.min(curY, baseY); y < baseY; y++) {
            setBlock(x, y, z, BlockType.DIRT);
          }
          // Clear above baseY up to old curY + 6
          for (let y = baseY + 1; y <= Math.max(curY + 6, baseY + 6); y++) {
            setBlock(x, y, z, BlockType.AIR);
          }
          // Surface
          setBlock(x, baseY, z, BlockType.GRASS);
        }
      }

      // A. Gravel Walkways (Crossroad through center)
      for (let i = 1; i < CHUNK_SIZE_X - 1; i++) {
        setBlock(i, baseY, 7, BlockType.GRAVEL);
        setBlock(i, baseY, 8, BlockType.GRAVEL);
        setBlock(7, baseY, i, BlockType.GRAVEL);
        setBlock(8, baseY, i, BlockType.GRAVEL);
      }

      // B. Central Water Well (x: 6 to 9, z: 6 to 9)
      for (let x = 6; x <= 9; x++) {
        for (let z = 6; z <= 9; z++) {
          // Cobblestone rim
          setBlock(x, baseY + 1, z, BlockType.COBBLESTONE);
          // Overhanging roof
          setBlock(x, baseY + 4, z, BlockType.PLANKS);
        }
      }
      // Well water pool in center
      setBlock(7, baseY, 7, BlockType.WATER);
      setBlock(8, baseY, 7, BlockType.WATER);
      setBlock(7, baseY, 8, BlockType.WATER);
      setBlock(8, baseY, 8, BlockType.WATER);
      setBlock(7, baseY + 1, 7, BlockType.AIR);
      setBlock(8, baseY + 1, 7, BlockType.AIR);
      setBlock(7, baseY + 1, 8, BlockType.AIR);
      setBlock(8, baseY + 1, 8, BlockType.AIR);
      // Well corner wood posts
      for (let y = baseY + 1; y <= baseY + 3; y++) {
        setBlock(6, y, 6, BlockType.WOOD);
        setBlock(9, y, 6, BlockType.WOOD);
        setBlock(6, y, 9, BlockType.WOOD);
        setBlock(9, y, 9, BlockType.WOOD);
      }
      setBlock(6, baseY + 3, 7, BlockType.TORCH);
      setBlock(9, baseY + 3, 8, BlockType.TORCH);

      // C. Village House 1 (North-West Cottage at x: 1..5, z: 1..5)
      // Foundation & Floor
      for (let x = 1; x <= 5; x++) {
        for (let z = 1; z <= 5; z++) {
          setBlock(x, baseY, z, BlockType.COBBLESTONE);
          // Roof
          setBlock(x, baseY + 4, z, BlockType.PLANKS);
        }
      }
      // Wood corner pillars
      for (let y = baseY + 1; y <= baseY + 3; y++) {
        setBlock(1, y, 1, BlockType.WOOD);
        setBlock(5, y, 1, BlockType.WOOD);
        setBlock(1, y, 5, BlockType.WOOD);
        setBlock(5, y, 5, BlockType.WOOD);
      }
      // Walls
      for (let y = baseY + 1; y <= baseY + 3; y++) {
        for (let x = 2; x <= 4; x++) {
          setBlock(x, y, 1, BlockType.PLANKS);
          setBlock(x, y, 5, BlockType.PLANKS);
        }
        for (let z = 2; z <= 4; z++) {
          setBlock(1, y, z, BlockType.PLANKS);
          setBlock(5, y, z, BlockType.PLANKS);
        }
      }
      // Hollow inside
      for (let x = 2; x <= 4; x++) {
        for (let z = 2; z <= 4; z++) {
          setBlock(x, baseY + 1, z, BlockType.AIR);
          setBlock(x, baseY + 2, z, BlockType.AIR);
          setBlock(x, baseY + 3, z, BlockType.AIR);
        }
      }
      // Door opening facing street (south: z=5)
      setBlock(3, baseY + 1, 5, BlockType.AIR);
      setBlock(3, baseY + 2, 5, BlockType.AIR);
      // Windows
      setBlock(1, baseY + 2, 3, BlockType.GLASS);
      setBlock(5, baseY + 2, 3, BlockType.GLASS);
      // Furniture inside
      setBlock(2, baseY + 1, 2, BlockType.CRAFTING_TABLE);
      setBlock(4, baseY + 1, 2, BlockType.BOOKSHELF);
      setBlock(3, baseY + 3, 2, BlockType.TORCH);

      // D. Village House 2 (South-East Smithy / Workshop at x: 10..14, z: 10..14)
      for (let x = 10; x <= 14; x++) {
        for (let z = 10; z <= 14; z++) {
          setBlock(x, baseY, z, BlockType.COBBLESTONE);
          setBlock(x, baseY + 4, z, BlockType.COBBLESTONE); // stone roof
        }
      }
      // Corner posts
      for (let y = baseY + 1; y <= baseY + 3; y++) {
        setBlock(10, y, 10, BlockType.WOOD);
        setBlock(14, y, 10, BlockType.WOOD);
        setBlock(10, y, 14, BlockType.WOOD);
        setBlock(14, y, 14, BlockType.WOOD);
      }
      // Cobblestone/plank walls
      for (let y = baseY + 1; y <= baseY + 3; y++) {
        for (let x = 11; x <= 13; x++) {
          setBlock(x, y, 10, BlockType.PLANKS);
          setBlock(x, y, 14, BlockType.COBBLESTONE);
        }
        for (let z = 11; z <= 13; z++) {
          setBlock(10, y, z, BlockType.COBBLESTONE);
          setBlock(14, y, z, BlockType.PLANKS);
        }
      }
      // Hollow inside
      for (let x = 11; x <= 13; x++) {
        for (let z = 11; z <= 13; z++) {
          setBlock(x, baseY + 1, z, BlockType.AIR);
          setBlock(x, baseY + 2, z, BlockType.AIR);
          setBlock(x, baseY + 3, z, BlockType.AIR);
        }
      }
      // Door opening facing street (north: z=10)
      setBlock(12, baseY + 1, 10, BlockType.AIR);
      setBlock(12, baseY + 2, 10, BlockType.AIR);
      // Furniture: Furnace, crafting table, chest/bookshelf
      setBlock(11, baseY + 1, 13, BlockType.FURNACE);
      setBlock(13, baseY + 1, 13, BlockType.CRAFTING_TABLE);
      setBlock(13, baseY + 1, 11, BlockType.BOOKSHELF);
      setBlock(11, baseY + 3, 12, BlockType.TORCH);

      // E. Village Farm Plot (North-East at x: 10..14, z: 1..5)
      for (let x = 10; x <= 14; x++) {
        for (let z = 1; z <= 5; z++) {
          if (x === 10 || x === 14 || z === 1 || z === 5) {
            setBlock(x, baseY + 1, z, BlockType.WOOD); // log border
          } else if (z === 3) {
            setBlock(x, baseY, z, BlockType.WATER); // central water trench
            setBlock(x, baseY + 1, z, BlockType.AIR);
          } else {
            // Farm crops
            setBlock(x, baseY, z, BlockType.DIRT);
            setBlock(x, baseY + 1, z, BlockType.LEAVES); // crops
          }
        }
      }

      // F. Street Lamp Posts with Torches
      setBlock(6, baseY + 1, 4, BlockType.WOOD);
      setBlock(6, baseY + 2, 4, BlockType.WOOD);
      setBlock(6, baseY + 3, 4, BlockType.TORCH);

      setBlock(9, baseY + 1, 11, BlockType.WOOD);
      setBlock(9, baseY + 2, 11, BlockType.WOOD);
      setBlock(9, baseY + 3, 11, BlockType.TORCH);
    }

    return data;
  }
}
