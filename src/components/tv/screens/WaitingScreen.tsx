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
 * [modificación] Configuración actualizada - eliminadas imágenes 2.svg y 6.svg
 * 
 * 🔧 CONFIGURACIÓN DE CARDS FLOTANTES:
 * - Para agregar card flotante: incluir propiedad "floatingText" con el texto deseado
 * - Para NO mostrar card flotante: omitir la propiedad "floatingText" o dejarla undefined
 * - El texto aparecerá en una card azul posicionada en la parte inferior de la imagen
 */
const CAROUSEL_IMAGES: CarouselImage[] = [
  { 
    src: '/images/carrusel_tv/4.svg', 
    caption: 'Imagen publicitaria', 
    alt: 'Imagen publicitaria 1'
    // ❌ SIN card flotante (según especificación del usuario)
  },
  { 
    src: '/images/carrusel_tv/8.svg', 
    caption: 'Imagen publicitaria', 
    alt: 'Imagen publicitaria 2'
    // ❌ SIN card flotante (según especificación del usuario)
  }
  // [modificación] Eliminadas imágenes 2.svg y 6.svg según solicitud del usuario
  // [modificación] Eliminada imagen 7.svg según especificación anterior del usuario
];

const CAROUSEL_INTERVAL = 8000; // [modificación] Intervalo más largo para experiencia fullscreen (8 segundos)

/**
 * Hook personalizado para manejar el carrusel de imágenes
 */
function useCarousel() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const isMounted = useIsMounted();

  useEffect(() => {
    if (!isMounted) return;
    
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        (prevIndex + 1) % CAROUSEL_IMAGES.length
      );
    }, CAROUSEL_INTERVAL);

    return () => clearInterval(interval);
  }, [isMounted]);

  return { currentImageIndex, totalImages: CAROUSEL_IMAGES.length };
}

/**
 * Componente del carrusel de imágenes
 * [modificación] Carrusel con tamaño de card ampliada y márgenes verticales
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
          {/* [modificación] Card más visible con márgenes reducidos y z-index alto */}
          <article className="relative w-11/12 max-w-6xl h-4/5 bg-white rounded-3xl shadow-2xl overflow-hidden z-30">
            {/* [modificación] Imagen optimizada dentro de la card ampliada */}
            <div className="w-full h-full flex items-center justify-center p-8">
              <Image
                src={currentImage.src}
                alt={currentImage.alt}
                width={1400}
                height={1400}
                className="max-w-full max-h-full object-contain drop-shadow-lg"
                priority={currentIndex === 0} // [modificación] Prioridad para la primera imagen
                quality={100} // [modificación] Máxima calidad para pantalla 65"
              />
            </div>
            
            {/* [modificación] Overlay sutil para mejorar la transición */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/2 via-transparent to-black/2 pointer-events-none rounded-3xl" />
          </article>
        </MotionDiv>
      </AnimatePresence>
    </section>
  );
}

/**
 * Indicadores de progreso del carrusel
 * [modificación] Indicadores optimizados para pantalla fullscreen 65"
 */
function CarouselIndicators({ currentIndex, totalImages }: { currentIndex: number; totalImages: number }) {
  return (
    <MotionDiv
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.5, delay: 2 }}
      className="absolute bottom-16 left-1/2 transform -translate-x-1/2 z-30"
      role="tablist"
      aria-label="Indicadores del carrusel"
    >
      <div className="flex space-x-8 bg-black/20 backdrop-blur-sm rounded-full px-8 py-4">
        {Array.from({ length: totalImages }).map((_, index) => (
          <MotionDiv
            key={index}
            role="tab"
            aria-selected={index === currentIndex}
            aria-label={`Imagen ${index + 1} de ${totalImages}`}
            className={`w-6 h-6 rounded-full transition-all duration-500 border-2 ${
              index === currentIndex 
                ? 'bg-white border-white scale-125 shadow-lg' 
                : 'bg-white/30 border-white/50 hover:bg-white/50'
            }`}
            whileHover={{ scale: 1.3 }}
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
 */
export default function WaitingScreen() {
  const { currentImageIndex, totalImages } = useCarousel();
  const isMounted = useIsMounted();

  // [modificación] Log para debugging cuando se muestra la pantalla de espera
  useEffect(() => {
    if (isMounted) {
      console.log('📺 WaitingScreen: Pantalla de espera montada - carrusel publicitario activo');
    }
  }, [isMounted]);

  if (!isMounted) {
    return null; // [modificación] Retornar null en lugar de LoadingScreen para evitar dependencia circular
  }

  return (
    <MotionDiv
      key="waiting-carousel"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative min-h-screen w-full bg-transparent overflow-hidden"
      role="main"
      aria-label="Pantalla de espera"
    >
      {/* [modificación] Carrusel de imágenes principal */}
      <ImageCarousel currentIndex={currentImageIndex} />

      {/* [modificación] Indicadores de progreso del carrusel */}
      <CarouselIndicators currentIndex={currentImageIndex} totalImages={totalImages} />
    </MotionDiv>
  );
} 