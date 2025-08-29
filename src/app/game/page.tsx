'use client';

import React, { useState, useEffect, useCallback } from 'react';
import GameBoard from '@/components/memory/GameBoard';
import Scoreboard from '@/components/memory/Scoreboard';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { CardType } from '@/components/memory/Card';

const cardValues = [
  'Clock', 'Apple', 'Banana', 'Brain', 'Car', 'Cat', 'Dog', 'Fish', 
  'Gift', 'Heart', 'Home', 'Star'
];

const generateCards = () => {
  const duplicatedValues = [...cardValues, ...cardValues];
  return duplicatedValues
    .map((value, index) => ({
      id: index,
      value,
      isFlipped: false,
      isMatched: false,
    }))
    .sort(() => Math.random() - 0.5);
};

export default function GamePage() {
  const [gameMode, setGameMode] = useState<'single' | 'two-player'>('single');
  const [cards, setCards] = useState<CardType[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [scores, setScores] = useState({ player1: 0, player2: 0 });
  const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1);
  const [isChecking, setIsChecking] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setCards(generateCards());
  }, []);

  const handleCardClick = (id: number) => {
    if (isChecking || (gameMode === 'single' && currentPlayer === 2) || flippedCards.length === 2) {
      return;
    }

    const card = cards.find(c => c.id === id);
    if (!card || card.isFlipped || card.isMatched) {
      return;
    }

    const newFlippedCards = [...flippedCards, id];
    setCards(prevCards =>
      prevCards.map(c =>
        c.id === id ? { ...c, isFlipped: true } : c
      )
    );
    setFlippedCards(newFlippedCards);
  };
  
  const checkForMatch = useCallback(() => {
    if (flippedCards.length !== 2) return;

    setIsChecking(true);
    const [firstCardId, secondCardId] = flippedCards;
    const firstCard = cards.find(c => c.id === firstCardId);
    const secondCard = cards.find(c => c.id === secondCardId);

    if (firstCard && secondCard && firstCard.value === secondCard.value) {
      setCards(prevCards =>
        prevCards.map(card =>
          card.id === firstCardId || card.id === secondCardId
            ? { ...card, isMatched: true }
            : card
        )
      );
      setScores(prevScores => ({
        ...prevScores,
        [currentPlayer === 1 ? 'player1' : 'player2']:
          prevScores[currentPlayer === 1 ? 'player1' : 'player2'] + 1,
      }));
      setFlippedCards([]);
      setIsChecking(false);
       if (gameMode === 'single' && currentPlayer === 2) {
        setTimeout(botTurn, 1000);
      }
    } else {
      setTimeout(() => {
        setCards(prevCards =>
          prevCards.map(card =>
            card.id === firstCardId || card.id === secondCardId
              ? { ...card, isFlipped: false }
              : card
          )
        );
        setFlippedCards([]);
        const nextPlayer = currentPlayer === 1 ? 2 : 1;
        setCurrentPlayer(nextPlayer);
        setIsChecking(false);
         if (gameMode === 'single' && nextPlayer === 2) {
           setTimeout(botTurn, 1000);
        }
      }, 1000);
    }
  }, [flippedCards, cards, currentPlayer, gameMode]);

  const botTurn = useCallback(() => {
    if (isChecking) return;

    const availableCards = cards.filter(card => !card.isFlipped && !card.isMatched);
    if (availableCards.length >= 2) {
      const firstPickIndex = Math.floor(Math.random() * availableCards.length);
      let secondPickIndex = Math.floor(Math.random() * (availableCards.length - 1));
      if (secondPickIndex >= firstPickIndex) {
        secondPickIndex++;
      }
      
      const firstCardId = availableCards[firstPickIndex].id;
      const secondCardId = availableCards[secondPickIndex].id;

      handleCardClick(firstCardId);
      setTimeout(() => {
        handleCardClick(secondCardId);
      }, 700);
    }
  }, [cards, isChecking]);

  useEffect(() => {
    if (flippedCards.length === 2) {
      checkForMatch();
    }
  }, [flippedCards, checkForMatch]);

  useEffect(() => {
    if (gameMode === 'single' && currentPlayer === 2 && !isChecking && flippedCards.length === 0) {
      botTurn();
    }
  }, [currentPlayer, gameMode, isChecking, botTurn, flippedCards.length]);

  useEffect(() => {
    if (cards.length > 0 && cards.every(c => c.isMatched)) {
      let winnerMessage = '';
      if (gameMode === 'single') {
        winnerMessage = scores.player1 > scores.player2 ? 'You win!' : 'Bot wins!';
      } else {
        if (scores.player1 === scores.player2) {
          winnerMessage = "It's a tie!";
        } else {
          winnerMessage = `Player ${scores.player1 > scores.player2 ? 1 : 2} wins!`;
        }
      }
      toast({
        title: 'Game Over!',
        description: winnerMessage,
      });
    }
  }, [cards, scores, gameMode, toast]);

  const restartGame = () => {
    setCards(generateCards());
    setFlippedCards([]);
    setScores({ player1: 0, player2: 0 });
    setCurrentPlayer(1);
    setIsChecking(false);
  };

  const handleModeChange = (value: string) => {
    setGameMode(value as 'single' | 'two-player');
    restartGame();
  };

  return (
    <div className="container mx-auto p-4 flex flex-col items-center">
      <h1 className="text-4xl font-bold mb-4 text-primary">Memory Game</h1>
      <div className="flex gap-4 mb-4">
        <Select onValueChange={handleModeChange} defaultValue={gameMode}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select mode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="single">Single Player vs Bot</SelectItem>
            <SelectItem value="two-player">Two Players</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={restartGame}>Restart Game</Button>
      </div>
      <Scoreboard scores={scores} currentPlayer={currentPlayer} gameMode={gameMode} />
      <GameBoard cards={cards} onCardClick={handleCardClick} />
    </div>
  );
}
