// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

// [modificación] Verificación de variables de entorno para la conexión con Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// [modificación] Verificación más robusta de las variables requeridas para el cliente
if (!supabaseUrl || supabaseUrl.length < 10) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL no está definida correctamente en las variables de entorno');
}

if (!supabaseAnonKey || supabaseAnonKey.length < 10) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_ANON_KEY no está definida correctamente en las variables de entorno');
}

// [modificación] Cliente para uso en el lado del cliente (autenticación anónima)
// Con mejor manejo de errores y opciones adicionales
export const supabaseClient = createClient(
  supabaseUrl || '',
  supabaseAnonKey || '',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false
    },
    global: {
      headers: {
        'x-application-name': 'roulette-game'
      }
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  }
);

// [modificación] Cliente con rol de servicio para operaciones administrativas en API Routes
// IMPORTANTE: Este cliente NUNCA debe usarse en componentes del cliente, solo en API Routes
export const supabaseAdmin = supabaseServiceRoleKey 
  ? createClient(
      supabaseUrl || '', 
      supabaseServiceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
  : null;

// [modificación] Función de ayuda para depurar errores de Supabase en desarrollo
export function handleSupabaseError(error: any, context: string) {
  if (process.env.NODE_ENV !== 'production') {
    console.error(`Error de Supabase en ${context}:`, error);
  }
  return error;
}

// [modificación] Exportamos tipos básicos de Supabase
export type { SupabaseClient } from '@supabase/supabase-js';