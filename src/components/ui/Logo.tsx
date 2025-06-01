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
  // [modificación] Aumenté los valores de 'lg' para que el logo sea notablemente grande (simétrico con la ruleta y el botón).
  const sizesMap = {
    sm: { width: 200, height: 60 },   // Tamaño pequeño aumentado
    md: { width: 600, height: 180 },  // Tamaño mediano ultra grande
    lg: { width: 1200, height: 360 }, // Tamaño grande ultra optimizado (antes 800×240)
  };

  // Estado para manejar dimensiones responsivas si size='auto'
  const [dimensions, setDimensions] = useState(sizesMap.md);

  useEffect(() => {
    if (size !== "auto") return;

    const updateSize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isGameView = window.location.pathname.includes("/game/");

      // Detección específica para resolución 2160×3840 (portrait)
      const isUltraHighRes = width === 2160 && height === 3840;

      if (isUltraHighRes) {
        // [modificación] En TV vertical dedicamos un logo aún más grande
        if (isGameView) {
          setDimensions({ width: 800, height: 240 });   // Vista de juego → grande pero compacto
        } else {
          setDimensions({ width: 1200, height: 360 });  // Vista principal → súper grande
        }
      } else if (isGameView) {
        if (width < 640) {
          setDimensions({ width: 200, height: 60 });
        } else if (width < 768) {
          setDimensions({ width: 240, height: 72 });
        } else if (width < 1024) {
          setDimensions({ width: 280, height: 84 });
        } else {
          setDimensions({ width: 320, height: 96 });
        }
        // Si está en landscape, reducimos un poco
        if (width > height) {
          setDimensions((prev) => ({
            width: Math.round(prev.width * 0.85),
            height: Math.round(prev.height * 0.85),
          }));
        }
      } else {
        // En otras secciones (no juego), tamaños estándar optimizados para TV
        if (width < 640) {
          setDimensions({ width: 240, height: 72 });
        } else if (width < 768) {
          setDimensions({ width: 300, height: 90 });
        } else if (width < 1024) {
          setDimensions({ width: 400, height: 120 });
        } else if (width < 2560) {
          setDimensions({ width: 800, height: 240 });
        } else {
          setDimensions({ width: 1200, height: 360 });
        }
      }
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, [size]);

  const logoSize = size === "auto" ? dimensions : sizesMap[size];
  const safeWidth = logoSize?.width ?? 160;
  const safeHeight = logoSize?.height ?? 48;

  // [modificación] Clases de imagen reforzadas para resoluciones grandes
  const imageClasses = `w-auto h-auto ${withShadow ? "drop-shadow-2xl filter contrast-110 brightness-105" : ""}`;

  const logoContent = (
    <Image
      src="/images/8.svg"
      alt="Logo DarSalud"
      width={safeWidth}
      height={safeHeight}
      priority
      className={imageClasses}
      style={{
        // [modificación] Sombra más pronunciada en TV
        filter: withShadow
          ? 'drop-shadow(0 15px 30px rgba(0, 0, 0, 0.3)) contrast(110%) brightness(105%)'
          : 'contrast(110%) brightness(105%)',
        imageRendering: 'crisp-edges',
      }}
    />
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
