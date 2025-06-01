// src/app/game/[sessionId]/GameLayout.tsx
"use client";

import { ReactNode, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Logo from "@/components/ui/Logo";
import dynamic from "next/dynamic";
import { useGameStore } from "@/store/gameStore";

const Confetti = dynamic(() => import("react-confetti"), { ssr: false });

export default function GameLayout({ children }: { children: ReactNode }) {
  // Estado para detectar la orientación y tamaño
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isTV65, setIsTV65] = useState(false); // [modificación] - Detectar TV65 para confetti optimizado
  const showConfetti = useGameStore((state) => state.showConfetti);

  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // [modificación] - Detectar TV65 igual que en QuestionDisplay
      const isTV65Resolution = (width >= 2160 && height >= 3840) || (width >= 3840 && height >= 2160);
      
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width <= 1280);
      setIsTV65(isTV65Resolution);
      setWindowSize({ width, height });
      
      if (isTV65Resolution) {
        console.log(`🎉 GameLayout: Confetti optimizado para TV65 activado - ${width}x${height}`);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // [modificación] - Configuración dinámica del confetti según el dispositivo
  const confettiConfig = {
    width: windowSize.width,
    height: windowSize.height,
    // [modificación] - Muchísimas más partículas para TV65 para efecto espectacular
    numberOfPieces: isTV65 ? 2000 : isMobile ? 200 : 500,
    // [modificación] - Gravedad más lenta para TV65 para que caiga más elegante
    gravity: isTV65 ? 0.1 : 0.2,
    // [modificación] - Velocidad inicial más alta para TV65
    initialVelocityY: isTV65 ? 25 : 15,
    initialVelocityX: isTV65 ? 15 : 10,
    // [modificación] - Confetti NO se recicla para que haya una explosión inicial espectacular
    recycle: false,
    // [modificación] - Tamaño de partículas más grande especialmente para TV65
    scalar: isTV65 ? 2.2 : isTablet ? 1.5 : isMobile ? 1.2 : 1.3, // Partículas más grandes según dispositivo
    // [modificación] - Colores vibrantes y festivos
    colors: [
      '#ff0040', '#ff8c00', '#ffd700', '#00ff80', '#00bfff', 
      '#8a2be2', '#ff1493', '#32cd32', '#ff6347', '#1e90ff',
      '#ffa500', '#9370db', '#00ced1', '#ff69b4', '#00ff00'
    ],
    // [modificación] - Más tiempo de vida para partículas en TV65
    ...(isTV65 && {
      opacity: 0.9,
      wind: 0.02,
    })
  };

  return (
    <div className="flex flex-col min-h-screen bg-main-gradient relative">
      {/* [modificación] - Confetti mejorado con configuración dinámica y z-index alto */}
      {showConfetti && (
        <Confetti
          {...confettiConfig}
          className="pointer-events-none fixed inset-0 z-50"
          style={{ zIndex: 9999 }} // [modificación] - Z-index máximo para que esté encima de todo
        />
      )}
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
