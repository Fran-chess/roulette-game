// src/components/game/RegistrationForm.tsx
"use client";
import { useState, FormEvent } from "react";
import { useGameStore } from "@/store/gameStore";
import { motion } from "framer-motion";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

// [modificación] Añadir props para sessionId y onPlayerRegistered
interface RegistrationFormProps {
  sessionId?: string; // Opcional para mantener compatibilidad con el uso existente
  onPlayerRegistered?: () => void;
}

// [modificación] Actualizar la firma del componente para aceptar props
export default function RegistrationForm({ sessionId, onPlayerRegistered }: RegistrationFormProps) {
  const startPlaySession = useGameStore(state => state.startPlaySession);
  const setGameState = useGameStore(state => state.setGameState);

  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    especialidad: "", // [modificación] Añadido campo de especialidad
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{
    nombre?: string;
    apellido?: string;
    email?: string;
    especialidad?: string;
    general?: string;
  }>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Limpiar error específico al cambiar el campo
    if (errors[e.target.name as keyof typeof errors]) {
      setErrors({ ...errors, [e.target.name]: undefined });
    }
    // Limpiar error general al empezar a escribir de nuevo
    if (errors.general) {
      setErrors({ ...errors, general: undefined });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!formData.nombre || formData.nombre.trim() === "") {
      newErrors.nombre = "El nombre es obligatorio.";
    }

    // --- Validación de Email (Obligatorio) ---
    if (!formData.email || formData.email.trim() === "") {
      newErrors.email = "El email es obligatorio.";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = "El formato del email no es válido.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0; // Retorna true si no hay errores
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Limpiar errores previos
    setErrors({});

    // Validar formulario
    if (!validateForm()) {
      return; // Detiene el envío si hay errores
    }

    // Indicar que está en proceso
    setIsSubmitting(true);

    try {
      // [modificación] Si hay sessionId, usar la API de registro de jugador en sesión
      if (sessionId) {
        console.log('Enviando registro para sesión:', sessionId);
        
        // Intentar primero verificar que la sesión existe
        try {
          const verifyResponse = await fetch(`/api/session/verify?sessionId=${sessionId}`);
          if (!verifyResponse.ok) {
            const verifyData = await verifyResponse.json();
            console.error('Error al verificar sesión antes de registrar:', verifyData);
            throw new Error(verifyData.message || 'Sesión no disponible');
          }
        } catch (verifyError: any) {
          console.error('Error al verificar sesión:', verifyError);
          setErrors({
            general: `Error al verificar la sesión: ${verifyError.message || 'Error desconocido'}`
          });
          setIsSubmitting(false);
          return;
        }
        
        // Enviar solicitud de registro
        const response = await fetch('/api/admin/sessions/register-player', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId,
            ...formData,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          console.error('Error en respuesta de API:', data);
          throw new Error(data.message || data.error || 'Error al registrar jugador');
        }

        console.log('Registro exitoso:', data);
        
        // Si hay un callback de éxito de registro, llamarlo
        if (onPlayerRegistered) {
          onPlayerRegistered();
        } else {
          // Si no hay callback específico, cambiar al estado de ruleta
          setGameState("roulette");
        }
      } else {
        // Comportamiento original sin sessionId (para compatibilidad)
        await startPlaySession(
          {
            nombre: formData.nombre.trim(),
            apellido: formData.apellido.trim() || undefined,
            email: formData.email.trim(),
          },
          // Callback de éxito
          (data) => {
            console.log("Registro exitoso:", data.message);
            setGameState("roulette");
          },
          // Callback de error
          (error) => {
            console.error("Error de registro:", error);
            setErrors({
              general: error.message || "Error al registrar. Inténtalo de nuevo.",
            });
            setIsSubmitting(false);
          }
        );
      }
    } catch (error: any) {
      // Capturar cualquier error no manejado
      console.error("Error inesperado:", error);
      setErrors({
        general: error.message || "Ocurrió un error inesperado. Por favor, inténtalo de nuevo.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Variantes de animación
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
      transition: { duration: 0.4, ease: "easeOut" },
    },
  };

  // Estilos Tailwindcss
  const textOnDarkBase = "text-white";
  const labelColorOnDark = "text-gray-200";
  const inputTextColorOnDark = "text-white";
  const placeholderColorOnDark = "placeholder-gray-400";
  const inputBgOnDark = "bg-black/20";
  const inputBorderOnDark = "border-white/40";
  const inputHoverStyles = "hover:bg-black/30 hover:border-white/60";
  const inputFocusStyles =
    "focus:border-teal-400 focus:ring-1 focus:ring-teal-400";

  return (
    <div
      className={`flex flex-col items-center justify-between w-full max-w-lg mx-auto p-6 md:p-10 rounded-2xl bg-slate-900/20 ${textOnDarkBase} shadow-2xl`}
      style={{ minHeight: "auto", maxHeight: "80vh" }}
    >
      <motion.div
        className="w-full flex flex-col items-center shrink-0"
        variants={fieldItemVariants}
        initial="hidden"
        animate="visible"
      >
        <h2
          className={`text-2xl md:text-3xl font-marineBold text-center mb-6 md:mb-8`}
        >
          Registro para Jugar
        </h2>
      </motion.div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col space-y-4 md:space-y-5 w-full overflow-y-auto px-2 custom-scrollbar"
        style={{ flexGrow: 1 }}
      >
        <motion.div
          variants={fieldsetVariants}
          initial="hidden"
          animate="visible"
          className="space-y-4 md:space-y-5"
        >
          {/* Input Nombre */}
          <motion.div variants={fieldItemVariants}>
            <Input
              label="Nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              aria-required="true"
              containerClassName="w-full"
              labelClassName={`${labelColorOnDark} text-sm`}
              className={`${inputBgOnDark} ${inputTextColorOnDark} ${placeholderColorOnDark} ${inputBorderOnDark} ${inputHoverStyles} ${inputFocusStyles} ${
                errors.nombre ? "border-red-500" : ""
              }`}
              autoComplete="name"
            />
            {errors.nombre && (
              <p className="text-red-500 text-xs mt-1 px-1">{errors.nombre}</p>
            )}
          </motion.div>

          {/* Input Apellido (Opcional) */}
          <motion.div variants={fieldItemVariants}>
            <Input
              label="Apellido"
              name="apellido"
              value={formData.apellido}
              onChange={handleChange}
              containerClassName="w-full"
              labelClassName={`${labelColorOnDark} text-sm`}
              className={`${inputBgOnDark} ${inputTextColorOnDark} ${placeholderColorOnDark} ${inputBorderOnDark} ${inputHoverStyles} ${inputFocusStyles}`}
              autoComplete="family-name"
            />
          </motion.div>
          
          {/* [modificación] Input Especialidad (Opcional) */}
          <motion.div variants={fieldItemVariants}>
            <Input
              label="Especialidad"
              name="especialidad"
              value={formData.especialidad}
              onChange={handleChange}
              containerClassName="w-full"
              labelClassName={`${labelColorOnDark} text-sm`}
              className={`${inputBgOnDark} ${inputTextColorOnDark} ${placeholderColorOnDark} ${inputBorderOnDark} ${inputHoverStyles} ${inputFocusStyles}`}
            />
          </motion.div>

          {/* Input Email */}
          <motion.div variants={fieldItemVariants}>
            <Input
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              aria-required="true"
              containerClassName="w-full"
              labelClassName={`${labelColorOnDark} text-sm`}
              className={`${inputBgOnDark} ${inputTextColorOnDark} ${placeholderColorOnDark} ${inputBorderOnDark} ${inputHoverStyles} ${inputFocusStyles} ${
                errors.email ? "border-red-500" : ""
              }`}
              autoComplete="email"
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1 px-1">{errors.email}</p>
            )}
          </motion.div>

          {/* Mensaje de Error General */}
          {errors.general && (
            <motion.div variants={fieldItemVariants}>
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 mt-3">
                <p className="text-red-200 text-sm text-center">
                  {errors.general}
                </p>
              </div>
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
            disabled={isSubmitting}
            className={`w-full bg-teal-500 hover:bg-teal-600 text-white font-marineBold py-3 px-8 rounded-xl 
                     transition-colors duration-300 shadow-lg
                     ${isSubmitting ? "opacity-70 cursor-not-allowed" : ""}`}
          >
            {isSubmitting ? "Registrando..." : "Comenzar a Jugar"}
          </Button>
        </motion.div>
      </form>
    </div>
  );
}
