import React, { useState } from 'react';
import { Play, Save, Settings, LogOut, Volume2, Eye, Compass, Shield, Check } from 'lucide-react';
import { sounds } from '../game/audio';

interface PauseMenuProps {
  onResume: () => void;
  onSave: () => void;
  onQuit: () => void;
  renderDistance: number;
  setRenderDistance: (d: number) => void;
  sensitivity: number;
  setSensitivity: (s: number) => void;
  gameMode: 'survival' | 'creative';
  setGameMode: (m: 'survival' | 'creative') => void;
  soundVolume: number;
  setSoundVolume: (v: number) => void;
  lang?: 'en' | 'uz';
}

export const PauseMenu: React.FC<PauseMenuProps> = ({
  onResume,
  onSave,
  onQuit,
  renderDistance,
  setRenderDistance,
  sensitivity,
  setSensitivity,
  gameMode,
  setGameMode,
  soundVolume,
  setSoundVolume,
  lang = 'uz',
}) => {
  const [tab, setTab] = useState<'menu' | 'settings' | 'controls'>('menu');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveClick = () => {
    onSave();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 select-none">
      <div className="bg-stone-900 border-2 border-stone-600 rounded-2xl shadow-2xl max-w-md w-full p-6 text-stone-200">
        {/* Title */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-black tracking-wider text-emerald-400 font-mono">
            {lang === 'uz' ? "O'YIN TO'XTATILDI" : 'GAME PAUSED'}
          </h2>
          <p className="text-xs text-stone-400 mt-1">BUILDRE Sandbox Voxel World</p>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-stone-950 p-1 rounded-xl mb-6 border border-stone-800">
          <button
            onClick={() => setTab('menu')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold uppercase transition cursor-pointer ${
              tab === 'menu' ? 'bg-stone-800 text-white shadow' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            {lang === 'uz' ? 'Menyu' : 'Menu'}
          </button>
          <button
            onClick={() => setTab('settings')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold uppercase transition cursor-pointer ${
              tab === 'settings' ? 'bg-stone-800 text-white shadow' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            {lang === 'uz' ? 'Sozlamalar' : 'Settings'}
          </button>
          <button
            onClick={() => setTab('controls')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold uppercase transition cursor-pointer ${
              tab === 'controls' ? 'bg-stone-800 text-white shadow' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            {lang === 'uz' ? 'Boshqaruv' : 'Controls'}
          </button>
        </div>

        {/* Content by Tab */}
        {tab === 'menu' && (
          <div className="space-y-3">
            <button
              onClick={onResume}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-xl border border-emerald-400 transition flex items-center justify-center gap-2 cursor-pointer shadow-lg"
            >
              <Play className="w-4 h-4 fill-white" />
              {lang === 'uz' ? "O'yinni Davom Ettirish" : 'Resume Game'}
            </button>

            <button
              onClick={handleSaveClick}
              className="w-full bg-stone-800 hover:bg-stone-750 text-white font-semibold py-3 px-4 rounded-xl border border-stone-650 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              {saveSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-300">
                    {lang === 'uz' ? 'Dunyo Saqlandi!' : 'World Saved!'}
                  </span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 text-amber-400" />
                  {lang === 'uz' ? 'Dunyoni Saqlash' : 'Save World'}
                </>
              )}
            </button>

            <button
              onClick={() => setTab('settings')}
              className="w-full bg-stone-800 hover:bg-stone-750 text-white font-semibold py-3 px-4 rounded-xl border border-stone-650 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Settings className="w-4 h-4 text-blue-400" />
              {lang === 'uz' ? 'Sozlamalar' : 'Settings'}
            </button>

            <button
              onClick={onQuit}
              className="w-full bg-red-950/70 hover:bg-red-900 text-red-200 font-semibold py-3 px-4 rounded-xl border border-red-800 transition flex items-center justify-center gap-2 cursor-pointer mt-4"
            >
              <LogOut className="w-4 h-4" />
              {lang === 'uz' ? 'Saqlash va Chiqish' : 'Save & Quit to Title'}
            </button>
          </div>
        )}

        {tab === 'settings' && (
          <div className="space-y-4">
            {/* Render Distance */}
            <div className="bg-stone-950/70 p-3 rounded-xl border border-stone-800">
              <div className="flex justify-between items-center text-xs font-semibold mb-2">
                <span className="flex items-center gap-1.5 text-stone-300">
                  <Eye className="w-3.5 h-3.5 text-emerald-400" />
                  Render Distance
                </span>
                <span className="font-mono text-emerald-400">{renderDistance} Chunks</span>
              </div>
              <input
                type="range"
                min="2"
                max="5"
                step="1"
                value={renderDistance}
                onChange={(e) => setRenderDistance(parseInt(e.target.value, 10))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <span className="text-[10px] text-stone-500 block mt-1">
                Lower distance delivers higher FPS on slower devices.
              </span>
            </div>

            {/* Mouse Sensitivity */}
            <div className="bg-stone-950/70 p-3 rounded-xl border border-stone-800">
              <div className="flex justify-between items-center text-xs font-semibold mb-2">
                <span className="flex items-center gap-1.5 text-stone-300">
                  <Compass className="w-3.5 h-3.5 text-blue-400" />
                  Look Sensitivity
                </span>
                <span className="font-mono text-blue-400">{Math.round(sensitivity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.4"
                max="2.5"
                step="0.1"
                value={sensitivity}
                onChange={(e) => setSensitivity(parseFloat(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer"
              />
            </div>

            {/* Sound Volume */}
            <div className="bg-stone-950/70 p-3 rounded-xl border border-stone-800">
              <div className="flex justify-between items-center text-xs font-semibold mb-2">
                <span className="flex items-center gap-1.5 text-stone-300">
                  <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                  Audio Volume
                </span>
                <span className="font-mono text-amber-400">{Math.round(soundVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={soundVolume}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setSoundVolume(val);
                  sounds.volume = val;
                }}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Game Mode */}
            <div className="bg-stone-950/70 p-3 rounded-xl border border-stone-800 flex justify-between items-center">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-stone-300">
                <Shield className="w-3.5 h-3.5 text-purple-400" />
                Game Mode
              </span>
              <button
                onClick={() => setGameMode(gameMode === 'survival' ? 'creative' : 'survival')}
                className="bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs px-3 py-1.5 rounded-lg border border-stone-700 uppercase font-mono font-bold cursor-pointer transition"
              >
                {gameMode}
              </button>
            </div>

            <button
              onClick={() => setTab('menu')}
              className="w-full bg-stone-800 hover:bg-stone-700 text-white text-xs font-bold py-2.5 rounded-xl border border-stone-700 transition mt-2 cursor-pointer"
            >
              Done
            </button>
          </div>
        )}

        {tab === 'controls' && (
          <div className="space-y-2 text-xs">
            <div className="bg-stone-950/80 p-3 rounded-xl border border-stone-800 space-y-2 font-mono">
              <div className="flex justify-between">
                <span className="text-stone-400">WASD</span>
                <span className="text-white">Move / Strafe</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Mouse</span>
                <span className="text-white">Look / Camera</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Space</span>
                <span className="text-white">Jump / Swim</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Left Shift</span>
                <span className="text-white">Sprint</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Left Click</span>
                <span className="text-emerald-400">Mine Block / Attack</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Right Click</span>
                <span className="text-amber-400">Place Block / Eat Food</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">1 - 9 Keys</span>
                <span className="text-white">Select Hotbar Slot</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">E Key</span>
                <span className="text-blue-400">Open Inventory & Crafting</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">ESC Key</span>
                <span className="text-white">Pause Menu</span>
              </div>
            </div>

            <button
              onClick={() => setTab('menu')}
              className="w-full bg-stone-800 hover:bg-stone-700 text-white text-xs font-bold py-2.5 rounded-xl border border-stone-700 transition mt-3 cursor-pointer"
            >
              Back to Menu
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
