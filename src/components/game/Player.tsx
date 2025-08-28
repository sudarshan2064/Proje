'use client';

interface PlayerProps {
    player: {
        id: string;
        x: number;
        y: number;
        health: number;
    };
    isLocalPlayer: boolean;
}

export function Player({ player, isLocalPlayer }: PlayerProps) {
  const color = isLocalPlayer ? 'bg-blue-500' : 'bg-red-500';

  return (
    <div
      className={`absolute w-10 h-10 rounded-full ${color} border-2 border-white`}
      style={{
        left: player.x,
        top: player.y,
        transition: 'left 0.1s linear, top 0.1s linear',
      }}
    >
      <div className="relative w-full h-full">
        <div className="absolute -top-6 w-full text-center text-white text-xs font-bold">
          Player {player.id.substring(0, 4)}
        </div>
        <div className="absolute -bottom-5 w-full h-2 bg-gray-300 rounded overflow-hidden">
            <div className="h-full bg-green-500" style={{ width: `${player.health}%`}}></div>
        </div>
      </div>
    </div>
  );
}
