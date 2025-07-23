'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export default function ReactQueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Configuración por defecto para queries
            staleTime: 5 * 60 * 1000, // 5 minutos - datos considerados frescos
            gcTime: 10 * 60 * 1000, // 10 minutos - tiempo en cache (antes cacheTime)
            retry: (failureCount, error: Error) => {
              // No reintentar en errores 404 o 403
              const errorWithStatus = error as Error & { status?: number };
              if (errorWithStatus?.status === 404 || errorWithStatus?.status === 403) {
                return false;
              }
              // Reintentar máximo 3 veces para otros errores
              return failureCount < 3;
            },
            refetchOnWindowFocus: true, // Refrescar al enfocar ventana
            refetchOnReconnect: true, // Refrescar al reconectar
          },
          mutations: {
            // Configuración por defecto para mutations
            retry: false, // No reintentar mutations por defecto
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Mostrar DevTools solo en desarrollo */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools 
          initialIsOpen={false} 
          position="bottom"
        />
      )}
    </QueryClientProvider>
  );
}