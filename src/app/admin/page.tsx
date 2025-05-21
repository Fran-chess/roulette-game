// src/app/admin/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import AdminLogin from '@/components/admin/AdminLogin';
import AdminPanel from '@/components/admin/AdminPanel';
import { useGameStore } from '@/store/gameStore';
import { supabaseClient } from '@/lib/supabase';
import { motion } from 'framer-motion';

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [adminData, setAdminData] = useState<any>(null);
  const router = useRouter();
  const { setAdminUser, adminUser } = useGameStore();

  // Variantes de animación
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.4,
        when: "beforeChildren",
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.3, ease: "easeOut" },
    },
  };

  useEffect(() => {
    // Verificar si hay un administrador en el localStorage
    const checkAdminStatus = () => {
      const storedAdmin = localStorage.getItem('adminUser');
      if (storedAdmin) {
        try {
          const parsedAdmin = JSON.parse(storedAdmin);
          setAdminData(parsedAdmin);
          setAdminUser(parsedAdmin);
          setIsLoggedIn(true);
        } catch (error) {
          console.error('Error parsing admin data:', error);
          localStorage.removeItem('adminUser');
        }
      }
    };

    checkAdminStatus();
  }, [setAdminUser]);

  const handleLoginSuccess = (adminData: any) => {
    setAdminData(adminData);
    setAdminUser(adminData);
    setIsLoggedIn(true);
    localStorage.setItem('adminUser', JSON.stringify(adminData));
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setAdminData(null);
    setAdminUser(null);
    localStorage.removeItem('adminUser');
    
    window.location.href = '/admin';
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen p-2 md:p-4 bg-main-gradient overflow-hidden">
      <motion.div
        className="w-full max-w-5xl"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {!isLoggedIn ? (
          // Si no hay sesión iniciada, mostramos solo el login
          <AdminLogin onLoginSuccess={handleLoginSuccess} />
        ) : (
          // Si hay sesión iniciada, mostramos el panel de administración
          <AdminPanel adminData={adminData} onLogout={handleLogout} />
        )}
      </motion.div>
    </div>
  );
}