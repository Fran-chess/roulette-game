// src/app/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useGameStore } from "@/store/gameStore";
import ScreenSaver from "@/components/layout/ScreenSaver";
import AdminLogin from "@/components/admin/AdminLogin";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useNavigationStore } from "@/store/navigationStore";
import { useInactivityTimer } from "@/lib/hooks/useInactivityTimer";
import dynamic from "next/dynamic";
import type { GameState } from "@/types";

const VideoBackground = dynamic(() => import("@/components/layout/VideoBackground"), {
  ssr: false,
});

interface GameStateConfig {
  showVideo: boolean;
  detectInactivity: boolean;
  transitionTo?: GameState;
  route?: string;
}

export default function HomePage() {
  const gameState = useGameStore((state) => state.gameState);
  const setGameState = useGameStore((state) => state.setGameState);
  const resetCurrentGame = useGameStore((state) => state.resetCurrentGame);
  const adminUser = useGameStore((state) => state.adminUser);
  const setAdminUser = useGameStore((state) => state.setAdminUser);

  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const router = useRouter();

  const isNavigating = useNavigationStore(state => state.isNavigating);
  const startNavigation = useNavigationStore(state => state.startNavigation);

  const stateConfig: Record<GameState, GameStateConfig> = {
    'screensaver': {
      showVideo: true,
      detectInactivity: false
    },
    'register': {
      showVideo: false,
      detectInactivity: true,
      route: '/register'
    },
    'roulette': {
      showVideo: false,
      detectInactivity: true,
      route: '/game/roulette'
    },
    'question': {
      showVideo: false,
      detectInactivity: true,
      route: '/game/question'
    },
    'prize': {
      showVideo: false,
      detectInactivity: true,
      route: '/game/prize'
    },
    'ended': {
      showVideo: false,
      detectInactivity: true,
      transitionTo: 'screensaver'
    }
  };

  useInactivityTimer(
    300000, 
    () => {
      if (gameState && stateConfig[gameState]?.detectInactivity) {
        console.log(`Inactividad detectada en estado ${gameState}: mostrando screensaver`);
        setGameState("screensaver");
      }
    },
    gameState
  );

  useEffect(() => {
    const currentConfig = gameState && stateConfig[gameState];
    
    if (currentConfig?.transitionTo) {
      const timer = setTimeout(() => {
        setGameState(currentConfig.transitionTo as GameState);
      }, 10000);
      
      return () => clearTimeout(timer);
    }
  }, [gameState, setGameState]);

  useEffect(() => {
    const currentConfig = gameState && stateConfig[gameState];
    
    if (currentConfig?.route && !isTransitioning && !isNavigating) {
      const currentPath = window.location.pathname;
      if (currentPath !== currentConfig.route) {
        startNavigation(currentConfig.route, `Cargando ${gameState}...`);
      }
    }
  }, [gameState, isTransitioning, isNavigating, startNavigation]);

  useEffect(() => {
    setGameState('screensaver');
    if (typeof resetCurrentGame === 'function') {
      resetCurrentGame();
    }

    const storedAdmin = localStorage.getItem('adminUser');
    if (storedAdmin) {
      try {
        const parsedAdmin = JSON.parse(storedAdmin);
        setAdminUser(parsedAdmin);
      } catch (error) {
        localStorage.removeItem('adminUser');
        setAdminUser(null);
      }
    } else {
      setAdminUser(null);
    }
  }, [setAdminUser, setGameState, resetCurrentGame]);

  const handleScreenInteraction = useCallback(() => {
    if (isTransitioning) return;

    setIsTransitioning(true);

    if (!adminUser) {
      setShowLoginModal(true);
      setTimeout(() => setIsTransitioning(false), 300);
    } else {
      startNavigation('/admin', 'Accediendo al panel de administración...');
    }
  }, [isTransitioning, adminUser, startNavigation]);

  const handleLoginSuccess = (adminDataFromLogin: any) => {
    setAdminUser(adminDataFromLogin);
    localStorage.setItem('adminUser', JSON.stringify(adminDataFromLogin));
    setShowLoginModal(false);
    setIsTransitioning(true);
    startNavigation('/admin', 'Accediendo al panel de administración...');
  };

  const handleCloseLoginModal = () => {
    setShowLoginModal(false);
  };

  const handleStartGame = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    
    setGameState("register");
    
    setTimeout(() => {
      setIsTransitioning(false);
      startNavigation('/register', 'Iniciando juego...');
    }, 300);
  }, [isTransitioning, setGameState, startNavigation]);

  return (
    <main className="flex flex-col items-center justify-center min-h-screen text-center relative overflow-hidden">
      {gameState && stateConfig[gameState]?.showVideo && <VideoBackground />}

      {gameState === "screensaver" && (
        <ScreenSaver 
          onInteraction={adminUser ? handleScreenInteraction : handleStartGame} 
          isVisible={!showLoginModal && !isTransitioning}
        />
      )}

      {showLoginModal && (
        <motion.div 
          className="fixed inset-0 z-40 flex items-center justify-center p-4 backdrop-blur-md bg-black/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="w-full max-w-lg"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
          >
            <AdminLogin onLoginSuccess={handleLoginSuccess} />
          </motion.div>
        </motion.div>
      )}
    </main>
  );
}
