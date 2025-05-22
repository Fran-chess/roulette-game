// src/components/game/RegistrationForm.tsx
"use client";
import { useState, FormEvent } from "react";
import { useGameStore } from "@/store/gameStore";
import { motion } from "framer-motion";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { PlayCircleIcon } from "@heroicons/react/24/solid";

// [modificación] Añadir props para sessionId y onPlayerRegistered
interface RegistrationFormProps {
  sessionId?: string; // Opcional para mantener compatibilidad con el uso existente
  onPlayerRegistered?: () => void;
}

// [modificación] Actualizar la firma del componente para aceptar props
export default function RegistrationForm({
  sessionId,
  onPlayerRegistered,
}: RegistrationFormProps) {
  const startPlaySession = useGameStore((state) => state.startPlaySession);
  const setGameState = useGameStore((state) => state.setGameState);

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
        console.log("Enviando registro para sesión:", sessionId);

        // Intentar primero verificar que la sesión existe
        try {
          const verifyResponse = await fetch(
            `/api/session/verify?sessionId=${sessionId}`
          );
          if (!verifyResponse.ok) {
            const verifyData = await verifyResponse.json();
            console.error(
              "Error al verificar sesión antes de registrar:",
              verifyData
            );
            throw new Error(verifyData.message || "Sesión no disponible");
          }

          // [modificación] Verificar si el jugador ya está registrado
          const sessionData = await verifyResponse.json();
          if (
            sessionData.data &&
            sessionData.data.status === "player_registered" &&
            sessionData.data.nombre &&
            sessionData.data.email
          ) {
            console.log("El jugador ya está registrado en esta sesión");

            // [modificación] Si hay un callback de éxito de registro, llamarlo
            if (onPlayerRegistered) {
              onPlayerRegistered();
              return;
            }
          }
        } catch (verifyError: Error | unknown) {
          console.error("Error al verificar sesión:", verifyError);
          setErrors({
            general: `Error al verificar la sesión: ${
              verifyError instanceof Error ? verifyError.message : "Error desconocido"
            }`,
          });
          setIsSubmitting(false);
          return;
        }

        // Enviar solicitud de registro
        const response = await fetch("/api/admin/sessions/register-player", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sessionId,
            ...formData,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          console.error("Error en respuesta de API:", data);
          throw new Error(
            data.message || data.error || "Error al registrar jugador"
          );
        }

        console.log("Registro exitoso:", data);

        // [modificación] Añadir pequeño retraso para asegurar que los datos se procesan
        await new Promise((resolve) => setTimeout(resolve, 500));

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
            especialidad: formData.especialidad.trim() || undefined,
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
              general:
                error instanceof Error ? error.message :
                "Error al registrar. Inténtalo de nuevo.",
            });
            setIsSubmitting(false);
          }
        );
      }
    } catch (error: Error | unknown) {
      // Capturar cualquier error no manejado
      console.error("Error inesperado:", error);
      setErrors({
        general:
          error instanceof Error ? error.message :
          "Ocurrió un error inesperado. Por favor, inténtalo de nuevo.",
      });
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

  // [modificación] Detectar si estamos en móvil con base en el ancho de pantalla
  const isMobile = typeof window !== "undefined" && window.innerWidth <= 500;
  const isTablet =
    typeof window !== "undefined" &&
    window.innerWidth > 500 &&
    window.innerWidth <= 768;

  return (
    <div
      className={`flex flex-col items-center justify-between w-full mx-auto 
        p-4 sm:p-5 md:p-6 rounded-2xl bg-slate-900/20 ${textOnDarkBase} shadow-2xl
        ${isMobile ? "max-w-full" : isTablet ? "max-w-[95%]" : "max-w-lg"}`}
      style={{
        minHeight: "auto",
        maxHeight: isMobile ? "80vh" : isTablet ? "75vh" : "70vh",
      }}
    >
      <motion.div
        className="w-full flex flex-col items-center shrink-0"
        variants={fieldItemVariants}
        initial="hidden"
        animate="visible"
      >
        <h2
          className={`text-2xl sm:text-2xl md:text-3xl font-marineBold text-center mb-3 sm:mb-4 md:mb-5`}
        >
          Registro para Jugar
        </h2>
      </motion.div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col space-y-3 sm:space-y-4 w-full overflow-y-auto px-1 sm:px-2 custom-scrollbar"
        style={{ flexGrow: 1 }}
      >
        <motion.div
          variants={fieldsetVariants}
          initial="hidden"
          animate="visible"
          className="space-y-3 sm:space-y-4"
        >
          {/* Nombre (Obligatorio) */}
          <motion.div variants={fieldItemVariants}>
            <label
              htmlFor="nombre"
              className={`block text-base sm:text-lg font-medium mb-1 ${labelColorOnDark}`}
            >
              Nombre
            </label>
            <Input
              id="nombre"
              name="nombre"
              type="text"
              value={formData.nombre}
              onChange={handleChange}
              placeholder="Tu nombre"
              required
              className={`${inputTextColorOnDark} ${placeholderColorOnDark} ${inputBgOnDark} ${inputBorderOnDark} ${inputHoverStyles} ${inputFocusStyles} w-full py-2 px-3 rounded-md border text-base sm:text-lg`}
              errorMessage={errors.nombre}
              maxLength={100}
              aria-describedby="nombre-error"
            />
          </motion.div>

          {/* Apellido (Opcional) */}
          <motion.div variants={fieldItemVariants}>
            <label
              htmlFor="apellido"
              className={`block text-base sm:text-lg font-medium mb-1 ${labelColorOnDark}`}
            >
              Apellido
            </label>
            <Input
              id="apellido"
              name="apellido"
              type="text"
              value={formData.apellido}
              onChange={handleChange}
              placeholder="Tu apellido"
              className={`${inputTextColorOnDark} ${placeholderColorOnDark} ${inputBgOnDark} ${inputBorderOnDark} ${inputHoverStyles} ${inputFocusStyles} w-full py-2 px-3 rounded-md border text-base sm:text-lg`}
              errorMessage={errors.apellido}
              maxLength={100}
              aria-describedby="apellido-error"
            />
          </motion.div>

          {/* Especialidad (Opcional) */}
          <motion.div variants={fieldItemVariants}>
            <label
              htmlFor="especialidad"
              className={`block text-base sm:text-lg font-medium mb-1 ${labelColorOnDark}`}
            >
              Especialidad
            </label>
            <Input
              id="especialidad"
              name="especialidad"
              type="text"
              value={formData.especialidad}
              onChange={handleChange}
              placeholder="Tu especialidad médica"
              className={`${inputTextColorOnDark} ${placeholderColorOnDark} ${inputBgOnDark} ${inputBorderOnDark} ${inputHoverStyles} ${inputFocusStyles} w-full py-2 px-3 rounded-md border text-base sm:text-lg`}
              errorMessage={errors.especialidad}
              maxLength={100}
              aria-describedby="especialidad-error"
            />
          </motion.div>

          {/* Email (Obligatorio) */}
          <motion.div variants={fieldItemVariants}>
            <label
              htmlFor="email"
              className={`block text-base sm:text-lg font-medium mb-1 ${labelColorOnDark}`}
            >
              Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="tu.email@ejemplo.com"
              required
              className={`${inputTextColorOnDark} ${placeholderColorOnDark} ${inputBgOnDark} ${inputBorderOnDark} ${inputHoverStyles} ${inputFocusStyles} w-full py-2 px-3 rounded-md border text-base sm:text-lg`}
              errorMessage={errors.email}
              maxLength={254}
              aria-describedby="email-error"
            />
          </motion.div>

          {/* Error general */}
          {errors.general && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-2 text-red-400 text-sm sm:text-base font-medium p-2 rounded-md bg-red-900/30 border border-red-400/30"
            >
              {errors.general}
            </motion.div>
          )}
        </motion.div>

        {/* Botón de envío */}
        <motion.div
          className="mt-2 sm:mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.3 }}
        >
          <Button
            type="submit"
            variant="gradient"
            className="w-full py-3.5 px-6 text-xl font-bold rounded-2xl flex items-center justify-center gap-2"
            loading={isSubmitting}
            loadingText="Registrando..."
          >
            <PlayCircleIcon className="w-6 h-6" />
            Comenzar a Jugar
          </Button>
        </motion.div>
      </form>
    </div>
  );
}
