import React from 'react';

interface NpcProps {
  position: {
    x: number;
    y: number;
  };
  tileSize: number;
}

const Npc: React.FC<NpcProps> = ({ position, tileSize }) => {
  return (
    <div
      className="absolute bg-yellow-500 rounded-full"
      style={{
        left: position.x * tileSize,
        top: position.y * tileSize,
        width: tileSize,
        height: tileSize,
      }}
    />
  );
};

export default Npc;
