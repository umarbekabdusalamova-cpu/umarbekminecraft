import * as THREE from 'three';
import { MobEntity } from '../types/game';
import { World } from './world';
import { Physics } from './physics';
import { sounds } from './audio';

export class MobManager {
  private scene: THREE.Scene;
  private world: World;
  private physics: Physics;
  public mobs: MobEntity[] = [];
  private mobGroup: THREE.Group;
  private spawnTimer: number = 0;
  private maxMobs: number = 16;

  constructor(scene: THREE.Scene, world: World, physics: Physics) {
    this.scene = scene;
    this.world = world;
    this.physics = physics;

    this.mobGroup = new THREE.Group();
    this.scene.add(this.mobGroup);
  }

  // Create blocky 3D mesh for each mob type
  private createMobMesh(type: MobEntity['type']): THREE.Group {
    const group = new THREE.Group();

    if (type === 'crawler') {
      // Zombie-like green humanoid
      const bodyMat = new THREE.MeshLambertMaterial({ color: 0x2d6a4f }); // Forest green
      const shirtMat = new THREE.MeshLambertMaterial({ color: 0x457b9d }); // Blue tunic
      const pantsMat = new THREE.MeshLambertMaterial({ color: 0x1d3557 }); // Dark pants

      // Head
      const headGeom = new THREE.BoxGeometry(0.5, 0.5, 0.5);
      const head = new THREE.Mesh(headGeom, bodyMat);
      head.position.y = 1.6;
      head.name = 'head';
      group.add(head);

      // Torso
      const torsoGeom = new THREE.BoxGeometry(0.5, 0.7, 0.3);
      const torso = new THREE.Mesh(torsoGeom, shirtMat);
      torso.position.y = 1.05;
      group.add(torso);

      // Left Leg
      const legGeom = new THREE.BoxGeometry(0.2, 0.7, 0.2);
      const legL = new THREE.Mesh(legGeom, pantsMat);
      legL.position.set(-0.15, 0.35, 0);
      legL.name = 'legL';
      group.add(legL);

      // Right Leg
      const legR = new THREE.Mesh(legGeom, pantsMat);
      legR.position.set(0.15, 0.35, 0);
      legR.name = 'legR';
      group.add(legR);

      // Arms reaching forward
      const armGeom = new THREE.BoxGeometry(0.18, 0.6, 0.18);
      const armL = new THREE.Mesh(armGeom, bodyMat);
      armL.position.set(-0.35, 1.1, 0.25);
      armL.rotation.x = -Math.PI / 2.3;
      armL.name = 'armL';
      group.add(armL);

      const armR = new THREE.Mesh(armGeom, bodyMat);
      armR.position.set(0.35, 1.1, 0.25);
      armR.rotation.x = -Math.PI / 2.3;
      armR.name = 'armR';
      group.add(armR);
    } else if (type === 'spider') {
      // Wide flat red-eyed arachnid
      const bodyMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0xe63946 });

      const bodyGeom = new THREE.BoxGeometry(0.7, 0.4, 0.9);
      const body = new THREE.Mesh(bodyGeom, bodyMat);
      body.position.y = 0.35;
      group.add(body);

      // Eyes
      const eyeGeom = new THREE.BoxGeometry(0.08, 0.08, 0.08);
      const eye1 = new THREE.Mesh(eyeGeom, eyeMat);
      eye1.position.set(-0.15, 0.4, -0.46);
      const eye2 = new THREE.Mesh(eyeGeom, eyeMat);
      eye2.position.set(0.15, 0.4, -0.46);
      group.add(eye1, eye2);

      // 4 Legs pairs
      for (let i = 0; i < 4; i++) {
        const legGeom = new THREE.BoxGeometry(0.6, 0.1, 0.1);
        const legL = new THREE.Mesh(legGeom, bodyMat);
        legL.position.set(-0.45, 0.2, (i - 1.5) * 0.22);
        legL.rotation.z = 0.3;
        legL.name = `legL_${i}`;
        const legR = new THREE.Mesh(legGeom, bodyMat);
        legR.position.set(0.45, 0.2, (i - 1.5) * 0.22);
        legR.rotation.z = -0.3;
        legR.name = `legR_${i}`;
        group.add(legL, legR);
      }
    } else if (type === 'pig') {
      // Cute pink voxel animal
      const pinkMat = new THREE.MeshLambertMaterial({ color: 0xffb5a7 });
      const snoutMat = new THREE.MeshLambertMaterial({ color: 0xf4978e });

      // Body
      const bodyGeom = new THREE.BoxGeometry(0.6, 0.5, 0.9);
      const body = new THREE.Mesh(bodyGeom, pinkMat);
      body.position.y = 0.55;
      group.add(body);

      // Head
      const headGeom = new THREE.BoxGeometry(0.45, 0.45, 0.45);
      const head = new THREE.Mesh(headGeom, pinkMat);
      head.position.set(0, 0.75, -0.55);
      group.add(head);

      // Snout
      const snoutGeom = new THREE.BoxGeometry(0.25, 0.16, 0.1);
      const snout = new THREE.Mesh(snoutGeom, snoutMat);
      snout.position.set(0, 0.68, -0.8);
      group.add(snout);

      // 4 stubby legs
      const legGeom = new THREE.BoxGeometry(0.18, 0.35, 0.18);
      const pos = [
        [-0.2, 0.18, -0.3],
        [0.2, 0.18, -0.3],
        [-0.2, 0.18, 0.3],
        [0.2, 0.18, 0.3],
      ];
      pos.forEach((p, idx) => {
        const leg = new THREE.Mesh(legGeom, pinkMat);
        leg.position.set(p[0], p[1], p[2]);
        leg.name = `leg_${idx}`;
        group.add(leg);
      });
    } else if (type === 'villager') {
      // Classic Villager with brown robe, folded arms, and iconic nose
      const skinMat = new THREE.MeshLambertMaterial({ color: 0xc89666 });
      const robeMat = new THREE.MeshLambertMaterial({ color: 0x7f4f24 });
      const darkRobeMat = new THREE.MeshLambertMaterial({ color: 0x582f0e });
      const eyeMat = new THREE.MeshLambertMaterial({ color: 0x2d6a4f });

      // Head
      const headGeom = new THREE.BoxGeometry(0.48, 0.54, 0.48);
      const head = new THREE.Mesh(headGeom, skinMat);
      head.position.y = 1.62;
      head.name = 'head';
      group.add(head);

      // Villager Nose
      const noseGeom = new THREE.BoxGeometry(0.12, 0.22, 0.16);
      const nose = new THREE.Mesh(noseGeom, skinMat);
      nose.position.set(0, 1.5, -0.3);
      group.add(nose);

      // Eyes
      const eye1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.04), eyeMat);
      eye1.position.set(-0.13, 1.62, -0.25);
      const eye2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.04), eyeMat);
      eye2.position.set(0.13, 1.62, -0.25);
      group.add(eye1, eye2);

      // Robe / Body
      const bodyGeom = new THREE.BoxGeometry(0.55, 0.9, 0.38);
      const body = new THREE.Mesh(bodyGeom, robeMat);
      body.position.y = 0.95;
      group.add(body);

      // Folded Arms in front
      const armsGeom = new THREE.BoxGeometry(0.62, 0.32, 0.3);
      const arms = new THREE.Mesh(armsGeom, darkRobeMat);
      arms.position.set(0, 1.05, -0.15);
      arms.name = 'arms';
      group.add(arms);

      // Legs
      const legGeom = new THREE.BoxGeometry(0.2, 0.5, 0.2);
      const legL = new THREE.Mesh(legGeom, darkRobeMat);
      legL.position.set(-0.14, 0.25, 0);
      legL.name = 'legL';
      const legR = new THREE.Mesh(legGeom, darkRobeMat);
      legR.position.set(0.14, 0.25, 0);
      legR.name = 'legR';
      group.add(legL, legR);
    } else if (type === 'iron_golem') {
      // Massive Iron Golem Guardian (~2.7m tall)
      const ironMat = new THREE.MeshLambertMaterial({ color: 0xd8d8d8 });
      const vineMat = new THREE.MeshLambertMaterial({ color: 0x40916c });
      const redEyeMat = new THREE.MeshLambertMaterial({ color: 0x9e2a2b });
      const noseMat = new THREE.MeshLambertMaterial({ color: 0xb5838d });

      // Heavy Iron Torso
      const torsoGeom = new THREE.BoxGeometry(1.0, 0.95, 0.6);
      const torso = new THREE.Mesh(torsoGeom, ironMat);
      torso.position.y = 1.65;
      group.add(torso);

      // Ivy / Vine decorative streaks on chest
      const vine = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.45, 0.04), vineMat);
      vine.position.set(-0.25, 1.65, -0.31);
      group.add(vine);

      // Golem Head
      const headGeom = new THREE.BoxGeometry(0.5, 0.55, 0.5);
      const head = new THREE.Mesh(headGeom, ironMat);
      head.position.set(0, 2.35, -0.15);
      head.name = 'head';
      group.add(head);

      // Golem Nose
      const nose = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.24, 0.16), noseMat);
      nose.position.set(0, 2.22, -0.45);
      group.add(nose);

      // Glowing Red Eyes
      const eye1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.04), redEyeMat);
      eye1.position.set(-0.14, 2.38, -0.41);
      const eye2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.04), redEyeMat);
      eye2.position.set(0.14, 2.38, -0.41);
      group.add(eye1, eye2);

      // Massive Iron Arms
      const armGeom = new THREE.BoxGeometry(0.3, 1.4, 0.3);
      const armL = new THREE.Mesh(armGeom, ironMat);
      armL.position.set(-0.68, 1.35, 0);
      armL.name = 'armL';
      const armR = new THREE.Mesh(armGeom, ironMat);
      armR.position.set(0.68, 1.35, 0);
      armR.name = 'armR';
      group.add(armL, armR);

      // Heavy Iron Legs
      const legGeom = new THREE.BoxGeometry(0.38, 0.9, 0.38);
      const legL = new THREE.Mesh(legGeom, ironMat);
      legL.position.set(-0.26, 0.45, 0);
      legL.name = 'legL';
      const legR = new THREE.Mesh(legGeom, ironMat);
      legR.position.set(0.26, 0.45, 0);
      legR.name = 'legR';
      group.add(legL, legR);
    }

    // Store original color on each mesh child
    group.traverse((child: any) => {
      if (child.isMesh && child.material && child.material.color) {
        child.material = child.material.clone();
        child.userData.origColor = child.material.color.getHex();
      }
    });

    return group;
  }

  // Spawn a mob into the world
  public spawnMob(
    type: MobEntity['type'],
    x: number,
    y: number,
    z: number
  ): MobEntity {
    const isHostile = type === 'crawler' || type === 'spider' || type === 'specter';
    let health = 20;
    let damage = 0;
    let speed = 2.4;

    if (type === 'spider') {
      health = 12;
      damage = 3;
      speed = 4.2;
    } else if (type === 'crawler') {
      health = 20;
      damage = 4;
      speed = 2.8;
    } else if (type === 'pig') {
      health = 10;
      damage = 0;
      speed = 1.8;
    } else if (type === 'villager') {
      health = 20;
      damage = 0;
      speed = 2.2;
    } else if (type === 'iron_golem') {
      health = 100;
      damage = 14;
      speed = 3.6;
    }

    const mesh = this.createMobMesh(type);
    mesh.position.set(x, y, z);
    this.mobGroup.add(mesh);

    const mob: MobEntity = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      name: type.toUpperCase(),
      x,
      y,
      z,
      vx: 0,
      vy: 0,
      vz: 0,
      yaw: 0,
      health,
      maxHealth: health,
      isHostile,
      damage,
      speed,
      attackCooldown: 0,
      hurtCooldown: 0,
      walkAnimationTime: 0,
      mesh,
    };

    this.mobs.push(mob);
    return mob;
  }

  // Spawn villagers and iron golem in a village chunk
  public spawnedVillages: Set<string> = new Set();

  public checkVillageSpawns(cx: number, cz: number, worldX: number, worldY: number, worldZ: number): void {
    const vKey = `${cx},${cz}`;
    if (this.spawnedVillages.has(vKey)) return;
    this.spawnedVillages.add(vKey);

    // Spawn Iron Golem patrolling the village street
    this.spawnMob('iron_golem', worldX + 8.5, worldY + 1.2, worldZ + 6.5);

    // Spawn 3 Villagers around the well and houses
    this.spawnMob('villager', worldX + 3.5, worldY + 1.2, worldZ + 6.5);
    this.spawnMob('villager', worldX + 12.5, worldY + 1.2, worldZ + 9.5);
    this.spawnMob('villager', worldX + 7.5, worldY + 1.2, worldZ + 11.5);
  }

  // Natural mob spawning logic
  public updateSpawning(
    dt: number,
    playerX: number,
    playerY: number,
    playerZ: number,
    isNight: boolean
  ): void {
    this.spawnTimer += dt;
    if (this.spawnTimer < 5.0) return;
    this.spawnTimer = 0;

    if (this.mobs.length >= this.maxMobs) return;

    // Pick a random spot between 16 and 32 blocks from player
    const angle = Math.random() * Math.PI * 2;
    const dist = 16 + Math.random() * 16;
    const sx = Math.floor(playerX + Math.cos(angle) * dist);
    const sz = Math.floor(playerZ + Math.sin(angle) * dist);

    // Find surface
    const sy = this.world.generator.getHeight(sx, sz);
    if (sy > 15) {
      if (isNight) {
        // Spawn hostile night monsters
        const mobType = Math.random() > 0.4 ? 'crawler' : 'spider';
        this.spawnMob(mobType, sx + 0.5, sy + 1.2, sz + 0.5);
        sounds.playMobGroan();
      } else {
        // Daytime: occasionally spawn passive animals
        if (Math.random() > 0.6) {
          this.spawnMob('pig', sx + 0.5, sy + 1.2, sz + 0.5);
        }
      }
    }
  }

  // Update mob AI, physics and movement
  public update(
    dt: number,
    playerPos: THREE.Vector3,
    onPlayerDamage: (dmg: number) => void,
    onMobDrop: (item: string, count: number) => void
  ): void {
    for (let i = this.mobs.length - 1; i >= 0; i--) {
      const mob = this.mobs[i];

      // Update cooldowns
      if (mob.attackCooldown > 0) mob.attackCooldown -= dt;
      if (mob.hurtCooldown > 0) mob.hurtCooldown -= dt;

      // Distance to player
      const dx = playerPos.x - mob.x;
      const dy = playerPos.y - mob.y;
      const dz = playerPos.z - mob.z;
      const distToPlayer = Math.sqrt(dx * dx + dz * dz);

      // AI decision
      let targetVx = 0;
      let targetVz = 0;

      if (mob.type === 'iron_golem') {
        // Iron Golem Guardian: Scans for and annihilates hostile monsters
        let targetHostile: MobEntity | null = null;
        let closestHostileDist = 18;

        for (const other of this.mobs) {
          if (other.isHostile && other.health > 0) {
            const hdx = other.x - mob.x;
            const hdz = other.z - mob.z;
            const hdist = Math.sqrt(hdx * hdx + hdz * hdz);
            if (hdist < closestHostileDist) {
              closestHostileDist = hdist;
              targetHostile = other;
            }
          }
        }

        if (targetHostile) {
          const hdx = targetHostile.x - mob.x;
          const hdz = targetHostile.z - mob.z;
          mob.yaw = Math.atan2(hdx, hdz);
          targetVx = Math.sin(mob.yaw) * mob.speed;
          targetVz = Math.cos(mob.yaw) * mob.speed;

          // Iron Golem Uppercut Attack Range (< 2.2 blocks)
          if (closestHostileDist < 2.2 && mob.attackCooldown <= 0) {
            mob.attackCooldown = 0.85;
            targetHostile.health -= mob.damage;
            targetHostile.hurtCooldown = 0.35;
            // Launch monster high into the sky!
            targetHostile.vy = 8.5;
            targetHostile.vx = Math.sin(mob.yaw) * 6;
            targetHostile.vz = Math.cos(mob.yaw) * 6;
            sounds.playGolem();

            // Arm swing animation
            const armL = mob.mesh?.getObjectByName('armL');
            const armR = mob.mesh?.getObjectByName('armR');
            if (armL && armR) {
              armL.rotation.x = -Math.PI / 1.8;
              armR.rotation.x = -Math.PI / 1.8;
            }
          }
        } else {
          // Patrol village
          if (Math.random() < 0.02) {
            mob.yaw += (Math.random() - 0.5) * 1.5;
          }
          if (Math.random() < 0.5) {
            targetVx = Math.sin(mob.yaw) * (mob.speed * 0.4);
            targetVz = Math.cos(mob.yaw) * (mob.speed * 0.4);
          }
        }
      } else if (mob.type === 'villager') {
        // Villager: Panics and flees from monsters, otherwise strolls peacefully
        let nearThreat: MobEntity | null = null;
        for (const other of this.mobs) {
          if (other.isHostile && other.health > 0) {
            const tdx = other.x - mob.x;
            const tdz = other.z - mob.z;
            if (tdx * tdx + tdz * tdz < 11 * 11) {
              nearThreat = other;
              break;
            }
          }
        }

        if (nearThreat) {
          // Run away from threat in opposite direction
          const tdx = nearThreat.x - mob.x;
          const tdz = nearThreat.z - mob.z;
          mob.yaw = Math.atan2(-tdx, -tdz);
          targetVx = Math.sin(mob.yaw) * (mob.speed * 1.5);
          targetVz = Math.cos(mob.yaw) * (mob.speed * 1.5);
        } else {
          // Normal stroll
          if (Math.random() < 0.025) {
            mob.yaw += (Math.random() - 0.5) * 2;
          }
          if (Math.random() < 0.5) {
            targetVx = Math.sin(mob.yaw) * (mob.speed * 0.4);
            targetVz = Math.cos(mob.yaw) * (mob.speed * 0.4);
          }

          // Nasal "Hrrrmm!" when near player
          if (distToPlayer < 3.5 && Math.random() < 0.007) {
            sounds.playVillager();
          }
        }
      } else if (mob.isHostile && distToPlayer < 24) {
        // Chase player
        mob.yaw = Math.atan2(dx, dz);
        targetVx = Math.sin(mob.yaw) * mob.speed;
        targetVz = Math.cos(mob.yaw) * mob.speed;

        // Attack if in melee range (< 1.5 blocks)
        if (distToPlayer < 1.4 && Math.abs(dy) < 1.8 && mob.attackCooldown <= 0) {
          mob.attackCooldown = 1.0;
          onPlayerDamage(mob.damage);
          sounds.playHurt();
        }
      } else {
        // Idle wander
        if (Math.random() < 0.02) {
          mob.yaw += (Math.random() - 0.5) * 2;
        }
        if (Math.random() < 0.6) {
          targetVx = Math.sin(mob.yaw) * (mob.speed * 0.4);
          targetVz = Math.cos(mob.yaw) * (mob.speed * 0.4);
        }
      }

      // Smooth horizontal velocity
      mob.vx += (targetVx - mob.vx) * 6 * dt;
      mob.vz += (targetVz - mob.vz) * 6 * dt;

      // Gravity
      mob.vy -= 22 * dt;

      // Physics move with collision
      const mobVec = new THREE.Vector3(mob.x, mob.y, mob.z);
      const velVec = new THREE.Vector3(mob.vx, mob.vy, mob.vz);

      const halfW = mob.type === 'iron_golem' ? 0.55 : mob.type === 'spider' ? 0.45 : 0.32;
      const height = mob.type === 'iron_golem' ? 2.6 : mob.type === 'crawler' || mob.type === 'villager' ? 1.9 : 0.8;
      const col = this.physics.moveWithCollision(mobVec, velVec, dt, halfW, height);

      mob.x = mobVec.x;
      mob.y = mobVec.y;
      mob.z = mobVec.z;
      mob.vy = velVec.y;

      // Auto jump when hitting wall
      if (col.onGround && (Math.abs(mob.vx) > 0.4 || Math.abs(mob.vz) > 0.4)) {
        // If moving against obstacle, jump
        const forwardX = mob.x + Math.sin(mob.yaw) * 0.45;
        const forwardZ = mob.z + Math.cos(mob.yaw) * 0.45;
        if (this.physics.isSolid(forwardX, mob.y + 0.5, forwardZ)) {
          mob.vy = 7.0; // Jump
        }
      }

      // Limb swing animation
      if (mob.mesh) {
        mob.mesh.position.set(mob.x, mob.y, mob.z);
        mob.mesh.rotation.y = mob.yaw;

        const isMoving = Math.sqrt(mob.vx * mob.vx + mob.vz * mob.vz) > 0.2;
        if (isMoving) {
          mob.walkAnimationTime += dt * 8;
          const legAngle = Math.sin(mob.walkAnimationTime) * 0.6;

          const legL = mob.mesh.getObjectByName('legL');
          const legR = mob.mesh.getObjectByName('legR');
          if (legL && legR) {
            legL.rotation.x = legAngle;
            legR.rotation.x = -legAngle;
          }

          if (mob.type === 'iron_golem' && mob.attackCooldown <= 0) {
            const armL = mob.mesh.getObjectByName('armL');
            const armR = mob.mesh.getObjectByName('armR');
            if (armL && armR) {
              armL.rotation.x = -legAngle * 0.8;
              armR.rotation.x = legAngle * 0.8;
            }
          }
        }

        // Damage flash (red tint when recently hurt)
        if (mob.hurtCooldown > 0) {
          mob.mesh.traverse((child: any) => {
            if (child.isMesh && child.material && child.material.color) {
              child.material.color.setHex(0xff3333);
            }
          });
        } else {
          // Reset color reliably to original after cooldown
          mob.mesh.traverse((child: any) => {
            if (child.isMesh && child.material && child.material.color && child.userData.origColor !== undefined) {
              child.material.color.setHex(child.userData.origColor);
            }
          });
        }
      }

      // Check Death
      if (mob.health <= 0) {
        // Death drops
        if (mob.type === 'crawler') {
          onMobDrop('coal', 1 + Math.floor(Math.random() * 2));
        } else if (mob.type === 'spider') {
          onMobDrop('stick', 2);
        } else if (mob.type === 'pig') {
          onMobDrop('raw_meat', 1 + Math.floor(Math.random() * 2));
        } else if (mob.type === 'villager') {
          onMobDrop('emerald', 1);
        } else if (mob.type === 'iron_golem') {
          onMobDrop('iron_ingot', 3 + Math.floor(Math.random() * 3));
          onMobDrop('red_flower', 1 + Math.floor(Math.random() * 2));
        }

        // Spawn death particles
        this.world.spawnBreakParticles(mob.x, mob.y + 0.5, mob.z, 0xff0000);

        // Remove mesh
        if (mob.mesh) {
          this.mobGroup.remove(mob.mesh);
          mob.mesh.traverse((c: any) => {
            if (c.geometry) c.geometry.dispose();
          });
        }

        this.mobs.splice(i, 1);
      }
    }
  }

  // Attack a mob with damage & knockback
  public damageMob(mobId: string, damage: number, fromPos: THREE.Vector3): void {
    const mob = this.mobs.find((m) => m.id === mobId);
    if (!mob) return;

    mob.health -= damage;
    mob.hurtCooldown = 0.25;

    // Knockback away from attacker
    const kx = mob.x - fromPos.x;
    const kz = mob.z - fromPos.z;
    const len = Math.sqrt(kx * kx + kz * kz) || 1;
    mob.vx = (kx / len) * 7.5;
    mob.vz = (kz / len) * 7.5;
    mob.vy = 4.0;

    sounds.playMobHit();
  }

  // Clean all mobs
  public clear(): void {
    for (const mob of this.mobs) {
      if (mob.mesh) {
        this.mobGroup.remove(mob.mesh);
        mob.mesh.traverse((c: any) => {
          if (c.geometry) c.geometry.dispose();
        });
      }
    }
    this.mobs = [];
  }
}
