'use client';
import { useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { motion } from 'framer-motion';

interface AdminLoginProps {
  onLoginSuccess: (adminData: any) => void;
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
  const inputBgOnLight = "bg-white/40";
  const inputBorderOnLight = "border-white/60";
  const inputHoverStyles = "hover:bg-white/50 hover:border-white/80";
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

      onLoginSuccess(data.admin);
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className={`flex flex-col items-center justify-between w-full max-w-lg mx-auto p-5 md:p-8 rounded-xl bg-white/15 ${textOnLightBase} shadow-xl backdrop-blur-md border-0`}
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
              className={`${inputBgOnLight} ${inputTextColorOnLight} ${placeholderColorOnLight} ${inputBorderOnLight} ${inputHoverStyles} ${inputFocusStyles}`}
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
              className={`${inputBgOnLight} ${inputTextColorOnLight} ${placeholderColorOnLight} ${inputBorderOnLight} ${inputHoverStyles} ${inputFocusStyles}`}
              autoComplete="current-password"
              required
            />
          </motion.div>

          {/* Mensaje de Error */}
          {error && (
            <motion.div variants={fieldItemVariants}>
              <p className="text-red-600 text-sm text-center mt-2">{error}</p>
            </motion.div>
          )}
        </motion.div>
        
        {/* Botón de Envío */}
        <motion.div
          className="pt-3 md:pt-5 text-center w-full shrink-0"
          variants={fieldItemVariants}
          initial="hidden"
          animate="visible"
        >
          <Button
            type="submit"
            disabled={isLoading}
            className={`w-full max-w-xs md:max-w-sm mx-auto bg-white/40 hover:bg-white/60 text-slate-800
                     font-marineBold px-6 py-3 text-base md:text-lg rounded-xl shadow-md border border-white/50
                     focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-blue-300/30
                     transform active:scale-95 transition-all duration-150
                     ${isLoading ? "opacity-70 cursor-not-allowed" : ""}`}
          >
            {isLoading ? "Iniciando Sesión..." : "Iniciar Sesión"}
          </Button>
        </motion.div>
      </form>
    </div>
  );
};

export default AdminLogin; 