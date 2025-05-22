'use client';
import { useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { motion } from 'framer-motion';
import { AdminUser } from '@/types';

interface AdminLoginProps {
  onLoginSuccess: (adminData: AdminUser) => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Variantes de animación para los componentes
  const fieldsetVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 },
    },
  };

  const fieldItemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1.0] },
    },
  };

  // [modificación] Estilos actualizados para el diseño claro
  const textOnLightBase = "text-slate-800";
  const labelColorOnLight = "text-slate-700";
  const inputTextColorOnLight = "text-slate-800";
  const placeholderColorOnLight = "placeholder-slate-500";
  const inputBgOnLight = "bg-black/5";
  const inputBorderOnLight = "border-white/30";
  const inputHoverStyles = "hover:bg-black/10 hover:border-white/50";
  const inputFocusStyles = "focus:border-teal-500 focus:ring-1 focus:ring-teal-500";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al iniciar sesión');
      }

      if (!data.admin || !data.admin.id || !data.admin.email || !data.admin.name) {
        throw new Error('Datos de administrador incompletos');
      }

      onLoginSuccess(data.admin);
    } catch (err: Error | unknown) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className={`flex flex-col items-center justify-between w-full max-w-lg mx-auto p-5 md:p-8 rounded-xl bg-black/5 ${textOnLightBase} shadow-xl backdrop-blur-md border border-white/10 touch-optimized`}
    >
      <motion.div
        className="w-full flex flex-col items-center shrink-0"
        variants={fieldItemVariants}
        initial="hidden"
        animate="visible"
      >
        <h2 className="text-xl md:text-2xl font-marineBold text-center mb-5 text-slate-800">
          Iniciar Sesión como Administrador
        </h2>
      </motion.div>

      <form onSubmit={handleLogin} className="flex flex-col space-y-3 md:space-y-4 w-full overflow-y-auto px-1 custom-scrollbar" style={{ flexGrow: 1 }}>
        <motion.div
          variants={fieldsetVariants}
          initial="hidden"
          animate="visible"
          className="space-y-3 md:space-y-4"
        >
          {/* Email */}
          <motion.div variants={fieldItemVariants}>
            <Input
              label="Email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-required="true"
              containerClassName="w-full"
              labelClassName={`${labelColorOnLight} text-sm`}
              className={`${inputBgOnLight} ${inputTextColorOnLight} ${placeholderColorOnLight} ${inputBorderOnLight} ${inputHoverStyles} ${inputFocusStyles} h-12 md:h-14 text-lg`}
              autoComplete="email"
              required
            />
          </motion.div>

          {/* Contraseña */}
          <motion.div variants={fieldItemVariants}>
            <Input
              label="Contraseña"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-required="true"
              containerClassName="w-full"
              labelClassName={`${labelColorOnLight} text-sm`}
              className={`${inputBgOnLight} ${inputTextColorOnLight} ${placeholderColorOnLight} ${inputBorderOnLight} ${inputHoverStyles} ${inputFocusStyles} h-12 md:h-14 text-lg`}
              autoComplete="current-password"
              required
            />
          </motion.div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="py-2 px-3 bg-red-500/10 text-red-600 rounded-md text-sm"
            >
              {error}
            </motion.div>
          )}

          <motion.div variants={fieldItemVariants} className="pt-2">
            <Button
              type="submit"
              disabled={isLoading}
              touchOptimized={true}
              className="w-full py-4 text-white text-lg btn-touch"
            >
              {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </Button>
          </motion.div>
        </motion.div>
      </form>
    </div>
  );
};

export default AdminLogin; 