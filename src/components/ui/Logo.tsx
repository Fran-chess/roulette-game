"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";

interface LogoProps {
  /** Tamaño del logo: 'sm' (pequeño), 'md' (mediano), 'lg' (grande) o 'auto' (responsivo automático) */
  size?: "sm" | "md" | "lg" | "auto";
  /** Controla si el logo tiene animación de entrada */
  animated?: boolean;
  /** Clase CSS adicional para el contenedor */
  className?: string;
  /** Controla si se mostrará sombra debajo del logo */
  withShadow?: boolean;
}

const Logo = ({
  size = "auto",
  animated = true,
  className = "",
  withShadow = true,
}: LogoProps) => {
  // [RESPONSIVO] Usar clases responsivas de Tailwind en lugar de tamaños fijos
  const sizesMap = {
    sm: { width: 80, height: 24 },    // Muy reducido para mobile
    md: { width: 120, height: 36 },   // Tamaño base para tablet
    lg: { width: 160, height: 48 },   // Tamaño grande para desktop
  };

  // Estado para manejar dimensiones responsivas si size='auto'
  const [dimensions, setDimensions] = useState(sizesMap.sm); // Cambiar default a 'sm'

  useEffect(() => {
    if (size !== "auto") return;

    const updateSize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isGameView = window.location.pathname.includes("/game/");

      // [modificación] Detección específica corregida para resolución 2160×3840 (portrait y landscape)
      const isUltraHighRes = (width === 2160 && height === 3840) || (width === 3840 && height === 2160);
      
      // [NUEVO] Detección específica para tablet 800x1340
      const isTabletPortrait = 
      width >= 768 && width <= 1200 && 
      height > width && // Orientación vertical
      height >= 1000 && // Altura mínima para tablets
      !((width >= 2160 && height >= 3840) || (width >= 3840 && height >= 2160)); // Excluir TV65

      // [modificación] Debug SIMPLIFICADO para logo en desarrollo
      if (process.env.NODE_ENV === 'development') {
        if (isUltraHighRes) {
          console.log('🖼️ Logo TV65 detectada:', { width, height, isGameView });
        } else if (isTabletPortrait) {
          console.log('🖼️ Logo Tablet detectada - aplicando tamaños PEQUEÑOS:', { width, height, isGameView });
        }
      }

      if (isUltraHighRes) {
        // [modificación] En TV vertical dedicamos un logo aún más grande
        if (isGameView) {
          setDimensions({ width: 1000, height: 300 });   // [modificación] Vista de juego → más grande para visibilidad
        } else {
          setDimensions({ width: 1400, height: 420 });  // [modificación] Vista principal → súper grande
        }
      } else if (isTabletPortrait) {
        // [NUEVO] Tamaños MUCHO MÁS PEQUEÑOS para tablet
        if (isGameView) {
          setDimensions({ width: 180, height: 54 });   // Reducido de 400x120 a 180x54
        } else {
          setDimensions({ width: 200, height: 60 });   // Reducido de 500x150 a 200x60
        }
      } else if (isGameView) {
        // Tamaños para mobile y otras pantallas pequeñas
        if (width < 640) {
          setDimensions({ width: 140, height: 42 });  // Reducido
        } else if (width < 768) {
          setDimensions({ width: 160, height: 48 });  // Reducido
        } else if (width < 1024) {
          setDimensions({ width: 180, height: 54 });  // Reducido
        } else {
          setDimensions({ width: 200, height: 60 });  // Reducido
        }
        // Si está en landscape, reducimos un poco
        if (width > height) {
          setDimensions((prev) => ({
            width: Math.round(prev.width * 0.85),
            height: Math.round(prev.height * 0.85),
          }));
        }
      } else {
        // En otras secciones (no juego), tamaños pequeños para tablet
        if (width < 640) {
          setDimensions({ width: 160, height: 48 });
        } else if (width < 768) {
          setDimensions({ width: 180, height: 54 });
        } else if (width < 1024) {
          setDimensions({ width: 200, height: 60 });  // Muy reducido de 400x120
        } else if (width < 2560) {
          setDimensions({ width: 300, height: 90 });   // Muy reducido de 800x240
        } else {
          setDimensions({ width: 1200, height: 360 }); // Solo para TV muy grande
        }
      }
    };

    updateSize();
    
    // [modificación] Throttle mejorado
    let timeoutId: NodeJS.Timeout | null = null;
    const throttledUpdateSize = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(updateSize, 500);
    };
    
    window.addEventListener("resize", throttledUpdateSize);
    return () => {
      window.removeEventListener("resize", throttledUpdateSize);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [size]); // [modificación] Solo dependencia 'size'

  const logoSize = size === "auto" ? dimensions : sizesMap[size];
  const safeWidth = logoSize?.width ?? 120; // Reducido default
  const safeHeight = logoSize?.height ?? 36; // Reducido default

  // [RESPONSIVO] Clases de imagen con breakpoints responsivos
  const imageClasses = `
    w-16 h-16 
    sm:w-20 sm:h-20 
    md:w-24 md:h-24 
    lg:w-28 lg:h-28 
    xl:w-32 xl:h-32
    max-w-full max-h-full 
    object-contain
    ${withShadow ? "drop-shadow-sm md:drop-shadow-md lg:drop-shadow-lg" : ""}
  `;

  const logoContent = (
    <div className="w-full h-full max-w-[200px] md:max-w-[300px] lg:max-w-[400px] flex items-center justify-center">
      <Image
        src="/images/8.svg"
        alt="Logo DarSalud"
        width={safeWidth}
        height={safeHeight}
        priority
        className={imageClasses}
        style={{
          filter: withShadow
            ? 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1)) md:drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2)) lg:drop-shadow(0 8px 16px rgba(0, 0, 0, 0.3)) contrast(110%) brightness(105%)'
            : 'contrast(110%) brightness(105%)',
          imageRendering: 'crisp-edges',
        }}
      />
    </div>
  );

  if (animated) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, type: "spring", stiffness: 120 }}
        className={className}
      >
        {logoContent}
      </motion.div>
    );
  }

  return <div className={className}>{logoContent}</div>;
};

export default Logo;
