import { useEffect, useState } from 'react';
import { supabaseClient, checkSupabaseConnection } from '@/lib/supabase';

interface SupabaseHealthStatus {
  isConnected: boolean;
  hasMultipleInstances: boolean;
  connectionError: string | null;
  clientInitialized: boolean;
}

// [modificación] Interfaz para window con propiedades de Supabase
interface WindowWithSupabaseInstances extends Window {
  __supabaseClientInstances?: number;
}

// [modificación] Hook para monitorear la salud de Supabase y detectar múltiples instancias
export function useSupabaseHealth(): SupabaseHealthStatus {
  const [healthStatus, setHealthStatus] = useState<SupabaseHealthStatus>({
    isConnected: false,
    hasMultipleInstances: false,
    connectionError: null,
    clientInitialized: false,
  });

  useEffect(() => {
    // [modificación] Verificar el estado de la conexión
    const checkHealth = async () => {
      try {
        // Verificar que el cliente esté inicializado
        const clientInitialized = supabaseClient !== null && typeof supabaseClient === 'object';
        
        if (!clientInitialized) {
          setHealthStatus(prev => ({
            ...prev,
            clientInitialized: false,
            connectionError: 'Cliente de Supabase no inicializado',
          }));
          return;
        }

        // [modificación] Verificar múltiples instancias con tipo específico
        const multipleInstances = typeof window !== 'undefined' 
          ? (((window as WindowWithSupabaseInstances).__supabaseClientInstances || 0) > 1)
          : false;

        // [modificación] Probar conexión con una consulta simple
        const { error } = await supabaseClient
          .from('admin_users')
          .select('count')
          .limit(1);

        setHealthStatus({
          isConnected: !error,
          hasMultipleInstances: multipleInstances,
          connectionError: error?.message || null,
          clientInitialized: true,
        });

        // [modificación] Log en desarrollo
        if (process.env.NODE_ENV === 'development') {
          checkSupabaseConnection();
          
          if (multipleInstances) {
            console.warn('⚠️ useSupabaseHealth: Detectadas múltiples instancias de Supabase client');
          }
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        setHealthStatus(prev => ({
          ...prev,
          isConnected: false,
          connectionError: errorMessage,
        }));
      }
    };

    // [modificación] Verificar inmediatamente y luego cada 30 segundos
    checkHealth();
    const interval = setInterval(checkHealth, 30000);

    return () => clearInterval(interval);
  }, []);

  return healthStatus;
}

// [modificación] Hook simplificado para solo verificar múltiples instancias
export function useSupabaseInstanceCheck(): boolean {
  const [hasMultipleInstances, setHasMultipleInstances] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const windowWithInstances = window as WindowWithSupabaseInstances;
      const instances = windowWithInstances.__supabaseClientInstances || 0;
      setHasMultipleInstances(instances > 1);
      
      if (instances > 1 && process.env.NODE_ENV === 'development') {
        console.warn(`⚠️ Detectadas ${instances} instancias de Supabase client`);
      }
    }
  }, []);

  return hasMultipleInstances;
} 