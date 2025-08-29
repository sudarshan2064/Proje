'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ScoreboardProps {
  scores: {
    player1: number;
    player2: number;
  };
  currentPlayer: 1 | 2;
  gameMode: 'single' | 'two-player';
}

const Scoreboard: React.FC<ScoreboardProps> = ({ scores, currentPlayer, gameMode }) => {
  const player2Name = gameMode === 'single' ? 'Bot' : 'Player 2';
  
  return (
    <div className="flex gap-4 mb-4">
      <Card className={cn('w-48', currentPlayer === 1 && 'border-blue-500 border-2')}>
        <CardHeader>
          <CardTitle>Player 1</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{scores.player1}</p>
        </CardContent>
      </Card>
      <Card className={cn('w-48', currentPlayer === 2 && 'border-red-500 border-2')}>
        <CardHeader>
          <CardTitle>{player2Name}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{scores.player2}</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Scoreboard;
