'use client';

interface BulletProps {
    bullet: {
        x: number;
        y: number;
    };
}

export function Bullet({ bullet }: BulletProps) {
  return (
    <div
      className="absolute w-2 h-2 bg-yellow-400 rounded-full"
      style={{
        left: bullet.x,
        top: bullet.y,
      }}
    />
  );
}
