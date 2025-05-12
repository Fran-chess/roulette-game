// src/components/AdminRegistrationForm.tsx
"use client";

import { useState, FormEvent, useEffect } from "react";
import { supabaseAdmin } from "@/lib/supabase"; // This should be used in an API route, not directly in client component for security.
// For direct client-side admin actions (if policies allow, or for a trusted admin panel), supabaseClient can be used.
// Let's assume for now this admin panel is secure or uses an API route for actual DB operations.
import { supabaseClient } from "@/lib/supabase"; // Using supabaseClient for simplicity here, but API route is better.
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

// Define the structure of the data to be saved
interface AdminFormData {
  session_id: string;
  nombre: string;
  apellido: string;
  email: string;
}

// Props for the component, e.g., if we need to pre-fill a session ID
interface AdminRegistrationFormProps {
  initialSessionId?: string;
}

export default function AdminRegistrationForm({
  initialSessionId = "",
}: AdminRegistrationFormProps) {
  const [formData, setFormData] = useState<AdminFormData>({
    session_id: initialSessionId,
    nombre: "",
    apellido: "",
    email: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialSessionId) {
      setFormData((prev) => ({ ...prev, session_id: initialSessionId }));
    }
  }, [initialSessionId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null); // Clear error on new input
    setSuccessMessage(null); // Clear success message
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    if (!formData.session_id || !formData.nombre || !formData.email) {
      setError("Session ID, Nombre y Email son obligatorios.");
      setIsSubmitting(false);
      return;
    }

    try {
      // Check if a record for this session_id already exists
      const { data: existingData, error: fetchError } = await supabaseClient
        .from("registrations")
        .select("id")
        .eq("session_id", formData.session_id)
        .single(); // Use single() if you expect at most one record

      if (fetchError && fetchError.code !== "PGRST116") {
        // PGRST116: no rows found, which is fine for insert
        throw fetchError;
      }

      let responseError;
      if (existingData) {
        // Update existing record
        const { error: updateError } = await supabaseClient
          .from("registrations")
          .update({
            nombre: formData.nombre,
            apellido: formData.apellido,
            email: formData.email,
            status: "data_entered_by_admin", // Update status
            admin_updated_at: new Date().toISOString(),
          })
          .eq("session_id", formData.session_id);
        responseError = updateError;
      } else {
        // Insert new record
        const { error: insertError } = await supabaseClient
          .from("registrations")
          .insert([
            {
              session_id: formData.session_id,
              nombre: formData.nombre,
              apellido: formData.apellido,
              email: formData.email,
              status: "data_entered_by_admin",
              admin_updated_at: new Date().toISOString(),
              // created_at will be set by default in Supabase or by trigger
            },
          ]);
        responseError = insertError;
      }

      if (responseError) {
        throw responseError;
      }

      setSuccessMessage(
        "Datos guardados correctamente. El usuario debería verlos en su pantalla."
      );
      // Optionally clear form or keep data for further edits
      // setFormData({ session_id: formData.session_id, nombre: '', apellido: '', email: '' });
    } catch (err: any) {
      console.error("Error saving registration data:", err);
      setError(`Error al guardar: ${err.message || "Error desconocido"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmAndStart = async () => {
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    if (!formData.session_id) {
      setError("Se requiere un ID de Sesión para confirmar.");
      setIsSubmitting(false);
      return;
    }
    try {
      const { error: confirmError } = await supabaseClient
        .from("registrations")
        .update({
          status: "confirmed_by_admin",
          admin_updated_at: new Date().toISOString(),
        })
        .eq("session_id", formData.session_id);
      if (confirmError) throw confirmError;
      setSuccessMessage(
        "¡Usuario confirmado! El juego debería iniciar para el participante."
      );
    } catch (err: any) {
      console.error("Error confirming user:", err);
      setError(`Error al confirmar: ${err.message || "Error desconocido"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 bg-slate-700 rounded-lg shadow-md text-white w-full max-w-md mx-auto mt-10">
      <h2 className="text-xl font-semibold mb-4 text-center">
        Panel de Administrador - Registro de Usuario
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="ID de Sesión del Stand"
          name="session_id"
          value={formData.session_id}
          onChange={handleChange}
          placeholder="Ej: stand1_active_user"
          className="bg-slate-600 border-slate-500"
          labelClassName="text-slate-300"
          required
        />
        <Input
          label="Nombre del Participante"
          name="nombre"
          value={formData.nombre}
          onChange={handleChange}
          className="bg-slate-600 border-slate-500"
          labelClassName="text-slate-300"
          required
        />
        <Input
          label="Apellido del Participante (Opcional)"
          name="apellido"
          value={formData.apellido}
          onChange={handleChange}
          className="bg-slate-600 border-slate-500"
          labelClassName="text-slate-300"
        />
        <Input
          label="Email del Participante"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          className="bg-slate-600 border-slate-500"
          labelClassName="text-slate-300"
          required
        />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        {successMessage && (
          <p className="text-green-400 text-sm">{successMessage}</p>
        )}
        <div className="flex space-x-3 pt-2">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-sky-600 hover:bg-sky-700"
          >
            {isSubmitting ? "Guardando..." : "Guardar Datos"}
          </Button>
          <Button
            type="button"
            onClick={handleConfirmAndStart}
            disabled={isSubmitting || !formData.session_id}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
          >
            {isSubmitting ? "Confirmando..." : "Confirmar e Iniciar Juego"}
          </Button>
        </div>
      </form>
      <p className="text-xs text-slate-400 mt-4">
        Nota: El administrador debe ingresar el ID de sesión que se muestra en
        la pantalla del participante. Al guardar, los datos se reflejarán en
        tiempo real. Al confirmar, el juego iniciará para el participante.
      </p>
    </div>
  );
}
