// src/lib/supabase-admin.ts
// IMPORTANTE: Este archivo SOLO debe ser importado en rutas /admin
// NUNCA importar este archivo en rutas /tv

import { createClient } from '@supabase/supabase-js';
import { tvProdLogger } from '@/utils/tvLogger';

// Verificación de variables de entorno para la conexión con Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Verificación más robusta de las variables requeridas para el cliente
if (!supabaseUrl || supabaseUrl.length < 10) {
  tvProdLogger.error('Error: NEXT_PUBLIC_SUPABASE_URL no está definida correctamente en las variables de entorno');
}

if (!supabaseAnonKey || supabaseAnonKey.length < 10) {
  tvProdLogger.error('Error: NEXT_PUBLIC_SUPABASE_ANON_KEY no está definida correctamente en las variables de entorno');
}

// Configuración optimizada para evitar múltiples instancias de GoTrueClient
const supabaseConfig = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    storageKey: 'roulette-game-admin-auth', // Clave única para administración
    flowType: 'implicit' as const,
  },
  global: {
    headers: {
      'x-application-name': 'roulette-game-admin'
    }
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
};

// Cliente singleton para uso en el lado del cliente (autenticación anónima) - SOLO ADMIN
let _supabaseAdminClient: ReturnType<typeof createClient> | null = null;

export const supabaseAdminClient = (() => {
  // Protección SSR: solo crear cliente en el navegador
  if (typeof window === 'undefined') {
    return null as unknown as ReturnType<typeof createClient>;
  }
  
  if (!_supabaseAdminClient) {
    _supabaseAdminClient = createClient(
      supabaseUrl || '',
      supabaseAnonKey || '',
      supabaseConfig
    );
    
    // Verificar que es la única instancia
    verifyAdminClientSingleton();
  }
  return _supabaseAdminClient;
})();

// Cliente con rol de servicio para operaciones administrativas en API Routes
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
          storageKey: 'roulette-game-admin-service-auth',
        }
      }
    );
  }
  return _supabaseAdmin;
})();

// Interfaz para errores de Supabase
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
    tvProdLogger.error(`Error de Supabase en ${context}:`, error);
  }
  return error;
}

// Función para verificar que solo hay una instancia activa
export function verifyAdminClientSingleton() {
  if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
    interface WindowWithSupabaseInstances extends Window {
      __supabaseAdminClientInstances?: number;
    }
    
    const windowWithInstances = window as WindowWithSupabaseInstances;
    const clientInstances = windowWithInstances.__supabaseAdminClientInstances || 0;
    windowWithInstances.__supabaseAdminClientInstances = clientInstances + 1;
    
    if (clientInstances > 0) {
      tvProdLogger.warn('⚠️ Detectada posible múltiple instanciación de Supabase admin client');
    }
  }
}

// Exportamos tipos básicos de Supabase
export type { SupabaseClient } from '@supabase/supabase-js'; 