'use client';

interface PlayerProps {
    player: {
        id: string;
        x: number;
        y: number;
        health: number;
        isDead: boolean;
        isBot: boolean;
    };
    isLocalPlayer: boolean;
}

export function Player({ player, isLocalPlayer }: PlayerProps) {
  const color = isLocalPlayer ? '#3b82f6' : (player.isBot ? '#f97316' : '#ef4444'); // blue-500, orange-500 for bots, red-500 for other players

  if (player.isDead) {
      return null;
  }

  return (
    <div
      className="absolute"
      style={{
        left: player.x,
        top: player.y,
        width: 40,
        height: 40,
        transition: 'left 0.05s linear, top 0.05s linear',
      }}
    >
      <svg width="40" height="40" viewBox="0 0 40 40" className="overflow-visible">
        <g stroke={color} strokeWidth="3" fill="none">
          {/* Head */}
          <circle cx="20" cy="7" r="5" fill={color} />
          {/* Body */}
          <line x1="20" y1="12" x2="20" y2="24" />
          {/* Arms */}
          <line x1="10" y1="18" x2="30" y2="18" />
          {/* Legs */}
          <line x1="20" y1="24" x2="12" y2="34" />
          <line x1="20" y1="24" x2="28" y2="34" />
        </g>
      </svg>
      <div className="relative w-full h-full -mt-10">
        <div className="absolute -top-6 w-full text-center text-white text-xs font-bold">
          {player.isBot ? `Bot ${player.id.substring(0, 4)}` : `Player ${player.id.substring(0, 4)}`}
        </div>
        <div className="absolute -bottom-5 w-full h-2 bg-gray-300 rounded overflow-hidden">
            <div className="h-full bg-green-500" style={{ width: `${player.health}%`}}></div>
        </div>
      </div>
    </div>
  );
}
