/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { MainMenu } from './components/MainMenu';
import { GameCanvas } from './components/GameCanvas';
import { WorldSaveMeta } from './types/game';

export default function App() {
  const [screen, setScreen] = useState<'menu' | 'game'>('menu');
  const [activeWorld, setActiveWorld] = useState<WorldSaveMeta | null>(null);

  const handleStartGame = (worldMeta: WorldSaveMeta) => {
    setActiveWorld(worldMeta);
    setScreen('game');
  };

  const handleExitToMenu = () => {
    setScreen('menu');
    setActiveWorld(null);
  };

  return (
    <div className="w-screen h-screen overflow-hidden bg-black select-none">
      {screen === 'menu' && <MainMenu onStartGame={handleStartGame} />}
      {screen === 'game' && activeWorld && (
        <GameCanvas worldMeta={activeWorld} onExitToMenu={handleExitToMenu} />
      )}
    </div>
  );
}
