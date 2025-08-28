'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { nanoid } from 'nanoid';

export default function Home() {
  const [roomCode, setRoomCode] = useState('');
  const router = useRouter();

  const handleCreateRoom = () => {
    const newRoomCode = nanoid(6);
    router.push(`/rooms/${newRoomCode}`);
  };

  const handlePlayWithBots = () => {
    const newRoomCode = nanoid(6);
    router.push(`/rooms/${newRoomCode}?bots=true`);
  };

  const handleJoinRoom = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (roomCode.trim()) {
      router.push(`/rooms/${roomCode.trim()}`);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
      <div className="text-center mb-12">
        <h1 className="text-6xl font-bold tracking-tighter text-primary">2D Shooter</h1>
        <p className="text-xl text-muted-foreground mt-2">Create, join, or play against bots</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-8">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-center">Create a New Room</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={handleCreateRoom} className="w-full" size="lg">
              Create Room
            </Button>
          </CardContent>
        </Card>

        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-center">Play with Bots</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={handlePlayWithBots} className="w-full" size="lg" variant="secondary">
              Start
            </Button>
          </CardContent>
        </Card>

        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-center">Join an Existing Room</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleJoinRoom} className="flex flex-col gap-4">
              <Input
                type="text"
                placeholder="Enter room code"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                className="text-center uppercase"
                maxLength={6}
              />
              <Button type="submit" className="w-full" size="lg">
                Join Room
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
