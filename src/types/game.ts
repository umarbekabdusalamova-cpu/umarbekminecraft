export enum BlockType {
  AIR = 0,
  GRASS = 1,
  DIRT = 2,
  STONE = 3,
  SAND = 4,
  WOOD = 5,
  LEAVES = 6,
  WATER = 7,
  COAL_ORE = 8,
  IRON_ORE = 9,
  GOLD_ORE = 10,
  DIAMOND_ORE = 11,
  PLANKS = 12,
  COBBLESTONE = 13,
  TORCH = 14,
  GLASS = 15,
  BRICK = 16,
  CRAFTING_TABLE = 17,
  FURNACE = 18,
  BEDROCK = 19,
  BOOKSHELF = 20,
  COPPER_ORE = 21,
  EMERALD_ORE = 22,
  OBSIDIAN = 23,
  GRAVEL = 24,
  CLAY = 25,
  BIRCH_WOOD = 26,
  BIRCH_LEAVES = 27,
  RED_FLOWER = 28,
  YELLOW_FLOWER = 29,
}

export type ItemType =
  | 'block'
  | 'pickaxe'
  | 'axe'
  | 'shovel'
  | 'sword'
  | 'armor'
  | 'material'
  | 'food'
  | 'structure';

export type MaterialTier = 'wood' | 'stone' | 'copper' | 'iron' | 'diamond';

export interface ItemDef {
  id: string;
  name: string;
  nameUz?: string;
  type: ItemType;
  blockType?: BlockType;
  tier?: MaterialTier;
  maxStack: number;
  damage?: number;
  miningSpeed?: number;
  foodRestore?: number;
  armorPoints?: number;
  armorSlot?: 'helmet' | 'chestplate' | 'leggings' | 'boots';
  textureCoords?: { x: number; y: number };
  color?: string;
  icon?: string;
  description?: string;
  descriptionUz?: string;
}

export interface DroppedItemEntity {
  id: string;
  itemId: string;
  count: number;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  mesh: any;
}

export interface SmeltingRecipe {
  input: string;
  output: string;
  cookTime: number; // in seconds
  xp: number;
}

export interface ItemStack {
  itemId: string;
  count: number;
}

export interface InventorySlot {
  slotId: number;
  item: ItemStack | null;
}

export interface Recipe {
  id: string;
  name: string;
  is3x3?: boolean;
  pattern?: (string | null)[][]; // 2x2 or 3x3 pattern
  shapelessInputs?: { [itemId: string]: number };
  result: ItemStack;
}

export interface VoxelRaycastHit {
  hit: boolean;
  voxel: [number, number, number];
  normal: [number, number, number];
  adjacent: [number, number, number];
  distance: number;
  blockType: BlockType;
}

export interface MobEntity {
  id: string;
  type: 'crawler' | 'spider' | 'specter' | 'pig' | 'villager' | 'iron_golem';
  name: string;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  yaw: number;
  health: number;
  maxHealth: number;
  isHostile: boolean;
  damage: number;
  speed: number;
  attackCooldown: number;
  hurtCooldown: number;
  walkAnimationTime: number;
  mesh?: any;
}

export interface WorldSaveMeta {
  id: string;
  name: string;
  seed: number;
  createdAt: number;
  lastPlayed: number;
  gameTime: number; // in seconds
  player: {
    x: number;
    y: number;
    z: number;
    pitch: number;
    yaw: number;
    health: number;
    hunger: number;
    inventory: (ItemStack | null)[];
    hotbar: (ItemStack | null)[];
    selectedHotbarIndex: number;
  };
  gameMode: 'survival' | 'creative';
}

export interface WorldDelta {
  [coordKey: string]: BlockType;
}
