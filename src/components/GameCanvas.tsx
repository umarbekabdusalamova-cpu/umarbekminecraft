import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { WorldSaveMeta } from '../types/game';
import { World } from '../game/world';
import { Physics } from '../game/physics';
import { MobManager } from '../game/mobs';
import { Environment } from '../game/environment';
import { Player } from '../game/player';
import { WorldStorage } from '../game/storage';
import { HUD } from './HUD';
import { InventoryModal } from './InventoryModal';
import { PauseMenu } from './PauseMenu';

interface GameCanvasProps {
  worldMeta: WorldSaveMeta;
  onExitToMenu: () => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ worldMeta, onExitToMenu }) => {
  const mountRef = useRef<HTMLDivElement>(null);

  // Game Engine instances stored in refs
  const engineRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    world: World;
    physics: Physics;
    mobManager: MobManager;
    environment: Environment;
    player: Player;
    animationFrameId: number;
    lastTime: number;
    autoSaveTimer: number;
  } | null>(null);

  const [playerInstance, setPlayerInstance] = useState<Player | null>(null);
  const [timeOfDay, setTimeOfDay] = useState('Day');
  const [isPaused, setIsPaused] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isPointerLocked, setIsPointerLocked] = useState(false);

  // Settings
  const [renderDistance, setRenderDistance] = useState(3);
  const [sensitivity, setSensitivity] = useState(1.0);
  const [gameMode, setGameMode] = useState<'survival' | 'creative'>(worldMeta.gameMode || 'survival');
  const [soundVolume, setSoundVolume] = useState(0.5);
  const [lang, setLang] = useState<'en' | 'uz'>('uz'); // Default to Uzbek as requested by user

  // Toggle language
  const toggleLanguage = () => {
    setLang((prev) => (prev === 'en' ? 'uz' : 'en'));
  };

  // Save current world state
  const saveCurrentWorld = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;

    const { player, world, environment } = engine;
    const meta: WorldSaveMeta = {
      ...worldMeta,
      lastPlayed: Date.now(),
      gameTime: environment.time,
      gameMode,
      player: {
        x: player.position.x,
        y: player.position.y,
        z: player.position.z,
        pitch: player.pitch,
        yaw: player.yaw,
        health: player.health,
        hunger: player.hunger,
        inventory: player.inventory,
        hotbar: player.inventory.slice(0, 9),
        selectedHotbarIndex: player.selectedHotbarIndex,
      },
    };

    WorldStorage.saveWorld(meta, world.serializeDeltas());
  }, [worldMeta, gameMode]);

  // Safe pointer lock helper that catches browser gesture rejections
  const requestLock = useCallback(() => {
    try {
      if (mountRef.current && document.pointerLockElement !== mountRef.current) {
        const p = mountRef.current.requestPointerLock() as any;
        if (p && typeof p.catch === 'function') {
          p.catch(() => {});
        }
      }
    } catch {
      // Ignore harmless pointerlock errors
    }
  }, []);

  // Respawn player
  const handleRespawn = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.player.respawn();
    requestLock();
  }, [requestLock]);

  // Main Three.js Game Setup
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      250
    );

    // 2. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      powerPreference: 'high-performance',
      antialias: false, // pixelated retro look & max fps
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // 3. Engine modules
    const world = new World(scene, worldMeta.seed);
    world.renderDistance = renderDistance;

    const physics = new Physics(world);
    const mobManager = new MobManager(scene, world, physics);
    const environment = new Environment(scene);
    environment.time = worldMeta.gameTime || 100;

    const player = new Player(camera, world, physics, mobManager, scene);
    player.gameMode = gameMode;

    // Hook up village entity spawns when village chunks load
    world.onChunkLoaded = (cx, cz) => {
      if (world.generator.isVillageChunk(cx, cz)) {
        const wx = cx * 16;
        const wz = cz * 16;
        const wy = Math.max(18, Math.min(28, world.generator.getHeight(wx + 8, wz + 8)));
        mobManager.checkVillageSpawns(cx, cz, wx, wy, wz);
      }
    };

    // Load saved deltas (block modifications)
    const savedRecord = WorldStorage.loadWorld(worldMeta.id);
    if (savedRecord && savedRecord.deltas) {
      world.loadDeltas(savedRecord.deltas);
    }

    // Restore player state if exists, or pick safe ground spawn
    if (worldMeta.player && worldMeta.player.x !== undefined) {
      player.position.set(worldMeta.player.x, worldMeta.player.y, worldMeta.player.z);
      player.pitch = worldMeta.player.pitch || 0;
      player.yaw = worldMeta.player.yaw || 0;
      player.health = worldMeta.player.health ?? 20;
      player.hunger = worldMeta.player.hunger ?? 20;
      if (worldMeta.player.inventory) {
        player.inventory = [...worldMeta.player.inventory];
      }
      player.selectedHotbarIndex = worldMeta.player.selectedHotbarIndex || 0;
      player.updateHeldItem();
    } else {
      const spawn = world.getSafeSpawn();
      player.position.set(spawn.x, spawn.y, spawn.z);
    }

    // Initial chunk load around player
    world.update(player.position.x, player.position.z);
    for (const chunk of world.chunks.values()) {
      if (world.generator.isVillageChunk(chunk.chunkX, chunk.chunkZ)) {
        const wx = chunk.chunkX * 16;
        const wz = chunk.chunkZ * 16;
        const wy = Math.max(18, Math.min(28, world.generator.getHeight(wx + 8, wz + 8)));
        mobManager.checkVillageSpawns(chunk.chunkX, chunk.chunkZ, wx, wy, wz);
      }
    }

    engineRef.current = {
      scene,
      camera,
      renderer,
      world,
      physics,
      mobManager,
      environment,
      player,
      animationFrameId: 0,
      lastTime: performance.now(),
      autoSaveTimer: 0,
    };

    setPlayerInstance(player);

    // 4. Game Loop
    let animId = 0;
    const animate = (time: number) => {
      animId = requestAnimationFrame(animate);

      const engine = engineRef.current;
      if (!engine) return;

      const dt = Math.min((time - engine.lastTime) / 1000, 0.1);
      engine.lastTime = time;

      // Only update simulation if not paused
      if (!isPaused && !isInventoryOpen) {
        // Environment & day/night
        const envInfo = engine.environment.update(dt, engine.player.position.x, engine.player.position.z);
        setTimeOfDay(envInfo.timeOfDay);

        // Player physics & actions
        engine.player.update(dt);

        // Dynamic chunk streaming around player
        engine.world.update(engine.player.position.x, engine.player.position.z);
        engine.world.updateParticles(dt);

        // Mobs update & spawning (disabled if creative mode)
        if (gameMode === 'survival') {
          engine.mobManager.updateSpawning(
            dt,
            engine.player.position.x,
            engine.player.position.y,
            engine.player.position.z,
            envInfo.isNight
          );

          engine.mobManager.update(
            dt,
            engine.player.position,
            (dmg) => {
              if (engine.player.gameMode === 'creative') return;
              engine.player.health = Math.max(0, engine.player.health - dmg);
              if (engine.player.health <= 0 && !engine.player.isDead) {
                engine.player.health = 0;
                engine.player.isDead = true;
                if (document.pointerLockElement) {
                  document.exitPointerLock();
                }
              }
            },
            (dropItem, count) => {
              engine.world.spawnDroppedItem(
                dropItem,
                count,
                engine.player.position.x + (Math.random() - 0.5) * 1.5,
                engine.player.position.y + 0.5,
                engine.player.position.z + (Math.random() - 0.5) * 1.5
              );
            }
          );
        }

        // Auto-save every 30 seconds
        engine.autoSaveTimer += dt;
        if (engine.autoSaveTimer > 30) {
          engine.autoSaveTimer = 0;
          saveCurrentWorld();
        }
      }

      // Render Scene
      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    // 5. Window Resize Handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // Clean up on unmount
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      saveCurrentWorld();

      world.clear();
      mobManager.clear();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      engineRef.current = null;
    };
  }, [worldMeta.id, worldMeta.seed]);

  // Update render distance and gameMode when changed
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.world.renderDistance = renderDistance;
      engineRef.current.player.gameMode = gameMode;
    }
  }, [renderDistance, gameMode]);

  // 6. Input Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const player = engineRef.current?.player;
      if (!player) return;

      // Respawn on Enter key if dead
      if (player.isDead) {
        if (e.code === 'Enter' || e.code === 'NumpadEnter' || e.key === 'Enter') {
          e.preventDefault();
          handleRespawn();
        }
        return;
      }

      // Inventory toggle (E)
      if (e.code === 'KeyE') {
        if (!isPaused) {
          setIsInventoryOpen((prev) => {
            const next = !prev;
            if (next && document.pointerLockElement) {
              document.exitPointerLock();
            }
            return next;
          });
        }
        return;
      }

      // Pause toggle (Escape)
      if (e.code === 'Escape') {
        if (isInventoryOpen) {
          setIsInventoryOpen(false);
        } else {
          setIsPaused((prev) => {
            const next = !prev;
            if (next && document.pointerLockElement) {
              document.exitPointerLock();
            }
            return next;
          });
        }
        return;
      }

      // If in menu or inventory, ignore game keys
      if (isPaused || isInventoryOpen) return;

      // WASD & Movement
      if (e.code === 'KeyW') player.moveForward = true;
      if (e.code === 'KeyS') player.moveBackward = true;
      if (e.code === 'KeyA') player.moveLeft = true;
      if (e.code === 'KeyD') player.moveRight = true;
      if (e.code === 'Space') player.isJumping = true;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') player.isSprinting = true;

      // Number keys 1-9 for Hotbar
      if (e.key >= '1' && e.key <= '9') {
        const slotIdx = parseInt(e.key, 10) - 1;
        player.selectedHotbarIndex = slotIdx;
        player.updateHeldItem();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const player = engineRef.current?.player;
      if (!player) return;

      if (e.code === 'KeyW') player.moveForward = false;
      if (e.code === 'KeyS') player.moveBackward = false;
      if (e.code === 'KeyA') player.moveLeft = false;
      if (e.code === 'KeyD') player.moveRight = false;
      if (e.code === 'Space') player.isJumping = false;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') player.isSprinting = false;
    };

    // Mouse Look
    const handleMouseMove = (e: MouseEvent) => {
      const player = engineRef.current?.player;
      if (!player || isPaused || isInventoryOpen) return;

      if (document.pointerLockElement) {
        const factor = 0.0022 * sensitivity;
        player.yaw -= e.movementX * factor;
        player.pitch -= e.movementY * factor;

        // Clamp pitch (-89° to +89°)
        const maxPitch = Math.PI / 2 - 0.02;
        player.pitch = Math.max(-maxPitch, Math.min(maxPitch, player.pitch));
      }
    };

    // Mouse Down (Left click = Mine / Attack, Right click = Place / Eat)
    const handleMouseDown = (e: MouseEvent) => {
      const player = engineRef.current?.player;
      if (!player || isPaused || isInventoryOpen) return;

      // If not pointer locked, lock first
      if (!document.pointerLockElement) {
        mountRef.current?.requestPointerLock();
        return;
      }

      if (e.button === 0) {
        // Left click
        player.handleLeftClick();
      } else if (e.button === 2) {
        // Right click
        player.handleRightClick();
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      const player = engineRef.current?.player;
      if (!player) return;
      if (e.button === 0) {
        player.stopLeftClick();
      }
    };

    // Mouse Wheel: Scroll hotbar slots
    const handleWheel = (e: WheelEvent) => {
      const player = engineRef.current?.player;
      if (!player || isPaused || isInventoryOpen) return;

      if (e.deltaY > 0) {
        player.selectedHotbarIndex = (player.selectedHotbarIndex + 1) % 9;
      } else {
        player.selectedHotbarIndex = (player.selectedHotbarIndex + 8) % 9;
      }
      player.updateHeldItem();
    };

    // Pointer Lock change listener
    const handlePointerLockChange = () => {
      setIsPointerLocked(!!document.pointerLockElement);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('wheel', handleWheel, { passive: true });
    document.addEventListener('pointerlockchange', handlePointerLockChange);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('wheel', handleWheel);
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
    };
  }, [isPaused, isInventoryOpen, sensitivity]);

  return (
    <div className="relative w-full h-full min-h-screen bg-black overflow-hidden select-none">
      {/* Three.js Canvas Container */}
      <div
        ref={mountRef}
        className="w-full h-full absolute inset-0 cursor-crosshair"
        onClick={() => {
          if (!isPaused && !isInventoryOpen && !playerInstance?.isDead && !document.pointerLockElement) {
            requestLock();
          }
        }}
      />

      {/* Click-to-lock cursor overlay if unlocked */}
      {!isPointerLocked && !isPaused && !isInventoryOpen && !playerInstance?.isDead && (
        <div
          onClick={requestLock}
          className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center cursor-pointer z-20"
        >
          <div className="bg-stone-900/90 border-2 border-emerald-500/80 px-6 py-4 rounded-2xl shadow-2xl text-center animate-pulse">
            <div className="text-emerald-400 font-bold text-base font-mono">
              {lang === 'uz' ? "O'YNASH UCHUN BOSING" : 'CLICK TO PLAY'}
            </div>
            <div className="text-stone-300 text-xs mt-1">
              {lang === 'uz'
                ? 'Kamerani boshqarish uchun sichqonchani qulflaydi'
                : 'Locks mouse camera for first-person controls'}
            </div>
          </div>
        </div>
      )}

      {/* Underwater realistic blue screen tint and caustics */}
      {playerInstance?.inWater && (
        <div className="absolute inset-0 bg-cyan-700/25 pointer-events-none z-5 mix-blend-overlay backdrop-blur-[0.5px]"></div>
      )}

      {/* Main Gameplay In-Game HUD */}
      <HUD
        player={playerInstance}
        timeOfDay={timeOfDay}
        gameMode={gameMode}
        lang={lang}
        onToggleLang={toggleLanguage}
        onRespawn={handleRespawn}
        onOpenInventory={() => setIsInventoryOpen(true)}
        onOpenPause={() => setIsPaused(true)}
      />

      {/* Inventory & Crafting Workbench Modal */}
      {isInventoryOpen && playerInstance && (
        <InventoryModal
          player={playerInstance}
          lang={lang}
          onClose={() => setIsInventoryOpen(false)}
        />
      )}

      {/* Pause Menu */}
      {isPaused && (
        <PauseMenu
          onResume={() => setIsPaused(false)}
          onSave={saveCurrentWorld}
          onQuit={() => {
            saveCurrentWorld();
            onExitToMenu();
          }}
          renderDistance={renderDistance}
          setRenderDistance={setRenderDistance}
          sensitivity={sensitivity}
          setSensitivity={setSensitivity}
          gameMode={gameMode}
          setGameMode={setGameMode}
          soundVolume={soundVolume}
          setSoundVolume={setSoundVolume}
          lang={lang}
        />
      )}
    </div>
  );
};
