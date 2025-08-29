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
        'w-24 h-32 rounded-lg cursor-pointer flex items-center justify-center text-4xl font-bold transition-transform duration-500',
        'transform-style-3d'
      )}
      onClick={handleClick}
    >
      <div
        className={cn('absolute w-full h-full backface-hidden rounded-lg transition-transform duration-500', 
          isFlipped ? 'rotate-y-180' : 'rotate-y-0',
          isMatched ? 'bg-green-500' : 'bg-blue-500'
        )}
      >
        <div className="absolute w-full h-full backface-hidden rounded-lg bg-gray-300 dark:bg-gray-700" />
        <div className="absolute w-full h-full backface-hidden rounded-lg flex items-center justify-center rotate-y-180 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
          {LucideIcon ? <LucideIcon size={48} /> : value}
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
