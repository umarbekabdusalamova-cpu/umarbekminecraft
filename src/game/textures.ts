import * as THREE from 'three';
import { BlockType } from '../types/game';

// Helper to create a 16x16 pixel canvas texture
function createPixelTexture(
  drawFn: (ctx: CanvasRenderingContext2D, w: number, h: number) => void
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 16;
  canvas.height = 16;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;

  drawFn(ctx, 16, 16);

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Pseudo-random deterministic noise for pixel texture generation
function pseudoRandom(x: number, y: number, seed: number = 42): number {
  const n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
  return n - Math.floor(n);
}

export interface BlockMaterials {
  top: THREE.Material;
  bottom: THREE.Material;
  side: THREE.Material;
  isTransparent?: boolean;
}

let cachedMaterials: Map<BlockType, THREE.Material[] | THREE.Material> | null = null;

export function getBlockMaterials(): Map<BlockType, THREE.Material[] | THREE.Material> {
  if (cachedMaterials) return cachedMaterials;

  const map = new Map<BlockType, THREE.Material[] | THREE.Material>();

  // 1. DIRT
  const dirtTex = createPixelTexture((ctx) => {
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const r = pseudoRandom(x, y, 1);
        const shade = Math.floor(95 + r * 35);
        ctx.fillStyle = `rgb(${shade}, ${Math.floor(shade * 0.65)}, ${Math.floor(shade * 0.42)})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  });
  const dirtMat = new THREE.MeshLambertMaterial({ map: dirtTex });

  // 2. GRASS TOP
  const grassTopTex = createPixelTexture((ctx) => {
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const r = pseudoRandom(x, y, 2);
        const g = Math.floor(130 + r * 45);
        ctx.fillStyle = `rgb(${Math.floor(g * 0.45)}, ${g}, ${Math.floor(g * 0.28)})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  });
  const grassTopMat = new THREE.MeshLambertMaterial({ map: grassTopTex });

  // 3. GRASS SIDE
  const grassSideTex = createPixelTexture((ctx) => {
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const r = pseudoRandom(x, y, 3);
        const drip = 3 + Math.floor(pseudoRandom(x, 0, 7) * 3);
        if (y < drip) {
          const g = Math.floor(130 + r * 45);
          ctx.fillStyle = `rgb(${Math.floor(g * 0.45)}, ${g}, ${Math.floor(g * 0.28)})`;
        } else {
          const shade = Math.floor(95 + r * 35);
          ctx.fillStyle = `rgb(${shade}, ${Math.floor(shade * 0.65)}, ${Math.floor(shade * 0.42)})`;
        }
        ctx.fillRect(x, y, 1, 1);
      }
    }
  });
  const grassSideMat = new THREE.MeshLambertMaterial({ map: grassSideTex });

  // 4. STONE
  const stoneTex = createPixelTexture((ctx) => {
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const r = pseudoRandom(x, y, 4);
        const val = Math.floor(115 + r * 45);
        ctx.fillStyle = `rgb(${val}, ${val}, ${Math.floor(val * 1.02)})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  });
  const stoneMat = new THREE.MeshLambertMaterial({ map: stoneTex });

  // 5. COBBLESTONE
  const cobbleTex = createPixelTexture((ctx) => {
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const isBorder = (x % 5 === 0 && y % 3 === 0) || (x % 4 === 0 && y % 5 === 0) || x === 0 || y === 0 || x === 15 || y === 15;
        const r = pseudoRandom(x, y, 5);
        const val = isBorder ? Math.floor(65 + r * 20) : Math.floor(110 + r * 45);
        ctx.fillStyle = `rgb(${val}, ${val}, ${val})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  });
  const cobbleMat = new THREE.MeshLambertMaterial({ map: cobbleTex });

  // 6. SAND
  const sandTex = createPixelTexture((ctx) => {
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const r = pseudoRandom(x, y, 6);
        const val = Math.floor(205 + r * 35);
        ctx.fillStyle = `rgb(${val}, ${Math.floor(val * 0.9)}, ${Math.floor(val * 0.65)})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  });
  const sandMat = new THREE.MeshLambertMaterial({ map: sandTex });

  // 7. WOOD LOG (SIDE & TOP)
  const woodSideTex = createPixelTexture((ctx) => {
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const barkLine = Math.sin(x * 1.5) * 15;
        const r = pseudoRandom(x, y, 8);
        const shade = Math.floor(80 + barkLine + r * 20);
        ctx.fillStyle = `rgb(${shade}, ${Math.floor(shade * 0.62)}, ${Math.floor(shade * 0.38)})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  });
  const woodSideMat = new THREE.MeshLambertMaterial({ map: woodSideTex });

  const woodTopTex = createPixelTexture((ctx) => {
    const cx = 7.5, cy = 7.5;
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
        const r = pseudoRandom(x, y, 9);
        const ring = Math.floor(dist * 2) % 2 === 0 ? 15 : 0;
        const shade = Math.floor(140 - dist * 5 + ring + r * 15);
        ctx.fillStyle = `rgb(${shade}, ${Math.floor(shade * 0.72)}, ${Math.floor(shade * 0.48)})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  });
  const woodTopMat = new THREE.MeshLambertMaterial({ map: woodTopTex });

  // 8. PLANKS
  const planksTex = createPixelTexture((ctx) => {
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const isPlankBorder = y % 4 === 0 || (y < 4 && x === 8) || (y >= 4 && y < 8 && x === 3) || (y >= 8 && y < 12 && x === 12) || (y >= 12 && x === 6);
        const r = pseudoRandom(x, y, 10);
        const shade = isPlankBorder ? Math.floor(100 + r * 15) : Math.floor(155 + r * 25);
        ctx.fillStyle = `rgb(${shade}, ${Math.floor(shade * 0.7)}, ${Math.floor(shade * 0.42)})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  });
  const planksMat = new THREE.MeshLambertMaterial({ map: planksTex });

  // 9. LEAVES (semi-transparent with leaf pattern)
  const leavesTex = createPixelTexture((ctx) => {
    ctx.clearRect(0, 0, 16, 16);
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const r = pseudoRandom(x, y, 11);
        if (r > 0.18) {
          const g = Math.floor(115 + r * 50);
          ctx.fillStyle = `rgb(${Math.floor(g * 0.35)}, ${g}, ${Math.floor(g * 0.22)})`;
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
  });
  const leavesMat = new THREE.MeshLambertMaterial({
    map: leavesTex,
    transparent: true,
    alphaTest: 0.2,
  });

  // 10. WATER
  const waterTex = createPixelTexture((ctx) => {
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const r = pseudoRandom(x, y, 12);
        const b = Math.floor(180 + r * 45);
        ctx.fillStyle = `rgb(${Math.floor(b * 0.2)}, ${Math.floor(b * 0.45)}, ${b})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  });
  const waterMat = new THREE.MeshLambertMaterial({
    map: waterTex,
    transparent: true,
    opacity: 0.72,
    depthWrite: false,
  });

  // Helper for Ores
  const createOreMat = (speckColor: string, seed: number) => {
    const tex = createPixelTexture((ctx) => {
      // Base stone
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          const r = pseudoRandom(x, y, seed);
          const val = Math.floor(115 + r * 45);
          ctx.fillStyle = `rgb(${val}, ${val}, ${Math.floor(val * 1.02)})`;
          ctx.fillRect(x, y, 1, 1);
        }
      }
      // Ore flecks
      for (let y = 1; y < 15; y++) {
        for (let x = 1; x < 15; x++) {
          const r = pseudoRandom(x, y, seed + 100);
          if (r > 0.82) {
            ctx.fillStyle = speckColor;
            ctx.fillRect(x, y, 2, 2);
          }
        }
      }
    });
    return new THREE.MeshLambertMaterial({ map: tex });
  };

  const coalMat = createOreMat('#1c1c1c', 13);
  const ironMat = createOreMat('#d5b088', 14);
  const goldMat = createOreMat('#ffca3a', 15);
  const diamondMat = createOreMat('#48cae4', 16);

  // BRICK
  const brickTex = createPixelTexture((ctx) => {
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const isMortar = y % 4 === 0 || (y < 4 && x === 8) || (y >= 4 && y < 8 && (x === 0 || x === 15)) || (y >= 8 && y < 12 && x === 8) || (y >= 12 && (x === 0 || x === 15));
        const r = pseudoRandom(x, y, 17);
        if (isMortar) {
          const m = Math.floor(180 + r * 30);
          ctx.fillStyle = `rgb(${m}, ${m}, ${m})`;
        } else {
          const red = Math.floor(150 + r * 35);
          ctx.fillStyle = `rgb(${red}, ${Math.floor(red * 0.4)}, ${Math.floor(red * 0.3)})`;
        }
        ctx.fillRect(x, y, 1, 1);
      }
    }
  });
  const brickMat = new THREE.MeshLambertMaterial({ map: brickTex });

  // GLASS
  const glassTex = createPixelTexture((ctx) => {
    ctx.clearRect(0, 0, 16, 16);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, 15, 15);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillRect(3, 3, 2, 2);
    ctx.fillRect(4, 5, 2, 2);
    ctx.fillRect(10, 11, 2, 2);
  });
  const glassMat = new THREE.MeshLambertMaterial({
    map: glassTex,
    transparent: true,
    opacity: 0.5,
  });

  // CRAFTING TABLE (Top has grid, side has tools)
  const craftTopTex = createPixelTexture((ctx) => {
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const r = pseudoRandom(x, y, 18);
        const shade = Math.floor(170 + r * 20);
        ctx.fillStyle = `rgb(${shade}, ${Math.floor(shade * 0.72)}, ${Math.floor(shade * 0.42)})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
    // Grid in center
    ctx.strokeStyle = '#6d4c41';
    ctx.strokeRect(2.5, 2.5, 11, 11);
    ctx.beginPath();
    ctx.moveTo(6.5, 2.5); ctx.lineTo(6.5, 13.5);
    ctx.moveTo(10.5, 2.5); ctx.lineTo(10.5, 13.5);
    ctx.moveTo(2.5, 6.5); ctx.lineTo(13.5, 6.5);
    ctx.moveTo(2.5, 10.5); ctx.lineTo(13.5, 10.5);
    ctx.stroke();
  });
  const craftTopMat = new THREE.MeshLambertMaterial({ map: craftTopTex });

  const craftSideTex = createPixelTexture((ctx) => {
    // Planks background with saw/hammer shape
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const r = pseudoRandom(x, y, 19);
        const shade = Math.floor(145 + r * 20);
        ctx.fillStyle = `rgb(${shade}, ${Math.floor(shade * 0.65)}, ${Math.floor(shade * 0.38)})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
    // Saw silhouette
    ctx.fillStyle = '#424242';
    ctx.fillRect(4, 5, 8, 2);
    ctx.fillStyle = '#ffb703';
    ctx.fillRect(2, 4, 3, 4);
  });
  const craftSideMat = new THREE.MeshLambertMaterial({ map: craftSideTex });

  // FURNACE
  const furnaceFrontTex = createPixelTexture((ctx) => {
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const r = pseudoRandom(x, y, 20);
        const val = Math.floor(100 + r * 30);
        ctx.fillStyle = `rgb(${val}, ${val}, ${val})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
    // Furnace opening
    ctx.fillStyle = '#1c1c1c';
    ctx.fillRect(4, 7, 8, 6);
    // Glow inside
    ctx.fillStyle = '#ff6b35';
    ctx.fillRect(5, 9, 6, 3);
    ctx.fillStyle = '#ffbe0b';
    ctx.fillRect(6, 10, 4, 2);
  });
  const furnaceFrontMat = new THREE.MeshLambertMaterial({ map: furnaceFrontTex });

  // TORCH
  const torchTex = createPixelTexture((ctx) => {
    ctx.clearRect(0, 0, 16, 16);
    // Stick
    ctx.fillStyle = '#7f5539';
    ctx.fillRect(7, 5, 2, 10);
    // Flame
    ctx.fillStyle = '#ffb703';
    ctx.fillRect(6, 2, 4, 3);
    ctx.fillStyle = '#fb8500';
    ctx.fillRect(7, 1, 2, 2);
  });
  const torchMat = new THREE.MeshBasicMaterial({ map: torchTex, transparent: true });

  // BEDROCK
  const bedrockTex = createPixelTexture((ctx) => {
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const r = pseudoRandom(x, y, 22);
        const val = Math.floor(25 + r * 45);
        ctx.fillStyle = `rgb(${val}, ${val}, ${val})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  });
  const bedrockMat = new THREE.MeshLambertMaterial({ map: bedrockTex });

  // BOOKSHELF
  const bookshelfSideTex = createPixelTexture((ctx) => {
    // Planks frame
    ctx.fillStyle = '#8d6e63';
    ctx.fillRect(0, 0, 16, 16);
    // Shelf rows
    ctx.fillStyle = '#3e2723';
    ctx.fillRect(2, 2, 12, 5);
    ctx.fillRect(2, 9, 12, 5);
    // Book spines
    const bookColors = ['#d90429', '#2a9d8f', '#e76f51', '#457b9d', '#9c6644'];
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = bookColors[i % bookColors.length];
      ctx.fillRect(3 + i * 2, 3, 2, 4);
      ctx.fillStyle = bookColors[(i + 2) % bookColors.length];
      ctx.fillRect(3 + i * 2, 10, 2, 4);
    }
  });
  const bookshelfSideMat = new THREE.MeshLambertMaterial({ map: bookshelfSideTex });

  // COPPER ORE
  const copperMat = createOreMat('#e07a5f', 31);

  // EMERALD ORE
  const emeraldMat = createOreMat('#2ec4b6', 32);

  // OBSIDIAN
  const obsidianTex = createPixelTexture((ctx) => {
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const r = pseudoRandom(x, y, 33);
        const val = Math.floor(18 + r * 28);
        const purple = Math.floor(val * 1.5);
        ctx.fillStyle = `rgb(${val}, ${Math.floor(val * 0.7)}, ${purple})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
    // Deep crystal facets
    ctx.fillStyle = '#6a4c93';
    ctx.fillRect(3, 4, 3, 2);
    ctx.fillRect(10, 9, 2, 3);
  });
  const obsidianMat = new THREE.MeshLambertMaterial({ map: obsidianTex });

  // GRAVEL
  const gravelTex = createPixelTexture((ctx) => {
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const r = pseudoRandom(x, y, 34);
        const val = Math.floor(90 + r * 50);
        ctx.fillStyle = `rgb(${val}, ${val - 5}, ${val - 10})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  });
  const gravelMat = new THREE.MeshLambertMaterial({ map: gravelTex });

  // CLAY
  const clayTex = createPixelTexture((ctx) => {
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const r = pseudoRandom(x, y, 35);
        const val = Math.floor(145 + r * 25);
        ctx.fillStyle = `rgb(${val}, ${val + 5}, ${val + 10})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  });
  const clayMat = new THREE.MeshLambertMaterial({ map: clayTex });

  // BIRCH WOOD (white trunk with dark horizontal notches)
  const birchSideTex = createPixelTexture((ctx) => {
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const r = pseudoRandom(x, y, 36);
        const shade = Math.floor(215 + r * 30);
        ctx.fillStyle = `rgb(${shade}, ${shade}, ${shade})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
    // Birch dark bark specks
    ctx.fillStyle = '#2b2b2b';
    ctx.fillRect(2, 3, 4, 1);
    ctx.fillRect(9, 7, 3, 1);
    ctx.fillRect(4, 12, 5, 1);
    ctx.fillRect(12, 14, 3, 1);
  });
  const birchSideMat = new THREE.MeshLambertMaterial({ map: birchSideTex });

  const birchLeavesTex = createPixelTexture((ctx) => {
    ctx.clearRect(0, 0, 16, 16);
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const r = pseudoRandom(x, y, 37);
        if (r > 0.18) {
          const g = Math.floor(145 + r * 50);
          ctx.fillStyle = `rgb(${Math.floor(g * 0.5)}, ${g}, ${Math.floor(g * 0.25)})`;
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
  });
  const birchLeavesMat = new THREE.MeshLambertMaterial({
    map: birchLeavesTex,
    transparent: true,
    alphaTest: 0.2,
  });

  // FLOWERS (RED POPPY & YELLOW DANDELION)
  const redFlowerTex = createPixelTexture((ctx) => {
    ctx.clearRect(0, 0, 16, 16);
    // Green stem
    ctx.fillStyle = '#38b000';
    ctx.fillRect(7, 7, 2, 9);
    // Red petals
    ctx.fillStyle = '#d90429';
    ctx.fillRect(5, 3, 6, 5);
    ctx.fillRect(6, 2, 4, 7);
    // Flower center
    ctx.fillStyle = '#2b2b2b';
    ctx.fillRect(7, 4, 2, 2);
  });
  const redFlowerMat = new THREE.MeshLambertMaterial({ map: redFlowerTex, transparent: true, alphaTest: 0.3 });

  const yellowFlowerTex = createPixelTexture((ctx) => {
    ctx.clearRect(0, 0, 16, 16);
    ctx.fillStyle = '#38b000';
    ctx.fillRect(7, 7, 2, 9);
    ctx.fillStyle = '#ffb703';
    ctx.fillRect(5, 3, 6, 5);
    ctx.fillStyle = '#fb8500';
    ctx.fillRect(6, 4, 4, 3);
  });
  const yellowFlowerMat = new THREE.MeshLambertMaterial({ map: yellowFlowerTex, transparent: true, alphaTest: 0.3 });

  // Map 6 faces: +X, -X, +Y, -Y, +Z, -Z
  // In Three.js BoxGeometry material array order: [right, left, top, bottom, front, back]
  map.set(BlockType.GRASS, [grassSideMat, grassSideMat, grassTopMat, dirtMat, grassSideMat, grassSideMat]);
  map.set(BlockType.DIRT, dirtMat);
  map.set(BlockType.STONE, stoneMat);
  map.set(BlockType.COBBLESTONE, cobbleMat);
  map.set(BlockType.SAND, sandMat);
  map.set(BlockType.WOOD, [woodSideMat, woodSideMat, woodTopMat, woodTopMat, woodSideMat, woodSideMat]);
  map.set(BlockType.LEAVES, leavesMat);
  map.set(BlockType.PLANKS, planksMat);
  map.set(BlockType.WATER, waterMat);
  map.set(BlockType.COAL_ORE, coalMat);
  map.set(BlockType.IRON_ORE, ironMat);
  map.set(BlockType.GOLD_ORE, goldMat);
  map.set(BlockType.DIAMOND_ORE, diamondMat);
  map.set(BlockType.BRICK, brickMat);
  map.set(BlockType.GLASS, glassMat);
  map.set(BlockType.CRAFTING_TABLE, [craftSideMat, craftSideMat, craftTopMat, planksMat, craftSideMat, craftSideMat]);
  map.set(BlockType.FURNACE, [cobbleMat, cobbleMat, cobbleMat, cobbleMat, furnaceFrontMat, cobbleMat]);
  map.set(BlockType.TORCH, torchMat);
  map.set(BlockType.BEDROCK, bedrockMat);
  map.set(BlockType.BOOKSHELF, [bookshelfSideMat, bookshelfSideMat, planksMat, planksMat, bookshelfSideMat, bookshelfSideMat]);
  map.set(BlockType.COPPER_ORE, copperMat);
  map.set(BlockType.EMERALD_ORE, emeraldMat);
  map.set(BlockType.OBSIDIAN, obsidianMat);
  map.set(BlockType.GRAVEL, gravelMat);
  map.set(BlockType.CLAY, clayMat);
  map.set(BlockType.BIRCH_WOOD, [birchSideMat, birchSideMat, woodTopMat, woodTopMat, birchSideMat, birchSideMat]);
  map.set(BlockType.BIRCH_LEAVES, birchLeavesMat);
  map.set(BlockType.RED_FLOWER, redFlowerMat);
  map.set(BlockType.YELLOW_FLOWER, yellowFlowerMat);

  cachedMaterials = map;
  return map;
}
