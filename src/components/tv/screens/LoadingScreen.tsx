/**
 * Pantalla de carga inicial para la TV
 * Se muestra mientras el componente se está montando o inicializando
 */
export default function LoadingScreen() {
  return (
    <main className="min-h-screen bg-black flex items-center justify-center">
      <section className="text-center" role="status" aria-live="polite">
        {/* [modificación] Icono de TV con semántica mejorada */}
        <div className="text-6xl mb-6" role="img" aria-label="Televisión">
          📺
        </div>
        
        {/* [modificación] Título principal con jerarquía semántica */}
        <h1 className="text-4xl font-bold text-white mb-4">
          Inicializando TV...
        </h1>
        
        {/* [modificación] Indicador de carga con mejor accesibilidad */}
        <div className="flex items-center justify-center" role="progressbar" aria-label="Cargando">
          <div className="w-3 h-3 bg-white rounded-full animate-pulse mr-2"></div>
          <div className="w-3 h-3 bg-white rounded-full animate-pulse delay-200 mr-2"></div>
          <div className="w-3 h-3 bg-white rounded-full animate-pulse delay-400"></div>
        </div>
        
        {/* [modificación] Texto de estado para lectores de pantalla */}
        <span className="sr-only">
          Sistema de TV inicializándose, por favor espere
        </span>
      </section>
    </main>
  );
} 