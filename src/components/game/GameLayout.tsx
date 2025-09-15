"use client";

import { ReactNode } from 'react';

interface GameLayoutProps {
  children: ReactNode;
}

export default function GameLayout({ children }: GameLayoutProps) {
  return (
    <div className="min-h-screen bg-game-gradient flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        {children}
      </div>
    </div>
  );
}