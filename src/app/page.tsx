import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-100 dark:bg-gray-900">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
          Memory Card Game
        </h1>
        <p className="mt-6 text-lg leading-8 text-muted-foreground">
          Select a game mode to start.
        </p>
        <div className="mt-10">
          <Link href="/game">
            <Button size="lg">Start Game</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
