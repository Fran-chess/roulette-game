import { useIsMounted } from '@/hooks/useIsMounted';
import { MotionDiv } from '../shared/MotionComponents';
import LoadingScreen from './LoadingScreen';

interface InvitationScreenProps {
  currentTime: Date | null;
}

/**
 * Datos de las características del juego
 */
const GAME_FEATURES = [
  { icon: '❓', title: 'Preguntas desafiantes', description: 'Pon a prueba tus conocimientos' },
  { icon: '🏆', title: 'Premios increíbles', description: 'Gana premios fantásticos' },
  { icon: '⚡', title: 'Acción en tiempo real', description: 'Experiencia interactiva' }
];

/**
 * Componente de características del juego
 */
function GameFeatures() {
  return (
    <section className="bg-gray-100 rounded-2xl p-12 mt-12">
      <h3 className="text-4xl font-semibold text-gray-800 mb-8 text-center">
        ¿Por qué elegirnos?
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-gray-700">
        {GAME_FEATURES.map((feature, index) => (
          <article key={index} className="text-center">
            <div className="text-6xl mb-4" role="img" aria-label={feature.title}>
              {feature.icon}
            </div>
            <h4 className="text-2xl font-semibold">{feature.title}</h4>
          </article>
        ))}
      </div>
    </section>
  );
}

/**
 * Pantalla de invitación cuando hay registro abierto
 * Se muestra cuando un jugador se ha registrado y está esperando comenzar
 */
export default function InvitationScreen({ currentTime }: InvitationScreenProps) {
  const isMounted = useIsMounted();

  if (!isMounted) {
    return <LoadingScreen />;
  }

  return (
    <MotionDiv
      key="invitation"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="flex flex-col items-center justify-center min-h-screen text-center px-8 bg-black"
      role="main"
      aria-label="Pantalla de invitación al juego"
    >
      {/* [modificación] Título principal optimizado para 3060x2160 */}
      <MotionDiv
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="mb-16"
      >
        <header>
          <h1 className="text-8xl font-bold text-white mb-8">
            ¡Únete al Juego!
          </h1>
          <p className="text-4xl text-blue-200">
            DarSalud - Experiencia Interactiva
          </p>
        </header>
      </MotionDiv>

      {/* [modificación] Card de invitación con background blanco y tamaño optimizado para 3060x2160 */}
      <MotionDiv
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="bg-white rounded-3xl p-20 max-w-7xl w-full shadow-2xl"
      >
        <article className="space-y-12">
          {/* [modificación] Icono animado del juego más grande */}
          <MotionDiv
            animate={{ 
              scale: [1, 1.05, 1],
              rotate: [0, 2, -2, 0]
            }}
            transition={{ 
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="text-9xl mb-12"
            role="img"
            aria-label="Icono de videojuego"
          >
            🎮
          </MotionDiv>

          <header>
            <h2 className="text-6xl font-bold text-gray-800 mb-8">
              Acércate a la Tablet
            </h2>
          </header>
          
          <p className="text-3xl text-gray-700 leading-relaxed max-w-5xl mx-auto">
            Regístrate con el administrador para participar en nuestro 
            emocionante juego de conocimientos
          </p>

          {/* [modificación] Características del juego */}
          <GameFeatures />
        </article>
      </MotionDiv>

      {/* [modificación] Tiempo actual con mejor contraste */}
      <MotionDiv
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        className="mt-12 text-white/60 text-2xl"
      >
        <time dateTime={currentTime?.toISOString()} aria-label="Hora actual">
          {currentTime?.toLocaleTimeString('es-ES') || 'N/A'}
        </time>
      </MotionDiv>
    </MotionDiv>
  );
} 