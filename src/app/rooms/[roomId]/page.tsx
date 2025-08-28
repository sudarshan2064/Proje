'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Game } from '@/components/game/Game';
import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Player {
  id: string;
  kills: number;
  deaths: number;
  health: number;
}

export default function RoomPage() {
  const { roomId } = useParams();
  const searchParams = useSearchParams();
  const isBotGame = searchParams.get('bots') === 'true';

  const [players, setPlayers] = useState<Player[]>([]);
  const [localPlayer, setLocalPlayer] = useState<Player | null>(null);

  useEffect(() => {
    if (!roomId) return;
    const roomRef = doc(db, 'rooms', roomId as string);
    const unsubscribe = onSnapshot(roomRef, (doc) => {
      if (doc.exists()) {
        const roomData = doc.data();
        const playersData = Object.values(roomData.players || {}) as Player[];
        setPlayers(playersData.sort((a, b) => b.kills - a.kills));
        
        const localPlayerId = localStorage.getItem(`player_id_${roomId}`);
        if (localPlayerId) {
          const foundPlayer = playersData.find(p => p.id === localPlayerId);
          if (foundPlayer) {
            setLocalPlayer(foundPlayer);
          }
        }
      }
    });

    return () => unsubscribe();
  }, [roomId]);

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <header className="flex justify-between items-center p-4 border-b">
        <h1 className="text-2xl font-bold">Room: <span className="text-primary uppercase">{roomId}</span></h1>
        {isBotGame && <p className="text-lg font-semibold text-secondary-foreground">Playing with bots</p>}
        <div className="flex items-center gap-4">
          <div className="w-48">
            <p className="text-sm text-muted-foreground mb-1">Health</p>
            <Progress value={localPlayer?.health || 0} />
          </div>
          <div>
            <p className="text-lg">Score: <span className="font-bold text-primary">{localPlayer?.kills || 0}</span></p>
          </div>
        </div>
      </header>
      <main className="flex-1 flex">
        <div className="flex-1 bg-muted/20 border-r relative">
          <Game />
        </div>
        <aside className="w-64 p-4">
          <Card>
            <CardHeader>
              <CardTitle>Scoreboard</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {players.map((player) => (
                  <li key={player.id} className="flex justify-between">
                    <span>Player {player.id.substring(0, 4)}</span>
                    <span className="font-bold">{player.kills} / {player.deaths}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </aside>
      </main>
    </div>
  );
}
