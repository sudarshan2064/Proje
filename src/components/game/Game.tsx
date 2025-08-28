'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { doc, onSnapshot, setDoc, updateDoc, arrayUnion, writeBatch, increment } from 'firebase/firestore';
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
const RESPAWN_TIME = 3000;

interface PlayerState {
  id: string;
  x: number;
  y: number;
  health: number;
  kills: number;
  deaths: number;
  lastShot: number;
  isDead: boolean;
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
      if (!roomId) return;
      const roomRef = doc(db, 'rooms', roomId as string);
      
      const newPlayer: PlayerState = {
        id: localPlayerId,
        x: Math.random() * (GAME_WIDTH - PLAYER_SIZE),
        y: Math.random() * (GAME_HEIGHT - PLAYER_SIZE),
        health: MAX_HEALTH,
        kills: 0,
        deaths: 0,
        lastShot: 0,
        isDead: false,
      };

      // This will create the player if they don't exist, or update their state if they do.
      // It avoids reading the document first, which caused the offline error.
      await setDoc(roomRef, { players: { [localPlayerId]: newPlayer } }, { merge: true });
    };

    initPlayer();

    const unsubscribe = onSnapshot(doc(db, 'rooms', roomId as string), (doc) => {
      if (doc.exists()) {
        const data = doc.data() as GameState;
        // Ensure bullets is always an array
        if (!data.bullets) {
          data.bullets = [];
        }
        setGameState(data);
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

    const gameLoop = async () => {
      if (playerId && gameState.players[playerId]) {
        const player = { ...gameState.players[playerId] };
        let playerMoved = false;

        // Player movement
        if (!player.isDead) {
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
        }
        
        if (playerMoved) {
          // We only update the position, not the whole player object
          await updateDoc(doc(db, 'rooms', roomId as string), { 
            [`players.${playerId}.x`]: player.x,
            [`players.${playerId}.y`]: player.y 
          });
        }
        
        // Player shooting
        if (keysPressed.current['mouse0'] && !player.isDead && Date.now() - player.lastShot > 200) {
          const newLastShot = Date.now();
          const angle = Math.atan2(mousePosition.current.y - (player.y + PLAYER_SIZE / 2), mousePosition.current.x - (player.x + PLAYER_SIZE / 2));
          const newBullet: BulletState = {
            id: `b_${nanoid(6)}`,
            x: player.x + PLAYER_SIZE / 2,
            y: player.y + PLAYER_SIZE / 2,
            dx: Math.cos(angle) * BULLET_SPEED,
            dy: Math.sin(angle) * BULLET_SPEED,
            playerId: playerId,
          };
          // Update lastShot locally immediately to prevent rapid firing
          setGameState(prev => ({
              ...prev,
              players: {
                  ...prev.players,
                  [playerId]: {
                      ...prev.players[playerId],
                      lastShot: newLastShot,
                  }
              }
          }));
          await updateDoc(doc(db, 'rooms', roomId as string), { bullets: arrayUnion(newBullet), [`players.${playerId}.lastShot`]: newLastShot });
        }
      }

      // This part should only be run by one client, ideally a host or server
      // For simplicity in this example, we'll let the first player who joined be the "host"
      const players = Object.values(gameState.players).sort((a,b) => a.id.localeCompare(b.id));
      if (players.length > 0 && players[0].id === playerId) {
        let newBullets = gameState.bullets ? [...gameState.bullets] : [];
        const bulletsToRemove: string[] = [];
        const batch = writeBatch(db);
        const roomRef = doc(db, 'rooms', roomId as string);
        let hasUpdates = false;

        // Update bullets
        newBullets = newBullets.map(b => ({
            ...b,
            x: b.x + b.dx,
            y: b.y + b.dy
        }));

        // Check for bullet collisions
        for (const bullet of newBullets) {
            if (bullet.x < 0 || bullet.x > GAME_WIDTH || bullet.y < 0 || bullet.y > GAME_HEIGHT) {
                bulletsToRemove.push(bullet.id);
                continue;
            }

            for (const p of Object.values(gameState.players)) {
                if (p.id !== bullet.playerId && !p.isDead) {
                    const distance = Math.sqrt((bullet.x - (p.x + PLAYER_SIZE/2))**2 + (bullet.y - (p.y + PLAYER_SIZE/2))**2);
                    if (distance < PLAYER_SIZE/2) {
                        bulletsToRemove.push(bullet.id);
                        const newHealth = Math.max(0, p.health - 25);
                        batch.update(roomRef, {[`players.${p.id}.health`]: newHealth});
                        hasUpdates = true;

                        if (newHealth <= 0 && !p.isDead) {
                            batch.update(roomRef, {
                                [`players.${p.id}.deaths`]: increment(1),
                                [`players.${p.id}.isDead`]: true,
                                [`players.${bullet.playerId}.kills`]: increment(1),
                            });
                            
                            setTimeout(() => {
                                const respawnedPlayer = {
                                    x: Math.random() * (GAME_WIDTH - PLAYER_SIZE),
                                    y: Math.random() * (GAME_HEIGHT - PLAYER_SIZE),
                                    health: MAX_HEALTH,
                                    isDead: false,
                                };
                                updateDoc(doc(db, 'rooms', roomId as string), {
                                    [`players.${p.id}.x`]: respawnedPlayer.x,
                                    [`players.${p.id}.y`]: respawnedPlayer.y,
                                    [`players.${p.id}.health`]: respawnedPlayer.health,
                                    [`players.${p.id}.isDead`]: respawnedPlayer.isDead,
                                });
                            }, RESPAWN_TIME);
                        }
                        break; 
                    }
                }
            }
        }
        
        const finalBullets = newBullets.filter(b => !bulletsToRemove.includes(b.id));
        if (finalBullets.length !== (gameState.bullets?.length || 0) || bulletsToRemove.length > 0) {
           batch.update(roomRef, { bullets: finalBullets });
           hasUpdates = true;
        }

        if (hasUpdates) {
            await batch.commit();
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
    <div ref={gameContainerRef} className="w-full h-full bg-gray-800 overflow-hidden relative" style={{ width: GAME_WIDTH, height: GAME_HEIGHT, margin: 'auto' }}>
      {Object.values(gameState.players).map(p => <Player key={p.id} player={p} isLocalPlayer={p.id === playerId} />)}
      {gameState.bullets?.map(b => <Bullet key={b.id} bullet={b} />)}
    </div>
  );
}
