// src/app/game/[sessionId]/GameLayout.tsx
"use client";

import { ReactNode, useEffect, useState } from "react";
import Logo from "@/components/ui/Logo";
import { useGameStore } from "@/store/gameStore";
import MassiveConfetti from "@/components/ui/MassiveConfetti";

export default function GameLayout({ children }: { children: ReactNode }) {
  // Estados de dispositivo
  const [isTV65, setIsTV65] = useState(false);
  const [isTabletPortrait, setIsTabletPortrait] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  
  const showConfetti = useGameStore((state) => state.showConfetti);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // Detectar resoluciones
      const isTV65Resolution = (width >= 2160 && height >= 3840) || (width >= 3840 && height >= 2160);
      const isTabletPortraitResolution = 
        width >= 768 && width <= 1200 && 
        height > width && 
        height >= 1000 && 
        !isTV65Resolution;
      
      setIsTV65(isTV65Resolution);
      setIsTabletPortrait(isTabletPortraitResolution);
      setWindowSize({ width, height });
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-main-gradient relative overflow-hidden flex flex-col">
      {/* CONFETTI */}
      <MassiveConfetti 
        show={showConfetti} 
        windowSize={windowSize} 
        isTV65={isTV65}
        isTabletPortrait={isTabletPortrait}
      />
      
      {/* HEADER con LOGO - Discreto para no competir con la ruleta */}
      <header className={`
        flex justify-center items-center w-full z-20 relative shrink-0
        ${isTabletPortrait ? 'py-2' : isTV65 ? 'py-6' : 'py-4'}
      `}>
        <div className="drop-shadow-sm">
          <Logo 
            size="auto" 
            variant="subtle"
            animated={true}  
            withShadow={true}
            className="transition-all duration-300 ease-out"
          />
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL - Ocupa el espacio restante */}
      <main className={`
        flex-1 flex flex-col items-center justify-center w-full z-10 relative
        ${isTabletPortrait ? 'px-3 py-2' : isTV65 ? 'px-12 py-8' : 'px-6 py-4'}
        min-h-0
      `}>
        {children}
      </main>

      {/* FOOTER MÍNIMO - Solo información */}
      <footer className={`
        text-center text-white/40 w-full z-10 relative shrink-0
        ${isTabletPortrait ? 'py-2 text-xs' : isTV65 ? 'py-6 text-lg' : 'py-3 text-sm'}
      `}>
        <div className="font-light tracking-wide">
          {isTV65 ? 'DarSalud © 2024 - Capacitación Interactiva' : 'DarSalud © 2024'}
        </div>
      </footer>
    </div>
  );
}
