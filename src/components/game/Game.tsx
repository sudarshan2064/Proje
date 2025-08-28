'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
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
const BOT_COUNT = 3;

interface PlayerState {
  id: string;
  x: number;
  y: number;
  health: number;
  kills: number;
  deaths: number;
  lastShot: number;
  isDead: boolean;
  isBot: boolean;
  targetX?: number;
  targetY?: number;
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
  const searchParams = useSearchParams();
  const isBotGame = searchParams.get('bots') === 'true';

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
        isBot: false,
      };

      await setDoc(roomRef, { players: { [localPlayerId]: newPlayer } }, { merge: true });

      if (isBotGame) {
        const batch = writeBatch(db);
        for (let i = 0; i < BOT_COUNT; i++) {
          const botId = `b_${nanoid(4)}`;
          const newBot: PlayerState = {
            id: botId,
            x: Math.random() * (GAME_WIDTH - PLAYER_SIZE),
            y: Math.random() * (GAME_HEIGHT - PLAYER_SIZE),
            health: MAX_HEALTH,
            kills: 0,
            deaths: 0,
            lastShot: 0,
            isDead: false,
            isBot: true,
            targetX: Math.random() * (GAME_WIDTH - PLAYER_SIZE),
            targetY: Math.random() * (GAME_HEIGHT - PLAYER_SIZE),
          };
          batch.set(roomRef, { players: { [botId]: newBot } }, { merge: true });
        }
        await batch.commit();
      }
    };

    initPlayer();

    const unsubscribe = onSnapshot(doc(db, 'rooms', roomId as string), (doc) => {
      if (doc.exists()) {
        const data = doc.data() as GameState;
        if (!data.bullets) {
          data.bullets = [];
        }
        setGameState(data);
      }
    });

    return () => unsubscribe();
  }, [roomId, isBotGame]);
  
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
          await updateDoc(doc(db, 'rooms', roomId as string), { 
            [`players.${playerId}.x`]: player.x,
            [`players.${playerId}.y`]: player.y 
          });
        }
        
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
          setGameState(prev => ({
              ...prev,
              players: { ...prev.players, [playerId]: { ...prev.players[playerId], lastShot: newLastShot, } }
          }));
          await updateDoc(doc(db, 'rooms', roomId as string), { bullets: arrayUnion(newBullet), [`players.${playerId}.lastShot`]: newLastShot });
        }
      }

      const players = Object.values(gameState.players).sort((a,b) => a.id.localeCompare(b.id));
      if (players.length > 0 && players[0].id === playerId) {
        const batch = writeBatch(db);
        const roomRef = doc(db, 'rooms', roomId as string);
        let hasHostUpdates = false;

        // --- Host-controlled logic (Bots & Bullets) ---

        // Bot AI
        if (isBotGame) {
          const humanPlayer = gameState.players[playerId];
          Object.values(gameState.players).forEach(p => {
            if (p.isBot && !p.isDead && humanPlayer) {
              const botSpeed = PLAYER_SPEED * 0.5; // Slower bots
              
              // Move towards target
              const targetX = p.targetX ?? p.x;
              const targetY = p.targetY ?? p.y;
              let newBotX = p.x;
              let newBotY = p.y;
              const dx = targetX - p.x;
              const dy = targetY - p.y;
              const dist = Math.sqrt(dx*dx + dy*dy);
              
              if (dist > 10) {
                newBotX += (dx / dist) * botSpeed;
                newBotY += (dy / dist) * botSpeed;
              } else {
                // New target
                batch.update(roomRef, { 
                  [`players.${p.id}.targetX`]: Math.random() * (GAME_WIDTH - PLAYER_SIZE),
                  [`players.${p.id}.targetY`]: Math.random() * (GAME_HEIGHT - PLAYER_SIZE)
                });
              }

              batch.update(roomRef, { [`players.${p.id}.x`]: newBotX, [`players.${p.id}.y`]: newBotY });
              hasHostUpdates = true;

              // Bot shooting
              if (Date.now() - p.lastShot > 1000) { // Slower fire rate
                const angle = Math.atan2((humanPlayer.y + PLAYER_SIZE/2) - (p.y + PLAYER_SIZE/2), (humanPlayer.x + PLAYER_SIZE/2) - (p.x + PLAYER_SIZE/2));
                const newBullet: BulletState = {
                  id: `b_${nanoid(6)}`,
                  x: p.x + PLAYER_SIZE / 2,
                  y: p.y + PLAYER_SIZE / 2,
                  dx: Math.cos(angle) * BULLET_SPEED,
                  dy: Math.sin(angle) * BULLET_SPEED,
                  playerId: p.id,
                };
                batch.update(roomRef, { bullets: arrayUnion(newBullet), [`players.${p.id}.lastShot`]: Date.now() });
                hasHostUpdates = true;
              }
            }
          });
        }
        
        // Bullet movement and collision
        let newBullets = gameState.bullets ? [...gameState.bullets] : [];
        const bulletsToRemove: string[] = [];
        
        newBullets = newBullets.map(b => ({ ...b, x: b.x + b.dx, y: b.y + b.dy }));

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
                        hasHostUpdates = true;

                        if (newHealth <= 0 && !p.isDead) {
                            batch.update(roomRef, {
                                [`players.${p.id}.deaths`]: increment(1),
                                [`players.${p.id}.isDead`]: true,
                            });
                             if (gameState.players[bullet.playerId]) {
                                batch.update(roomRef, {[`players.${bullet.playerId}.kills`]: increment(1)});
                            }
                            
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
           hasHostUpdates = true;
        }

        if (hasHostUpdates) {
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
  }, [playerId, gameState, roomId, isBotGame]);


  return (
    <div ref={gameContainerRef} className="w-full h-full bg-gray-800 overflow-hidden relative" style={{ width: GAME_WIDTH, height: GAME_HEIGHT, margin: 'auto' }}>
      {Object.values(gameState.players).map(p => <Player key={p.id} player={p} isLocalPlayer={p.id === playerId} />)}
      {gameState.bullets?.map(b => <Bullet key={b.id} bullet={b} />)}
    </div>
  );
}
