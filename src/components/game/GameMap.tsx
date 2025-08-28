import React from 'react';

interface GameMapProps {
    width: number;
    height: number;
    tileSize: number;
}

const GameMap: React.FC<GameMapProps> = ({ width, height, tileSize }) => {
  return (
    <div className="absolute inset-0">
      {Array.from({ length: width * height }).map((_, index) => {
        const x = index % width;
        const y = Math.floor(index / width);
        // Simple grass pattern for now
        const bgColor = (x + y) % 2 === 0 ? 'bg-green-600' : 'bg-green-500';
        return (
          <div
            key={index}
            className={`absolute ${bgColor}`}
            style={{
              left: x * tileSize,
              top: y * tileSize,
              width: tileSize,
              height: tileSize,
            }}
          />
        );
      })}
    </div>
  );
};

export default GameMap;
