"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import AdminLogin from "@/components/admin/AdminLogin";
import AdminPanel from "@/components/admin/AdminPanel";
import { motion } from "framer-motion";
import { useSessionStore } from "@/store/sessionStore";
import type { AdminUser } from "@/types";

export default function HomePage() {
  const { 
    user, 
    isAuthenticated, 
    isLoading, 
    error,
    logout,
    setCurrentView 
  } = useSessionStore();

  const [isInitialized, setIsInitialized] = useState(false);
  const isFirstMount = useRef(true);

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      
      const checkExistingSession = () => {
        setIsInitialized(true);
      };

      checkExistingSession();
    }
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      setCurrentView('login');
          } catch {
        // Error al cerrar sesión - no es crítico, solo log de debug
        // No usar tvProdLogger ya que no es un error crítico de producción
      }
  }, [logout, setCurrentView]);

  if (!isInitialized || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center relative overflow-hidden bg-main-gradient">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-white text-lg"
        >
          {isLoading ? 'Iniciando sesión...' : 'Cargando...'}
        </motion.div>
      </div>
    );
  }

  if (isAuthenticated && user && user.role === 'admin') {
    const adminData: AdminUser = {
      id: user.id,
      email: user.email,
      name: user.name || '',
      role: user.role
    };

    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-2 md:p-4 bg-main-gradient overflow-hidden">
        <motion.div
          className="w-full max-w-5xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <AdminPanel adminData={adminData} onLogout={handleLogout} />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-2 md:p-4 bg-main-gradient overflow-hidden">
      <motion.div
        className="w-full max-w-lg"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, type: "spring", stiffness: 300, damping: 25 }}
      >
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 py-2 px-3 bg-red-500/10 text-red-600 rounded-md text-sm text-center"
          >
            {error}
          </motion.div>
        )}
        <AdminLogin />
      </motion.div>
    </div>
  );
}
