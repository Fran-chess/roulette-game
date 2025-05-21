// src/app/game/[sessionId]/GameLayout.tsx
"use client";

import { ReactNode, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Logo from "@/components/ui/Logo";

// [modificación] Partículas generadas solo en el cliente para evitar hydration mismatch
const BackgroundParticles = () => {
  const [particleCount, setParticleCount] = useState(40);
  const [particles, setParticles] = useState<any[]>([]);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) setParticleCount(20);
      else if (width < 1200) setParticleCount(30);
      else setParticleCount(40);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const newParticles = Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      size: Math.random() * 10 + 2,
      left: Math.random() * 100,
      top: Math.random() * 100,
      animationDuration: Math.random() * 12 + 4,
      delay: Math.random() * 7,
    }));
    setParticles(newParticles);
  }, [particleCount]);

  return (
    <motion.div
      className="particles-bg absolute inset-0 pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.5 }}
    >
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="particle absolute rounded-full"
          style={{
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            left: `${particle.left}%`,
            top: `${particle.top}%`,
            animationDuration: `${particle.animationDuration}s`,
            animationDelay: `${particle.delay}s`,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.8, 0.4, 0] }}
          transition={{
            duration: particle.animationDuration,
            repeat: Infinity,
            delay: particle.delay,
          }}
        />
      ))}
    </motion.div>
  );
};

// Decorativos blur con posiciones más estratégicas para diseño responsive
const BackgroundElements = () => (
  <motion.div
    className="absolute top-0 left-0 w-full h-full z-0 pointer-events-none overflow-hidden"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 1 }}
  >
    {/* Optimizados para posiciones visibles en tablets/tótems */}
    <div className="absolute top-[5%] right-[5%] w-24 h-24 sm:w-32 sm:h-32 bg-white/10 rounded-full blur-3xl"></div>
    <div className="absolute bottom-[10%] left-[5%] w-36 h-36 sm:w-44 sm:h-44 bg-celeste-medio/10 rounded-full blur-3xl"></div>
    <div className="absolute top-[25%] left-[8%] w-20 h-20 sm:w-28 sm:h-28 bg-white/15 rounded-full blur-3xl"></div>
    <div className="absolute bottom-[20%] right-[10%] w-28 h-28 sm:w-36 sm:h-36 bg-verde-salud/10 rounded-full blur-3xl"></div>
    <div className="absolute top-[15%] left-[30%] w-72 h-72 sm:w-80 sm:h-80 bg-white/5 rounded-full blur-3xl"></div>
    <div className="absolute bottom-[5%] right-[25%] w-56 h-56 sm:w-64 sm:h-64 bg-celeste-medio/10 rounded-full blur-3xl"></div>
  </motion.div>
);

export default function GameLayout({ children }: { children: ReactNode }) {
  // Estado para detectar la orientación y tamaño
  const [isLandscape, setIsLandscape] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setIsLandscape(width > height);
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width <= 1280);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-main-gradient relative">
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
