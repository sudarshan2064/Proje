'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { doc, onSnapshot, setDoc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Player } from './Player';
import { Bullet } from './Bullet';
import { nanoid } from 'nanoid';

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const PLAYER_SIZE = 40;
const PLAYER_SPEED = 5;
const BULLET_SPEED = 10;
const MAX_HEALTH = 100;

interface PlayerState {
  id: string;
  x: number;
  y: number;
  health: number;
  kills: number;
  deaths: number;
  lastShot: number;
}

interface BulletState {
  id: string;
  x: number;
  y: number;
  dx: number;
  dy: number;
  playerId: string;
}

interface GameState {
  players: { [key: string]: PlayerState };
  bullets: BulletState[];
}

export function Game() {
  const { roomId } = useParams();
  const [gameState, setGameState] = useState<GameState>({ players: {}, bullets: [] });
  const [playerId, setPlayerId] = useState<string | null>(null);
  const gameLoopRef = useRef<number>();
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const mousePosition = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const gameContainerRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    const localPlayerId = localStorage.getItem(`player_id_${roomId}`) || `p_${nanoid(4)}`;
    localStorage.setItem(`player_id_${roomId}`, localPlayerId);
    setPlayerId(localPlayerId);
    
    const initPlayer = async () => {
      const roomRef = doc(db, 'rooms', roomId as string);
      const roomSnap = await getDoc(roomRef);
      if (!roomSnap.exists() || !roomSnap.data().players?.[localPlayerId]) {
        const newPlayer: PlayerState = {
          id: localPlayerId,
          x: Math.random() * (GAME_WIDTH - PLAYER_SIZE),
          y: Math.random() * (GAME_HEIGHT - PLAYER_SIZE),
          health: MAX_HEALTH,
          kills: 0,
          deaths: 0,
          lastShot: 0
        };
        await setDoc(roomRef, { players: { [localPlayerId]: newPlayer }, bullets: [] }, { merge: true });
      }
    };

    initPlayer();

    const unsubscribe = onSnapshot(doc(db, 'rooms', roomId as string), (doc) => {
      if (doc.exists()) {
        setGameState(doc.data() as GameState);
      }
    });

    return () => unsubscribe();
  }, [roomId]);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = false;
    };
    const handleMouseMove = (e: MouseEvent) => {
        if (gameContainerRef.current) {
            const rect = gameContainerRef.current.getBoundingClientRect();
            mousePosition.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        }
    };
    const handleMouseDown = (e: MouseEvent) => {
        if (e.button === 0) {
            keysPressed.current['mouse0'] = true;
        }
    };
    const handleMouseUp = (e: MouseEvent) => {
        if (e.button === 0) {
            keysPressed.current['mouse0'] = false;
        }
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    const gameEl = gameContainerRef.current;
    if (gameEl) {
        gameEl.addEventListener('mousemove', handleMouseMove);
        gameEl.addEventListener('mousedown', handleMouseDown);
        gameEl.addEventListener('mouseup', handleMouseUp);
    }

    const gameLoop = () => {
      if (playerId && gameState.players[playerId]) {
        const player = { ...gameState.players[playerId] };
        let playerMoved = false;

        if (keysPressed.current['w'] || keysPressed.current['arrowup']) {
          player.y = Math.max(0, player.y - PLAYER_SPEED);
          playerMoved = true;
        }
        if (keysPressed.current['s'] || keysPressed.current['arrowdown']) {
          player.y = Math.min(GAME_HEIGHT - PLAYER_SIZE, player.y + PLAYER_SPEED);
          playerMoved = true;
        }
        if (keysPressed.current['a'] || keysPressed.current['arrowleft']) {
          player.x = Math.max(0, player.x - PLAYER_SPEED);
          playerMoved = true;
        }
        if (keysPressed.current['d'] || keysPressed.current['arrowright']) {
          player.x = Math.min(GAME_WIDTH - PLAYER_SIZE, player.x + PLAYER_SPEED);
          playerMoved = true;
        }
        
        if (playerMoved) {
          updateDoc(doc(db, 'rooms', roomId as string), { [`players.${playerId}`]: player });
        }
        
        if (keysPressed.current['mouse0'] && Date.now() - player.lastShot > 200) {
          player.lastShot = Date.now();
          const angle = Math.atan2(mousePosition.current.y - (player.y + PLAYER_SIZE / 2), mousePosition.current.x - (player.x + PLAYER_SIZE / 2));
          const newBullet: BulletState = {
            id: `b_${nanoid(6)}`,
            x: player.x + PLAYER_SIZE / 2,
            y: player.y + PLAYER_SIZE / 2,
            dx: Math.cos(angle) * BULLET_SPEED,
            dy: Math.sin(angle) * BULLET_SPEED,
            playerId: playerId,
          };
          updateDoc(doc(db, 'rooms', roomId as string), { bullets: arrayUnion(newBullet), [`players.${playerId}.lastShot`]: player.lastShot });
        }
      }
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (gameEl) {
        gameEl.removeEventListener('mousemove', handleMouseMove);
        gameEl.removeEventListener('mousedown', handleMouseDown);
        gameEl.removeEventListener('mouseup', handleMouseUp);
      }
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [playerId, gameState, roomId]);


  return (
    <div ref={gameContainerRef} className="w-full h-full bg-gray-800 overflow-hidden" style={{ width: GAME_WIDTH, height: GAME_HEIGHT, margin: 'auto' }}>
      {Object.values(gameState.players).map(p => <Player key={p.id} player={p} isLocalPlayer={p.id === playerId} />)}
      {gameState.bullets?.map(b => <Bullet key={b.id} bullet={b} />)}
    </div>
  );
}
