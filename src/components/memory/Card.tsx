'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { icons } from 'lucide-react';

export interface CardType {
  id: number;
  value: string;
  isFlipped: boolean;
  isMatched: boolean;
}

interface CardProps {
  card: CardType;
  onClick: (id: number) => void;
}

const Card: React.FC<CardProps> = ({ card, onClick }) => {
  const { id, value, isFlipped, isMatched } = card;

  const handleClick = () => {
    if (!isFlipped && !isMatched) {
      onClick(id);
    }
  };

  const LucideIcon = icons[value as keyof typeof icons];

  return (
    <div
      className={cn(
        'w-24 h-32 rounded-lg cursor-pointer perspective-1000 group'
      )}
      onClick={handleClick}
    >
      <div
        className={cn(
          'relative w-full h-full transition-transform duration-500 transform-style-3d shadow-lg rounded-lg',
          isFlipped ? 'rotate-y-180' : '',
          isMatched && 'opacity-70'
        )}
      >
        <div className={cn("absolute w-full h-full backface-hidden rounded-lg flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-700 text-white")}>
          {/* Back of the card */}
          <div className="text-2xl font-bold">?</div>
        </div>
        <div className={cn(
            "absolute w-full h-full backface-hidden rounded-lg flex items-center justify-center rotate-y-180 bg-card",
             isMatched ? 'bg-green-500/20' : 'bg-card'
            )}>
          {/* Front of the card */}
          {LucideIcon ? <LucideIcon size={40} className={cn(isMatched ? 'text-green-500' : 'text-primary')} /> : value}
        </div>
      </div>
    </div>
  );
};


export const MemoizedCard = React.memo(Card);

export const CardSkeleton = () => {
    return (
        <div className="w-24 h-32 rounded-lg bg-gray-300 dark:bg-gray-700 animate-pulse" />
    )
}

export default Card;
