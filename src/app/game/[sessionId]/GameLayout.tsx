// src/app/game/[sessionId]/GameLayout.tsx
"use client";

import { ReactNode, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Logo from "@/components/ui/Logo";
import { useGameStore } from "@/store/gameStore";
// [modificación] - Importar el componente reutilizable de confetti masivo
import MassiveConfetti from "@/components/ui/MassiveConfetti";

export default function GameLayout({ children }: { children: ReactNode }) {
  // Estado para detectar la orientación y tamaño
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isTV65, setIsTV65] = useState(false); // [modificación] - Detectar TV65 para confetti optimizado
  const [isTablet800, setIsTablet800] = useState(false); // [NUEVO] - Detectar tablet 800x1340
  const showConfetti = useGameStore((state) => state.showConfetti);

  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // [modificación] - Detectar TV65 igual que en QuestionDisplay
      const isTV65Resolution = (width >= 2160 && height >= 3840) || (width >= 3840 && height >= 2160);
      
      // [NUEVO] - Detectar tablet 800x1340
      const isTablet800Resolution = (width >= 790 && width <= 810) && (height >= 1330 && height <= 1350);
      
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width <= 1280);
      setIsTV65(isTV65Resolution);
      setIsTablet800(isTablet800Resolution);
      setWindowSize({ width, height });
      
      if (isTV65Resolution) {
        console.log(`🎉 GameLayout: Confetti optimizado para TV65 activado - ${width}x${height}`);
      } else if (isTablet800Resolution) {
        console.log(`🎉 GameLayout: Confetti optimizado para tablet 800x1340 activado - ${width}x${height}`);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-main-gradient relative">
      {/* [modificación] - Sistema de confetti masivo usando componente reutilizable */}
      <MassiveConfetti 
        show={showConfetti} 
        windowSize={windowSize} 
        isTV65={isTV65}
        isTablet800={isTablet800} // [NUEVO] Pasar prop para tablet 800x1340
      />
      {/* [modificación] Header compacto y con layout similar al de registro para consistencia */}
      <header className="w-full flex justify-center items-center min-h-[65px] border-b border-white/10 backdrop-blur-sm">
        {/* [modificación] Contenedor con tamaño máximo consistente con el formulario de registro */}
        <div className={`${isMobile ? 'max-w-[150px]' : isTablet ? 'max-w-[165px]' : 'max-w-[200px]'} w-full flex justify-center items-center`}>
          <Logo
            size="auto"
            animated={true}
            withShadow={true}
            className="w-full h-auto"
          />
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center w-full px-2 py-0">
        <AnimatePresence mode="wait">
          <motion.div
            key="roulette-main"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="w-full flex flex-col items-center justify-center"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
