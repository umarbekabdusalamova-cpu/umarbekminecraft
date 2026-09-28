import React, { useState, useEffect } from 'react';
import {
  X,
  Hammer,
  Flame,
  Box,
  Check,
  ArrowRight,
  ArrowDownUp,
  Search,
  Sparkles,
  Layers,
  Info,
  CornerDownRight,
} from 'lucide-react';
import { Player } from '../game/player';
import { ITEMS, SMELTING_RECIPES, BLOCK_PROPERTIES } from '../game/constants';
import { CRAFTING_RECIPES, CraftingRecipe } from '../game/recipes';
import { sounds } from '../game/audio';
import { ItemDef, BlockType } from '../types/game';

interface InventoryModalProps {
  player: Player;
  lang?: 'en' | 'uz';
  onClose: () => void;
}

// 3D Isometric Voxel Cube Mini-Render
const VoxelCube: React.FC<{ color?: string; size?: number; className?: string }> = ({
  color = '#7a5230',
  size = 28,
  className = '',
}) => {
  return (
    <div
      className={`relative inline-block ${className}`}
      style={{ width: size, height: size * 1.15 }}
    >
      <svg
        viewBox="0 0 32 36"
        className="w-full h-full drop-shadow-md"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Top Face */}
        <polygon points="16,1 31,9 16,17 1,9" fill={color} filter="brightness(1.2)" />
        {/* Left Face */}
        <polygon points="1,9 16,17 16,34 1,26" fill={color} filter="brightness(0.85)" />
        {/* Right Face */}
        <polygon points="16,17 31,9 31,26 16,34" fill={color} filter="brightness(0.65)" />
        {/* Subtle Edge Insets */}
        <polyline points="1,9 16,17 31,9" stroke="#ffffff" strokeWidth="0.75" strokeOpacity="0.3" />
        <line x1="16" y1="17" x2="16" y2="34" stroke="#000000" strokeWidth="0.75" strokeOpacity="0.4" />
      </svg>
    </div>
  );
};

export const InventoryModal: React.FC<InventoryModalProps> = ({ player, lang = 'uz', onClose }) => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'crafting' | 'furnace' | 'creative'>('inventory');
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [hoveredItem, setHoveredItem] = useState<{ slotIdx: number; itemDef: ItemDef; count: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [craftCategory, setCraftCategory] = useState<'all' | 'tools' | 'structures' | 'weapons' | 'blocks' | 'materials'>('all');
  const [craftSearch, setCraftSearch] = useState('');
  const [, setRefresh] = useState(0);

  const forceUpdate = () => setRefresh((r) => r + 1);

  // Close modal on 'E' or 'Escape'
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyE' || e.code === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Handle slot left-click: pick up, swap, or move
  const handleSlotClick = (slotIdx: number, e: React.MouseEvent) => {
    // Shift + Click: Quick move between Hotbar (0..8) and Backpack (9..35)
    if (e.shiftKey) {
      if (player.inventory[slotIdx]) {
        player.quickTransferSlot(slotIdx);
        setSelectedSlot(null);
        forceUpdate();
      }
      return;
    }

    if (selectedSlot === null) {
      if (player.inventory[slotIdx]) {
        setSelectedSlot(slotIdx);
        sounds.playPop();
      }
    } else {
      if (selectedSlot === slotIdx) {
        // Deselect
        setSelectedSlot(null);
      } else {
        const source = player.inventory[selectedSlot];
        const target = player.inventory[slotIdx];

        // Same item type: try stacking up to maxStack
        if (source && target && source.itemId === target.itemId) {
          const maxStack = ITEMS[source.itemId]?.maxStack || 64;
          const space = maxStack - target.count;
          if (space > 0) {
            const transfer = Math.min(space, source.count);
            target.count += transfer;
            source.count -= transfer;
            if (source.count <= 0) {
              player.inventory[selectedSlot] = null;
              setSelectedSlot(null);
            }
          } else {
            // Swap if target is already full
            player.inventory[slotIdx] = source;
            player.inventory[selectedSlot] = target;
            setSelectedSlot(null);
          }
        } else {
          // Different items or one empty: swap
          player.inventory[slotIdx] = source;
          player.inventory[selectedSlot] = target;
          setSelectedSlot(null);
        }

        player.updateHeldItem();
        sounds.playPop();
        forceUpdate();
      }
    }
  };

  // Handle slot right-click: Split stack into half
  const handleSlotContextMenu = (slotIdx: number, e: React.MouseEvent) => {
    e.preventDefault();
    const slot = player.inventory[slotIdx];
    if (!slot || slot.count <= 1) return;

    if (selectedSlot === null) {
      // Find first empty slot to put half the stack
      const half = Math.floor(slot.count / 2);
      for (let i = 0; i < 36; i++) {
        if (!player.inventory[i]) {
          player.inventory[i] = { itemId: slot.itemId, count: half };
          slot.count -= half;
          player.updateHeldItem();
          sounds.playPop();
          forceUpdate();
          return;
        }
      }
    } else {
      // Transfer 1 item from selectedSlot into target slotIdx
      const sel = player.inventory[selectedSlot];
      if (!sel) return;

      if (!slot) {
        player.inventory[slotIdx] = { itemId: sel.itemId, count: 1 };
        sel.count -= 1;
        if (sel.count <= 0) {
          player.inventory[selectedSlot] = null;
          setSelectedSlot(null);
        }
      } else if (slot.itemId === sel.itemId) {
        const maxStack = ITEMS[sel.itemId]?.maxStack || 64;
        if (slot.count < maxStack) {
          slot.count += 1;
          sel.count -= 1;
          if (sel.count <= 0) {
            player.inventory[selectedSlot] = null;
            setSelectedSlot(null);
          }
        }
      }
      player.updateHeldItem();
      sounds.playPop();
      forceUpdate();
    }
  };

  // Drop selected slot item into world
  const handleDropSlot = (slotIdx: number, all: boolean = true) => {
    const slot = player.inventory[slotIdx];
    if (!slot) return;
    player.dropSlotItem(slotIdx, all ? slot.count : 1);
    if (!player.inventory[slotIdx]) {
      setSelectedSlot(null);
    }
    forceUpdate();
  };

  // Sort inventory
  const handleSort = () => {
    player.sortInventory();
    setSelectedSlot(null);
    sounds.playCraft();
    forceUpdate();
  };

  // Recipe helpers
  const canCraft = (recipe: CraftingRecipe) => {
    return recipe.inputs.every((input) => player.getItemCount(input.itemId) >= input.count);
  };

  const handleCraft = (recipe: CraftingRecipe) => {
    if (!canCraft(recipe)) return;
    for (const input of recipe.inputs) {
      player.removeItem(input.itemId, input.count);
    }
    player.addItem(recipe.result.itemId, recipe.result.count);
    sounds.playCraft();
    forceUpdate();
  };

  const handleSmelt = (smelt: (typeof SMELTING_RECIPES)[0]) => {
    const hasOre = player.getItemCount(smelt.input) >= 1;
    const hasFuel = player.getItemCount('coal') >= 1 || player.getItemCount('wood') >= 1;
    if (!hasOre || !hasFuel) return;

    player.removeItem(smelt.input, 1);
    if (player.getItemCount('coal') >= 1) {
      player.removeItem('coal', 1);
    } else {
      player.removeItem('wood', 1);
    }
    player.addItem(smelt.output, 1);
    sounds.playCraft();
    forceUpdate();
  };

  // Add item in Creative mode
  const handleTakeCreativeItem = (itemId: string) => {
    player.addItem(itemId, 64);
    sounds.playPop();
    forceUpdate();
  };

  const getItemDisplayName = (itemId: string) => {
    const def = ITEMS[itemId];
    if (!def) return itemId;
    return lang === 'uz' && def.nameUz ? def.nameUz : def.name;
  };

  // Calculate inventory statistics
  const occupiedSlots = player.inventory.filter(Boolean).length;
  const totalItemCount = player.inventory.reduce((sum, item) => sum + (item?.count || 0), 0);

  // Inspector item calculation
  const inspectedSlot = selectedSlot !== null ? selectedSlot : hoveredItem?.slotIdx ?? null;
  const inspectedStack = inspectedSlot !== null ? player.inventory[inspectedSlot] : null;
  const inspectedDef = inspectedStack ? ITEMS[inspectedStack.itemId] : null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-5 select-none animate-fadeIn">
      <div className="bg-stone-900/95 border-2 border-stone-600 rounded-2xl shadow-2xl max-w-5xl w-full flex flex-col max-h-[92vh] overflow-hidden text-stone-200">
        {/* Header Tabs & Close */}
        <div className="flex items-center justify-between px-5 py-3 bg-stone-950/80 border-b border-stone-750">
          <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto">
            <button
              onClick={() => setActiveTab('inventory')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-mono font-bold text-xs uppercase transition cursor-pointer ${
                activeTab === 'inventory'
                  ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/60 shadow-md'
                  : 'text-stone-400 hover:text-white hover:bg-stone-850'
              }`}
            >
              <Box className="w-4 h-4 text-emerald-400" />
              <span>{lang === 'uz' ? 'Voksel Bloklar' : 'Voxel Blocks'}</span>
            </button>

            <button
              onClick={() => setActiveTab('crafting')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-mono font-bold text-xs uppercase transition cursor-pointer ${
                activeTab === 'crafting'
                  ? 'bg-amber-600/30 text-amber-300 border border-amber-500/60 shadow-md'
                  : 'text-stone-400 hover:text-white hover:bg-stone-850'
              }`}
            >
              <Hammer className="w-4 h-4 text-amber-400" />
              <span>{lang === 'uz' ? 'Dastgoh' : 'Crafting'}</span>
            </button>

            <button
              onClick={() => setActiveTab('furnace')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-mono font-bold text-xs uppercase transition cursor-pointer ${
                activeTab === 'furnace'
                  ? 'bg-orange-600/30 text-orange-300 border border-orange-500/60 shadow-md'
                  : 'text-stone-400 hover:text-white hover:bg-stone-850'
              }`}
            >
              <Flame className="w-4 h-4 text-orange-400" />
              <span>{lang === 'uz' ? 'Pech' : 'Furnace'}</span>
            </button>

            {player.gameMode === 'creative' && (
              <button
                onClick={() => setActiveTab('creative')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-mono font-bold text-xs uppercase transition cursor-pointer ${
                  activeTab === 'creative'
                    ? 'bg-purple-600/30 text-purple-300 border border-purple-500/60 shadow-md'
                    : 'text-stone-400 hover:text-white hover:bg-stone-850'
                }`}
              >
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>{lang === 'uz' ? 'Ijodiy Palitra' : 'Creative Palette'}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-block text-[11px] font-mono text-stone-500 bg-stone-900 border border-stone-800 px-2 py-0.5 rounded">
              [E / ESC] {lang === 'uz' ? 'Yopish' : 'Close'}
            </span>
            <button
              onClick={onClose}
              className="text-stone-400 hover:text-white p-1.5 rounded-lg hover:bg-stone-800 transition cursor-pointer"
              title="Close [E]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden divide-y md:divide-y-0 md:divide-x divide-stone-800">
          {/* TAB 1: INVENTORY & VOXEL BLOCKS */}
          {activeTab === 'inventory' && (
            <>
              {/* Left Column: Storage Grid (Hotbar & 27 Backpack Slots) */}
              <div className="flex-1 p-5 flex flex-col justify-between overflow-y-auto bg-stone-900/70">
                <div>
                  {/* Top Bar: Controls & Quick Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono uppercase font-bold text-stone-300 flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-emerald-400" />
                        {lang === 'uz' ? 'Xalta & Saqlash Joyi' : 'Backpack & Storage'}
                      </span>
                      <span className="text-[11px] text-stone-500 font-mono">
                        ({occupiedSlots}/36 {lang === 'uz' ? 'joy' : 'slots'} • {totalItemCount}{' '}
                        {lang === 'uz' ? 'dona' : 'items'})
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleSort}
                        className="bg-stone-800 hover:bg-stone-750 text-stone-200 text-xs font-mono font-semibold px-3 py-1.5 rounded-lg border border-stone-700 transition flex items-center gap-1.5 cursor-pointer shadow"
                        title={lang === 'uz' ? 'Blok va asboblarni tartiblash' : 'Sort & stack inventory'}
                      >
                        <ArrowDownUp className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{lang === 'uz' ? 'Tartiblash' : 'Sort Items'}</span>
                      </button>

                      {selectedSlot !== null && player.inventory[selectedSlot] && (
                        <button
                          onClick={() => handleDropSlot(selectedSlot, false)}
                          className="bg-amber-950/60 hover:bg-amber-900/80 text-amber-200 text-xs font-mono font-semibold px-3 py-1.5 rounded-lg border border-amber-700 transition flex items-center gap-1.5 cursor-pointer shadow"
                          title={lang === 'uz' ? "Yerga 1 dona tashlash" : "Drop 1 item into world"}
                        >
                          <CornerDownRight className="w-3.5 h-3.5" />
                          <span>{lang === 'uz' ? 'Tashlash (1x)' : 'Drop (1x)'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Search Bar for Voxel Blocks */}
                  <div className="relative mb-3">
                    <Search className="w-3.5 h-3.5 text-stone-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder={lang === 'uz' ? 'Blok yoki buyumlarni qidirish...' : 'Search collected blocks...'}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-stone-950/70 border border-stone-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-stone-200 placeholder-stone-500 focus:outline-hidden focus:border-emerald-500"
                    />
                  </div>

                  {/* Main Storage Grid (3x9 = 27 Slots: 9 to 35) */}
                  <div className="bg-stone-950/80 p-3 rounded-xl border border-stone-800 shadow-inner">
                    <div className="grid grid-cols-9 gap-2">
                      {Array.from({ length: 27 }).map((_, i) => {
                        const slotIdx = 9 + i;
                        const item = player.inventory[slotIdx];
                        const def = item ? ITEMS[item.itemId] : null;
                        const isSelected = selectedSlot === slotIdx;
                        const matchesSearch =
                          !searchQuery ||
                          (def &&
                            (def.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              (def.nameUz && def.nameUz.toLowerCase().includes(searchQuery.toLowerCase()))));

                        return (
                          <div
                            key={slotIdx}
                            onClick={(e) => handleSlotClick(slotIdx, e)}
                            onContextMenu={(e) => handleSlotContextMenu(slotIdx, e)}
                            onMouseEnter={() => def && item && setHoveredItem({ slotIdx, itemDef: def, count: item.count })}
                            onMouseLeave={() => setHoveredItem(null)}
                            className={`relative aspect-square rounded-lg border-2 flex items-center justify-center cursor-pointer transition-all ${
                              isSelected
                                ? 'border-amber-400 bg-amber-500/25 ring-2 ring-amber-400/40 scale-105 z-10 shadow-lg'
                                : matchesSearch
                                ? 'border-stone-750 bg-stone-850 hover:bg-stone-800 hover:border-emerald-500/60'
                                : 'border-stone-800 bg-stone-900/40 opacity-30'
                            }`}
                            title={def ? `${getItemDisplayName(item?.itemId || '')} (${item?.count})` : ''}
                          >
                            {def && (
                              <div className="flex items-center justify-center pointer-events-none">
                                {def.type === 'block' ? (
                                  <VoxelCube color={def.color} size={24} />
                                ) : (
                                  <div
                                    className="w-5 h-5 rounded flex items-center justify-center font-bold text-[9px] text-white drop-shadow border border-black/30"
                                    style={{ backgroundColor: def.color || '#555' }}
                                  >
                                    {def.name.substring(0, 2).toUpperCase()}
                                  </div>
                                )}
                              </div>
                            )}

                            {item && item.count > 1 && (
                              <span className="absolute bottom-0.5 right-1 text-[11px] font-black font-mono text-white drop-shadow-[0_1px_2px_rgba(0,0,0,1)] pointer-events-none">
                                {item.count}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Hotbar (Slots 0 to 8) */}
                <div className="mt-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono uppercase font-bold text-stone-400">
                      {lang === 'uz' ? 'Tezkor Panel (1 - 9)' : 'Hotbar (Keys 1 - 9)'}
                    </span>
                    <span className="text-[11px] text-stone-500 font-mono">
                      {lang === 'uz' ? 'Qo\'ldagi aktiv asbob / blok' : 'Equipped in hands'}
                    </span>
                  </div>

                  <div className="bg-stone-950 p-3 rounded-xl border-2 border-stone-700 shadow-xl">
                    <div className="grid grid-cols-9 gap-2">
                      {Array.from({ length: 9 }).map((_, slotIdx) => {
                        const item = player.inventory[slotIdx];
                        const def = item ? ITEMS[item.itemId] : null;
                        const isSelected = selectedSlot === slotIdx;
                        const isEquipped = player.selectedHotbarIndex === slotIdx;

                        return (
                          <div
                            key={slotIdx}
                            onClick={(e) => handleSlotClick(slotIdx, e)}
                            onContextMenu={(e) => handleSlotContextMenu(slotIdx, e)}
                            onMouseEnter={() => def && item && setHoveredItem({ slotIdx, itemDef: def, count: item.count })}
                            onMouseLeave={() => setHoveredItem(null)}
                            className={`relative aspect-square rounded-lg border-2 flex items-center justify-center cursor-pointer transition-all ${
                              isSelected
                                ? 'border-amber-400 bg-amber-500/25 ring-2 ring-amber-400/40 scale-105 z-10 shadow-lg'
                                : isEquipped
                                ? 'border-emerald-500 bg-emerald-950/40 ring-1 ring-emerald-500/60'
                                : 'border-stone-700 bg-stone-850 hover:bg-stone-800'
                            }`}
                            title={def ? `${getItemDisplayName(item?.itemId || '')} (${item?.count})` : ''}
                          >
                            <span className="absolute top-0.5 left-1 text-[8px] font-mono text-stone-500 font-bold pointer-events-none">
                              {slotIdx + 1}
                            </span>

                            {def && (
                              <div className="flex items-center justify-center pointer-events-none">
                                {def.type === 'block' ? (
                                  <VoxelCube color={def.color} size={24} />
                                ) : (
                                  <div
                                    className="w-5 h-5 rounded flex items-center justify-center font-bold text-[9px] text-white drop-shadow border border-black/30"
                                    style={{ backgroundColor: def.color || '#555' }}
                                  >
                                    {def.name.substring(0, 2).toUpperCase()}
                                  </div>
                                )}
                              </div>
                            )}

                            {item && item.count > 1 && (
                              <span className="absolute bottom-0.5 right-1 text-[11px] font-black font-mono text-white drop-shadow-[0_1px_2px_rgba(0,0,0,1)] pointer-events-none">
                                {item.count}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Hotkey Helper Bar */}
                  <div className="mt-3 flex flex-wrap items-center justify-between text-[11px] text-stone-500 font-mono px-1">
                    <span>
                      <strong className="text-stone-300">Left-Click:</strong> {lang === 'uz' ? 'Olish/Almashtirish' : 'Pick/Swap'}
                    </span>
                    <span>
                      <strong className="text-stone-300">Right-Click:</strong> {lang === 'uz' ? 'Teng 2 ga bo\'lish' : 'Split Stack (50%)'}
                    </span>
                    <span>
                      <strong className="text-stone-300">Shift+Click:</strong> {lang === 'uz' ? 'Tezkor ko\'chirish' : 'Fast Move'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Voxel Block Inspector & Details Card */}
              <div className="w-full md:w-80 p-5 bg-stone-950 flex flex-col justify-between border-t md:border-t-0 border-stone-800">
                {inspectedDef && inspectedStack ? (
                  <div className="space-y-4">
                    {/* Header with 3D Preview */}
                    <div className="flex items-center gap-3.5 pb-3 border-b border-stone-800">
                      <div className="w-14 h-14 rounded-xl bg-stone-900 border-2 border-stone-700 flex items-center justify-center shadow-inner">
                        {inspectedDef.type === 'block' ? (
                          <VoxelCube color={inspectedDef.color} size={36} />
                        ) : (
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm text-white drop-shadow border border-black/30"
                            style={{ backgroundColor: inspectedDef.color || '#555' }}
                          >
                            {inspectedDef.name.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>

                      <div>
                        <h4 className="text-base font-bold text-white font-mono leading-tight">
                          {getItemDisplayName(inspectedDef.id)}
                        </h4>
                        <span className="text-[11px] font-mono text-emerald-400 capitalize">
                          {inspectedDef.type === 'block'
                            ? lang === 'uz'
                              ? '3D Voksel Bloki'
                              : 'Voxel Block'
                            : inspectedDef.type}
                        </span>
                      </div>
                    </div>

                    {/* Stats Table */}
                    <div className="space-y-2 text-xs font-mono">
                      <div className="flex justify-between py-1 border-b border-stone-900">
                        <span className="text-stone-400">{lang === 'uz' ? 'To\'plangan soni:' : 'Stack Count:'}</span>
                        <span className="text-white font-bold">{inspectedStack.count} / {inspectedDef.maxStack}</span>
                      </div>

                      {inspectedDef.type === 'block' && inspectedDef.blockType !== undefined && (
                        <>
                          <div className="flex justify-between py-1 border-b border-stone-900">
                            <span className="text-stone-400">{lang === 'uz' ? 'Qattiqligi:' : 'Hardness:'}</span>
                            <span className="text-stone-200">
                              {BLOCK_PROPERTIES[inspectedDef.blockType]?.hardness || 1.0}s
                            </span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-stone-900">
                            <span className="text-stone-400">{lang === 'uz' ? 'Qulay asbob:' : 'Preferred Tool:'}</span>
                            <span className="text-amber-400 capitalize">
                              {BLOCK_PROPERTIES[inspectedDef.blockType]?.preferredTool || 'Hand / Any'}
                            </span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-stone-900">
                            <span className="text-stone-400">{lang === 'uz' ? 'Dunyoga qo\'yiladi:' : 'Placeable:'}</span>
                            <span className="text-emerald-400 font-bold">{lang === 'uz' ? 'Ha (Sichqoncha o\'ng)' : 'Yes (Right-Click)'}</span>
                          </div>
                        </>
                      )}

                      {inspectedDef.damage !== undefined && (
                        <div className="flex justify-between py-1 border-b border-stone-900">
                          <span className="text-stone-400">{lang === 'uz' ? 'Zarba kuchi:' : 'Attack Damage:'}</span>
                          <span className="text-red-400 font-bold">+{inspectedDef.damage} DMG</span>
                        </div>
                      )}

                      {inspectedDef.miningSpeed !== undefined && (
                        <div className="flex justify-between py-1 border-b border-stone-900">
                          <span className="text-stone-400">{lang === 'uz' ? 'Qazish tezligi:' : 'Mining Speed:'}</span>
                          <span className="text-blue-400 font-bold">{inspectedDef.miningSpeed}x</span>
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    {inspectedDef.description && (
                      <p className="text-xs text-stone-400 italic bg-stone-900/60 p-2.5 rounded-lg border border-stone-850">
                        {inspectedDef.description}
                      </p>
                    )}

                    {/* Actions on this item */}
                    {inspectedSlot !== null && (
                      <div className="pt-2 flex flex-col gap-2">
                        <button
                          onClick={() => player.quickTransferSlot(inspectedSlot)}
                          className="w-full bg-stone-800 hover:bg-stone-750 text-stone-200 text-xs font-mono font-semibold py-2 rounded-lg border border-stone-700 transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <ArrowRight className="w-3.5 h-3.5 text-blue-400" />
                          <span>
                            {inspectedSlot < 9
                              ? lang === 'uz'
                                ? 'Xaltaga ko\'chirish'
                                : 'Move to Backpack'
                              : lang === 'uz'
                              ? 'Tezkor panelga ko\'chirish'
                              : 'Move to Hotbar'}
                          </span>
                        </button>

                        <button
                          onClick={() => handleDropSlot(inspectedSlot, true)}
                          className="w-full bg-red-950/50 hover:bg-red-900/60 text-red-300 text-xs font-mono font-semibold py-2 rounded-lg border border-red-800/80 transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <CornerDownRight className="w-3.5 h-3.5" />
                          <span>{lang === 'uz' ? 'Hammasini yerga tashlash' : 'Drop All into World'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center h-full py-12 text-stone-500">
                    <Info className="w-8 h-8 mb-2 opacity-50" />
                    <span className="text-xs font-mono">
                      {lang === 'uz'
                        ? 'Xususiyatlarini ko\'rish uchun istalgan blok yoki asbob ustiga bosing.'
                        : 'Select or hover any voxel block or tool to view details.'}
                    </span>
                  </div>
                )}

                <div className="text-[10px] text-stone-600 font-mono text-center pt-3 border-t border-stone-900">
                  BUILDRE Voxel Engine • 64-Stack Max
                </div>
              </div>
            </>
          )}

          {/* TAB 2: CRAFTING WORKBENCH */}
          {activeTab === 'crafting' && (
            <div className="flex-1 p-5 flex flex-col overflow-hidden bg-stone-900">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <span className="text-xs font-mono uppercase text-stone-300 font-bold flex items-center gap-1.5">
                  <Hammer className="w-4 h-4 text-amber-400" />
                  {lang === 'uz' ? 'Dastgoh & Qurilmalar (Crafting)' : 'Workbench & Structures'}
                </span>

                {/* Category Filters */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
                  {(
                    [
                      { key: 'all', en: 'All', uz: 'Barchasi' },
                      { key: 'tools', en: 'Tools', uz: 'Asboblar' },
                      { key: 'structures', en: 'Structures', uz: 'Qurilmalar' },
                      { key: 'weapons', en: 'Weapons', uz: 'Qurollar' },
                      { key: 'blocks', en: 'Blocks', uz: 'Bloklar' },
                      { key: 'materials', en: 'Materials', uz: 'Materiallar' },
                    ] as const
                  ).map((cat) => (
                    <button
                      key={cat.key}
                      onClick={() => setCraftCategory(cat.key)}
                      className={`px-2.5 py-1 rounded-lg transition cursor-pointer font-semibold ${
                        craftCategory === cat.key
                          ? 'bg-amber-600/35 text-amber-300 border border-amber-500/60 shadow'
                          : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800 border border-transparent'
                      }`}
                    >
                      {lang === 'uz' ? cat.uz : cat.en}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search Bar for Crafting Recipes */}
              <div className="relative mb-3">
                <Search className="w-3.5 h-3.5 text-stone-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder={
                    lang === 'uz'
                      ? 'Asbob, qurol, bino yoki material retseptini qidirish...'
                      : 'Search tools, weapons, structures or recipes...'
                  }
                  value={craftSearch}
                  onChange={(e) => setCraftSearch(e.target.value)}
                  className="w-full bg-stone-950/70 border border-stone-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-stone-200 placeholder-stone-500 focus:outline-hidden focus:border-amber-500"
                />
              </div>

              {/* Recipe Cards Grid */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-2">
                {CRAFTING_RECIPES.filter((r) => {
                  if (craftCategory !== 'all' && r.category !== craftCategory) return false;
                  if (!craftSearch) return true;
                  const q = craftSearch.toLowerCase();
                  return (
                    r.name.toLowerCase().includes(q) ||
                    (r.nameUz && r.nameUz.toLowerCase().includes(q)) ||
                    r.description.toLowerCase().includes(q) ||
                    r.inputs.some((inp) => inp.itemId.toLowerCase().includes(q))
                  );
                }).map((recipe) => {
                  const available = canCraft(recipe);
                  const resDef = ITEMS[recipe.result.itemId];
                  const isStructure = recipe.category === 'structures';

                  return (
                    <div
                      key={recipe.id}
                      className={`p-3.5 rounded-xl border transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                        available
                          ? isStructure
                            ? 'bg-amber-950/20 border-amber-600/50 hover:border-amber-400 shadow-md'
                            : 'bg-stone-850 border-stone-700 hover:border-amber-400/60 shadow-md'
                          : 'bg-stone-950/60 border-stone-850 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-xl bg-stone-900 border border-stone-750 flex items-center justify-center relative shadow-inner shrink-0">
                          {resDef?.type === 'block' ? (
                            <VoxelCube color={resDef.color} size={30} />
                          ) : isStructure ? (
                            <div className="flex flex-col items-center justify-center">
                              <Box className="w-6 h-6 text-amber-400 drop-shadow" />
                            </div>
                          ) : (
                            <div
                              className="w-7 h-7 rounded flex items-center justify-center text-xs font-bold text-white drop-shadow"
                              style={{ backgroundColor: resDef?.color || '#555' }}
                            >
                              {recipe.result.itemId.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                          {recipe.result.count > 1 && (
                            <span className="absolute bottom-0.5 right-1 text-[10px] font-mono font-bold text-white drop-shadow">
                              {recipe.result.count}
                            </span>
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-stone-100 font-mono">
                              {lang === 'uz' && recipe.nameUz ? recipe.nameUz : recipe.name}
                            </span>
                            {isStructure && (
                              <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded font-bold">
                                {lang === 'uz' ? '3D Bino' : 'Structure'}
                              </span>
                            )}
                            {resDef?.damage && (
                              <span className="text-[10px] font-mono bg-red-500/20 text-red-300 border border-red-500/40 px-1.5 py-0.2 rounded">
                                +{resDef.damage} DMG
                              </span>
                            )}
                            {resDef?.miningSpeed && (
                              <span className="text-[10px] font-mono bg-blue-500/20 text-blue-300 border border-blue-500/40 px-1.5 py-0.2 rounded">
                                {resDef.miningSpeed}x Speed
                              </span>
                            )}
                          </div>

                          <div className="text-[11px] text-stone-400 font-mono mt-0.5">
                            {lang === 'uz' && recipe.descriptionUz ? recipe.descriptionUz : recipe.description}
                          </div>

                          <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px] font-mono">
                            {recipe.inputs.map((inp, idx) => {
                              const have = player.getItemCount(inp.itemId);
                              const hasEnough = have >= inp.count;
                              return (
                                <span
                                  key={idx}
                                  className={`px-1.5 py-0.5 rounded border ${
                                    hasEnough
                                      ? 'bg-stone-900 border-stone-750 text-stone-300'
                                      : 'bg-red-950/40 border-red-800 text-red-400 font-medium'
                                  }`}
                                >
                                  {getItemDisplayName(inp.itemId)}: {have}/{inp.count}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      <button
                        disabled={!available}
                        onClick={() => handleCraft(recipe)}
                        className={`w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold font-mono uppercase transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md shrink-0 ${
                          available
                            ? isStructure
                              ? 'bg-amber-600 hover:bg-amber-500 text-stone-950 font-black'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                            : 'bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-750'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{lang === 'uz' ? 'Yaratish' : 'Craft'}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: SMELTING FURNACE */}
          {activeTab === 'furnace' && (
            <div className="flex-1 p-5 flex flex-col overflow-hidden bg-stone-900">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono uppercase text-orange-400 font-bold flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-orange-500" />
                  {lang === 'uz' ? 'Eritish Pechi (Smelting)' : 'Smelting & Cooking'}
                </span>
                <span className="text-[11px] text-stone-400 font-mono">
                  {lang === 'uz' ? 'Yoqilg\'i: Ko\'mir (Coal) yoki Yog\'och (Wood)' : 'Fuel: Coal or Wood'}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2.5 pr-2">
                {SMELTING_RECIPES.map((smelt, idx) => {
                  const hasOre = player.getItemCount(smelt.input) >= 1;
                  const hasFuel = player.getItemCount('coal') >= 1 || player.getItemCount('wood') >= 1;
                  const canSmelt = hasOre && hasFuel;
                  const inDef = ITEMS[smelt.input];
                  const outDef = ITEMS[smelt.output];

                  return (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-xl border transition flex items-center justify-between ${
                        canSmelt
                          ? 'bg-stone-850 border-orange-500/40 hover:border-orange-500/80 shadow-md'
                          : 'bg-stone-950/60 border-stone-850 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-lg bg-stone-900 border border-stone-750 flex items-center justify-center">
                          {inDef?.type === 'block' ? (
                            <VoxelCube color={inDef.color} size={24} />
                          ) : (
                            <div
                              className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold text-white drop-shadow"
                              style={{ backgroundColor: inDef?.color || '#555' }}
                            >
                              {smelt.input.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>

                        <ArrowRight className="w-4 h-4 text-stone-500" />

                        <div className="w-10 h-10 rounded-lg bg-stone-900 border border-stone-750 flex items-center justify-center">
                          {outDef?.type === 'block' ? (
                            <VoxelCube color={outDef.color} size={24} />
                          ) : (
                            <div
                              className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold text-white drop-shadow"
                              style={{ backgroundColor: outDef?.color || '#555' }}
                            >
                              {smelt.output.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>

                        <div>
                          <div className="text-sm font-semibold text-stone-100 font-mono">
                            {getItemDisplayName(smelt.output)}
                          </div>
                          <div className="text-[11px] text-stone-400 font-mono mt-0.5">
                            {getItemDisplayName(smelt.input)} ({player.getItemCount(smelt.input)}) +{' '}
                            {lang === 'uz' ? 'Yoqilg\'i' : 'Fuel'}
                          </div>
                        </div>
                      </div>

                      <button
                        disabled={!canSmelt}
                        onClick={() => handleSmelt(smelt)}
                        className={`px-4 py-2 rounded-lg text-xs font-bold font-mono uppercase transition flex items-center gap-1.5 cursor-pointer shadow-md ${
                          canSmelt
                            ? 'bg-orange-600 hover:bg-orange-500 text-white'
                            : 'bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-750'
                        }`}
                      >
                        <Flame className="w-3.5 h-3.5 fill-white" />
                        <span>{lang === 'uz' ? 'Eritish' : 'Smelt'}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: CREATIVE PALETTE */}
          {activeTab === 'creative' && player.gameMode === 'creative' && (
            <div className="flex-1 p-5 flex flex-col overflow-hidden bg-stone-900">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono uppercase text-purple-400 font-bold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  {lang === 'uz' ? 'Ijodiy Rejim: Barcha Bloklar va Buyumlar' : 'Creative Mode Block Palette'}
                </span>
                <span className="text-[11px] text-stone-400 font-mono">
                  {lang === 'uz' ? 'Bosib, 64 donadan inventarga oling' : 'Click any block to get a full stack (64x)'}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 pr-2">
                {Object.values(ITEMS).map((itemDef) => (
                  <button
                    key={itemDef.id}
                    onClick={() => handleTakeCreativeItem(itemDef.id)}
                    className="p-2.5 rounded-xl bg-stone-850 hover:bg-stone-800 border border-stone-750 hover:border-purple-400/60 transition flex items-center gap-3 text-left cursor-pointer group shadow"
                  >
                    <div className="w-9 h-9 rounded-lg bg-stone-900 border border-stone-750 flex items-center justify-center shrink-0">
                      {itemDef.type === 'block' ? (
                        <VoxelCube color={itemDef.color} size={22} />
                      ) : (
                        <div
                          className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold text-white drop-shadow"
                          style={{ backgroundColor: itemDef.color || '#555' }}
                        >
                          {itemDef.name.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-bold text-stone-200 group-hover:text-purple-300 font-mono truncate">
                        {getItemDisplayName(itemDef.id)}
                      </div>
                      <span className="text-[10px] text-stone-500 font-mono">+64 {lang === 'uz' ? 'olish' : 'take'}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
