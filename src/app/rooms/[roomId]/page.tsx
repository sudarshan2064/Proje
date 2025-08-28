'use client';

import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export default function RoomPage() {
  const { roomId } = useParams();

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <header className="flex justify-between items-center p-4 border-b">
        <h1 className="text-2xl font-bold">Room: <span className="text-primary uppercase">{roomId}</span></h1>
        <div className="flex items-center gap-4">
          <div className="w-48">
            <p className="text-sm text-muted-foreground mb-1">Health</p>
            <Progress value={75} />
          </div>
          <div>
            <p className="text-lg">Score: <span className="font-bold text-primary">0</span></p>
          </div>
        </div>
      </header>
      <main className="flex-1 flex">
        <div className="flex-1 bg-muted/20 border-r relative">
          {/* Game Canvas will go here */}
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-2xl text-muted-foreground">Game Area</p>
          </div>
        </div>
        <aside className="w-64 p-4">
          <Card>
            <CardHeader>
              <CardTitle>Scoreboard</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex justify-between">
                  <span>Player 1</span>
                  <span className="font-bold">5</span>
                </li>
                <li className="flex justify-between">
                  <span>Player 2</span>
                  <span className="font-bold">3</span>
                </li>
                <li className="flex justify-between">
                  <span>Bot 1</span>
                  <span className="font-bold">1</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </aside>
      </main>
    </div>
  );
}
