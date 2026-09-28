import * as THREE from 'three';
import { BlockType, VoxelRaycastHit } from '../types/game';
import { World } from './world';

export class Physics {
  private world: World;

  constructor(world: World) {
    this.world = world;
  }

  // Fast DDA Voxel Raycaster (Amanatides-Woo algorithm)
  public raycast(
    origin: THREE.Vector3,
    direction: THREE.Vector3,
    maxDistance: number = 6.0
  ): VoxelRaycastHit {
    let px = origin.x;
    let py = origin.y;
    let pz = origin.z;

    const dx = direction.x;
    const dy = direction.y;
    const dz = direction.z;

    let ix = Math.floor(px);
    let iy = Math.floor(py);
    let iz = Math.floor(pz);

    const stepX = dx > 0 ? 1 : dx < 0 ? -1 : 0;
    const stepY = dy > 0 ? 1 : dy < 0 ? -1 : 0;
    const stepZ = dz > 0 ? 1 : dz < 0 ? -1 : 0;

    const tDeltaX = stepX !== 0 ? Math.abs(1 / dx) : Infinity;
    const tDeltaY = stepY !== 0 ? Math.abs(1 / dy) : Infinity;
    const tDeltaZ = stepZ !== 0 ? Math.abs(1 / dz) : Infinity;

    let tMaxX = stepX > 0 ? (ix + 1 - px) / dx : stepX < 0 ? (ix - px) / dx : Infinity;
    let tMaxY = stepY > 0 ? (iy + 1 - py) / dy : stepY < 0 ? (iy - py) / dy : Infinity;
    let tMaxZ = stepZ > 0 ? (iz + 1 - pz) / dz : stepZ < 0 ? (iz - pz) / dz : Infinity;

    let normalX = 0;
    let normalY = 0;
    let normalZ = 0;
    let dist = 0;

    while (dist < maxDistance) {
      const block = this.world.getBlock(ix, iy, iz);
      // Hit a solid/interactable block (exclude AIR and WATER for placing/breaking targets)
      if (block !== BlockType.AIR && block !== BlockType.WATER) {
        return {
          hit: true,
          voxel: [ix, iy, iz],
          normal: [normalX, normalY, normalZ],
          adjacent: [ix + normalX, iy + normalY, iz + normalZ],
          distance: dist,
          blockType: block,
        };
      }

      if (tMaxX < tMaxY) {
        if (tMaxX < tMaxZ) {
          dist = tMaxX;
          tMaxX += tDeltaX;
          ix += stepX;
          normalX = -stepX;
          normalY = 0;
          normalZ = 0;
        } else {
          dist = tMaxZ;
          tMaxZ += tDeltaZ;
          iz += stepZ;
          normalX = 0;
          normalY = 0;
          normalZ = -stepZ;
        }
      } else {
        if (tMaxY < tMaxZ) {
          dist = tMaxY;
          tMaxY += tDeltaY;
          iy += stepY;
          normalX = 0;
          normalY = -stepY;
          normalZ = 0;
        } else {
          dist = tMaxZ;
          tMaxZ += tDeltaZ;
          iz += stepZ;
          normalX = 0;
          normalY = 0;
          normalZ = -stepZ;
        }
      }
    }

    return {
      hit: false,
      voxel: [0, 0, 0],
      normal: [0, 0, 0],
      adjacent: [0, 0, 0],
      distance: 0,
      blockType: BlockType.AIR,
    };
  }

  // Check if a block at (x, y, z) is solid for movement collisions
  public isSolid(x: number, y: number, z: number): boolean {
    const block = this.world.getBlock(Math.floor(x), Math.floor(y), Math.floor(z));
    return (
      block !== BlockType.AIR &&
      block !== BlockType.WATER &&
      block !== BlockType.TORCH &&
      block !== BlockType.RED_FLOWER &&
      block !== BlockType.YELLOW_FLOWER
    );
  }

  // Check if position is submerged in water
  public isInWater(x: number, y: number, z: number): boolean {
    return this.world.getBlock(Math.floor(x), Math.floor(y), Math.floor(z)) === BlockType.WATER;
  }

  // Resolve any penetration/overlap if player is stuck inside solid voxels
  public resolveOverlap(
    pos: THREE.Vector3,
    halfWidth: number = 0.26,
    height: number = 1.8
  ): boolean {
    if (!this.checkAABBCollision(pos.x, pos.y, pos.z, halfWidth, height)) {
      return false; // Not stuck
    }

    // 1. Try nudging upward to the nearest open space above
    for (let dy = 0.1; dy <= 2.2; dy += 0.1) {
      if (!this.checkAABBCollision(pos.x, pos.y + dy, pos.z, halfWidth, height)) {
        pos.y += dy;
        return true;
      }
    }

    // 2. Try horizontal nudges in 4 cardinal directions (+X, -X, +Z, -Z)
    const offsets = [
      [0.35, 0],
      [-0.35, 0],
      [0, 0.35],
      [0, -0.35],
      [0.55, 0],
      [-0.55, 0],
      [0, 0.55],
      [0, -0.55],
      [0.35, 0.35],
      [-0.35, -0.35],
      [0.35, -0.35],
      [-0.35, 0.35],
    ];

    for (const [ox, oz] of offsets) {
      if (!this.checkAABBCollision(pos.x + ox, pos.y, pos.z + oz, halfWidth, height)) {
        pos.x += ox;
        pos.z += oz;
        return true;
      }
      // Try horizontal nudge with slight lift
      if (!this.checkAABBCollision(pos.x + ox, pos.y + 0.5, pos.z + oz, halfWidth, height)) {
        pos.x += ox;
        pos.y += 0.5;
        pos.z += oz;
        return true;
      }
    }

    // 3. Last resort: Find topmost open air block in this vertical column
    const bx = Math.floor(pos.x);
    const bz = Math.floor(pos.z);
    for (let y = Math.floor(pos.y); y < 60; y++) {
      if (!this.isSolid(bx, y, bz) && !this.isSolid(bx, y + 1, bz)) {
        pos.y = y + 0.05;
        return true;
      }
    }

    return false;
  }

  // AABB collision detection & resolution
  // Player bounds: width ~0.52 (halfWidth 0.26), height ~1.8
  public moveWithCollision(
    pos: THREE.Vector3,
    velocity: THREE.Vector3,
    dt: number,
    halfWidth: number = 0.26,
    height: number = 1.8
  ): { onGround: boolean; inWater: boolean; stepped: boolean } {
    let onGround = false;
    let inWater = false;
    let stepped = false;

    // Check if player is currently in water
    inWater = this.isInWater(pos.x, pos.y + 0.5, pos.z);

    // 0. Pre-movement unstick: If currently stuck inside a solid block, push out immediately
    this.resolveOverlap(pos, halfWidth, height);

    // 1. Apply X movement with auto-step
    const dx = velocity.x * dt;
    if (dx !== 0) {
      const newX = pos.x + dx;
      if (!this.checkAABBCollision(newX, pos.y, pos.z, halfWidth, height)) {
        pos.x = newX;
      } else {
        // Auto-step over slopes and 1-block steps (smooth climbing up to 1.05m)
        let stepResolved = false;
        const stepHeights = [0.55, 1.05];
        for (const step of stepHeights) {
          if (!this.checkAABBCollision(newX, pos.y + step, pos.z, halfWidth, height)) {
            pos.x = newX;
            pos.y += step;
            stepped = true;
            stepResolved = true;
            break;
          }
        }
        if (!stepResolved) {
          velocity.x = 0;
        }
      }
    }

    // 2. Apply Z movement with auto-step
    const dz = velocity.z * dt;
    if (dz !== 0) {
      const newZ = pos.z + dz;
      if (!this.checkAABBCollision(pos.x, pos.y, newZ, halfWidth, height)) {
        pos.z = newZ;
      } else {
        let stepResolved = false;
        const stepHeights = [0.55, 1.05];
        for (const step of stepHeights) {
          if (!this.checkAABBCollision(pos.x, pos.y + step, newZ, halfWidth, height)) {
            pos.z = newZ;
            pos.y += step;
            stepped = true;
            stepResolved = true;
            break;
          }
        }
        if (!stepResolved) {
          velocity.z = 0;
        }
      }
    }

    // 3. Apply Y movement
    const dy = velocity.y * dt;
    if (dy !== 0) {
      const newY = pos.y + dy;
      if (!this.checkAABBCollision(pos.x, newY, pos.z, halfWidth, height)) {
        pos.y = newY;
      } else {
        if (dy < 0) {
          // Landing on floor: clean snap to top of solid block
          onGround = true;
          pos.y = Math.floor(newY) + 1.0;
          while (this.checkAABBCollision(pos.x, pos.y, pos.z, halfWidth, height)) {
            pos.y += 0.02;
          }
        } else {
          // Hit ceiling: snap right below ceiling block
          pos.y = Math.floor(newY + height) - height - 0.01;
        }
        velocity.y = 0;
      }
    }

    // Secondary ground probe check
    if (!onGround && velocity.y <= 0) {
      if (this.checkAABBCollision(pos.x, pos.y - 0.08, pos.z, halfWidth, height)) {
        onGround = true;
      }
    }

    // Final safety check: ensure player is never embedded in geometry
    this.resolveOverlap(pos, halfWidth, height);

    return { onGround, inWater, stepped };
  }

  // Check if box centered at (x, y, z) with dimensions (2*halfWidth, height, 2*halfWidth) intersects solid voxels
  public checkAABBCollision(
    cx: number,
    baseY: number,
    cz: number,
    halfWidth: number,
    height: number
  ): boolean {
    const minX = Math.floor(cx - halfWidth);
    const maxX = Math.floor(cx + halfWidth);
    const minY = Math.floor(baseY);
    const maxY = Math.floor(baseY + height - 0.05);
    const minZ = Math.floor(cz - halfWidth);
    const maxZ = Math.floor(cz + halfWidth);

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        for (let z = minZ; z <= maxZ; z++) {
          if (this.isSolid(x, y, z)) {
            return true;
          }
        }
      }
    }
    return false;
  }
}
