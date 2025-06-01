import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useIsMounted } from '@/hooks/useIsMounted';
import { MotionDiv, AnimatePresence } from '../shared/MotionComponents';

/**
 * [modificación] Tipo para definir la estructura de cada imagen del carrusel
 */
interface CarouselImage {
  src: string;
  caption: string;
  alt: string;
  floatingText?: string; // [modificación] Texto flotante opcional
}

/**
 * Datos del carrusel de imágenes publicitarias
 * [modificación] Configuración actualizada - verificando todas las imágenes
 * 
 * 🔧 CONFIGURACIÓN DE CARDS FLOTANTES:
 * - Para agregar card flotante: incluir propiedad "floatingText" con el texto deseado
 * - Para NO mostrar card flotante: omitir la propiedad "floatingText" o dejarla undefined
 * - El texto aparecerá en una card azul posicionada en la parte inferior de la imagen
 */
const CAROUSEL_IMAGES: CarouselImage[] = [
  { 
    src: '/images/carrusel_tv/1.svg', 
    caption: 'Imagen publicitaria 1', 
    alt: 'Imagen publicitaria 1'
    // ❌ SIN card flotante (según especificación del usuario)
  },
  { 
    src: '/images/carrusel_tv/3.svg', 
    caption: 'Imagen publicitaria 3', 
    alt: 'Imagen publicitaria 3'
    // ❌ SIN card flotante (según especificación del usuario)
  },
  { 
    src: '/images/carrusel_tv/4.svg', 
    caption: 'Imagen publicitaria 4', 
    alt: 'Imagen publicitaria 4'
    // ❌ SIN card flotante (según especificación del usuario)
  },
  { 
    src: '/images/carrusel_tv/8.svg', 
    caption: 'Imagen publicitaria 8', 
    alt: 'Imagen publicitaria 8'
    // ❌ SIN card flotante (según especificación del usuario)
  }
  // [modificación] Verificadas las 4 imágenes: 1.svg, 3.svg, 4.svg, 8.svg
];

const CAROUSEL_INTERVAL = 4000; // [modificación] Ajustado a 4 segundos para dar tiempo suficiente de visualización

/**
 * Hook personalizado para manejar el carrusel de imágenes
 */
function useCarousel() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const isMounted = useIsMounted();

  useEffect(() => {
    if (!isMounted) return;
    
    // [modificación] Log para debugging del carrusel
    console.log(`🎠 Carrusel iniciado con ${CAROUSEL_IMAGES.length} imágenes, intervalo: ${CAROUSEL_INTERVAL}ms`);
    
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % CAROUSEL_IMAGES.length;
        // [modificación] Log para seguimiento del carrusel
        console.log(`🎠 Carrusel: ${prevIndex} → ${nextIndex} (${CAROUSEL_IMAGES[nextIndex].src})`);
        return nextIndex;
      });
    }, CAROUSEL_INTERVAL);

    return () => {
      console.log('🎠 Carrusel limpiado');
      clearInterval(interval);
    };
  }, [isMounted]);

  // [modificación] Log del estado actual
  useEffect(() => {
    if (isMounted) {
      console.log(`🎠 Estado actual: imagen ${currentImageIndex + 1}/${CAROUSEL_IMAGES.length} - ${CAROUSEL_IMAGES[currentImageIndex]?.src}`);
    }
  }, [currentImageIndex, isMounted]);

  return { currentImageIndex, totalImages: CAROUSEL_IMAGES.length };
}

/**
 * Componente del carrusel de imágenes
 * [modificación] Carrusel con cards estilo ventana cuadrada elegante para TV portrait 2160x3840
 */
function ImageCarousel({ currentIndex }: { currentIndex: number }) {
  const isMounted = useIsMounted();
  
  if (!isMounted) return null;

  const currentImage = CAROUSEL_IMAGES[currentIndex]; // [modificación] Obtener imagen actual para acceder a sus propiedades

  return (
    <section className="absolute inset-0 flex items-center justify-center z-20" aria-label="Carrusel publicitario">
      <AnimatePresence mode="wait">
        <MotionDiv
          key={currentIndex}
          initial={{ 
            opacity: 0, 
            scale: 1.05,
            filter: "blur(10px)"
          }}
          animate={{ 
            opacity: 1, 
            scale: 1,
            filter: "blur(0px)"
          }}
          exit={{ 
            opacity: 0, 
            scale: 0.95,
            filter: "blur(5px)"
          }}
          transition={{ 
            duration: 1.2,
            ease: [0.25, 0.46, 0.45, 0.94] // [modificación] Easing profesional y suave
          }}
          className="relative w-full h-full flex items-center justify-center"
        >
          {/* [modificación] Card estilo ventana cuadrada con proporciones más anchas y menos altas - tamaño aumentado */}
          <article className="relative w-10/12 max-w-7xl h-3/5 bg-white/95 backdrop-blur-sm rounded-2xl overflow-hidden z-30 tv-portrait:w-9/12 tv-portrait:h-1/2 tv-portrait:max-w-8xl tv-portrait:rounded-3xl shadow-[0_20px_60px_-12px_rgba(25,42,110,0.3),0_8px_25px_-8px_rgba(90,204,193,0.2),0_0_40px_rgba(64,192,239,0.15)] tv-portrait:shadow-[0_40px_120px_-20px_rgba(25,42,110,0.4),0_16px_50px_-12px_rgba(90,204,193,0.3),0_0_80px_rgba(64,192,239,0.25)]">
            {/* [modificación] Imagen centrada con padding optimizado para formato ventana */}
            <div className="w-full h-full flex items-center justify-center p-6 tv-portrait:p-10">
              <Image
                src={currentImage.src}
                alt={currentImage.alt}
                width={1800} // [modificación] Tamaño aumentado para cards más grandes
                height={1800}
                className="max-w-full max-h-full object-contain drop-shadow-[0_8px_16px_rgba(25,42,110,0.15)] tv-portrait:drop-shadow-[0_12px_24px_rgba(25,42,110,0.25)]"
                priority={currentIndex === 0} // [modificación] Prioridad para la primera imagen
                quality={100} // [modificación] Máxima calidad para pantalla TV portrait
              />
            </div>
            
            {/* [modificación] Overlay sutil con gradiente que complementa el fondo */}
            <div className="absolute inset-0 bg-gradient-to-br from-azul-intenso/2 via-transparent via-40% to-verde-salud/3 pointer-events-none rounded-2xl tv-portrait:rounded-3xl tv-portrait:from-azul-intenso/3 tv-portrait:to-verde-salud/4" />
            
            {/* [modificación] Borde interno sutil para mayor elegancia */}
            <div className="absolute inset-[1px] rounded-2xl tv-portrait:rounded-3xl border border-white/20 pointer-events-none" />
          </article>

          {/* [modificación] Efecto de resplandor de fondo adaptado para formato ventana más grande */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-11/12 h-4/5 rounded-full bg-gradient-to-r from-azul-intenso/10 via-verde-salud/10 to-celeste-medio/10 blur-3xl tv-portrait:w-10/12 tv-portrait:h-3/5 tv-portrait:blur-[100px]" />
          </div>
        </MotionDiv>
      </AnimatePresence>
    </section>
  );
}

/**
 * Indicadores de progreso del carrusel
 * [modificación] Indicadores optimizados para TV portrait 2160x3840
 */
function CarouselIndicators({ currentIndex, totalImages }: { currentIndex: number; totalImages: number }) {
  return (
    <MotionDiv
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.5, delay: 2 }}
      className="absolute bottom-16 left-1/2 transform -translate-x-1/2 z-30 tv-portrait:bottom-32"
      role="tablist"
      aria-label="Indicadores del carrusel"
    >
      <div className="flex space-x-8 bg-black/20 backdrop-blur-sm rounded-full px-8 py-4 tv-portrait:space-x-16 tv-portrait:px-16 tv-portrait:py-8 tv-portrait:backdrop-blur-md">
        {Array.from({ length: totalImages }).map((_, index) => (
          <MotionDiv
            key={index}
            role="tab"
            aria-selected={index === currentIndex}
            aria-label={`Imagen ${index + 1} de ${totalImages}`}
            className={`w-6 h-6 rounded-full transition-all duration-500 border-2 tv-portrait:w-12 tv-portrait:h-12 tv-portrait:border-4 ${
              index === currentIndex 
                ? 'bg-white border-white scale-125 shadow-lg tv-portrait:shadow-tv-lg' 
                : 'bg-white/30 border-white/50 hover:bg-white/50'
            }`}
            whileHover={{ 
              scale: window.innerWidth >= 2160 ? 1.3 : 1.4, // [modificación] Hover adaptado para TV
              transition: { duration: 0.2 }
            }}
            animate={{
              scale: index === currentIndex ? 1.25 : 1,
              backgroundColor: index === currentIndex ? '#ffffff' : 'rgba(255, 255, 255, 0.3)'
            }}
            transition={{ duration: 0.3 }}
          />
        ))}
      </div>
    </MotionDiv>
  );
}

/**
 * Pantalla de espera con carrusel autónomo de imágenes publicitarias
 * Se muestra cuando no hay sesiones activas
 * [modificación] Optimizada para TV portrait 2160x3840
 */
export default function WaitingScreen() {
  const { currentImageIndex, totalImages } = useCarousel();
  const isMounted = useIsMounted();

  // [modificación] Log para debugging cuando se muestra la pantalla de espera
  useEffect(() => {
    if (isMounted) {
      console.log('📺 WaitingScreen: Pantalla de espera montada - carrusel publicitario activo para TV portrait 2160x3840');
      console.log(`📺 WaitingScreen: ${totalImages} imágenes en carrusel con intervalo de ${CAROUSEL_INTERVAL}ms`);
    }
  }, [isMounted, totalImages]);

  if (!isMounted) {
    return null; // [modificación] Retornar null en lugar de LoadingScreen para evitar dependencia circular
  }

  return (
    <MotionDiv
      key="waiting-carousel"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative min-h-screen w-full bg-transparent overflow-hidden tv-portrait:min-h-screen"
      role="main"
      aria-label="Pantalla de espera optimizada para TV portrait"
    >
      {/* [modificación] Carrusel de imágenes principal optimizado para TV portrait */}
      <ImageCarousel currentIndex={currentImageIndex} />

      {/* [modificación] Indicadores de progreso del carrusel optimizados para TV portrait */}
      <CarouselIndicators currentIndex={currentImageIndex} totalImages={totalImages} />

      {/* [modificación] Información de debug solo en desarrollo */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-4 left-4 bg-black/50 text-white text-xs p-2 rounded tv-portrait:text-lg tv-portrait:p-4">
          TV Portrait Mode: {currentImageIndex + 1}/{totalImages} - {CAROUSEL_INTERVAL}ms
        </div>
      )}
    </MotionDiv>
  );
} 