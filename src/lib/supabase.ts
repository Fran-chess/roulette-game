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

// [modificación] Configuración optimizada para evitar múltiples instancias de GoTrueClient
const supabaseConfig = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    // [modificación] Configuración específica para evitar múltiples instancias
    storageKey: 'roulette-game-auth', // Clave única para esta aplicación
    flowType: 'implicit' as const,
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
  // [modificación] Removido db.schema que causaba error de TypeScript
};

// [modificación] Cliente singleton para uso en el lado del cliente (autenticación anónima)
// Con protección SSR para evitar múltiples instancias en Next.js
let _supabaseClient: ReturnType<typeof createClient> | null = null;

export const supabaseClient = (() => {
  // [modificación] Protección SSR: solo crear cliente en el navegador
  if (typeof window === 'undefined') {
    // En SSR no creamos cliente, retornamos null pero con el tipo correcto
    return null as unknown as ReturnType<typeof createClient>;
  }
  
  if (!_supabaseClient) {
    _supabaseClient = createClient(
      supabaseUrl || '',
      supabaseAnonKey || '',
      supabaseConfig
    );
    
    // [modificación] Verificar que es la única instancia
    verifyClientSingleton();
  }
  return _supabaseClient;
})();

// [modificación] Cliente con rol de servicio para operaciones administrativas en API Routes
// IMPORTANTE: Este cliente NUNCA debe usarse en componentes del cliente, solo en API Routes
let _supabaseAdmin: ReturnType<typeof createClient> | null = null;

export const supabaseAdmin = (() => {
  if (!supabaseServiceRoleKey) {
    return null;
  }
  
  if (!_supabaseAdmin) {
    _supabaseAdmin = createClient(
      supabaseUrl || '', 
      supabaseServiceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          // [modificación] Configuración específica para admin
          storageKey: 'roulette-game-admin-auth',
        }
        // [modificación] Removido db.schema que causaba error de TypeScript
      }
    );
  }
  return _supabaseAdmin;
})();

// [modificación] Definiendo interfaz para errores de Supabase
export interface SupabaseError {
  message: string;
  status?: number;
  details?: string;
  hint?: string;
  code?: string;
}

/**
 * Función de ayuda para depurar errores de Supabase en desarrollo
 */
export function handleSupabaseError(error: Error | SupabaseError | unknown, context: string) {
  if (process.env.NODE_ENV !== 'production') {
    console.error(`Error de Supabase en ${context}:`, error);
  }
  return error;
}

// [modificación] Función para verificar que solo hay una instancia activa
export function verifyClientSingleton() {
  if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
    // [modificación] Verificar que no hay múltiples instancias con tipo específico
    interface WindowWithSupabaseInstances extends Window {
      __supabaseClientInstances?: number;
    }
    
    const windowWithInstances = window as WindowWithSupabaseInstances;
    const clientInstances = windowWithInstances.__supabaseClientInstances || 0;
    windowWithInstances.__supabaseClientInstances = clientInstances + 1;
    
    if (clientInstances > 0) {
      console.warn('⚠️ Detectada posible múltiple instanciación de Supabase client');
    }
  }
}

// [modificación] Exportamos tipos básicos de Supabase
export type { SupabaseClient } from '@supabase/supabase-js';
