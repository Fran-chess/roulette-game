import { useState, useEffect } from "react";

/**
 * Pantalla de carga inicial para la TV
 * Si la app tarda demasiado, ofrece un botón para recargar manualmente
 */
export default function LoadingScreen() {
  const [showRetry, setShowRetry] = useState(false);

  // Si la inicialización tarda >10 s, mostramos el botón «Reintentar»
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('⏱️ LoadingScreen: 10 segundos transcurridos, mostrando botón de reintentar');
      setShowRetry(true);
    }, 10_000);
    
    return () => {
      clearTimeout(timer);
    };
  }, []);

  const handleRetry = () => {
    console.log('🔄 LoadingScreen: Ejecutando recarga manual');
    // Recarga brutal: asegura limpiar cualquier estado colgado
    window.location.reload();
  };

  return (
    <main className="min-h-screen bg-main-gradient flex flex-col items-center justify-center select-none">
      {/* Ícono */}
      <div role="img" aria-label="Televisión" className="text-6xl mb-6">
        📺
      </div>

      {/* Título */}
      <h1 className="text-4xl font-bold text-white mb-4 text-center drop-shadow-2xl">
        Inicializando TV...
      </h1>

      {/* Indicador de carga */}
      <div
        className="flex items-center justify-center mb-8"
        role="progressbar"
        aria-label="Cargando"
      >
        <div className="w-3 h-3 bg-white rounded-full animate-pulse mr-2" />
        <div className="w-3 h-3 bg-white rounded-full animate-pulse mr-2" style={{ animationDelay: '0.2s' }} />
        <div className="w-3 h-3 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
      </div>

      {/* Botón Retry - Solo aparece después de 10 segundos */}
      {showRetry && (
        <button
          onClick={handleRetry}
          className="bg-white/20 backdrop-blur-md border border-white/30 px-8 py-3 rounded-xl text-white text-xl font-semibold
                     hover:bg-white/30 hover:border-white/50 hover:scale-105 
                     active:scale-95 transition-all duration-200 shadow-lg
                     focus:outline-none focus:ring-4 focus:ring-white/50"
          aria-label="Reintentar carga de la aplicación"
        >
          Reintentar ↻
        </button>
      )}

      {/* Texto invisible para accesibilidad */}
      <span className="sr-only">
        Sistema de TV inicializándose, por favor espere
        {showRetry && ". Botón de reintentar disponible"}
      </span>
    </main>
  );
} 