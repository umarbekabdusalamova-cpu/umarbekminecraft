import React, { useState, useEffect } from 'react';
import { Play, Plus, Trash2, Settings, HelpCircle, Box, Compass, Sparkles, Shield, ChevronRight } from 'lucide-react';
import { WorldStorage } from '../game/storage';
import { WorldSaveMeta } from '../types/game';

interface MainMenuProps {
  onStartGame: (worldMeta: WorldSaveMeta) => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({ onStartGame }) => {
  const [view, setView] = useState<'home' | 'worlds' | 'new_world' | 'settings' | 'help'>('home');
  const [worlds, setWorlds] = useState<WorldSaveMeta[]>([]);
  const [selectedWorldId, setSelectedWorldId] = useState<string | null>(null);
  const [lang, setLang] = useState<'uz' | 'en'>('uz');

  // New World Form state
  const [newWorldName, setNewWorldName] = useState('Mening Dunyoyim');
  const [newWorldSeed, setNewWorldSeed] = useState('');
  const [newWorldMode, setNewWorldMode] = useState<'survival' | 'creative'>('survival');

  // Load existing worlds
  useEffect(() => {
    const list = WorldStorage.listWorlds();
    setWorlds(list);
    if (list.length > 0) {
      setSelectedWorldId(list[0].id);
    }
  }, []);

  const handleCreateWorld = (e: React.FormEvent) => {
    e.preventDefault();
    const seed = newWorldSeed.trim() !== '' ? parseInt(newWorldSeed, 10) : undefined;
    const meta = WorldStorage.createNewWorld(newWorldName, seed, newWorldMode);
    setWorlds(WorldStorage.listWorlds());
    onStartGame(meta);
  };

  const handlePlaySelected = () => {
    if (!selectedWorldId) {
      // If no world exists, create one immediately
      const meta = WorldStorage.createNewWorld('My Survival World');
      onStartGame(meta);
      return;
    }
    const target = worlds.find((w) => w.id === selectedWorldId);
    if (target) {
      onStartGame(target);
    }
  };

  const handleDeleteWorld = (worldId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this world? This cannot be undone.')) {
      WorldStorage.deleteWorld(worldId);
      const updated = WorldStorage.listWorlds();
      setWorlds(updated);
      if (selectedWorldId === worldId) {
        setSelectedWorldId(updated.length > 0 ? updated[0].id : null);
      }
    }
  };

  return (
    <div className="relative w-full h-full min-h-screen bg-[#111116] flex flex-col items-center justify-between p-6 select-none overflow-hidden font-sans">
      {/* Background visual ambiance (pixel blocks pattern) */}
      <div className="absolute inset-0 opacity-15 pointer-events-none">
        <div className="w-full h-full bg-[radial-gradient(#2d6a4f_1px,transparent_1px)] [background-size:24px_24px]"></div>
      </div>

      {/* Language Switcher Top-Right */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <button
          onClick={() => setLang(lang === 'uz' ? 'en' : 'uz')}
          className="bg-stone-800/80 hover:bg-stone-700 text-white text-xs px-3 py-1.5 rounded-lg border border-stone-600 font-mono transition cursor-pointer flex items-center gap-1.5 shadow"
        >
          <span>🌐</span>
          <span className="font-bold">{lang === 'uz' ? "O'zbekcha" : 'English'}</span>
        </button>
      </div>

      {/* Header Banner */}
      <div className="relative z-10 mt-12 flex flex-col items-center text-center">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-emerald-500 rounded-lg shadow-lg shadow-emerald-500/30 flex items-center justify-center border-2 border-emerald-300">
            <Box className="w-6 h-6 text-white" />
          </div>
          <span className="text-xs font-mono font-bold tracking-widest text-emerald-400 bg-emerald-950/70 border border-emerald-500/40 px-3 py-1 rounded-full uppercase">
            {lang === 'uz' ? '3D Voksel Omon Qolish Sandbogi' : '3D Voxel Sandbox'}
          </span>
        </div>

        <h1 className="text-6xl md:text-7xl font-black tracking-tight text-white drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)] font-mono">
          BUILD<span className="text-emerald-400">RE</span>
        </h1>
        <p className="text-stone-400 text-sm md:text-base max-w-md mt-2 font-medium">
          {lang === 'uz'
            ? 'Cheksiz dunyolarni kashf eting, mis, temir va olmos qazing, imoratlar quring va kechasi yirtqichlardan saqlaning.'
            : 'Explore infinite procedural landscapes, mine rare ores, build structures, and survive the wild.'}
        </p>
      </div>

      {/* Main Container Views */}
      <div className="relative z-10 w-full max-w-lg my-8">
        {/* VIEW: HOME */}
        {view === 'home' && (
          <div className="flex flex-col gap-3.5">
            <button
              onClick={() => {
                if (worlds.length === 0) {
                  setView('new_world');
                } else {
                  setView('worlds');
                }
              }}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 px-6 rounded-2xl border-2 border-emerald-400 shadow-xl shadow-emerald-600/30 text-lg uppercase tracking-wider transition-all hover:scale-[1.02] flex items-center justify-center gap-3 cursor-pointer"
            >
              <Play className="w-5 h-5 fill-white" />
              {worlds.length > 0
                ? lang === 'uz'
                  ? 'Dunyoni tanlash / O\'ynash'
                  : 'Select World / Play'
                : lang === 'uz'
                ? 'Hozir O\'ynash'
                : 'Play Now'}
            </button>

            <button
              onClick={() => setView('new_world')}
              className="w-full bg-stone-800 hover:bg-stone-750 text-stone-100 font-bold py-3.5 px-6 rounded-2xl border border-stone-700 transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              {lang === 'uz' ? 'Yangi Dunyo Yaratish' : 'Create New World'}
            </button>

            <div className="flex gap-3">
              <button
                onClick={() => setView('help')}
                className="flex-1 bg-stone-850 hover:bg-stone-800 text-stone-300 font-semibold py-3 px-4 rounded-xl border border-stone-750 transition flex items-center justify-center gap-2 text-xs cursor-pointer"
              >
                <HelpCircle className="w-4 h-4 text-amber-400" />
                {lang === 'uz' ? 'Qo\'llanma' : 'How to Play'}
              </button>
              <button
                onClick={() => setView('settings')}
                className="flex-1 bg-stone-850 hover:bg-stone-800 text-stone-300 font-semibold py-3 px-4 rounded-xl border border-stone-750 transition flex items-center justify-center gap-2 text-xs cursor-pointer"
              >
                <Settings className="w-4 h-4 text-blue-400" />
                {lang === 'uz' ? 'Sozlamalar' : 'Settings'}
              </button>
            </div>
          </div>
        )}

        {/* VIEW: SELECT WORLD */}
        {view === 'worlds' && (
          <div className="bg-stone-900 border-2 border-stone-700 rounded-2xl p-5 shadow-2xl flex flex-col max-h-[480px]">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800 mb-3">
              <h2 className="text-base font-bold font-mono text-white flex items-center gap-2">
                <Compass className="w-4 h-4 text-emerald-400" />
                Select World
              </h2>
              <button
                onClick={() => setView('new_world')}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                New World
              </button>
            </div>

            {/* Worlds List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {worlds.length === 0 ? (
                <div className="text-center py-10 text-stone-500 text-sm">
                  No saved worlds found. Create your first world!
                </div>
              ) : (
                worlds.map((w) => {
                  const isSelected = selectedWorldId === w.id;
                  const dateStr = new Date(w.lastPlayed).toLocaleDateString();

                  return (
                    <div
                      key={w.id}
                      onClick={() => setSelectedWorldId(w.id)}
                      className={`p-3 rounded-xl border transition flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-950/40 border-emerald-500/80 shadow-md shadow-emerald-900/20'
                          : 'bg-stone-850 border-stone-750 hover:bg-stone-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-stone-800 border border-stone-700 flex items-center justify-center">
                          <Box className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                          <div className="font-bold text-sm text-stone-100">{w.name}</div>
                          <div className="text-[11px] text-stone-400 font-mono mt-0.5 flex items-center gap-2">
                            <span>Seed: {w.seed}</span>
                            <span>•</span>
                            <span>{dateStr}</span>
                            <span className="bg-stone-750 px-1.5 py-0.2 rounded text-[10px] uppercase text-stone-300">
                              {w.gameMode}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => handleDeleteWorld(w.id, e)}
                          className="p-2 text-stone-400 hover:text-red-400 hover:bg-red-950/50 rounded-lg transition"
                          title="Delete World"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-stone-800 mt-3">
              <button
                onClick={() => setView('home')}
                className="flex-1 bg-stone-800 hover:bg-stone-750 text-stone-300 font-semibold py-2.5 rounded-xl border border-stone-700 text-xs transition cursor-pointer"
              >
                Back
              </button>
              <button
                disabled={!selectedWorldId && worlds.length > 0}
                onClick={handlePlaySelected}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl border border-emerald-400 text-xs uppercase tracking-wider transition cursor-pointer shadow-lg flex items-center justify-center gap-2"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                Play World
              </button>
            </div>
          </div>
        )}

        {/* VIEW: CREATE NEW WORLD */}
        {view === 'new_world' && (
          <form
            onSubmit={handleCreateWorld}
            className="bg-stone-900 border-2 border-stone-700 rounded-2xl p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center gap-2 pb-2 border-b border-stone-800">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <h2 className="text-base font-bold font-mono text-white">Create New World</h2>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-300 uppercase mb-1">
                World Name
              </label>
              <input
                type="text"
                required
                value={newWorldName}
                onChange={(e) => setNewWorldName(e.target.value)}
                placeholder="e.g. My Survival Sanctuary"
                className="w-full bg-stone-950 border border-stone-700 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm text-stone-100 outline-hidden transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-300 uppercase mb-1">
                World Seed (Optional)
              </label>
              <input
                type="number"
                value={newWorldSeed}
                onChange={(e) => setNewWorldSeed(e.target.value)}
                placeholder="Leave blank for random procedural seed"
                className="w-full bg-stone-950 border border-stone-700 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm text-stone-100 outline-hidden transition font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-300 uppercase mb-1">
                Game Mode
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setNewWorldMode('survival')}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                    newWorldMode === 'survival'
                      ? 'bg-emerald-950/60 border-emerald-500 text-white'
                      : 'bg-stone-950 border-stone-800 text-stone-400'
                  }`}
                >
                  <div className="font-bold text-xs uppercase flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-emerald-400" />
                    Survival
                  </div>
                  <div className="text-[11px] text-stone-400 mt-1">Health, hunger, monsters at night, resource gathering.</div>
                </button>

                <button
                  type="button"
                  onClick={() => setNewWorldMode('creative')}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                    newWorldMode === 'creative'
                      ? 'bg-purple-950/60 border-purple-500 text-white'
                      : 'bg-stone-950 border-stone-800 text-stone-400'
                  }`}
                >
                  <div className="font-bold text-xs uppercase flex items-center gap-1.5">
                    <Box className="w-3.5 h-3.5 text-purple-400" />
                    Creative
                  </div>
                  <div className="text-[11px] text-stone-400 mt-1">Peaceful exploration and limitless building focus.</div>
                </button>
              </div>
            </div>

            <div className="flex gap-3 pt-3">
              <button
                type="button"
                onClick={() => setView('home')}
                className="flex-1 bg-stone-800 hover:bg-stone-750 text-stone-300 font-semibold py-3 rounded-xl border border-stone-700 text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl border border-emerald-400 text-xs uppercase tracking-wider transition cursor-pointer shadow-lg"
              >
                Generate & Play
              </button>
            </div>
          </form>
        )}

        {/* VIEW: HOW TO PLAY */}
        {view === 'help' && (
          <div className="bg-stone-900 border-2 border-stone-700 rounded-2xl p-6 shadow-2xl space-y-4 max-h-[500px] overflow-y-auto">
            <h2 className="text-base font-bold font-mono text-white flex items-center gap-2 pb-2 border-b border-stone-800">
              <HelpCircle className="w-4 h-4 text-amber-400" />
              How to Play BUILDRE
            </h2>

            <div className="space-y-3 text-xs text-stone-300">
              <div className="bg-stone-950 p-3 rounded-xl border border-stone-800">
                <span className="font-bold text-emerald-400 block mb-1">1. Controls</span>
                <ul className="space-y-1 font-mono text-[11px] text-stone-300">
                  <li>• <strong className="text-white">WASD</strong>: Move & Strafe</li>
                  <li>• <strong className="text-white">Mouse</strong>: Look around (Click screen to lock cursor)</li>
                  <li>• <strong className="text-white">Space</strong>: Jump / Swim in water</li>
                  <li>• <strong className="text-white">Shift</strong>: Sprint</li>
                  <li>• <strong className="text-white">Left Click</strong>: Break blocks / Attack monsters</li>
                  <li>• <strong className="text-white">Right Click</strong>: Place held block / Eat food</li>
                  <li>• <strong className="text-white">1 - 9</strong>: Select hotbar slot</li>
                  <li>• <strong className="text-white">E</strong>: Open Inventory & Crafting Workbench</li>
                  <li>• <strong className="text-white">ESC</strong>: Pause Menu</li>
                </ul>
              </div>

              <div className="bg-stone-950 p-3 rounded-xl border border-stone-800">
                <span className="font-bold text-amber-400 block mb-1">2. Survival & Crafting</span>
                <p className="text-[11px] leading-relaxed text-stone-400">
                  Start by punching wood logs from trees. Open your inventory (E) to craft Planks and Sticks.
                  Craft a Wooden Pickaxe to mine Stone and Coal. Upgrade to Stone, Iron, and Diamond tools to mine faster!
                </p>
              </div>

              <div className="bg-stone-950 p-3 rounded-xl border border-stone-800">
                <span className="font-bold text-purple-400 block mb-1">3. Day & Night Cycle</span>
                <p className="text-[11px] leading-relaxed text-stone-400">
                  The sun rises and sets dynamically. When darkness falls, Crawlers and Spiders emerge from the shadows!
                  Place Torches to illuminate your base and craft Swords to defend yourself.
                </p>
              </div>
            </div>

            <button
              onClick={() => setView('home')}
              className="w-full bg-stone-800 hover:bg-stone-700 text-white font-bold py-2.5 rounded-xl border border-stone-700 text-xs transition cursor-pointer"
            >
              Back to Menu
            </button>
          </div>
        )}

        {/* VIEW: SETTINGS */}
        {view === 'settings' && (
          <div className="bg-stone-900 border-2 border-stone-700 rounded-2xl p-6 shadow-2xl space-y-4">
            <h2 className="text-base font-bold font-mono text-white flex items-center gap-2 pb-2 border-b border-stone-800">
              <Settings className="w-4 h-4 text-blue-400" />
              Game Settings
            </h2>

            <div className="space-y-3 text-xs">
              <div className="bg-stone-950 p-3 rounded-xl border border-stone-800 flex justify-between items-center">
                <span className="font-semibold text-stone-300">Graphics Quality</span>
                <span className="text-emerald-400 font-mono font-bold">Fast Voxel 60FPS</span>
              </div>
              <div className="bg-stone-950 p-3 rounded-xl border border-stone-800 flex justify-between items-center">
                <span className="font-semibold text-stone-300">Save Storage</span>
                <span className="text-blue-400 font-mono font-bold">Local Browser (Offline)</span>
              </div>
            </div>

            <button
              onClick={() => setView('home')}
              className="w-full bg-stone-800 hover:bg-stone-700 text-white font-bold py-2.5 rounded-xl border border-stone-700 text-xs transition cursor-pointer"
            >
              Back
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="relative z-10 text-xs text-stone-500 font-mono">
        BUILDRE Sandbox Engine v1.0 • Procedural Voxels
      </div>
    </div>
  );
};
