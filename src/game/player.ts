import * as THREE from 'three';
import { BlockType, ItemStack, VoxelRaycastHit } from '../types/game';
import { BLOCK_PROPERTIES, ITEMS } from './constants';
import { World } from './world';
import { Physics } from './physics';
import { MobManager } from './mobs';
import { sounds } from './audio';

export class Player {
  public camera: THREE.PerspectiveCamera;
  public world: World;
  public physics: Physics;
  public mobManager: MobManager;

  // Transform & Physics
  public position: THREE.Vector3 = new THREE.Vector3(0, 30, 0);
  public velocity: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  public pitch: number = 0; // look up/down in radians
  public yaw: number = 0; // look left/right in radians
  public onGround: boolean = false;
  public inWater: boolean = false;
  public fallStartY: number = 30;

  // Survival Stats
  public gameMode: 'survival' | 'creative' = 'survival';
  public health: number = 20;
  public maxHealth: number = 20;
  public hunger: number = 20;
  public maxHunger: number = 20;
  public oxygen: number = 20;
  public maxOxygen: number = 20;
  public oxygenTimer: number = 0;
  public hungerTimer: number = 0;
  public regenTimer: number = 0;
  public starvationTimer: number = 0;
  public isDead: boolean = false;

  // Head bobbing & realism
  public headBobTimer: number = 0;
  public heldTorchLight: THREE.PointLight;

  // Inventory: 9 hotbar slots (0-8) + 27 main inventory slots (9-35)
  public inventory: (ItemStack | null)[] = new Array(36).fill(null);
  public selectedHotbarIndex: number = 0;

  // Mining state
  public miningProgress: number = 0; // 0.0 to 1.0
  public currentTargetBlock: [number, number, number] | null = null;
  public isMining: boolean = false;

  // Hand / Tool swinging
  public swingProgress: number = 0;
  public isSwinging: boolean = false;
  public handGroup: THREE.Group;
  private handItemMesh: THREE.Mesh | null = null;

  // Wireframe block outline for targeted block
  public targetOutlineMesh: THREE.LineSegments;

  // Movement input flags
  public moveForward: boolean = false;
  public moveBackward: boolean = false;
  public moveLeft: boolean = false;
  public moveRight: boolean = false;
  public isJumping: boolean = false;
  public isSprinting: boolean = false;

  // Step sound timer
  private stepTimer: number = 0;

  constructor(
    camera: THREE.PerspectiveCamera,
    world: World,
    physics: Physics,
    mobManager: MobManager,
    scene: THREE.Scene
  ) {
    this.camera = camera;
    this.world = world;
    this.physics = physics;
    this.mobManager = mobManager;

    // Create 3D wireframe box for highlighting target block
    const boxGeom = new THREE.BoxGeometry(1.002, 1.002, 1.002);
    const edgesGeom = new THREE.EdgesGeometry(boxGeom);
    this.targetOutlineMesh = new THREE.LineSegments(
      edgesGeom,
      new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2, transparent: true, opacity: 0.75 })
    );
    this.targetOutlineMesh.visible = false;
    scene.add(this.targetOutlineMesh);

    // Setup first-person hand
    this.handGroup = new THREE.Group();
    this.camera.add(this.handGroup);
    this.setupHand();

    // Held Torch Light (travels with player when holding a torch)
    this.heldTorchLight = new THREE.PointLight(0xffa500, 0, 16, 1.4);
    this.camera.add(this.heldTorchLight);

    // Populate initial starter items
    this.inventory[0] = { itemId: 'wooden_pickaxe', count: 1 };
    this.inventory[1] = { itemId: 'wooden_axe', count: 1 };
    this.inventory[2] = { itemId: 'torch', count: 16 };
    this.inventory[3] = { itemId: 'apple', count: 5 };
  }

  // Calculate total armor protection points (0 to 20)
  public getArmorPoints(): number {
    let total = 0;
    for (let i = 0; i < 36; i++) {
      const slot = this.inventory[i];
      if (slot) {
        const def = ITEMS[slot.itemId];
        if (def && def.armorPoints) {
          total += def.armorPoints;
        }
      }
    }
    return Math.min(20, total);
  }

  private setupHand(): void {
    // Basic arm block
    const armGeom = new THREE.BoxGeometry(0.18, 0.45, 0.18);
    const armMat = new THREE.MeshLambertMaterial({ color: 0xd4a373 }); // skin tone
    const arm = new THREE.Mesh(armGeom, armMat);
    arm.position.set(0.35, -0.35, -0.6);
    arm.rotation.set(-0.2, -0.1, 0.2);
    arm.name = 'arm';
    this.handGroup.add(arm);
  }

  // Update hand appearance to reflect current held item
  public updateHeldItem(): void {
    const currentItem = this.getHeldItem();

    if (this.handItemMesh) {
      this.handGroup.remove(this.handItemMesh);
      this.handItemMesh.geometry.dispose();
      this.handItemMesh = null;
    }

    if (!currentItem) {
      this.heldTorchLight.intensity = 0;
      return;
    }

    const def = ITEMS[currentItem.itemId];
    if (!def) return;

    // If holding torch, activate held torch point light
    if (currentItem.itemId === 'torch') {
      this.heldTorchLight.intensity = 1.6;
    } else {
      this.heldTorchLight.intensity = 0;
    }

    if (def.type === 'block') {
      // Show mini block in hand
      const geom = new THREE.BoxGeometry(0.18, 0.18, 0.18);
      const mat = new THREE.MeshLambertMaterial({ color: def.color || 0x888888 });
      this.handItemMesh = new THREE.Mesh(geom, mat);
      this.handItemMesh.position.set(0.32, -0.22, -0.55);
      this.handGroup.add(this.handItemMesh);
    } else if (def.type === 'sword') {
      // 3D Sword model (blade + guard + hilt)
      const swordGroup = new THREE.Group();
      const bladeGeom = new THREE.BoxGeometry(0.06, 0.42, 0.02);
      const bladeMat = new THREE.MeshLambertMaterial({ color: def.color || 0xcccccc });
      const blade = new THREE.Mesh(bladeGeom, bladeMat);
      blade.position.y = 0.22;
      swordGroup.add(blade);

      const guardGeom = new THREE.BoxGeometry(0.16, 0.03, 0.04);
      const guardMat = new THREE.MeshLambertMaterial({ color: 0x8d6e63 });
      const guard = new THREE.Mesh(guardGeom, guardMat);
      swordGroup.add(guard);

      swordGroup.position.set(0.32, -0.18, -0.58);
      swordGroup.rotation.set(-0.5, 0.2, 0.2);
      this.handItemMesh = swordGroup as any;
      this.handGroup.add(swordGroup);
    } else if (def.type === 'pickaxe') {
      // 3D Pickaxe model
      const pickGroup = new THREE.Group();
      const handleGeom = new THREE.BoxGeometry(0.04, 0.42, 0.04);
      const handleMat = new THREE.MeshLambertMaterial({ color: 0x8d6e63 });
      const handle = new THREE.Mesh(handleGeom, handleMat);
      pickGroup.add(handle);

      const headGeom = new THREE.BoxGeometry(0.24, 0.05, 0.05);
      const headMat = new THREE.MeshLambertMaterial({ color: def.color || 0x888888 });
      const head = new THREE.Mesh(headGeom, headMat);
      head.position.y = 0.2;
      pickGroup.add(head);

      pickGroup.position.set(0.32, -0.18, -0.58);
      pickGroup.rotation.set(-0.5, 0.2, 0.2);
      this.handItemMesh = pickGroup as any;
      this.handGroup.add(pickGroup);
    } else {
      // General item rod / food
      const geom = new THREE.BoxGeometry(0.12, 0.18, 0.12);
      const mat = new THREE.MeshLambertMaterial({ color: def.color || 0xcccccc });
      this.handItemMesh = new THREE.Mesh(geom, mat);
      this.handItemMesh.position.set(0.32, -0.2, -0.55);
      this.handGroup.add(this.handItemMesh);
    }
  }

  public getHeldItem(): ItemStack | null {
    return this.inventory[this.selectedHotbarIndex] || null;
  }

  // Add item stack to player inventory (stacks with existing items first)
  public addItem(itemId: string, count: number): boolean {
    const def = ITEMS[itemId];
    const maxStack = def ? def.maxStack : 64;

    // 1. Try stacking onto existing slots
    for (let i = 0; i < 36; i++) {
      const slot = this.inventory[i];
      if (slot && slot.itemId === itemId && slot.count < maxStack) {
        const canAdd = Math.min(count, maxStack - slot.count);
        slot.count += canAdd;
        count -= canAdd;
        if (count <= 0) {
          this.updateHeldItem();
          return true;
        }
      }
    }

    // 2. Place in first empty slot
    for (let i = 0; i < 36; i++) {
      if (!this.inventory[i]) {
        const toAdd = Math.min(count, maxStack);
        this.inventory[i] = { itemId, count: toAdd };
        count -= toAdd;
        if (count <= 0) {
          this.updateHeldItem();
          return true;
        }
      }
    }

    this.updateHeldItem();
    return count <= 0;
  }

  // Remove count of itemId from inventory
  public removeItem(itemId: string, count: number): boolean {
    let remaining = count;
    for (let i = 0; i < 36; i++) {
      const slot = this.inventory[i];
      if (slot && slot.itemId === itemId) {
        if (slot.count > remaining) {
          slot.count -= remaining;
          remaining = 0;
          break;
        } else {
          remaining -= slot.count;
          this.inventory[i] = null;
        }
      }
    }
    this.updateHeldItem();
    return remaining === 0;
  }

  // Count how many of an item the player has in total
  public getItemCount(itemId: string): number {
    let total = 0;
    for (let i = 0; i < 36; i++) {
      const slot = this.inventory[i];
      if (slot && slot.itemId === itemId) {
        total += slot.count;
      }
    }
    return total;
  }

  // Consolidate partial stacks and sort backpack slots (9-35)
  public sortInventory(): void {
    // 1. Extract all items from slots 9 to 35
    const items: { itemId: string; count: number }[] = [];
    for (let i = 9; i < 36; i++) {
      if (this.inventory[i]) {
        items.push({ ...this.inventory[i]! });
        this.inventory[i] = null;
      }
    }

    // 2. Consolidate matching item types into full stacks
    const consolidatedMap = new Map<string, number>();
    for (const item of items) {
      consolidatedMap.set(item.itemId, (consolidatedMap.get(item.itemId) || 0) + item.count);
    }

    // 3. Sort keys: blocks first, then tools, then materials, then food
    const sortedEntries = Array.from(consolidatedMap.entries()).sort(([idA], [idB]) => {
      const defA = ITEMS[idA];
      const defB = ITEMS[idB];
      const typeRank = (type?: string) => {
        if (type === 'block') return 1;
        if (type === 'pickaxe' || type === 'axe' || type === 'shovel' || type === 'sword') return 2;
        if (type === 'food') return 3;
        return 4;
      };
      const rankDiff = typeRank(defA?.type) - typeRank(defB?.type);
      if (rankDiff !== 0) return rankDiff;
      return idA.localeCompare(idB);
    });

    // 4. Fill back into slots 9 to 35
    let currentSlot = 9;
    for (const [itemId, totalCount] of sortedEntries) {
      const def = ITEMS[itemId];
      const maxStack = def ? def.maxStack : 64;
      let left = totalCount;
      while (left > 0 && currentSlot < 36) {
        const take = Math.min(left, maxStack);
        this.inventory[currentSlot++] = { itemId, count: take };
        left -= take;
      }
    }

    this.updateHeldItem();
  }

  // Drop an item stack or 1 item from slot into the 3D world as a physics item
  public dropSlotItem(slotIdx: number, dropCount?: number): void {
    const slot = this.inventory[slotIdx];
    if (!slot) return;

    const countToDrop = dropCount !== undefined ? Math.min(slot.count, dropCount) : slot.count;
    if (countToDrop <= 0) return;

    // Spawn in front of player
    const dir = new THREE.Vector3(0, 0, -1).applyEuler(this.camera.rotation);
    const dropPos = this.camera.position.clone().add(dir.clone().multiplyScalar(1.2));
    this.world.spawnDroppedItem(slot.itemId, countToDrop, dropPos.x, dropPos.y, dropPos.z);

    slot.count -= countToDrop;
    if (slot.count <= 0) {
      this.inventory[slotIdx] = null;
    }
    this.updateHeldItem();
    sounds.playPop();
  }

  // Quick transfer slot between Hotbar (0..8) and Backpack (9..35)
  public quickTransferSlot(slotIdx: number): boolean {
    const slot = this.inventory[slotIdx];
    if (!slot) return false;

    const isHotbar = slotIdx < 9;
    const targetStart = isHotbar ? 9 : 0;
    const targetEnd = isHotbar ? 36 : 9;

    const def = ITEMS[slot.itemId];
    const maxStack = def ? def.maxStack : 64;

    // First try merging into existing matching stacks in target region
    for (let i = targetStart; i < targetEnd; i++) {
      const target = this.inventory[i];
      if (target && target.itemId === slot.itemId && target.count < maxStack) {
        const canAdd = Math.min(slot.count, maxStack - target.count);
        target.count += canAdd;
        slot.count -= canAdd;
        if (slot.count <= 0) {
          this.inventory[slotIdx] = null;
          this.updateHeldItem();
          sounds.playPop();
          return true;
        }
      }
    }

    // Then find first empty slot in target region
    for (let i = targetStart; i < targetEnd; i++) {
      if (!this.inventory[i]) {
        this.inventory[i] = { ...slot };
        this.inventory[slotIdx] = null;
        this.updateHeldItem();
        sounds.playPop();
        return true;
      }
    }

    this.updateHeldItem();
    return false;
  }

  // Raycast from camera center to find target voxel
  public getTargetHit(): VoxelRaycastHit {
    const dir = new THREE.Vector3(0, 0, -1);
    dir.applyEuler(this.camera.rotation);
    return this.physics.raycast(this.camera.position, dir, 5.5);
  }

  // Trigger weapon / hand swing
  public swing(): void {
    this.isSwinging = true;
    this.swingProgress = 0;
    sounds.playSwing();
  }

  // Perform Attack on Mobs or Digging on Block
  public handleLeftClick(): void {
    this.swing();

    // Check if aiming directly at a mob first
    const dir = new THREE.Vector3(0, 0, -1).applyEuler(this.camera.rotation);
    const camPos = this.camera.position;

    let hitMob: any = null;
    let closestDist = 4.2;

    for (const mob of this.mobManager.mobs) {
      const toMob = new THREE.Vector3(mob.x - camPos.x, mob.y + 0.8 - camPos.y, mob.z - camPos.z);
      const dist = toMob.length();
      if (dist < closestDist) {
        const dot = toMob.clone().normalize().dot(dir);
        if (dot > 0.82) {
          // looking directly at mob
          hitMob = mob;
          closestDist = dist;
        }
      }
    }

    if (hitMob) {
      // Calculate weapon damage
      const held = this.getHeldItem();
      const def = held ? ITEMS[held.itemId] : null;
      const dmg = def && def.damage ? def.damage : 1;

      this.mobManager.damageMob(hitMob.id, dmg, this.position);
      return;
    }

    // Otherwise, start mining block
    this.isMining = true;
  }

  public stopLeftClick(): void {
    this.isMining = false;
    this.miningProgress = 0;
    this.currentTargetBlock = null;
  }

  // Handle right click: place block, interact with villager, or eat food
  public handleRightClick(): void {
    // 0. Check if interacting with Villager in front of player
    const dir = new THREE.Vector3(0, 0, -1).applyEuler(this.camera.rotation);
    const camPos = this.camera.position;
    for (const mob of this.mobManager.mobs) {
      if (mob.type === 'villager' && mob.health > 0) {
        const toMob = new THREE.Vector3(mob.x - camPos.x, mob.y + 1.0 - camPos.y, mob.z - camPos.z);
        const dist = toMob.length();
        if (dist < 3.8 && toMob.clone().normalize().dot(dir) > 0.78) {
          // Greet with iconic villager sound
          sounds.playVillager();
          mob.yaw = Math.atan2(camPos.x - mob.x, camPos.z - mob.z); // Turn towards player

          // Emerald Trade: trade 1 Emerald for 4 fresh Breads
          const heldItem = this.getHeldItem();
          if (heldItem && heldItem.itemId === 'emerald' && heldItem.count >= 1) {
            heldItem.count -= 1;
            if (heldItem.count <= 0) {
              this.inventory[this.selectedHotbarIndex] = null;
            }
            this.updateHeldItem();
            sounds.playPop();
            this.addItem('bread', 4);
            this.world.spawnBreakParticles(mob.x, mob.y + 1.2, mob.z, 0x2ec4b6);
          }
          this.swing();
          return;
        }
      }
    }

    const held = this.getHeldItem();
    if (!held) return;

    const def = ITEMS[held.itemId];
    if (!def) return;

    // 1. Food: Eat if hungry or health down
    if (def.type === 'food' && (this.hunger < this.maxHunger || this.health < this.maxHealth)) {
      this.hunger = Math.min(this.maxHunger, this.hunger + (def.foodRestore || 4));
      this.health = Math.min(this.maxHealth, this.health + 2);
      held.count -= 1;
      if (held.count <= 0) {
        this.inventory[this.selectedHotbarIndex] = null;
      }
      this.updateHeldItem();
      sounds.playEat();
      this.swing();
      return;
    }

    // 2. Structure Kit: Deploy crafted prefab structure into the voxel world!
    if (def.type === 'structure') {
      const hit = this.getTargetHit();
      if (hit.hit) {
        const [targetX, targetY, targetZ] = hit.adjacent;
        const placed = this.deployStructure(held.itemId, targetX, targetY, targetZ);
        if (placed) {
          sounds.playCraft();
          this.swing();
          if (this.gameMode !== 'creative') {
            held.count -= 1;
            if (held.count <= 0) {
              this.inventory[this.selectedHotbarIndex] = null;
            }
            this.updateHeldItem();
          }
        }
        return;
      }
    }

    // 3. Block: Place block
    if (def.type === 'block' && def.blockType !== undefined) {
      const hit = this.getTargetHit();
      if (hit.hit) {
        let [ax, ay, az] = hit.adjacent;

        // If target block is flower, replace it directly
        if (hit.blockType === BlockType.RED_FLOWER || hit.blockType === BlockType.YELLOW_FLOWER) {
          ax = hit.voxel[0];
          ay = hit.voxel[1];
          az = hit.voxel[2];
        }

        // Check if block placement collides with player's bounding box
        const playerMinX = this.position.x - 0.28;
        const playerMaxX = this.position.x + 0.28;
        const playerMinY = this.position.y;
        const playerMaxY = this.position.y + 1.8;
        const playerMinZ = this.position.z - 0.28;
        const playerMaxZ = this.position.z + 0.28;

        const overlapsPlayer =
          ax + 1 > playerMinX &&
          ax < playerMaxX &&
          ay + 1 > playerMinY &&
          ay < playerMaxY &&
          az + 1 > playerMinZ &&
          az < playerMaxZ;

        // If placing block directly under feet while jumping / in air (towering):
        const isPlacingUnderFeet =
          ax === Math.floor(this.position.x) &&
          az === Math.floor(this.position.z) &&
          ay === Math.floor(this.position.y);

        if (overlapsPlayer && isPlacingUnderFeet && this.position.y >= ay) {
          // Towering: place block and boost player smoothly above the new block
          this.world.setBlock(ax, ay, az, def.blockType);
          this.position.y = ay + 1.0;
          this.physics.resolveOverlap(this.position, 0.26, 1.8);
          sounds.playBlockPlace();
          this.swing();
          if (this.gameMode !== 'creative') {
            held.count -= 1;
            if (held.count <= 0) {
              this.inventory[this.selectedHotbarIndex] = null;
            }
            this.updateHeldItem();
          }
          return;
        }

        if (!overlapsPlayer) {
          this.world.setBlock(ax, ay, az, def.blockType);
          // Safety: ensure player never gets embedded in placed block
          this.physics.resolveOverlap(this.position, 0.26, 1.8);
          sounds.playBlockPlace();
          this.swing();

          if (this.gameMode !== 'creative') {
            held.count -= 1;
            if (held.count <= 0) {
              this.inventory[this.selectedHotbarIndex] = null;
            }
            this.updateHeldItem();
          }
        }
      }
    }
  }

  // Update mining progress when holding left click
  private updateMining(dt: number): void {
    if (!this.isMining) return;

    const hit = this.getTargetHit();
    if (!hit.hit) {
      this.miningProgress = 0;
      this.currentTargetBlock = null;
      return;
    }

    const [bx, by, bz] = hit.voxel;

    // If switched target block, reset progress
    if (
      !this.currentTargetBlock ||
      this.currentTargetBlock[0] !== bx ||
      this.currentTargetBlock[1] !== by ||
      this.currentTargetBlock[2] !== bz
    ) {
      this.currentTargetBlock = [bx, by, bz];
      this.miningProgress = 0;
    }

    const blockType = hit.blockType;
    const prop = BLOCK_PROPERTIES[blockType];
    const hardness = prop ? prop.hardness : 1.0;

    if (hardness >= 999999) return; // Unbreakable (Bedrock)

    // Instant break in creative mode
    if (this.gameMode === 'creative') {
      this.miningProgress = 1.0;
    } else {
      // Calculate mining speed modifier
      const held = this.getHeldItem();
      const itemDef = held ? ITEMS[held.itemId] : null;

      let speed = 1.0;
      if (itemDef && prop.preferredTool && itemDef.type === prop.preferredTool) {
        speed = itemDef.miningSpeed || 2.0;
      }

      // Time to break: base hardness / speed
      const breakTime = Math.max(0.1, hardness / speed);
      this.miningProgress += dt / breakTime;

      // Particle crumbs while mining
      if (Math.random() < 0.3) {
        sounds.playBlockBreak('dirt');
      }
    }

    // Check if fully mined
    if (this.miningProgress >= 1.0) {
      this.world.setBlock(bx, by, bz, BlockType.AIR);
      this.world.spawnBreakParticles(bx, by, bz);

      // Determine drop item
      let drop = prop.dropItem || 'dirt';
      if (blockType === BlockType.LEAVES) {
        if (Math.random() < 0.25) drop = 'apple';
        else drop = '';
      }

      // Spawn realistic 3D floating dropped item
      if (drop) {
        this.world.spawnDroppedItem(drop, prop.dropCount || 1, bx + 0.5, by + 0.5, bz + 0.5);
      }

      sounds.playBlockBreak('stone');
      this.miningProgress = 0;
      this.currentTargetBlock = null;
    }
  }

  // Update player physics, survival, stats and camera
  public update(dt: number): void {
    if (this.isDead) return;

    if (this.gameMode === 'creative') {
      this.health = this.maxHealth;
      this.hunger = this.maxHunger;
      this.oxygen = this.maxOxygen;
    }

    // 1. Camera orientation from yaw/pitch
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;

    // 2. Calculate movement direction from inputs
    const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
    const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);

    const moveDir = new THREE.Vector3(0, 0, 0);
    if (this.moveForward) moveDir.add(forward);
    if (this.moveBackward) moveDir.sub(forward);
    if (this.moveRight) moveDir.add(right);
    if (this.moveLeft) moveDir.sub(right);

    if (moveDir.lengthSq() > 0) {
      moveDir.normalize();
    }

    // Movement speed
    let baseSpeed = this.isSprinting && this.hunger > 6 ? 7.2 : 4.6;
    if (this.inWater) baseSpeed *= 0.55;

    // Apply horizontal acceleration & friction
    const accel = this.onGround ? 45 : 18;
    this.velocity.x += (moveDir.x * baseSpeed - this.velocity.x) * accel * dt;
    this.velocity.z += (moveDir.z * baseSpeed - this.velocity.z) * accel * dt;

    // Gravity & jumping
    if (this.inWater) {
      // Swimming
      if (this.isJumping) {
        this.velocity.y = 3.5;
      } else {
        this.velocity.y += (-3.0 - this.velocity.y) * 4 * dt;
      }
    } else {
      if (this.onGround) {
        // Fall damage calculation (mitigated by armor)
        if (this.fallStartY - this.position.y > 3.5) {
          const fallBlocks = this.fallStartY - this.position.y;
          let damage = Math.floor(fallBlocks - 3);
          const armorReduction = 1 - (this.getArmorPoints() * 0.035);
          damage = Math.max(1, Math.floor(damage * armorReduction));
          if (damage > 0) {
            this.health = Math.max(0, this.health - damage);
            sounds.playHurt();
          }
        }
        this.fallStartY = this.position.y;

        if (this.isJumping) {
          this.velocity.y = 8.5; // Jump velocity
          sounds.playJump();
          this.onGround = false;
        }
      } else {
        this.velocity.y -= 25.0 * dt; // Gravity
      }
    }

    // Move player with voxel collision detection
    const col = this.physics.moveWithCollision(this.position, this.velocity, dt, 0.26, 1.8);
    this.onGround = col.onGround;
    this.inWater = col.inWater;

    // Head bobbing calculation for realism
    let bobOffset = 0;
    if (this.onGround && moveDir.lengthSq() > 0.05) {
      this.headBobTimer += dt * (this.isSprinting ? 14 : 9);
      bobOffset = Math.sin(this.headBobTimer) * (this.isSprinting ? 0.05 : 0.03);
    } else {
      this.headBobTimer = 0;
    }

    // Position camera at player eye height + bobbing
    this.camera.position.set(this.position.x, this.position.y + 1.62 + bobOffset, this.position.z);

    // Footsteps sound
    if (this.onGround && moveDir.lengthSq() > 0.05) {
      this.stepTimer += dt * (this.isSprinting ? 2.8 : 1.8);
      if (this.stepTimer > 1.0) {
        this.stepTimer = 0;
        sounds.playFootstep();
      }
    }

    // 3. Underwater Oxygen & Drowning Realism
    const headBlock = this.world.getBlock(
      Math.floor(this.position.x),
      Math.floor(this.position.y + 1.5),
      Math.floor(this.position.z)
    );
    const isHeadInWater = headBlock === BlockType.WATER;

    if (isHeadInWater) {
      this.oxygenTimer += dt;
      if (this.oxygenTimer > 1.2) {
        this.oxygenTimer = 0;
        this.oxygen = Math.max(0, this.oxygen - 1);
        if (this.oxygen <= 0) {
          // Drowning damage
          this.health = Math.max(0, this.health - 2);
          sounds.playHurt();
        }
      }
    } else {
      // Surface: restore oxygen rapidly
      this.oxygen = Math.min(this.maxOxygen, this.oxygen + dt * 10);
      this.oxygenTimer = 0;
    }

    // 4. Update dropped items collection
    this.world.updateDroppedItems(dt, this.position, (itemId, count) => {
      return this.addItem(itemId, count);
    });

    // 5. Update dynamic torch lighting around player
    this.world.updateTorchLighting(this.position.x, this.position.y, this.position.z, performance.now() * 0.001);

    // 6. Mining progress
    this.updateMining(dt);

    // 4. Update target outline wireframe box
    const hit = this.getTargetHit();
    if (hit.hit) {
      this.targetOutlineMesh.visible = true;
      this.targetOutlineMesh.position.set(
        hit.voxel[0] + 0.5,
        hit.voxel[1] + 0.5,
        hit.voxel[2] + 0.5
      );
    } else {
      this.targetOutlineMesh.visible = false;
    }

    // 5. Hand swing animation
    if (this.isSwinging) {
      this.swingProgress += dt * 8.0;
      const angle = Math.sin(this.swingProgress * Math.PI) * 0.7;
      this.handGroup.rotation.x = -angle;
      this.handGroup.rotation.y = angle * 0.4;
      if (this.swingProgress >= 1.0) {
        this.isSwinging = false;
        this.handGroup.rotation.set(0, 0, 0);
      }
    }

    // 6. Survival: Hunger and Regeneration timers
    this.hungerTimer += dt;
    if (this.hungerTimer > 12.0) {
      this.hungerTimer = 0;
      if (this.isSprinting && moveDir.lengthSq() > 0) {
        this.hunger = Math.max(0, this.hunger - 1);
      } else if (Math.random() < 0.3) {
        this.hunger = Math.max(0, this.hunger - 1);
      }
    }

    // Health Regeneration when full
    if (this.hunger >= 16 && this.health < this.maxHealth) {
      this.regenTimer += dt;
      if (this.regenTimer > 3.0) {
        this.regenTimer = 0;
        this.health = Math.min(this.maxHealth, this.health + 1);
      }
    } else {
      this.regenTimer = 0;
    }

    // Starvation damage if hunger hits 0
    if (this.hunger <= 0) {
      this.starvationTimer += dt;
      if (this.starvationTimer > 4.0) {
        this.starvationTimer = 0;
        this.health = Math.max(0, this.health - 1);
        sounds.playHurt();
      }
    }

    if (this.health <= 0) {
      this.health = 0;
      this.isDead = true;
      if (document.pointerLockElement) {
        document.exitPointerLock();
      }
    }
  }

  // Deploy crafted prefab structure into the voxel world
  public deployStructure(structureId: string, bx: number, by: number, bz: number): boolean {
    const yaw = this.yaw;
    const fx = -Math.sin(yaw);
    const fz = -Math.cos(yaw);
    const dirX = Math.abs(fx) > Math.abs(fz) ? (fx > 0 ? 1 : -1) : 0;
    const dirZ = dirX === 0 ? (fz > 0 ? 1 : -1) : 0;

    if (structureId === 'structure_shelter') {
      // 5x5 Cottage
      const cx = bx + dirX * 3;
      const cz = bz + dirZ * 3;
      const cy = by;

      // Floor & ground leveling
      for (let x = -2; x <= 2; x++) {
        for (let z = -2; z <= 2; z++) {
          this.world.setBlock(cx + x, cy - 1, cz + z, BlockType.COBBLESTONE);
          // Roof
          this.world.setBlock(cx + x, cy + 3, cz + z, BlockType.PLANKS);
        }
      }

      // Corner pillars
      for (let y = 0; y <= 2; y++) {
        this.world.setBlock(cx - 2, cy + y, cz - 2, BlockType.WOOD);
        this.world.setBlock(cx + 2, cy + y, cz - 2, BlockType.WOOD);
        this.world.setBlock(cx - 2, cy + y, cz + 2, BlockType.WOOD);
        this.world.setBlock(cx + 2, cy + y, cz + 2, BlockType.WOOD);
      }

      // Outer walls & hollow inside
      for (let y = 0; y <= 2; y++) {
        for (let x = -1; x <= 1; x++) {
          this.world.setBlock(cx + x, cy + y, cz - 2, BlockType.PLANKS);
          this.world.setBlock(cx + x, cy + y, cz + 2, BlockType.PLANKS);
        }
        for (let z = -1; z <= 1; z++) {
          this.world.setBlock(cx - 2, cy + y, cz + z, BlockType.PLANKS);
          this.world.setBlock(cx + 2, cy + y, cz + z, BlockType.PLANKS);
        }
        for (let x = -1; x <= 1; x++) {
          for (let z = -1; z <= 1; z++) {
            this.world.setBlock(cx + x, cy + y, cz + z, BlockType.AIR);
          }
        }
      }

      // Windows
      this.world.setBlock(cx - 2, cy + 1, cz, BlockType.GLASS);
      this.world.setBlock(cx + 2, cy + 1, cz, BlockType.GLASS);

      // Door opening facing player
      this.world.setBlock(cx - dirX * 2, cy, cz - dirZ * 2, BlockType.AIR);
      this.world.setBlock(cx - dirX * 2, cy + 1, cz - dirZ * 2, BlockType.AIR);

      // Interior furniture
      this.world.setBlock(cx + dirZ, cy, cz - dirX, BlockType.CRAFTING_TABLE);
      this.world.setBlock(cx - dirZ, cy, cz + dirX, BlockType.BOOKSHELF);
      this.world.setBlock(cx, cy + 2, cz, BlockType.TORCH);

      this.world.spawnBreakParticles(cx, cy + 1, cz, 0x8b5a2b);
      return true;
    }

    if (structureId === 'structure_watchtower') {
      // 3x3 Fortified Tower (9 blocks high)
      const cx = bx + dirX * 2;
      const cz = bz + dirZ * 2;
      const cy = by;

      for (let y = 0; y <= 7; y++) {
        for (let x = -1; x <= 1; x++) {
          for (let z = -1; z <= 1; z++) {
            const isBorder = Math.abs(x) === 1 || Math.abs(z) === 1;
            if (isBorder) {
              this.world.setBlock(cx + x, cy + y, cz + z, BlockType.COBBLESTONE);
            } else {
              this.world.setBlock(cx + x, cy + y, cz + z, BlockType.WOOD);
            }
          }
        }
      }

      // Door opening at bottom
      this.world.setBlock(cx - dirX, cy, cz - dirZ, BlockType.AIR);
      this.world.setBlock(cx - dirX, cy + 1, cz - dirZ, BlockType.AIR);

      // Top platform (y = 8)
      for (let x = -1; x <= 1; x++) {
        for (let z = -1; z <= 1; z++) {
          this.world.setBlock(cx + x, cy + 8, cz + z, BlockType.COBBLESTONE);
        }
      }

      // Battlements and 4 corner torches (y = 9..10)
      const corners = [
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ];
      for (const [cxo, czo] of corners) {
        this.world.setBlock(cx + cxo, cy + 9, cz + czo, BlockType.COBBLESTONE);
        this.world.setBlock(cx + cxo, cy + 10, cz + czo, BlockType.TORCH);
      }

      this.world.spawnBreakParticles(cx, cy + 4, cz, 0x6c757d);
      return true;
    }

    if (structureId === 'structure_bridge') {
      // 7-block Bridge extending in player's forward direction
      const stepX = dirX !== 0 ? dirX : 1;
      const stepZ = dirZ !== 0 ? dirZ : 0;
      const sideX = stepZ;
      const sideZ = stepX;

      for (let i = 0; i < 7; i++) {
        const curX = bx + stepX * i;
        const curZ = bz + stepZ * i;
        const curY = by;

        this.world.setBlock(curX, curY - 1, curZ, BlockType.COBBLESTONE);

        for (let w = -1; w <= 1; w++) {
          const px = curX + sideX * w;
          const pz = curZ + sideZ * w;
          this.world.setBlock(px, curY, pz, BlockType.PLANKS);
          this.world.setBlock(px, curY + 1, pz, BlockType.AIR);
          this.world.setBlock(px, curY + 2, pz, BlockType.AIR);
        }

        if (i === 0 || i === 6) {
          this.world.setBlock(curX + sideX, curY + 1, curZ + sideZ, BlockType.TORCH);
          this.world.setBlock(curX - sideX, curY + 1, curZ - sideZ, BlockType.TORCH);
        }
      }

      this.world.spawnBreakParticles(bx + stepX * 3, by, bz + stepZ * 3, 0xb08968);
      return true;
    }

    if (structureId === 'structure_well') {
      const cx = bx + dirX * 2;
      const cz = bz + dirZ * 2;
      const cy = by;

      for (let x = -1; x <= 2; x++) {
        for (let z = -1; z <= 2; z++) {
          const isEdge = x === -1 || x === 2 || z === -1 || z === 2;
          if (isEdge) {
            this.world.setBlock(cx + x, cy, cz + z, BlockType.COBBLESTONE);
            this.world.setBlock(cx + x, cy + 3, cz + z, BlockType.PLANKS);
          } else {
            this.world.setBlock(cx + x, cy - 1, cz + z, BlockType.WATER);
            this.world.setBlock(cx + x, cy, cz + z, BlockType.AIR);
            this.world.setBlock(cx + x, cy + 1, cz + z, BlockType.AIR);
            this.world.setBlock(cx + x, cy + 2, cz + z, BlockType.AIR);
            this.world.setBlock(cx + x, cy + 3, cz + z, BlockType.PLANKS);
          }
        }
      }

      // 4 Wood corner posts
      for (let y = 0; y <= 2; y++) {
        this.world.setBlock(cx - 1, cy + y, cz - 1, BlockType.WOOD);
        this.world.setBlock(cx + 2, cy + y, cz - 1, BlockType.WOOD);
        this.world.setBlock(cx - 1, cy + y, cz + 2, BlockType.WOOD);
        this.world.setBlock(cx + 2, cy + y, cz + 2, BlockType.WOOD);
      }

      this.world.setBlock(cx - 1, cy + 2, cz, BlockType.TORCH);
      this.world.setBlock(cx + 2, cy + 2, cz + 1, BlockType.TORCH);

      this.world.spawnBreakParticles(cx, cy + 1, cz, 0x495057);
      return true;
    }

    if (structureId === 'structure_campfire') {
      for (let x = -1; x <= 1; x++) {
        for (let z = -1; z <= 1; z++) {
          if (x === 0 && z === 0) {
            this.world.setBlock(bx, by, bz, BlockType.WOOD);
            this.world.setBlock(bx, by + 1, bz, BlockType.TORCH);
          } else {
            this.world.setBlock(bx + x, by, bz + z, BlockType.COBBLESTONE);
            this.world.setBlock(bx + x, by + 1, bz + z, BlockType.AIR);
          }
        }
      }
      this.world.spawnBreakParticles(bx, by + 1, bz, 0xff7b00);
      return true;
    }

    return false;
  }

  // Respawn after death
  public respawn(): void {
    const spawn = this.world.getSafeSpawn();
    this.position.set(spawn.x, spawn.y, spawn.z);
    this.velocity.set(0, 0, 0);
    this.fallStartY = spawn.y;
    this.health = this.maxHealth;
    this.hunger = this.maxHunger;
    this.oxygen = this.maxOxygen;
    this.oxygenTimer = 0;
    this.hungerTimer = 0;
    this.regenTimer = 0;
    this.starvationTimer = 0;
    this.isDead = false;
    this.stopLeftClick();
  }
}
