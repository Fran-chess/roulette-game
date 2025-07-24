// src/components/game/RouletteLayout.tsx
"use client";

import { ReactNode } from "react";
import Logo from "@/components/ui/Logo";
import { useGameStore } from "@/store/gameStore";
import MassiveConfetti from "@/components/ui/MassiveConfetti";
import { useDeviceDetection } from "@/hooks/useDeviceDetection";

interface RouletteLayoutProps {
  children: ReactNode;
  buttons?: ReactNode;
}

export default function RouletteLayout({ children, buttons }: RouletteLayoutProps) {
  const device = useDeviceDetection();
  const showConfetti = useGameStore((state) => state.showConfetti);

  return (
    <div className="h-screen bg-main-gradient relative overflow-hidden">
      {/* CONFETTI */}
      <MassiveConfetti 
        show={showConfetti} 
        windowSize={device.dimensions} 
        isTV65={device.isTV65}
        isTabletPortrait={device.isTabletPortrait}
      />
      
      {/* Layout con altura FIJA para forzar expansión */}
      <main className="h-full flex flex-col w-full items-center justify-between py-4">
        {/* LOGO - Parte superior */}
        <div className="flex justify-center items-center z-20 relative">
          <Logo 
            size="auto" 
            variant="minimal"
            animated={true}  
            withShadow={true}
            className="transition-all duration-300 ease-out"
          />
        </div>

        {/* CONTENEDOR CENTRAL - flex-1 para expandir + min-h suficiente */}
        <div className="flex-1 w-full flex items-center justify-center min-h-[500px]">
          {/* Wrapper sin limitaciones de altura */}
          <div className="w-full h-full max-w-[500px] flex items-center justify-center">
            {children}
          </div>
        </div>
        
        {/* BOTONES - Parte inferior */}
        {buttons && (
          <div className="flex justify-center items-center w-full z-10 relative gap-4">
            {buttons}
          </div>
        )}
      </main>
    </div>
  );
}