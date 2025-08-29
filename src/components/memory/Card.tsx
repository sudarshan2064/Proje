'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface CardType {
  id: number;
  value: string;
  isFlipped: boolean;
  isMatched: boolean;
}

interface CardProps {
  card: CardType;
  onClick: (id: number) => void;
  isJustMatched: boolean;
}

const Card: React.FC<CardProps> = ({ card, onClick, isJustMatched }) => {
  const { id, value, isFlipped, isMatched } = card;

  const handleClick = () => {
    if (!isFlipped && !isMatched) {
      onClick(id);
    }
  };

  return (
    <div
      className={cn(
        'w-32 h-32 rounded-lg cursor-pointer perspective-1000 group',
        isMatched && 'invisible'
      )}
      onClick={handleClick}
    >
      <div
        className={cn(
          'relative w-full h-full transition-transform duration-500 transform-style-3d shadow-lg rounded-lg',
          isFlipped ? 'rotate-y-180' : '',
          isJustMatched && 'animate-tada'
        )}
      >
        <div
          className={cn(
            'absolute w-full h-full backface-hidden rounded-lg flex items-center justify-center bg-card text-card-foreground'
          )}
        >
          {/* Back of the card */}
          <div className="text-4xl font-bold">?</div>
        </div>
        <div
          className={cn(
            'absolute w-full h-full backface-hidden rounded-lg flex items-center justify-center rotate-y-180 bg-card overflow-hidden text-4xl'
          )}
        >
          {/* Front of the card */}
          {value}
        </div>
      </div>
    </div>
  );
};

export default Card;
