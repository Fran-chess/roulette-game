"use client";
import { useState, FormEvent } from "react";
import { useGameStore } from "@/store/gameStore";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { UserPlusIcon } from "@heroicons/react/24/solid";
// [React Query] Importar hooks optimizados
import { useRegisterParticipant } from "@/hooks/api";

interface RegistrationFormProps {
  sessionId?: string;
  onPlayerRegistered?: (playerName?: string) => void;
}

export default function RegistrationForm({
  sessionId,
  onPlayerRegistered,
}: RegistrationFormProps) {
  const startPlaySession = useGameStore((state) => state.startPlaySession);
  const setGameState = useGameStore((state) => state.setGameState);
  const setCurrentParticipant = useGameStore((state) => state.setCurrentParticipant);
  const addToQueue = useGameStore((state) => state.addToQueue);
  const loadQueueFromDB = useGameStore((state) => state.loadQueueFromDB);

  // [React Query] Hook para registro optimizado
  const registerParticipantMutation = useRegisterParticipant();

  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    especialidad: "",
  });
  const [errors, setErrors] = useState<{
    nombre?: string;
    apellido?: string;
    email?: string;
    especialidad?: string;
    general?: string;
  }>({});


  // Handlers
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name as keyof typeof errors]) {
      setErrors({ ...errors, [e.target.name]: undefined });
    }
    if (errors.general) {
      setErrors({ ...errors, general: undefined });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};
    if (!formData.nombre || formData.nombre.trim() === "") {
      newErrors.nombre = "El nombre es obligatorio.";
    }
    if (!formData.email || formData.email.trim() === "") {
      newErrors.email = "El email es obligatorio.";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = "El formato del email no es válido.";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});
    if (!validateForm()) return;

    try {
      if (sessionId) {
        try {
          const verifyResponse = await fetch(
            `/api/session/verify?sessionId=${sessionId}`
          );
          if (!verifyResponse.ok) {
            const verifyData = await verifyResponse.json();
            throw new Error(verifyData.message || "Sesión no disponible");
          }
          await verifyResponse.json();
          // **REMOVIDO**: Esta verificación impedía que se ejecutara el sistema de cola
          // if (
          //   sessionData.data &&
          //   sessionData.data.status === "player_registered" &&
          //   sessionData.data.nombre &&
          //   sessionData.data.email
          // ) {
          //   if (onPlayerRegistered) {
          //     onPlayerRegistered(sessionData.data.nombre);
          //     return;
          //   }
          // }
        } catch (verifyError: Error | unknown) {
          setErrors({
            general: `Error al verificar la sesión: ${
              verifyError instanceof Error ? verifyError.message : "Error desconocido"
            }`,
          });
          return;
        }
        
        // [React Query] Usar la mutación optimizada para registro
        const data = await registerParticipantMutation.mutateAsync({
          sessionId,
          nombre: formData.nombre,
          apellido: formData.apellido,
          email: formData.email,
        });

        // Usar sistema de cola automáticamente
        if (data.participant) {
          // [FIX] Verificar estado del currentParticipant y limpiar si es necesario
          const currentStore = useGameStore.getState();
          
          // Si hay un participante activo pero está en estado "completed" o es diferente al que se registra
          if (currentStore.currentParticipant) {
            // Si es el mismo participante, limpiar para re-registro
            if (currentStore.currentParticipant.email === data.participant.email) {
              setCurrentParticipant(null);
              setGameState('waiting');
              await new Promise(resolve => setTimeout(resolve, 100));
            }
            // Si es diferente participante pero parece estar "atorado", también limpiar
            else if (currentStore.gameState === 'waiting') {
              setCurrentParticipant(null);
              await new Promise(resolve => setTimeout(resolve, 100));
            }
          }
          
          // Cargar cola actual desde BD
          if (sessionId) {
            await loadQueueFromDB(sessionId);
          }
          
          // Agregar participante a cola (esto activará automáticamente si no hay participante activo)
          await addToQueue(data.participant);
        }

        await new Promise((resolve) => setTimeout(resolve, 500));
        if (onPlayerRegistered) {
          onPlayerRegistered(formData.nombre.trim());
        } else {
          setGameState("inGame");
        }
      } else {
        await startPlaySession(
          {
            nombre: formData.nombre.trim(),
            apellido: formData.apellido.trim() || undefined,
            email: formData.email.trim(),
            especialidad: formData.especialidad.trim() || undefined,
          },
          () => setGameState("inGame"),
          (error) => {
            setErrors({
              general:
                error instanceof Error ? error.message : "Error al registrar. Inténtalo de nuevo.",
            });
          }
        );
      }
    } catch (error: Error | unknown) {
      setErrors({
        general:
          error instanceof Error ? error.message : "Ocurrió un error inesperado. Por favor, inténtalo de nuevo.",
      });
    }
  };

  // --- UI ---
  return (
    <div className="flex flex-col justify-center w-full h-full p-6 rounded-2xl bg-slate-900/20 text-white shadow-2xl">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col space-y-4 w-full max-w-md mx-auto"
      >
        {/* Nombre */}
        <div>
          <label
            htmlFor="nombre"
            className="block text-base font-medium mb-1 text-gray-300"
          >
            Nombre *
          </label>
          <Input
            id="nombre"
            name="nombre"
            type="text"
            value={formData.nombre}
            onChange={handleChange}
            placeholder="Tu nombre"
            required
            className="text-gray-100 placeholder-gray-400 bg-black/30 border-gray-500 focus:border-teal-400 focus:ring-1 focus:ring-teal-400 w-full py-2.5 px-3 text-base rounded-md border"
            errorMessage={errors.nombre}
            maxLength={100}
            aria-describedby="nombre-error"
          />
        </div>

        {/* Apellido */}
        <div>
          <label
            htmlFor="apellido"
            className="block text-base font-medium mb-1 text-gray-300"
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
            className="text-gray-100 placeholder-gray-400 bg-black/30 border-gray-500 focus:border-teal-400 focus:ring-1 focus:ring-teal-400 w-full py-2.5 px-3 text-base rounded-md border"
            errorMessage={errors.apellido}
            maxLength={100}
            aria-describedby="apellido-error"
          />
        </div>

        {/* Especialidad */}
        <div>
          <label
            htmlFor="especialidad"
            className="block text-base font-medium mb-1 text-gray-300"
          >
            Especialidad
          </label>
          <div className="relative">
            <select
              id="especialidad"
              name="especialidad"
              value={formData.especialidad}
              onChange={handleChange}
              className="text-gray-100 bg-black/30 border-gray-500 focus:border-teal-400 focus:ring-1 focus:ring-teal-400 w-full py-2.5 px-3 text-base rounded-md border appearance-none cursor-pointer focus:outline-none"
              aria-describedby="especialidad-error"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundPosition: 'right 0.5rem center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '1.5em 1.5em'
              }}
            >
              <option value="" className="bg-slate-800 text-gray-300 py-2 px-3 text-base">
                Selecciona tu especialidad
              </option>
              <option value="Médico" className="bg-slate-800 text-gray-100 py-2 px-3 text-base">
                Médico
              </option>
              <option value="Médico especialista" className="bg-slate-800 text-gray-100 py-2 px-3 text-base">
                Médico especialista
              </option>
              <option value="Enfermero" className="bg-slate-800 text-gray-100 py-2 px-3 text-base">
                Enfermero
              </option>
              <option value="Psicólogo" className="bg-slate-800 text-gray-100 py-2 px-3 text-base">
                Psicólogo
              </option>
              <option value="Terapista ocupacional" className="bg-slate-800 text-gray-100 py-2 px-3 text-base">
                Terapista ocupacional
              </option>
              <option value="Fonoaudiólogo" className="bg-slate-800 text-gray-100 py-2 px-3 text-base">
                Fonoaudiólogo
              </option>
            </select>
          </div>
          {/* Error especialidad */}
          {errors.especialidad && (
            <div className="error-message mt-2 text-red-400 text-sm">
              {errors.especialidad}
            </div>
          )}
        </div>

        {/* Email */}
        <div>
          <label
            htmlFor="email"
            className="block text-base font-medium mb-1 text-gray-300"
          >
            Email *
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="tu.email@ejemplo.com"
            required
            autoComplete="email"
            inputMode="email"
            className="text-gray-100 placeholder-gray-400 bg-black/30 border-gray-500 focus:border-teal-400 focus:ring-1 focus:ring-teal-400 w-full py-2.5 px-3 text-base rounded-md border"
            errorMessage={errors.email}
            maxLength={254}
            aria-describedby="email-error"
          />
        </div>

        {/* Error general */}
        {errors.general && (
          <div className="error-message text-red-400 text-sm font-medium p-2 rounded-md bg-red-900/30 border border-red-400/30">
            {errors.general}
          </div>
        )}

        {/* Botón */}
        <div className="w-full mt-4">
          <Button
            type="submit"
            variant="gradient"
            className="w-full py-3.5 px-6 text-lg font-bold rounded-xl flex items-center justify-center gap-2 min-h-[48px]"
            loading={registerParticipantMutation.isPending}
            loadingText="Registrando..."
            touchOptimized={true}
          >
            <UserPlusIcon className="w-6 h-6" />
            Registrar Participante
          </Button>
        </div>
      </form>
    </div>
  );
}
