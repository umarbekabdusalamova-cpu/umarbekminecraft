import { Recipe, ItemStack } from '../types/game';

export interface CraftingRecipe {
  id: string;
  name: string;
  nameUz?: string;
  category: 'tools' | 'structures' | 'blocks' | 'weapons' | 'materials';
  requiresCraftingTable: boolean;
  inputs: { itemId: string; count: number }[];
  result: ItemStack;
  description: string;
  descriptionUz?: string;
  pattern?: string[];
  gridKeys?: Record<string, string>;
}

export const CRAFTING_RECIPES: CraftingRecipe[] = [
  // Planks from Wood
  {
    id: 'planks',
    name: 'Wooden Planks',
    category: 'blocks',
    requiresCraftingTable: false,
    inputs: [{ itemId: 'wood', count: 1 }],
    result: { itemId: 'planks', count: 4 },
    description: '4 Planks from 1 Wood Log',
  },
  // Sticks from Planks
  {
    id: 'stick',
    name: 'Sticks (x4)',
    category: 'materials',
    requiresCraftingTable: false,
    inputs: [{ itemId: 'planks', count: 2 }],
    result: { itemId: 'stick', count: 4 },
    description: 'Craft 4 sticks from 2 planks',
  },
  // Crafting Table
  {
    id: 'crafting_table',
    name: 'Crafting Table',
    category: 'blocks',
    requiresCraftingTable: false,
    inputs: [{ itemId: 'planks', count: 4 }],
    result: { itemId: 'crafting_table', count: 1 },
    description: 'Unlocks 3x3 advanced crafting grid',
  },
  // Torches
  {
    id: 'torch',
    name: 'Torches (x4)',
    category: 'blocks',
    requiresCraftingTable: false,
    inputs: [
      { itemId: 'coal', count: 1 },
      { itemId: 'stick', count: 1 },
    ],
    result: { itemId: 'torch', count: 4 },
    description: 'Provides light to keep monsters away',
  },
  // Furnace
  {
    id: 'furnace',
    name: 'Furnace',
    category: 'blocks',
    requiresCraftingTable: true,
    inputs: [{ itemId: 'cobblestone', count: 8 }],
    result: { itemId: 'furnace', count: 1 },
    description: 'Smelt ores and cook food',
  },

  // WOODEN TOOLS
  {
    id: 'wooden_pickaxe',
    name: 'Wooden Pickaxe',
    category: 'tools',
    requiresCraftingTable: true,
    inputs: [
      { itemId: 'planks', count: 3 },
      { itemId: 'stick', count: 2 },
    ],
    result: { itemId: 'wooden_pickaxe', count: 1 },
    description: 'Mines stone and coal',
  },
  {
    id: 'wooden_axe',
    name: 'Wooden Axe',
    category: 'tools',
    requiresCraftingTable: true,
    inputs: [
      { itemId: 'planks', count: 3 },
      { itemId: 'stick', count: 2 },
    ],
    result: { itemId: 'wooden_axe', count: 1 },
    description: 'Chops trees and wooden blocks fast',
  },
  {
    id: 'wooden_shovel',
    name: 'Wooden Shovel',
    category: 'tools',
    requiresCraftingTable: false,
    inputs: [
      { itemId: 'planks', count: 1 },
      { itemId: 'stick', count: 2 },
    ],
    result: { itemId: 'wooden_shovel', count: 1 },
    description: 'Digs dirt, sand, and gravel fast',
  },
  {
    id: 'wooden_sword',
    name: 'Wooden Sword',
    category: 'weapons',
    requiresCraftingTable: false,
    inputs: [
      { itemId: 'planks', count: 2 },
      { itemId: 'stick', count: 1 },
    ],
    result: { itemId: 'wooden_sword', count: 1 },
    description: 'Basic weapon for self-defense (4 DMG)',
  },

  // STONE TOOLS
  {
    id: 'stone_pickaxe',
    name: 'Stone Pickaxe',
    category: 'tools',
    requiresCraftingTable: true,
    inputs: [
      { itemId: 'cobblestone', count: 3 },
      { itemId: 'stick', count: 2 },
    ],
    result: { itemId: 'stone_pickaxe', count: 1 },
    description: 'Faster mining speed, can mine iron ore',
  },
  {
    id: 'stone_axe',
    name: 'Stone Axe',
    category: 'tools',
    requiresCraftingTable: true,
    inputs: [
      { itemId: 'cobblestone', count: 3 },
      { itemId: 'stick', count: 2 },
    ],
    result: { itemId: 'stone_axe', count: 1 },
    description: 'Heavy damage and fast wood cutting',
  },
  {
    id: 'stone_shovel',
    name: 'Stone Shovel',
    category: 'tools',
    requiresCraftingTable: false,
    inputs: [
      { itemId: 'cobblestone', count: 1 },
      { itemId: 'stick', count: 2 },
    ],
    result: { itemId: 'stone_shovel', count: 1 },
    description: 'Durable shovel for excavations',
  },
  {
    id: 'stone_sword',
    name: 'Stone Sword',
    category: 'weapons',
    requiresCraftingTable: false,
    inputs: [
      { itemId: 'cobblestone', count: 2 },
      { itemId: 'stick', count: 1 },
    ],
    result: { itemId: 'stone_sword', count: 1 },
    description: 'Sturdy sword for monster hunting (6 DMG)',
  },

  // IRON TOOLS
  {
    id: 'iron_pickaxe',
    name: 'Iron Pickaxe',
    category: 'tools',
    requiresCraftingTable: true,
    inputs: [
      { itemId: 'iron_ore', count: 3 },
      { itemId: 'stick', count: 2 },
    ],
    result: { itemId: 'iron_pickaxe', count: 1 },
    description: 'Can mine gold and diamond ore',
  },
  {
    id: 'iron_axe',
    name: 'Iron Axe',
    category: 'tools',
    requiresCraftingTable: true,
    inputs: [
      { itemId: 'iron_ore', count: 3 },
      { itemId: 'stick', count: 2 },
    ],
    result: { itemId: 'iron_axe', count: 1 },
    description: 'Heavy metal woodchopper (7 DMG)',
  },
  {
    id: 'iron_shovel',
    name: 'Iron Shovel',
    category: 'tools',
    requiresCraftingTable: false,
    inputs: [
      { itemId: 'iron_ore', count: 1 },
      { itemId: 'stick', count: 2 },
    ],
    result: { itemId: 'iron_shovel', count: 1 },
    description: 'Rapid digging shovel',
  },
  {
    id: 'iron_sword',
    name: 'Iron Sword',
    category: 'weapons',
    requiresCraftingTable: false,
    inputs: [
      { itemId: 'iron_ore', count: 2 },
      { itemId: 'stick', count: 1 },
    ],
    result: { itemId: 'iron_sword', count: 1 },
    description: 'High damage blade (8 DMG)',
  },

  // DIAMOND TOOLS
  {
    id: 'diamond_pickaxe',
    name: 'Diamond Pickaxe',
    category: 'tools',
    requiresCraftingTable: true,
    inputs: [
      { itemId: 'diamond', count: 3 },
      { itemId: 'stick', count: 2 },
    ],
    result: { itemId: 'diamond_pickaxe', count: 1 },
    description: 'Legendary pickaxe with supreme speed',
  },
  {
    id: 'diamond_sword',
    name: 'Diamond Sword',
    category: 'weapons',
    requiresCraftingTable: false,
    inputs: [
      { itemId: 'diamond', count: 2 },
      { itemId: 'stick', count: 1 },
    ],
    result: { itemId: 'diamond_sword', count: 1 },
    description: 'Supreme weapon (10 DMG)',
  },

  // COPPER TOOLS
  {
    id: 'copper_pickaxe',
    name: 'Copper Pickaxe',
    category: 'tools',
    requiresCraftingTable: true,
    inputs: [
      { itemId: 'copper_ingot', count: 3 },
      { itemId: 'stick', count: 2 },
    ],
    result: { itemId: 'copper_pickaxe', count: 1 },
    description: 'Sturdy copper pickaxe (Speed 5.0)',
  },
  {
    id: 'copper_axe',
    name: 'Copper Axe',
    category: 'tools',
    requiresCraftingTable: true,
    inputs: [
      { itemId: 'copper_ingot', count: 3 },
      { itemId: 'stick', count: 2 },
    ],
    result: { itemId: 'copper_axe', count: 1 },
    description: 'Chops trees efficiently (6 DMG)',
  },
  {
    id: 'copper_sword',
    name: 'Copper Sword',
    category: 'weapons',
    requiresCraftingTable: false,
    inputs: [
      { itemId: 'copper_ingot', count: 2 },
      { itemId: 'stick', count: 1 },
    ],
    result: { itemId: 'copper_sword', count: 1 },
    description: 'Sharp copper blade (7 DMG)',
  },

  // ARMOR - IRON SET
  {
    id: 'iron_helmet',
    name: 'Iron Helmet',
    category: 'weapons',
    requiresCraftingTable: true,
    inputs: [{ itemId: 'iron_ingot', count: 5 }],
    result: { itemId: 'iron_helmet', count: 1 },
    description: 'Protective iron headwear (+2 Armor)',
  },
  {
    id: 'iron_chestplate',
    name: 'Iron Chestplate',
    category: 'weapons',
    requiresCraftingTable: true,
    inputs: [{ itemId: 'iron_ingot', count: 8 }],
    result: { itemId: 'iron_chestplate', count: 1 },
    description: 'Heavy armor chest piece (+6 Armor)',
  },
  {
    id: 'iron_leggings',
    name: 'Iron Leggings',
    category: 'weapons',
    requiresCraftingTable: true,
    inputs: [{ itemId: 'iron_ingot', count: 7 }],
    result: { itemId: 'iron_leggings', count: 1 },
    description: 'Iron plate greaves (+5 Armor)',
  },
  {
    id: 'iron_boots',
    name: 'Iron Boots',
    category: 'weapons',
    requiresCraftingTable: true,
    inputs: [{ itemId: 'iron_ingot', count: 4 }],
    result: { itemId: 'iron_boots', count: 1 },
    description: 'Sturdy iron greaves (+2 Armor)',
  },

  // ARMOR - DIAMOND SET
  {
    id: 'diamond_chestplate',
    name: 'Diamond Chestplate',
    category: 'weapons',
    requiresCraftingTable: true,
    inputs: [{ itemId: 'diamond', count: 8 }],
    result: { itemId: 'diamond_chestplate', count: 1 },
    description: 'Supreme diamond armor (+8 Armor)',
  },

  // BUILDING MATERIALS
  {
    id: 'clay_block',
    name: 'Clay Block',
    category: 'blocks',
    requiresCraftingTable: false,
    inputs: [{ itemId: 'clay_ball', count: 4 }],
    result: { itemId: 'clay_block', count: 1 },
    description: 'Smooth gray clay block',
  },
  {
    id: 'brick',
    name: 'Bricks (x4)',
    category: 'blocks',
    requiresCraftingTable: false,
    inputs: [
      { itemId: 'dirt', count: 2 },
      { itemId: 'sand', count: 2 },
    ],
    result: { itemId: 'brick', count: 4 },
    description: 'Strong architectural building blocks',
  },
  {
    id: 'bookshelf',
    name: 'Bookshelf',
    category: 'blocks',
    requiresCraftingTable: true,
    inputs: [
      { itemId: 'planks', count: 6 },
      { itemId: 'wood', count: 1 },
    ],
    result: { itemId: 'bookshelf', count: 1 },
    description: 'Decorative library shelf',
  },

  // GOLDEN TOOLS
  {
    id: 'gold_pickaxe',
    name: 'Golden Pickaxe',
    nameUz: 'Oltin Cho\'kich',
    category: 'tools',
    requiresCraftingTable: true,
    inputs: [
      { itemId: 'gold_ingot', count: 3 },
      { itemId: 'stick', count: 2 },
    ],
    result: { itemId: 'gold_pickaxe', count: 1 },
    description: 'Ultra fast mining speed (12x speed)',
    descriptionUz: 'O\'ta yuqori qazish tezligiga ega cho\'kich (12x tezlik)',
    pattern: ['GGG', ' S ', ' S '],
    gridKeys: { G: 'gold_ingot', S: 'stick' },
  },
  {
    id: 'gold_axe',
    name: 'Golden Axe',
    nameUz: 'Oltin Bolta',
    category: 'tools',
    requiresCraftingTable: true,
    inputs: [
      { itemId: 'gold_ingot', count: 3 },
      { itemId: 'stick', count: 2 },
    ],
    result: { itemId: 'gold_axe', count: 1 },
    description: 'Ultra fast wood chopping axe',
    descriptionUz: 'Daraxtlarni bir zumda chopuvchi oltin bolta',
    pattern: ['GG ', 'GS ', ' S '],
    gridKeys: { G: 'gold_ingot', S: 'stick' },
  },
  {
    id: 'gold_sword',
    name: 'Golden Sword',
    nameUz: 'Oltin Qilich',
    category: 'weapons',
    requiresCraftingTable: false,
    inputs: [
      { itemId: 'gold_ingot', count: 2 },
      { itemId: 'stick', count: 1 },
    ],
    result: { itemId: 'gold_sword', count: 1 },
    description: 'Shining golden blade (7 DMG)',
    descriptionUz: 'Yaltiroq oltin qilich (7 zarar)',
    pattern: ['G', 'G', 'S'],
    gridKeys: { G: 'gold_ingot', S: 'stick' },
  },
  {
    id: 'emerald_sword',
    name: 'Emerald Blade',
    nameUz: 'Zumrad Qilich',
    category: 'weapons',
    requiresCraftingTable: true,
    inputs: [
      { itemId: 'emerald', count: 2 },
      { itemId: 'diamond', count: 1 },
      { itemId: 'stick', count: 1 },
    ],
    result: { itemId: 'emerald_sword', count: 1 },
    description: 'Legendary mystical blade infused with gem power (11 DMG)',
    descriptionUz: 'Afsonaviy zumrad qilich (11 zarar)',
    pattern: [' E ', 'EDE', ' S '],
    gridKeys: { E: 'emerald', D: 'diamond', S: 'stick' },
  },
  {
    id: 'shears',
    name: 'Iron Shears',
    nameUz: 'Temir Qaychi',
    category: 'tools',
    requiresCraftingTable: false,
    inputs: [{ itemId: 'iron_ingot', count: 2 }],
    result: { itemId: 'shears', count: 1 },
    description: 'Instantly harvests leaves, foliage and vines',
    descriptionUz: 'Barglar va lianalarni darhol yig\'ib oladi',
    pattern: [' I', 'I '],
    gridKeys: { I: 'iron_ingot' },
  },

  // STRUCTURES & PREFAB KITS (Crafted from collected voxel blocks)
  {
    id: 'structure_shelter',
    name: 'Survival Cottage Kit',
    nameUz: 'Boshpana Kulbasi To\'plami',
    category: 'structures',
    requiresCraftingTable: true,
    inputs: [
      { itemId: 'planks', count: 16 },
      { itemId: 'cobblestone', count: 8 },
      { itemId: 'glass', count: 2 },
      { itemId: 'torch', count: 2 },
    ],
    result: { itemId: 'structure_shelter', count: 1 },
    description: 'Instant 5x5 wooden and stone cottage with glass windows, crafting table & torches.',
    descriptionUz: '5x5 tosh va yog\'och kulba: derazalari, dastgohi va mash\'allari bilan bir zumda quriladi.',
    pattern: ['PPP', 'CGT', 'PPP'],
    gridKeys: { P: 'planks', C: 'cobblestone', G: 'glass', T: 'torch' },
  },
  {
    id: 'structure_watchtower',
    name: 'Stone Watchtower Kit',
    nameUz: 'Kuzatuv Minorasi To\'plami',
    category: 'structures',
    requiresCraftingTable: true,
    inputs: [
      { itemId: 'cobblestone', count: 20 },
      { itemId: 'wood', count: 4 },
      { itemId: 'torch', count: 4 },
    ],
    result: { itemId: 'structure_watchtower', count: 1 },
    description: '9-block high fortified stone watchtower with battlements and perimeter torches.',
    descriptionUz: '9 blokli mustahkam tosh minora: tepasida kuzatuv maydonchasi va 4 ta mash\'al.',
    pattern: ['TWT', 'CCC', 'CCC'],
    gridKeys: { T: 'torch', W: 'wood', C: 'cobblestone' },
  },
  {
    id: 'structure_bridge',
    name: 'Arch Bridge Kit',
    nameUz: 'Ko\'prik To\'plami',
    category: 'structures',
    requiresCraftingTable: true,
    inputs: [
      { itemId: 'cobblestone', count: 12 },
      { itemId: 'planks', count: 8 },
      { itemId: 'torch', count: 2 },
    ],
    result: { itemId: 'structure_bridge', count: 1 },
    description: 'Constructs a 7-block long wooden and cobblestone bridge across gaps or rivers.',
    descriptionUz: 'Daryo va jarliklar ustiga 7 blokli mustahkam yog\'och-tosh ko\'prik quradi.',
    pattern: ['T T', 'PPP', 'CCC'],
    gridKeys: { T: 'torch', P: 'planks', C: 'cobblestone' },
  },
  {
    id: 'structure_well',
    name: 'Stone Well Kit',
    nameUz: 'Tosh Quduq To\'plami',
    category: 'structures',
    requiresCraftingTable: true,
    inputs: [
      { itemId: 'cobblestone', count: 12 },
      { itemId: 'wood', count: 4 },
      { itemId: 'planks', count: 4 },
    ],
    result: { itemId: 'structure_well', count: 1 },
    description: 'Stone water well with wooden canopy and infinite water pool.',
    descriptionUz: 'Soyabonli va cheksiz toza suvli qishloq tosh qudug\'ini barpo etadi.',
    pattern: ['PPP', 'W W', 'CCC'],
    gridKeys: { P: 'planks', W: 'wood', C: 'cobblestone' },
  },
  {
    id: 'structure_campfire',
    name: 'Campfire Kit',
    nameUz: 'Gulxan To\'plami',
    category: 'structures',
    requiresCraftingTable: false,
    inputs: [
      { itemId: 'cobblestone', count: 4 },
      { itemId: 'wood', count: 2 },
      { itemId: 'coal', count: 1 },
    ],
    result: { itemId: 'structure_campfire', count: 1 },
    description: 'Warm campfire radiating light to illuminate wilderness and repel dark night mobs.',
    descriptionUz: 'Tungi qorong\'ulikda yirtqichlarni haydovchi issiq yorug\'lik beruvchi gulxan.',
    pattern: [' C ', 'CWC', ' W '],
    gridKeys: { C: 'cobblestone', W: 'wood' },
  },
];

// Helper: Match grid (9-element array for 3x3 or 4-element for 2x2) against registered recipes
export function matchRecipeFromGrid(grid: (string | null)[], is3x3: boolean = true): CraftingRecipe | null {
  // 1. Check shapeless inputs first
  const nonNulls = grid.filter((item): item is string => Boolean(item));
  if (nonNulls.length === 0) return null;

  const gridCounts = new Map<string, number>();
  for (const id of nonNulls) {
    gridCounts.set(id, (gridCounts.get(id) || 0) + 1);
  }

  for (const recipe of CRAFTING_RECIPES) {
    if (!is3x3 && recipe.requiresCraftingTable) continue;

    // Check if total count matches
    const totalRequired = recipe.inputs.reduce((sum, inp) => sum + inp.count, 0);
    if (totalRequired !== nonNulls.length) continue;

    // Check if each item count matches exactly
    let match = true;
    for (const inp of recipe.inputs) {
      if ((gridCounts.get(inp.itemId) || 0) !== inp.count) {
        match = false;
        break;
      }
    }
    if (match) return recipe;
  }

  return null;
}
