'use client';

import React from 'react';
import Card, { CardType } from './Card';

interface GameBoardProps {
  cards: CardType[];
  onCardClick: (id: number) => void;
}

const GameBoard: React.FC<GameBoardProps> = ({ cards, onCardClick }) => {
  return (
    <div className="grid grid-cols-6 gap-4">
      {cards.map(card => (
        <Card key={card.id} card={card} onClick={onCardClick} />
      ))}
    </div>
  );
};

export default GameBoard;
