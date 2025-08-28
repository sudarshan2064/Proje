'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
        <p className="text-xl text-muted-foreground mt-2">An online multiplayer shooter</p>
      </div>

      <Dialog>
        <DialogTrigger asChild>
          <Button size="lg" className="text-2xl h-16 px-12">Start Game</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">Game Mode</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Button onClick={handleCreateRoom} className="w-full" size="lg">
              Create Room
            </Button>
            <Button onClick={handlePlayWithBots} className="w-full" size="lg" variant="secondary">
              Play with Bots
            </Button>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or
                </span>
              </div>
            </div>
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
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
