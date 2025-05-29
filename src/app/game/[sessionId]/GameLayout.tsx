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
  const [isTV, setIsTV] = useState(false);
  const showConfetti = useGameStore((state) => state.showConfetti);

  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width <= 1280);
      setIsTV(width >= 1920);
      setWindowSize({ width, height: window.innerHeight });
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-main-gradient relative">
      {showConfetti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={500}
          gravity={0.2}
          className="pointer-events-none fixed inset-0"
        />
      )}
      {/* [modificación] Header compacto y con layout similar al de registro para consistencia */}
      <header className="w-full flex justify-center items-center min-h-[65px] border-b border-white/10 backdrop-blur-sm">
        {/* [modificación] Contenedor con tamaño máximo consistente con el formulario de registro */}
        <div className={`${isMobile ? 'max-w-[150px]' : isTablet ? 'max-w-[165px]' : isTV ? 'max-w-[220px]' : 'max-w-[200px]'} w-full flex justify-center items-center`}>
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
