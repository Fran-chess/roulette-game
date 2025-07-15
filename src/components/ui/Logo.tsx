"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";

interface LogoProps {
  /** Tamaño del logo: 'sm' (pequeño), 'md' (mediano), 'lg' (grande) o 'auto' (responsivo automático) */
  size?: "sm" | "md" | "lg" | "auto";
  /** Variante del logo que controla la prominencia visual */
  variant?: "default" | "subtle" | "minimal" | "watermark";
  /** Controla si el logo tiene animación de entrada */
  animated?: boolean;
  /** Clase CSS adicional para el contenedor */
  className?: string;
  /** Controla si se mostrará sombra debajo del logo */
  withShadow?: boolean;
}

const Logo = ({
  size = "auto",
  variant = "default",
  animated = true,
  className = "",
  withShadow = true,
}: LogoProps) => {
  // Estados para dimensiones
  const [dimensions, setDimensions] = useState({ width: 200, height: 60 });

  useEffect(() => {
    const updateSize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      if (size !== "auto") {
        // Tamaños base que se ajustan según la variante - OPTIMIZADOS PARA EL TAMAÑO DESEADO
        const baseSizesMap = {
          sm: { width: 160, height: 48 },  
          md: { width: 240, height: 72 },  
          lg: { width: 400, height: 200 }, // AJUSTADO: 400px x 200px como quiere el usuario
        };
        
        let newDimensions = baseSizesMap[size];
        
        // Ajustar tamaños según la variante - MUCHO MENOS AGRESIVOS para aprovechar espacio
        if (variant === "subtle") {
          newDimensions = {
            width: Math.round(newDimensions.width * 0.92),  
            height: Math.round(newDimensions.height * 0.92)
          };
        } else if (variant === "minimal") {
          newDimensions = {
            width: Math.round(newDimensions.width * 0.85),  
            height: Math.round(newDimensions.height * 0.85)
          };
        } else if (variant === "watermark") {
          newDimensions = {
            width: Math.round(newDimensions.width * 0.75),   
            height: Math.round(newDimensions.height * 0.75)
          };
        }
        
        setDimensions(newDimensions);
        return;
      }

      // Lógica responsiva para tamaño automático con ajustes por variante 
      let baseDimensions;
      if (width >= 2160 && height >= 3840) {
        // TV65 - Incrementado muy significativamente para aprovechar espacio
        baseDimensions = { width: 600, height: 180 };
      } else if (width >= 768 && width <= 1200 && height > width) {
        // Tablet Portrait - AJUSTADO: 400px x 200px como quiere el usuario
        baseDimensions = { width: 400, height: 200 };
      } else if (width < 768) {
        // Mobile - Incrementado considerablemente
        baseDimensions = { width: 220, height: 66 };
      } else {
        // Desktop/otros - Incrementado significativamente
        baseDimensions = { width: 380, height: 114 };
      }
      
      // Aplicar modificadores de variante - MUCHO MENOS AGRESIVOS para aprovechar espacio
      let newDimensions = baseDimensions;
      if (variant === "subtle") {
        newDimensions = {
          width: Math.round(baseDimensions.width * 0.92),  
          height: Math.round(baseDimensions.height * 0.92)
        };
      } else if (variant === "minimal") {
        newDimensions = {
          width: Math.round(baseDimensions.width * 0.85),  
          height: Math.round(baseDimensions.height * 0.85)
        };
      } else if (variant === "watermark") {
        newDimensions = {
          width: Math.round(baseDimensions.width * 0.75),   
          height: Math.round(baseDimensions.height * 0.75)
        };
      }
      
      setDimensions(newDimensions);
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, [size, variant]);

  // Determinar clases CSS basadas en la variante
  const getVariantClasses = () => {
    switch (variant) {
      case "subtle":
        return "logo-variant-subtle";
      case "minimal":
        return "logo-variant-minimal";
      case "watermark":
        return "logo-variant-watermark";
      default:
        return "opacity-100";
    }
  };

  // Ajustar sombra según variante
  const getShadowClass = () => {
    if (!withShadow) return "";
    
    switch (variant) {
      case "subtle":
        return "drop-shadow-md";
      case "minimal":
        return "drop-shadow-sm";
      case "watermark":
        return "drop-shadow-sm";
      default:
        return "drop-shadow-lg";
    }
  };

  // Componente del logo
  const logoContent = (
    <Image
      src="/images/8.svg"
      alt="Logo DarSalud"
      width={dimensions.width}
      height={dimensions.height}
      priority
      className={`
        object-contain transition-all duration-300 ease-out
        ${getShadowClass()}
        ${getVariantClasses()}
      `}
      style={{
        width: `${dimensions.width}px`,
        height: `${dimensions.height}px`,
      }}
    />
  );

  if (animated) {
    // CORREGIDO: Ajustar animación según variante con tipos correctos
    const animationProps = variant === "watermark" || variant === "minimal" 
      ? { duration: 0.5, ease: "easeInOut" as const } 
      : { duration: 0.8, type: "spring" as const, stiffness: 120 };

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={animationProps}
        className={`logo-responsive ${className}`}
      >
        {logoContent}
      </motion.div>
    );
  }

  return (
    <div className={`logo-responsive ${className}`}>
      {logoContent}
    </div>
  );
};

export default Logo;
