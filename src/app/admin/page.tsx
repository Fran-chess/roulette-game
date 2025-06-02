'use client';
import { useEffect, useState } from 'react';
import AdminLogin from '@/components/admin/AdminLogin';
import AdminPanel from '@/components/admin/AdminPanel';
import { useSessionStore } from '@/store/sessionStore';
import { motion } from 'framer-motion';
import { AdminUser } from '@/types';

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [adminData, setAdminData] = useState<AdminUser | null>(null);
  const { loginWithAdmin, setUser } = useSessionStore();

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

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const res = await fetch('/api/admin/profile');
        if (res.ok) {
          const { admin } = await res.json();
          setAdminData(admin);
          loginWithAdmin({
            id: admin.id,
            email: admin.email,
            name: admin.name,
            role: 'admin' as const,
          });
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
        }
      } catch (error) {
        console.error('Error verifying admin session:', error);
        setIsLoggedIn(false);
      }
    };

    checkAdminStatus();
  }, [loginWithAdmin]);

  const handleLoginSuccess = (adminData: AdminUser) => {
    setAdminData(adminData);
    loginWithAdmin({
      id: adminData.id,
      email: adminData.email,
      name: adminData.name,
      role: 'admin' as const
    });
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setAdminData(null);
    setUser(null);

    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    } finally {
      window.location.href = '/admin';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen p-2 md:p-4 bg-main-gradient overflow-hidden">
      <motion.div
        className="w-full max-w-5xl"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {!isLoggedIn || !adminData ? (
          // Si no hay sesión iniciada o no hay datos de admin, mostramos solo el login
          <AdminLogin onLoginSuccess={handleLoginSuccess} />
        ) : (
          // Si hay sesión iniciada y tenemos datos de admin, mostramos el panel de administración
          <AdminPanel adminData={adminData} onLogout={handleLogout} />
        )}
      </motion.div>
    </div>
  );
}