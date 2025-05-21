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
  /** Si se define, el logo será un enlace que lleva a esta ruta */
  linkTo?: string;
  /** Controla si se mostrará sombra debajo del logo */
  withShadow?: boolean;
}

/**
 * Componente Logo reutilizable que maneja correctamente las diferentes versiones
 * del logo en toda la aplicación, con soporte para responsive design.
 */
const Logo = ({
  size = "auto",
  animated = true,
  className = "",
  linkTo,
  withShadow = true,
}: LogoProps) => {
  // [modificación] Dimensiones predefinidas para diferentes tamaños - versiones más compactas
  const sizesMap = {
    sm: { width: 60, height: 18 }, // [modificación] Reducido aún más para la vista de tablet
    md: { width: 160, height: 48 }, // Tamaño medio optimizado
    lg: { width: 200, height: 60 }, // Grande pero más compacto
  };

  // Estado para manejar dimensiones responsivas si size='auto'
  const [dimensions, setDimensions] = useState(sizesMap.md);

  // Efecto para ajustar el tamaño según el viewport si size='auto'
  useEffect(() => {
    if (size !== "auto") return;

    const updateSize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isGameView = window.location.pathname.includes("/game/");

      // [modificación] Detector de ruta de juego para aplicar dimensiones más ajustadas
      if (isGameView) {
        // En sección de juego usamos tamaños más compactos
        if (width < 640) {
          setDimensions({ width: 110, height: 33 }); // Móviles pequeños
        } else if (width < 768) {
          setDimensions({ width: 130, height: 40 }); // Móviles
        } else if (width < 1024) {
          setDimensions({ width: 150, height: 45 }); // Tablets
        } else {
          setDimensions({ width: 180, height: 55 }); // Desktops
        }

        // Ajuste adicional si es landscape en modo juego
        if (width > height) {
          setDimensions((prev) => ({
            width: Math.round(prev.width * 0.85),
            height: Math.round(prev.height * 0.85),
          }));
        }
      } else {
        // En otras secciones mantenemos tamaños estándar
        if (width < 640) {
          setDimensions({ width: 140, height: 42 });
        } else if (width < 768) {
          setDimensions({ width: 160, height: 48 });
        } else if (width < 1024) {
          setDimensions({ width: 180, height: 55 });
        } else if (width < 1280) {
          setDimensions({ width: 200, height: 60 });
        } else {
          setDimensions({ width: 220, height: 67 });
        }
      }
    };

    // Inicializar tamaño
    updateSize();

    // Actualizar tamaño al cambiar dimensiones de ventana
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, [size]);

  const logoSize = size === "auto" ? dimensions : sizesMap[size];
  const safeWidth = logoSize?.width ?? 160; // <= Fallback seguro
  const safeHeight = logoSize?.height ?? 48; // <= Fallback seguro
  const imageClasses = `w-auto h-auto ${withShadow ? "drop-shadow-lg" : ""}`;

  const logoContent = (
    <Image
      src="/images/8.svg"
      alt="Logo DarSalud"
      width={safeWidth}
      height={safeHeight}
      priority
      className={imageClasses}
    />
  );
  // Si es animado, envolvemos en un motion.div
  if (animated) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, type: "spring", stiffness: 100 }}
        className={className}
      >
        {logoContent}
      </motion.div>
    );
  }

  // Versión no animada
  return <div className={className}>{logoContent}</div>;
};

export default Logo;
