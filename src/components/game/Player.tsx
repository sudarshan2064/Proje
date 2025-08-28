import React from 'react';

interface PlayerProps {
  position: {
    x: number;
    y: number;
  };
  tileSize: number;
}

const Player: React.FC<PlayerProps> = ({ position, tileSize }) => {
  return (
    <div
      className="absolute bg-blue-500 rounded-full"
      style={{
        left: position.x * tileSize,
        top: position.y * tileSize,
        width: tileSize,
        height: tileSize,
        transition: 'left 0.1s linear, top 0.1s linear',
      }}
    />
  );
};

export default Player;
