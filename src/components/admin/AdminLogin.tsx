'use client';
import { useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { motion } from 'framer-motion';
import { AdminUser } from '@/types';
import { useSessionStore } from '@/store/sessionStore';

interface AdminLoginProps {
  onLoginSuccess?: (adminData: AdminUser) => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [localLoading, setLocalLoading] = useState(false);
  
  // [modificación] Usar sessionStore para el flujo principal
  const { isLoading: sessionLoading, error: sessionError } = useSessionStore();
  
  // [modificación] Determinar si usar sessionStore o modo local
  const useSessionStoreMode = !onLoginSuccess;
  const isLoading = useSessionStoreMode ? sessionLoading : localLoading;
  const error = useSessionStoreMode ? sessionError : localError;

  // [modificación] Variantes de animación mejoradas para componentes
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { 
        duration: 0.6, 
        ease: [0.25, 0.1, 0.25, 1.0],
        staggerChildren: 0.1, 
        delayChildren: 0.2
      },
    },
  };

  const fieldsetVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.1 },
    },
  };

  const fieldItemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1.0] },
    },
  };

  // [modificación] Variantes para efectos de hover en botones
  const buttonVariants = {
    hover: { 
      scale: 1.02,
      boxShadow: "0 10px 30px -10px rgba(14, 165, 233, 0.4)",
      transition: { duration: 0.2 }
    },
    tap: { scale: 0.98 }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) return;

    if (useSessionStoreMode) {
      // [modificación] Usar la función login del sessionStore directamente
      try {
        await useSessionStore.getState().login(email, password);
// //         console.log('Login exitoso');
      } catch (err: unknown) {
        // El error ya se maneja en el sessionStore
        console.error('Error en login:', err);
      }
    } else {
      // [modificación] Modo local con props para compatibilidad con página /admin
      setLocalError('');
      setLocalLoading(true);

      try {
        const res = await fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        const { admin, message } = await res.json();
        
        if (!res.ok) {
          throw new Error(message || 'Error al iniciar sesión');
        }

        const adminData: AdminUser = {
          id: admin.id,
          name: admin.name,
          email: admin.email,
          role: 'admin'
        };

        // [modificación] Llamar a onLoginSuccess
        if (onLoginSuccess) {
          onLoginSuccess(adminData);
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Error al iniciar sesión';
        setLocalError(errorMessage);
      } finally {
        setLocalLoading(false);
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen w-full p-4">
      {/* [modificación] - Fondo mejorado con gradiente animado */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 via-transparent to-teal-500/10"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(14,165,233,0.1),transparent_50%)]"></div>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-md mx-auto"
      >
        {/* [modificación] - Contenedor principal mejorado con mejor glassmorphism */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-8 space-y-6">
          
          {/* [modificación] - Header mejorado con iconos y mejor tipografía */}
          <motion.div
            variants={fieldItemVariants}
            className="text-center space-y-4"
          >
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-marineBold text-white mb-2">
                Panel Administrativo
              </h2>
              <p className="text-slate-300 text-sm font-sans">
                Ingresa tus credenciales para continuar
              </p>
            </div>
          </motion.div>

          <form onSubmit={handleLogin} className="space-y-6">
            <motion.div
              variants={fieldsetVariants}
              initial="hidden"
              animate="visible"
              className="space-y-4"
            >
              {/* Campo Email */}
              <motion.div variants={fieldItemVariants}>
                <Input
                  label="Correo electrónico"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-required="true"
                  containerClassName="w-full"
                  labelClassName="text-slate-200 text-sm font-marineBold mb-2 block"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 hover:bg-white/10 font-sans"
                  autoComplete="email"
                  required
                  disabled={isLoading}
                />
              </motion.div>

              {/* Campo Contraseña */}
              <motion.div variants={fieldItemVariants}>
                <Input
                  label="Contraseña"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-required="true"
                  containerClassName="w-full"
                  labelClassName="text-slate-200 text-sm font-marineBold mb-2 block"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 hover:bg-white/10 font-sans"
                  autoComplete="current-password"
                  required
                  disabled={isLoading}
                />
              </motion.div>

              {/* [modificación] - Mensaje de error mejorado */}
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="flex items-center space-x-2 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm backdrop-blur-sm font-sans"
                >
                  <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{error}</span>
                </motion.div>
              )}

              {/* [modificación] - Botón mejorado con animaciones y gradiente */}
              <motion.div variants={fieldItemVariants} className="pt-2">
                <motion.div
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                >
                  <Button
                    type="submit"
                    disabled={isLoading || !email || !password}
                    className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white font-marineBold rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-transparent"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="font-marineBold">Iniciando sesión...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-2">
                        <span className="font-marineBold">Iniciar Sesión</span>
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </div>
                    )}
                  </Button>
                </motion.div>
              </motion.div>
            </motion.div>
          </form>

          {/* [modificación] - Footer con información adicional */}
          <motion.div 
            variants={fieldItemVariants}
            className="text-center pt-4 border-t border-white/10"
          >
            <p className="text-slate-400 text-xs font-sans">
              Acceso seguro protegido • Solo personal autorizado
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
