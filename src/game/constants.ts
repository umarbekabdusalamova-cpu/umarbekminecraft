import { BlockType, ItemDef, Recipe } from '../types/game';

export const CHUNK_SIZE_X = 16;
export const CHUNK_SIZE_Z = 16;
export const CHUNK_SIZE_Y = 48;
export const SEA_LEVEL = 14;

export const BLOCK_PROPERTIES: Record<
  BlockType,
  {
    name: string;
    transparent: boolean;
    hardness: number; // in seconds with fist
    preferredTool?: 'pickaxe' | 'axe' | 'shovel' | 'none';
    minTier?: 'wood' | 'stone' | 'iron' | 'diamond';
    dropItem?: string;
    dropCount?: number;
    lightLevel?: number;
  }
> = {
  [BlockType.AIR]: { name: 'Air', transparent: true, hardness: 0 },
  [BlockType.GRASS]: {
    name: 'Grass Block',
    transparent: false,
    hardness: 0.6,
    preferredTool: 'shovel',
    dropItem: 'dirt',
  },
  [BlockType.DIRT]: {
    name: 'Dirt',
    transparent: false,
    hardness: 0.5,
    preferredTool: 'shovel',
    dropItem: 'dirt',
  },
  [BlockType.STONE]: {
    name: 'Stone',
    transparent: false,
    hardness: 1.5,
    preferredTool: 'pickaxe',
    dropItem: 'cobblestone',
  },
  [BlockType.SAND]: {
    name: 'Sand',
    transparent: false,
    hardness: 0.5,
    preferredTool: 'shovel',
    dropItem: 'sand',
  },
  [BlockType.WOOD]: {
    name: 'Wood Log',
    transparent: false,
    hardness: 2.0,
    preferredTool: 'axe',
    dropItem: 'wood',
  },
  [BlockType.LEAVES]: {
    name: 'Leaves',
    transparent: true,
    hardness: 0.2,
    dropItem: 'apple', // small chance or sapling
  },
  [BlockType.WATER]: {
    name: 'Water',
    transparent: true,
    hardness: 999,
  },
  [BlockType.COAL_ORE]: {
    name: 'Coal Ore',
    transparent: false,
    hardness: 3.0,
    preferredTool: 'pickaxe',
    dropItem: 'coal',
  },
  [BlockType.IRON_ORE]: {
    name: 'Iron Ore',
    transparent: false,
    hardness: 3.5,
    preferredTool: 'pickaxe',
    minTier: 'stone',
    dropItem: 'iron_ore',
  },
  [BlockType.GOLD_ORE]: {
    name: 'Gold Ore',
    transparent: false,
    hardness: 4.0,
    preferredTool: 'pickaxe',
    minTier: 'iron',
    dropItem: 'gold_ore',
  },
  [BlockType.DIAMOND_ORE]: {
    name: 'Diamond Ore',
    transparent: false,
    hardness: 5.0,
    preferredTool: 'pickaxe',
    minTier: 'iron',
    dropItem: 'diamond',
  },
  [BlockType.PLANKS]: {
    name: 'Wooden Planks',
    transparent: false,
    hardness: 1.8,
    preferredTool: 'axe',
    dropItem: 'planks',
  },
  [BlockType.COBBLESTONE]: {
    name: 'Cobblestone',
    transparent: false,
    hardness: 2.0,
    preferredTool: 'pickaxe',
    dropItem: 'cobblestone',
  },
  [BlockType.TORCH]: {
    name: 'Torch',
    transparent: true,
    hardness: 0.05,
    dropItem: 'torch',
    lightLevel: 14,
  },
  [BlockType.GLASS]: {
    name: 'Glass',
    transparent: true,
    hardness: 0.3,
  },
  [BlockType.BRICK]: {
    name: 'Brick Block',
    transparent: false,
    hardness: 2.0,
    preferredTool: 'pickaxe',
    dropItem: 'brick',
  },
  [BlockType.CRAFTING_TABLE]: {
    name: 'Crafting Table',
    transparent: false,
    hardness: 2.5,
    preferredTool: 'axe',
    dropItem: 'crafting_table',
  },
  [BlockType.FURNACE]: {
    name: 'Furnace',
    transparent: false,
    hardness: 3.5,
    preferredTool: 'pickaxe',
    dropItem: 'furnace',
  },
  [BlockType.BEDROCK]: {
    name: 'Bedrock',
    transparent: false,
    hardness: 999999,
  },
  [BlockType.BOOKSHELF]: {
    name: 'Bookshelf',
    transparent: false,
    hardness: 1.5,
    preferredTool: 'axe',
    dropItem: 'bookshelf',
  },
  [BlockType.COPPER_ORE]: {
    name: 'Copper Ore',
    transparent: false,
    hardness: 3.0,
    preferredTool: 'pickaxe',
    minTier: 'stone',
    dropItem: 'raw_copper',
  },
  [BlockType.EMERALD_ORE]: {
    name: 'Emerald Ore',
    transparent: false,
    hardness: 4.5,
    preferredTool: 'pickaxe',
    minTier: 'iron',
    dropItem: 'emerald',
  },
  [BlockType.OBSIDIAN]: {
    name: 'Obsidian',
    transparent: false,
    hardness: 9.0,
    preferredTool: 'pickaxe',
    minTier: 'diamond',
    dropItem: 'obsidian',
  },
  [BlockType.GRAVEL]: {
    name: 'Gravel',
    transparent: false,
    hardness: 0.6,
    preferredTool: 'shovel',
    dropItem: 'flint',
  },
  [BlockType.CLAY]: {
    name: 'Clay Block',
    transparent: false,
    hardness: 0.6,
    preferredTool: 'shovel',
    dropItem: 'clay_ball',
    dropCount: 4,
  },
  [BlockType.BIRCH_WOOD]: {
    name: 'Birch Log',
    transparent: false,
    hardness: 2.0,
    preferredTool: 'axe',
    dropItem: 'birch_wood',
  },
  [BlockType.BIRCH_LEAVES]: {
    name: 'Birch Leaves',
    transparent: true,
    hardness: 0.2,
    dropItem: 'apple',
  },
  [BlockType.RED_FLOWER]: {
    name: 'Poppy Flower',
    transparent: true,
    hardness: 0.05,
    dropItem: 'red_flower',
  },
  [BlockType.YELLOW_FLOWER]: {
    name: 'Dandelion Flower',
    transparent: true,
    hardness: 0.05,
    dropItem: 'yellow_flower',
  },
};

export const ITEMS: Record<string, ItemDef> = {
  // Blocks as Items
  grass: { id: 'grass', name: 'Grass Block', nameUz: 'Maysa Bloki', type: 'block', blockType: BlockType.GRASS, maxStack: 64, color: '#4a8f3c' },
  dirt: { id: 'dirt', name: 'Dirt', nameUz: 'Tuproq', type: 'block', blockType: BlockType.DIRT, maxStack: 64, color: '#7a5230' },
  stone: { id: 'stone', name: 'Stone', nameUz: 'Tosh', type: 'block', blockType: BlockType.STONE, maxStack: 64, color: '#888888' },
  cobblestone: { id: 'cobblestone', name: 'Cobblestone', nameUz: 'Tosh parchalari', type: 'block', blockType: BlockType.COBBLESTONE, maxStack: 64, color: '#666666' },
  sand: { id: 'sand', name: 'Sand', nameUz: 'Qum', type: 'block', blockType: BlockType.SAND, maxStack: 64, color: '#dbcc86' },
  wood: { id: 'wood', name: 'Oak Log', nameUz: 'Eman Yog\'ochi', type: 'block', blockType: BlockType.WOOD, maxStack: 64, color: '#5c3a21' },
  birch_wood: { id: 'birch_wood', name: 'Birch Log', nameUz: 'Qayin Yog\'ochi', type: 'block', blockType: BlockType.BIRCH_WOOD, maxStack: 64, color: '#e5e5e5' },
  planks: { id: 'planks', name: 'Wooden Planks', nameUz: 'Yog\'och Taxta', type: 'block', blockType: BlockType.PLANKS, maxStack: 64, color: '#a67b48' },
  leaves: { id: 'leaves', name: 'Leaves', nameUz: 'Yaproqlar', type: 'block', blockType: BlockType.LEAVES, maxStack: 64, color: '#2e6b27' },
  birch_leaves: { id: 'birch_leaves', name: 'Birch Leaves', nameUz: 'Qayin Yaprog\'i', type: 'block', blockType: BlockType.BIRCH_LEAVES, maxStack: 64, color: '#6a994e' },
  glass: { id: 'glass', name: 'Glass', nameUz: 'Oyna', type: 'block', blockType: BlockType.GLASS, maxStack: 64, color: '#bde0fe' },
  brick: { id: 'brick', name: 'Bricks', nameUz: 'G\'isht', type: 'block', blockType: BlockType.BRICK, maxStack: 64, color: '#9d4332' },
  torch: { id: 'torch', name: 'Torch', nameUz: 'Mash\'al', type: 'block', blockType: BlockType.TORCH, maxStack: 64, color: '#ffd166', description: 'Emits warm dynamic light.' },
  crafting_table: { id: 'crafting_table', name: 'Crafting Table', nameUz: 'Dastgoh', type: 'block', blockType: BlockType.CRAFTING_TABLE, maxStack: 64, color: '#c49a45' },
  furnace: { id: 'furnace', name: 'Furnace', nameUz: 'Pech', type: 'block', blockType: BlockType.FURNACE, maxStack: 64, color: '#555555' },
  bookshelf: { id: 'bookshelf', name: 'Bookshelf', nameUz: 'Kitob javoni', type: 'block', blockType: BlockType.BOOKSHELF, maxStack: 64, color: '#7f5539' },
  obsidian: { id: 'obsidian', name: 'Obsidian', nameUz: 'Obsidian', type: 'block', blockType: BlockType.OBSIDIAN, maxStack: 64, color: '#1f1338', description: 'Ultra-tough volcanic glass.' },
  gravel: { id: 'gravel', name: 'Gravel', nameUz: 'Shag\'al', type: 'block', blockType: BlockType.GRAVEL, maxStack: 64, color: '#7f7f7f' },
  clay_block: { id: 'clay_block', name: 'Clay Block', nameUz: 'Gil bloki', type: 'block', blockType: BlockType.CLAY, maxStack: 64, color: '#9ca3af' },
  red_flower: { id: 'red_flower', name: 'Poppy', nameUz: 'Qizil Lola', type: 'block', blockType: BlockType.RED_FLOWER, maxStack: 64, color: '#ef4444' },
  yellow_flower: { id: 'yellow_flower', name: 'Dandelion', nameUz: 'Sariq Boychechak', type: 'block', blockType: BlockType.YELLOW_FLOWER, maxStack: 64, color: '#eab308' },

  // Ores & Raw Materials
  coal: { id: 'coal', name: 'Coal', nameUz: 'Ko\'mir', type: 'material', maxStack: 64, color: '#222222', description: 'Smelting fuel and torch ingredient.' },
  raw_copper: { id: 'raw_copper', name: 'Raw Copper', nameUz: 'Xom Mis', type: 'material', maxStack: 64, color: '#b85d38', description: 'Smelt into Copper Ingots.' },
  copper_ingot: { id: 'copper_ingot', name: 'Copper Ingot', nameUz: 'Mis Quyma', type: 'material', maxStack: 64, color: '#e07a5f', description: 'Used to craft tools & construction.' },
  iron_ore: { id: 'iron_ore', name: 'Raw Iron Ore', nameUz: 'Temir Rudasi', type: 'block', blockType: BlockType.IRON_ORE, maxStack: 64, color: '#d4a373' },
  iron_ingot: { id: 'iron_ingot', name: 'Iron Ingot', nameUz: 'Temir Quyma', type: 'material', maxStack: 64, color: '#e0e0e0', description: 'High strength metal for durable gear.' },
  gold_ore: { id: 'gold_ore', name: 'Gold Ore', nameUz: 'Oltin Rudasi', type: 'block', blockType: BlockType.GOLD_ORE, maxStack: 64, color: '#ffd700' },
  gold_ingot: { id: 'gold_ingot', name: 'Gold Ingot', nameUz: 'Oltin Quyma', type: 'material', maxStack: 64, color: '#ffb703', description: 'Precious lustrous gold.' },
  diamond: { id: 'diamond', name: 'Diamond', nameUz: 'Olmos', type: 'material', maxStack: 64, color: '#4cc9f0', description: 'The strongest and rarest gem.' },
  emerald: { id: 'emerald', name: 'Emerald', nameUz: 'Zumrad', type: 'material', maxStack: 64, color: '#2ec4b6', description: 'Precious green gemstone.' },
  flint: { id: 'flint', name: 'Flint', nameUz: 'Chaqmoqtosh', type: 'material', maxStack: 64, color: '#4a4e69', description: 'Found in gravel.' },
  clay_ball: { id: 'clay_ball', name: 'Clay Ball', nameUz: 'Gil bo\'lagi', type: 'material', maxStack: 64, color: '#a0aab2', description: 'Can be fired into bricks.' },
  stick: { id: 'stick', name: 'Stick', nameUz: 'Tayoq', type: 'material', maxStack: 64, color: '#8d6e63', description: 'Tool handle core.' },

  // Tools & Weapons - Wood
  wooden_pickaxe: { id: 'wooden_pickaxe', name: 'Wooden Pickaxe', nameUz: 'Yog\'och Cho\'kich', type: 'pickaxe', tier: 'wood', maxStack: 1, miningSpeed: 2.0, damage: 2, color: '#b08968' },
  wooden_axe: { id: 'wooden_axe', name: 'Wooden Axe', nameUz: 'Yog\'och Bolta', type: 'axe', tier: 'wood', maxStack: 1, miningSpeed: 2.0, damage: 3, color: '#b08968' },
  wooden_shovel: { id: 'wooden_shovel', name: 'Wooden Shovel', nameUz: 'Yog\'och Kurak', type: 'shovel', tier: 'wood', maxStack: 1, miningSpeed: 2.0, damage: 1, color: '#b08968' },
  wooden_sword: { id: 'wooden_sword', name: 'Wooden Sword', nameUz: 'Yog\'och Qilich', type: 'sword', tier: 'wood', maxStack: 1, damage: 4, color: '#b08968' },

  // Tools & Weapons - Stone
  stone_pickaxe: { id: 'stone_pickaxe', name: 'Stone Pickaxe', nameUz: 'Tosh Cho\'kich', type: 'pickaxe', tier: 'stone', maxStack: 1, miningSpeed: 4.0, damage: 3, color: '#9e9e9e' },
  stone_axe: { id: 'stone_axe', name: 'Stone Axe', nameUz: 'Tosh Bolta', type: 'axe', tier: 'stone', maxStack: 1, miningSpeed: 4.0, damage: 5, color: '#9e9e9e' },
  stone_shovel: { id: 'stone_shovel', name: 'Stone Shovel', nameUz: 'Tosh Kurak', type: 'shovel', tier: 'stone', maxStack: 1, miningSpeed: 4.0, damage: 2, color: '#9e9e9e' },
  stone_sword: { id: 'stone_sword', name: 'Stone Sword', nameUz: 'Tosh Qilich', type: 'sword', tier: 'stone', maxStack: 1, damage: 6, color: '#9e9e9e' },

  // Tools & Weapons - Copper
  copper_pickaxe: { id: 'copper_pickaxe', name: 'Copper Pickaxe', nameUz: 'Mis Cho\'kich', type: 'pickaxe', tier: 'copper', maxStack: 1, miningSpeed: 5.0, damage: 3, color: '#e07a5f' },
  copper_axe: { id: 'copper_axe', name: 'Copper Axe', nameUz: 'Mis Bolta', type: 'axe', tier: 'copper', maxStack: 1, miningSpeed: 5.0, damage: 6, color: '#e07a5f' },
  copper_sword: { id: 'copper_sword', name: 'Copper Sword', nameUz: 'Mis Qilich', type: 'sword', tier: 'copper', maxStack: 1, damage: 7, color: '#e07a5f' },

  // Tools & Weapons - Iron
  iron_pickaxe: { id: 'iron_pickaxe', name: 'Iron Pickaxe', nameUz: 'Temir Cho\'kich', type: 'pickaxe', tier: 'iron', maxStack: 1, miningSpeed: 6.5, damage: 4, color: '#f5f5f5' },
  iron_axe: { id: 'iron_axe', name: 'Iron Axe', nameUz: 'Temir Bolta', type: 'axe', tier: 'iron', maxStack: 1, miningSpeed: 6.5, damage: 7, color: '#f5f5f5' },
  iron_shovel: { id: 'iron_shovel', name: 'Iron Shovel', nameUz: 'Temir Kurak', type: 'shovel', tier: 'iron', maxStack: 1, miningSpeed: 6.5, damage: 3, color: '#f5f5f5' },
  iron_sword: { id: 'iron_sword', name: 'Iron Sword', nameUz: 'Temir Qilich', type: 'sword', tier: 'iron', maxStack: 1, damage: 8, color: '#f5f5f5' },

  // Tools & Weapons - Diamond
  diamond_pickaxe: { id: 'diamond_pickaxe', name: 'Diamond Pickaxe', nameUz: 'Olmos Cho\'kich', type: 'pickaxe', tier: 'diamond', maxStack: 1, miningSpeed: 10.0, damage: 5, color: '#48cae4' },
  diamond_axe: { id: 'diamond_axe', name: 'Diamond Axe', nameUz: 'Olmos Bolta', type: 'axe', tier: 'diamond', maxStack: 1, miningSpeed: 10.0, damage: 9, color: '#48cae4' },
  diamond_shovel: { id: 'diamond_shovel', name: 'Diamond Shovel', nameUz: 'Olmos Kurak', type: 'shovel', tier: 'diamond', maxStack: 1, miningSpeed: 10.0, damage: 4, color: '#48cae4' },
  diamond_sword: { id: 'diamond_sword', name: 'Diamond Sword', nameUz: 'Olmos Qilich', type: 'sword', tier: 'diamond', maxStack: 1, damage: 10, color: '#48cae4' },

  // Armor - Iron & Diamond
  iron_helmet: { id: 'iron_helmet', name: 'Iron Helmet', nameUz: 'Temir Dubulg\'a', type: 'armor', armorSlot: 'helmet', armorPoints: 2, maxStack: 1, color: '#e0e0e0', description: '+2 Armor' },
  iron_chestplate: { id: 'iron_chestplate', name: 'Iron Chestplate', nameUz: 'Temir Sovut', type: 'armor', armorSlot: 'chestplate', armorPoints: 6, maxStack: 1, color: '#e0e0e0', description: '+6 Armor' },
  iron_leggings: { id: 'iron_leggings', name: 'Iron Leggings', nameUz: 'Temir Shim', type: 'armor', armorSlot: 'leggings', armorPoints: 5, maxStack: 1, color: '#e0e0e0', description: '+5 Armor' },
  iron_boots: { id: 'iron_boots', name: 'Iron Boots', nameUz: 'Temir Etik', type: 'armor', armorSlot: 'boots', armorPoints: 2, maxStack: 1, color: '#e0e0e0', description: '+2 Armor' },

  diamond_helmet: { id: 'diamond_helmet', name: 'Diamond Helmet', nameUz: 'Olmos Dubulg\'a', type: 'armor', armorSlot: 'helmet', armorPoints: 3, maxStack: 1, color: '#48cae4', description: '+3 Armor' },
  diamond_chestplate: { id: 'diamond_chestplate', name: 'Diamond Chestplate', nameUz: 'Olmos Sovut', type: 'armor', armorSlot: 'chestplate', armorPoints: 8, maxStack: 1, color: '#48cae4', description: '+8 Armor' },
  diamond_leggings: { id: 'diamond_leggings', name: 'Diamond Leggings', nameUz: 'Olmos Shim', type: 'armor', armorSlot: 'leggings', armorPoints: 6, maxStack: 1, color: '#48cae4', description: '+6 Armor' },
  diamond_boots: { id: 'diamond_boots', name: 'Diamond Boots', nameUz: 'Olmos Etik', type: 'armor', armorSlot: 'boots', armorPoints: 3, maxStack: 1, color: '#48cae4', description: '+3 Armor' },

  // Tools & Weapons - Gold
  gold_pickaxe: { id: 'gold_pickaxe', name: 'Golden Pickaxe', nameUz: 'Oltin Cho\'kich', type: 'pickaxe', tier: 'wood', maxStack: 1, miningSpeed: 12.0, damage: 3, color: '#ffd166', description: 'Extremely fast mining speed.' },
  gold_axe: { id: 'gold_axe', name: 'Golden Axe', nameUz: 'Oltin Bolta', type: 'axe', tier: 'wood', maxStack: 1, miningSpeed: 12.0, damage: 6, color: '#ffd166', description: 'Rapid wood chopping axe.' },
  gold_sword: { id: 'gold_sword', name: 'Golden Sword', nameUz: 'Oltin Qilich', type: 'sword', tier: 'wood', maxStack: 1, damage: 7, color: '#ffd166', description: 'Lustrous golden blade (7 DMG).' },
  emerald_sword: { id: 'emerald_sword', name: 'Emerald Blade', nameUz: 'Zumrad Qilich', type: 'sword', tier: 'diamond', maxStack: 1, damage: 11, color: '#2ec4b6', description: 'Legendary mystical blade (11 DMG).' },
  shears: { id: 'shears', name: 'Shears', nameUz: 'Temir Qaychi', type: 'axe', tier: 'iron', maxStack: 1, miningSpeed: 15.0, damage: 2, color: '#ced4da', description: 'Instantly harvests leaves, foliage and vines.' },

  // Deployable Structures (Crafted from voxel blocks)
  structure_shelter: {
    id: 'structure_shelter',
    name: 'Survival Cottage Kit',
    nameUz: 'Boshpana Kulbasi To\'plami',
    type: 'structure',
    maxStack: 16,
    color: '#8b5a2b',
    description: 'Instant 5x5 wooden and stone cottage with windows, workbench and torch.',
    descriptionUz: 'Tayyor 5x5 o\'lchamli yog\'och-tosh kulba (derazali, dastgoh va mash\'alli).',
  },
  structure_watchtower: {
    id: 'structure_watchtower',
    name: 'Stone Watchtower Kit',
    nameUz: 'Kuzatuv Minorasi To\'plami',
    type: 'structure',
    maxStack: 16,
    color: '#6c757d',
    description: 'Instant 9-block high fortified stone watchtower with battlements & torches.',
    descriptionUz: '9 blok balandlikdagi tosh minora (tungi mash\'allar va devorlari bilan).',
  },
  structure_bridge: {
    id: 'structure_bridge',
    name: 'Arch Bridge Kit',
    nameUz: 'Ko\'prik To\'plami',
    type: 'structure',
    maxStack: 16,
    color: '#b08968',
    description: 'Builds a 7-block wooden arch bridge over rivers or chasms.',
    descriptionUz: 'Daryo yoki jarliklar ustiga 7 blokli yog\'och-tosh ko\'prik quradi.',
  },
  structure_well: {
    id: 'structure_well',
    name: 'Stone Well Kit',
    nameUz: 'Tosh Quduq To\'plami',
    type: 'structure',
    maxStack: 16,
    color: '#495057',
    description: 'Stone water well with wooden canopy and infinite water pool.',
    descriptionUz: 'Soyabonli va toza suv havzali tosh quduq barpo etadi.',
  },
  structure_campfire: {
    id: 'structure_campfire',
    name: 'Campfire Kit',
    nameUz: 'Gulxan To\'plami',
    type: 'structure',
    maxStack: 16,
    color: '#f77f00',
    description: 'Warm campfire radiating light to fend off dark night mobs.',
    descriptionUz: 'Tungi yirtqichlarni haydovchi yorqin gulxan to\'plami.',
  },

  // Food
  apple: { id: 'apple', name: 'Apple', nameUz: 'Olma', type: 'food', maxStack: 64, foodRestore: 4, color: '#e63946', description: 'Fresh sweet fruit. Restores 2 hearts.' },
  cooked_meat: { id: 'cooked_meat', name: 'Roast Steak', nameUz: 'Qovurilgan Go\'sht', type: 'food', maxStack: 64, foodRestore: 8, color: '#8a3324', description: 'Hearty cooked meat. Restores 4 hearts.' },
  raw_meat: { id: 'raw_meat', name: 'Raw Meat', nameUz: 'Xom Go\'sht', type: 'food', maxStack: 64, foodRestore: 3, color: '#c1121f', description: 'Cook in furnace to make roast steak.' },
  bread: { id: 'bread', name: 'Bread', nameUz: 'Non', type: 'food', maxStack: 64, foodRestore: 5, color: '#e09f3e', description: 'Freshly baked bread.' },
};

export const SMELTING_RECIPES = [
  { input: 'iron_ore', output: 'iron_ingot', cookTime: 5, xp: 2 },
  { input: 'raw_copper', output: 'copper_ingot', cookTime: 4, xp: 1 },
  { input: 'gold_ore', output: 'gold_ingot', cookTime: 6, xp: 3 },
  { input: 'raw_meat', output: 'cooked_meat', cookTime: 4, xp: 1 },
  { input: 'sand', output: 'glass', cookTime: 4, xp: 1 },
  { input: 'clay_ball', output: 'brick', cookTime: 3, xp: 1 },
  { input: 'cobblestone', output: 'stone', cookTime: 4, xp: 1 },
];
