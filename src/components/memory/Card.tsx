'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

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

  const getAiHint = (url: string) => {
    try {
      const parts = url.split('/');
      const seedPart = parts.find(p => p.startsWith('seed'));
      if (seedPart) {
        return seedPart.split('/')[1];
      }
    } catch (e) {
      // ignore
    }
    return 'placeholder';
  }

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
          isFlipped ? 'rotate-y-180' : ''
        )}
      >
        <div className={cn("absolute w-full h-full backface-hidden rounded-lg flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-700 text-white")}>
          {/* Back of the card */}
          <div className="text-4xl font-bold">?</div>
        </div>
        <div className={cn(
            "absolute w-full h-full backface-hidden rounded-lg flex items-center justify-center rotate-y-180 bg-card overflow-hidden",
             isFlipped && !isMatched ? 'bg-card' : 'bg-green-500/20'
            )}>
          {/* Front of the card */}
          <Image 
            src={value}
            alt="Card front"
            fill
            className="object-cover"
            data-ai-hint={getAiHint(value)}
            sizes="200px"
          />
        </div>
      </div>
    </div>
  );
};


export const MemoizedCard = React.memo(Card);

export const CardSkeleton = () => {
    return (
        <div className="w-32 h-32 rounded-lg bg-gray-300 dark:bg-gray-700 animate-pulse" />
    )
}

export default Card;
