'use client';

import React, { useState, useEffect } from 'react';
import Player from '@/components/game/Player';
import Npc from '@/components/game/Npc';
import GameMap from '@/components/game/GameMap';

const TILE_SIZE = 32;
const MAP_WIDTH_TILES = 25;
const MAP_HEIGHT_TILES = 15;

const MAP_WIDTH_PX = MAP_WIDTH_TILES * TILE_SIZE;
const MAP_HEIGHT_PX = MAP_HEIGHT_TILES * TILE_SIZE;

export default function GamePage() {
  const [playerPosition, setPlayerPosition] = useState({ x: 5, y: 5 });
  const [showDialog, setShowDialog] = useState(false);

  const npcPosition = { x: 15, y: 8 };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      setPlayerPosition((prev) => {
        let { x, y } = prev;
        switch (e.key) {
          case 'w':
          case 'ArrowUp':
            y = Math.max(0, y - 1);
            break;
          case 's':
          case 'ArrowDown':
            y = Math.min(MAP_HEIGHT_TILES - 1, y + 1);
            break;
          case 'a':
          case 'ArrowLeft':
            x = Math.max(0, x - 1);
            break;
          case 'd':
          case 'ArrowRight':
            x = Math.min(MAP_WIDTH_TILES - 1, x + 1);
            break;
          case 'e':
             const distance = Math.sqrt(
              Math.pow(playerPosition.x - npcPosition.x, 2) +
              Math.pow(playerPosition.y - npcPosition.y, 2)
            );
            if (distance < 2) {
              setShowDialog((prev) => !prev);
            }
            break;
          default:
            break;
        }
        return { x, y };
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [playerPosition.x, playerPosition.y, npcPosition.x, npcPosition.y]);

  return (
    <div className="flex items-center justify-center h-screen bg-gray-800">
      <div
        className="relative overflow-hidden border-4 border-gray-900 bg-green-500"
        style={{
          width: MAP_WIDTH_PX,
          height: MAP_HEIGHT_PX,
        }}
      >
        <GameMap width={MAP_WIDTH_TILES} height={MAP_HEIGHT_TILES} tileSize={TILE_SIZE} />
        <Player position={playerPosition} tileSize={TILE_SIZE} />
        <Npc position={npcPosition} tileSize={TILE_SIZE} />
        {showDialog && (
          <div className="absolute bottom-4 left-4 right-4 bg-white/80 p-4 rounded-lg text-gray-900 border-2 border-gray-700">
            <p className="font-bold">Old Man:</p>
            <p>Greetings, traveler! Be wary of the slimes in the north.</p>
             <button onClick={() => setShowDialog(false)} className="text-sm text-red-600 mt-2">Close</button>
          </div>
        )}
      </div>
    </div>
  );
}
