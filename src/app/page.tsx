// src/app/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useGameStore } from "@/store/gameStore";
import VideoBackground from "@/components/layout/VideoBackground";
import ScreenSaver from "@/components/layout/ScreenSaver"; // El ScreenSaver ahora es una capa interactiva invisible
import AdminLogin from "@/components/admin/AdminLogin";
// import { useInactivityTimer } from "@/lib/hooks/useInactivityTimer"; // Comentado si no se usa aquí directamente
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";

// const SCREENSAVER_TIMEOUT = 120000; // Para un hook de inactividad global

export default function HomePage() {
  // Selectores del store (ajusta según lo que necesite esta página específica)
  const setGameState = useGameStore((state) => state.setGameState);
  const resetCurrentGame = useGameStore((state) => state.resetCurrentGame); // Asumiendo que limpia gameSession, currentParticipant, etc.
  const adminUser = useGameStore((state) => state.adminUser);
  const setAdminUser = useGameStore((state) => state.setAdminUser);

  // Estado local
  const [isTransitioning, setIsTransitioning] = useState(false); // Para evitar interacciones dobles
  const [showLoginModal, setShowLoginModal] = useState(false);

  const router = useRouter();

  // Efecto para configurar el estado inicial de la página y verificar sesión de admin
  useEffect(() => {
    console.log("HomePage: Montado. Estableciendo estado a screensaver y limpiando juego.");
    setGameState('screensaver'); // Establece el estado global del juego
    if (typeof resetCurrentGame === 'function') {
        resetCurrentGame(); // Limpia datos de cualquier juego anterior
    }

    const storedAdmin = localStorage.getItem('adminUser');
    if (storedAdmin) {
      try {
        const parsedAdmin = JSON.parse(storedAdmin);
        setAdminUser(parsedAdmin);
        console.log("HomePage: Admin user cargado desde localStorage:", parsedAdmin);
      } catch (error) {
        console.error('HomePage: Error al procesar datos de admin de localStorage:', error);
        localStorage.removeItem('adminUser');
        setAdminUser(null);
      }
    } else {
      setAdminUser(null); // Asegurar que esté nulo si no hay nada en localStorage
    }
  }, [setAdminUser, setGameState, resetCurrentGame]); // Dependencias correctas

  // Lógica de Inactividad:
  // Si quieres que la inactividad en OTRAS páginas redirija aquí,
  // ese `useInactivityTimer` y la lógica de `router.push('/')`
  // deberían estar en un componente de Layout que envuelva esas otras páginas.
  // Esta página, al cargarse (como se ve en el useEffect de arriba), ya se pone en 'screensaver'.

  // Manejar interacción con el ScreenSaver (que ahora es toda la pantalla)
  const handleScreenInteraction = useCallback(() => {
    if (isTransitioning) return; // Prevenir clics múltiples durante la transición

    console.log("HomePage: Interacción con la pantalla detectada.");
    setIsTransitioning(true);

    if (!adminUser) {
      console.log("HomePage: No hay adminUser. Mostrando modal de login.");
      setShowLoginModal(true);
    } else {
      console.log("HomePage: adminUser encontrado. Redirigiendo a /admin.");
      router.push('/admin');
    }
    // Delay para permitir que la UI se actualice (ej. modal aparezca) o la navegación comience
    setTimeout(() => setIsTransitioning(false), 300); 
  }, [isTransitioning, adminUser, router]);

  // Manejar login exitoso desde el modal
  const handleLoginSuccess = (adminDataFromLogin: any) => {
    console.log("HomePage: Login exitoso. Admin data:", adminDataFromLogin);
    setAdminUser(adminDataFromLogin);
    localStorage.setItem('adminUser', JSON.stringify(adminDataFromLogin));
    setShowLoginModal(false);
    setIsTransitioning(true); // Prevenir más interacciones mientras se redirige
    router.push('/admin');
    setTimeout(() => setIsTransitioning(false), 300); // Resetear después de la navegación
  };

  // Cerrar el modal de login si se hace clic fuera (opcional) o si hay un botón de cerrar
  const handleCloseLoginModal = () => {
    console.log("HomePage: Cerrando modal de login.");
    setShowLoginModal(false);
  }

  return (
    <main
      className="flex flex-col items-center justify-center min-h-screen text-center relative overflow-hidden bg-black"
      // Los manejadores de interacción están en el ScreenSaver ahora
    >
      <VideoBackground
        videoSrc="/videos/intro-loop.mp4" // Asegúrate que esta ruta es correcta
        isActive={true} // El video siempre está activo y visible en esta página
      />

      {/* Modal de login de administrador */}
      <AnimatePresence>
        {showLoginModal && (
          <motion.div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            // onClick={handleCloseLoginModal} // Descomenta si quieres que un clic fuera del modal lo cierre
          >
            <motion.div
              className="w-full max-w-lg" // Contenedor del AdminLogin
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0, transition: { duration: 0.2 } }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()} // Evita que el clic en el modal lo cierre si el padre tiene onClick
            >
              <AdminLogin onLoginSuccess={handleLoginSuccess} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ScreenSaver como capa interactiva transparente. 
          Se muestra si el modal de login no está activo. 
          Su z-index (z-20) lo coloca sobre el video (z-0) y debajo del modal (z-50). */}
      {!showLoginModal && (
        <ScreenSaver
          onInteraction={handleScreenInteraction}
          isVisible={true} 
        />
      )}
    </main>
  );
}