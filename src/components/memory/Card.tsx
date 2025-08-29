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
        'w-20 h-28 rounded-lg cursor-pointer perspective-1000'
      )}
      onClick={handleClick}
    >
      <div
        className={cn(
          'relative w-full h-full transition-transform duration-500 transform-style-3d',
          isFlipped ? 'rotate-y-180' : ''
        )}
      >
        <div className={cn("absolute w-full h-full backface-hidden rounded-lg flex items-center justify-center", isMatched ? 'bg-green-500' : 'bg-blue-500')}>
          {/* Back of the card */}
        </div>
        <div className="absolute w-full h-full backface-hidden rounded-lg flex items-center justify-center rotate-y-180 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
          {/* Front of the card */}
          {LucideIcon ? <LucideIcon size={40} /> : value}
        </div>
      </div>
    </div>
  );
};


export const MemoizedCard = React.memo(Card);

export const CardSkeleton = () => {
    return (
        <div className="w-20 h-28 rounded-lg bg-gray-300 dark:bg-gray-700 animate-pulse" />
    )
}

export default Card;
