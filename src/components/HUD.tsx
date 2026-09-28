import React, { useEffect, useState } from 'react';
import { Heart, Drumstick, Compass, Clock, Shield, ShieldAlert, Droplets, Globe } from 'lucide-react';
import { Player } from '../game/player';
import { ITEMS } from '../game/constants';

interface HUDProps {
  player: Player | null;
  timeOfDay: string;
  gameMode: 'survival' | 'creative';
  lang?: 'en' | 'uz';
  onToggleLang?: () => void;
  onRespawn: () => void;
  onOpenInventory: () => void;
  onOpenPause: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  player,
  timeOfDay,
  gameMode,
  lang = 'en',
  onToggleLang,
  onRespawn,
  onOpenInventory,
  onOpenPause,
}) => {
  const [health, setHealth] = useState(20);
  const [hunger, setHunger] = useState(20);
  const [oxygen, setOxygen] = useState(20);
  const [armor, setArmor] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [coords, setCoords] = useState({ x: 0, y: 0, z: 0 });
  const [fps, setFps] = useState(60);
  const [showDebug, setShowDebug] = useState(false);
  const [toastName, setToastName] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [miningProgress, setMiningProgress] = useState(0);

  // Sync state with player engine at 15fps for UI
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();

    const interval = setInterval(() => {
      if (!player) return;

      setHealth(Math.round(player.health));
      setHunger(Math.round(player.hunger));
      setOxygen(Math.round(player.oxygen));
      setArmor(player.getArmorPoints());
      setMiningProgress(player.miningProgress);
      setCoords({
        x: Math.round(player.position.x),
        y: Math.round(player.position.y),
        z: Math.round(player.position.z),
      });

      if (player.selectedHotbarIndex !== selectedIndex) {
        setSelectedIndex(player.selectedHotbarIndex);
        const held = player.getHeldItem();
        if (held && ITEMS[held.itemId]) {
          const itemDef = ITEMS[held.itemId];
          setToastName(lang === 'uz' && itemDef.nameUz ? itemDef.nameUz : itemDef.name);
          setToastVisible(true);
          setTimeout(() => setToastVisible(false), 2000);
        }
      }

      frameCount++;
      const now = performance.now();
      if (now - lastTime >= 1000) {
        setFps(Math.round((frameCount * 1000) / (now - lastTime)));
        frameCount = 0;
        lastTime = now;
      }
    }, 66);

    return () => clearInterval(interval);
  }, [player, selectedIndex, lang]);

  // Listen for Enter key when player is dead to respawn
  useEffect(() => {
    if (!player?.isDead) return;
    const handleDeadKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.code === 'Enter' || e.code === 'NumpadEnter') {
        e.preventDefault();
        onRespawn();
      }
    };
    window.addEventListener('keydown', handleDeadKeyDown);
    return () => window.removeEventListener('keydown', handleDeadKeyDown);
  }, [player?.isDead, onRespawn]);

  const heldItem = player?.inventory[selectedIndex] || null;
  const heldDef = heldItem ? ITEMS[heldItem.itemId] : null;

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-10 font-sans">
      {/* 1. Crosshair in center of screen */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
        <div className="relative w-6 h-6 flex items-center justify-center">
          <div className="w-[18px] h-[2px] bg-white/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"></div>
          <div className="h-[18px] w-[2px] bg-white/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] absolute"></div>
        </div>

        {/* Mining crack progress indicator ring */}
        {miningProgress > 0 && (
          <div className="absolute w-12 h-12 rounded-full border-2 border-amber-400 border-t-transparent animate-spin"></div>
        )}
      </div>

      {/* 2. Top-Left Game Stats & Debug overlay */}
      <div className="absolute top-3 left-4 flex flex-col gap-1 text-xs text-white/90 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
        <div className="flex items-center gap-2">
          <span className="font-extrabold tracking-wider text-emerald-400 text-sm font-mono">BUILDRE</span>
          <span className="bg-black/40 backdrop-blur-xs px-2 py-0.5 rounded text-[10px] uppercase font-mono border border-white/10">
            {gameMode}
          </span>
          <span className="bg-black/40 backdrop-blur-xs px-2 py-0.5 rounded text-[10px] flex items-center gap-1 border border-white/10">
            <Clock className="w-3 h-3 text-amber-300" />
            {timeOfDay}
          </span>
        </div>

        {showDebug && (
          <div className="bg-black/60 backdrop-blur-xs p-2 rounded border border-white/15 text-[11px] font-mono mt-1 space-y-0.5">
            <div>XYZ: {coords.x} / {coords.y} / {coords.z}</div>
            <div>FPS: {fps}</div>
            <div>Chunks: {player?.world.chunks.size}</div>
            <div>Entities: {player?.mobManager.mobs.length}</div>
            <div>Drops: {player?.world.droppedItems.length}</div>
            <div>Armor: {armor} / 20</div>
          </div>
        )}
      </div>

      {/* 3. Top-Right Quick Action Buttons */}
      <div className="absolute top-3 right-4 flex items-center gap-2 pointer-events-auto">
        {onToggleLang && (
          <button
            onClick={onToggleLang}
            className="bg-stone-800/80 hover:bg-stone-700 text-white text-xs px-2.5 py-1.5 rounded border border-white/20 backdrop-blur-xs transition cursor-pointer flex items-center gap-1 font-mono"
            title="Tilni o'zgartirish / Change language"
          >
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span>{lang === 'uz' ? 'UZ' : 'EN'}</span>
          </button>
        )}
        <button
          onClick={() => setShowDebug(!showDebug)}
          className="bg-black/50 hover:bg-black/80 text-white/90 text-xs px-2.5 py-1.5 rounded border border-white/20 backdrop-blur-xs transition cursor-pointer font-mono"
          title="Toggle F3 Debug Info"
        >
          {showDebug ? 'F3: ON' : 'F3'}
        </button>
        <button
          onClick={onOpenInventory}
          className="bg-stone-800/80 hover:bg-stone-700 text-white text-xs px-3 py-1.5 rounded border border-white/20 backdrop-blur-xs transition cursor-pointer flex items-center gap-1.5 shadow-md"
        >
          <span className="bg-stone-950 px-1 py-0.5 rounded text-[10px] font-mono border border-stone-600">E</span>
          <span>{lang === 'uz' ? 'Inventar' : 'Inventory'}</span>
        </button>
        <button
          onClick={onOpenPause}
          className="bg-stone-800/80 hover:bg-stone-700 text-white text-xs px-3 py-1.5 rounded border border-white/20 backdrop-blur-xs transition cursor-pointer flex items-center gap-1.5 shadow-md"
        >
          <span className="bg-stone-950 px-1 py-0.5 rounded text-[10px] font-mono border border-stone-600">ESC</span>
          <span>{lang === 'uz' ? 'Menyu' : 'Menu'}</span>
        </button>
      </div>

      {/* 4. Bottom HUD: Toast, Hearts, Armor, Hunger, Oxygen, and 9-Slot Hotbar */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
        {/* Held item name popup */}
        {toastVisible && heldDef && (
          <div className="bg-black/75 backdrop-blur-xs text-amber-200 text-sm font-semibold px-4 py-1 rounded-full border border-amber-500/30 animate-fade-in shadow-lg">
            {lang === 'uz' && heldDef.nameUz ? heldDef.nameUz : heldDef.name}
          </div>
        )}

        {/* Survival Status Rows: Armor & Oxygen (Upper Row) */}
        {gameMode === 'survival' && (
          <div className="w-[360px] flex justify-between items-center px-1 mb-0.5">
            {/* Armor Bar (Left, above hearts) */}
            <div className="flex items-center gap-0.5 h-3">
              {armor > 0 &&
                Array.from({ length: 10 }).map((_, i) => {
                  const hasArmor = armor >= (i + 1) * 2;
                  const halfArmor = armor === i * 2 + 1;
                  return (
                    <Shield
                      key={i}
                      className={`w-3.5 h-3.5 ${
                        hasArmor
                          ? 'text-cyan-400 fill-cyan-400'
                          : halfArmor
                          ? 'text-cyan-400 fill-cyan-400/50'
                          : 'text-stone-700 fill-transparent'
                      }`}
                    />
                  );
                })}
            </div>

            {/* Underwater Oxygen Bubbles (Right, above hunger) */}
            <div className="flex items-center gap-0.5 h-3">
              {oxygen < 20 &&
                Array.from({ length: 10 }).map((_, i) => {
                  const hasBubble = oxygen >= (i + 1) * 2;
                  return (
                    <Droplets
                      key={i}
                      className={`w-3.5 h-3.5 ${
                        hasBubble ? 'text-blue-400 fill-blue-400 animate-pulse' : 'text-stone-700 fill-transparent'
                      }`}
                    />
                  );
                })}
            </div>
          </div>
        )}

        {/* Survival Status Bars: Health (left) & Hunger (right) */}
        {gameMode === 'survival' && (
          <div className="w-[360px] flex justify-between items-center px-1 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
            {/* Hearts (10 hearts for 20 HP) */}
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 10 }).map((_, i) => {
                const heartVal = health - i * 2;
                let fill = 'text-red-500 fill-red-500';
                if (heartVal <= 0) fill = 'text-stone-700 fill-transparent';
                else if (heartVal === 1) fill = 'text-red-500 fill-red-500/50';

                return (
                  <Heart
                    key={i}
                    className={`w-4 h-4 transition-transform ${fill} ${health < 5 ? 'animate-bounce' : ''}`}
                  />
                );
              })}
            </div>

            {/* Hunger Drumsticks (10 for 20 hunger) */}
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 10 }).map((_, i) => {
                const drumVal = hunger - i * 2;
                let fill = 'text-amber-500 fill-amber-500';
                if (drumVal <= 0) fill = 'text-stone-700 fill-transparent';
                else if (drumVal === 1) fill = 'text-amber-500 fill-amber-500/50';

                return (
                  <Drumstick
                    key={i}
                    className={`w-4 h-4 transition-colors ${fill}`}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* 9-Slot Hotbar */}
        <div className="bg-stone-900/90 p-1.5 rounded-lg border-2 border-stone-600 shadow-2xl flex items-center gap-1.5 backdrop-blur-md pointer-events-auto">
          {Array.from({ length: 9 }).map((_, idx) => {
            const item = player?.inventory[idx] || null;
            const def = item ? ITEMS[item.itemId] : null;
            const isSelected = idx === selectedIndex;

            return (
              <div
                key={idx}
                onClick={() => {
                  if (player) {
                    player.selectedHotbarIndex = idx;
                    player.updateHeldItem();
                    setSelectedIndex(idx);
                  }
                }}
                className={`relative w-11 h-11 rounded flex items-center justify-center cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-stone-700 border-2 border-white scale-105 shadow-md shadow-white/20'
                    : 'bg-stone-800/80 border border-stone-700 hover:bg-stone-750'
                }`}
              >
                {/* Number key badge (1-9) */}
                <span className="absolute top-0.5 left-1 text-[9px] font-mono text-stone-400 select-none">
                  {idx + 1}
                </span>

                {/* Item representation */}
                {def && (
                  <div className="flex flex-col items-center justify-center">
                    <div
                      className="w-6 h-6 rounded-xs shadow-inner border border-black/30 flex items-center justify-center"
                      style={{ backgroundColor: def.color || '#888' }}
                    >
                      <span className="text-[9px] font-bold text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.9)]">
                        {def.name.substring(0, 2).toUpperCase()}
                      </span>
                    </div>

                    {/* Stack count badge */}
                    {item && item.count > 1 && (
                      <span className="absolute bottom-0.5 right-1 text-[11px] font-bold font-mono text-white drop-shadow-[0_1px_2px_rgba(0,0,0,1)]">
                        {item.count}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Game Over / Respawn Screen */}
      {player?.isDead && (
        <div className="absolute inset-0 bg-red-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-6 pointer-events-auto z-50">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-black text-red-500 tracking-wider drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]">
              {lang === 'uz' ? 'SIZ HALOK BO\'LDINGIZ!' : 'YOU DIED!'}
            </h1>
            <p className="text-stone-300 mt-2 text-sm">
              {lang === 'uz' ? 'Yovvoyi tabiat sizni yengdi.' : 'You were overwhelmed by the wild.'}
            </p>
          </div>

          <button
            onClick={onRespawn}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-8 py-3.5 rounded-xl border-2 border-emerald-400 shadow-xl cursor-pointer text-base uppercase tracking-wider transition hover:scale-105 flex items-center gap-2.5 font-mono"
          >
            <span className="bg-emerald-800/90 text-emerald-200 px-2.5 py-0.5 rounded text-xs border border-emerald-400/50 shadow-inner font-bold">
              ENTER
            </span>
            <span>{lang === 'uz' ? 'Qayta Tug\'ilish' : 'Respawn'}</span>
          </button>
          <p className="text-stone-400 text-xs font-mono">
            {lang === 'uz'
              ? 'Qayta tug\'ilish uchun klaviaturada [ENTER] tugmasini bosing'
              : 'Press [ENTER] key on your keyboard to respawn'}
          </p>
        </div>
      )}
    </div>
  );
};
