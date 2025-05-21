'use client';

import { motion } from 'framer-motion';
import Logo from '../ui/Logo';

export default function FullScreenModal() {
  return (
    <motion.div
      className="fixed inset-0 w-full h-full z-50 bg-main-gradient flex flex-col items-center justify-between py-20"
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{
        opacity: 1,
        scale: 1,
        transition: { duration: 0.5, ease: 'easeInOut' }
      }}
    >
      {/* Partículas decorativas */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {[...Array(35)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${Math.random() * 2 + 1.5}px`,
              height: `${Math.random() * 2 + 1.5}px`,
              top: `${Math.random() * 98}%`,
              left: `${Math.random() * 98}%`,
              background:
                i % 7 === 0
                  ? 'rgba(90,204,193,0.30)'
                  : i % 11 === 0
                  ? 'rgba(255,255,255,0.65)'
                  : i % 4 === 0
                  ? 'rgba(64,192,239,0.35)'
                  : 'rgba(255,255,255,0.20)',
              boxShadow: i % 5 === 0 ? '0 0 10px 2px #40c0ef44' : undefined,
              filter: i % 7 === 0 ? 'blur(1.5px)' : 'blur(0.5px)',
              zIndex: 0,
            }}
            animate={{
              opacity: [0.3, 1, 0.4],
              y: [0, Math.random() * 28 - 14, 0],
              x: [0, Math.random() * 12 - 6, 0],
              transition: {
                duration: 2.4 + Math.random() * 3.6,
                repeat: Infinity,
                delay: Math.random() * 2
              }
            }}
          />
        ))}
      </div>

      {/* Logo superior con el logo real de la empresa */}
      <div className="flex flex-col items-center relative z-10 mt-2">
        <motion.div
          className="w-24 h-24 rounded-full bg-cyan-300/30 flex items-center justify-center mb-4 shadow-lg"
          initial={{ scale: 0.92 }}
          animate={{
            scale: [0.92, 1.01, 0.98, 1],
            transition: { repeat: Infinity, duration: 4, ease: 'easeInOut' }
          }}
        >
          <Logo size="md" animated className="w-16 h-16" />
        </motion.div>
        <h1 className="text-4xl font-bold text-white font-marineBold drop-shadow">
          DarSalud
        </h1>
        <p className="text-white/80 mt-2 font-marineRegular">
          Internación Domiciliaria
        </p>
      </div>

      {/* Texto central */}
      <div className="text-center px-6 relative z-10">
        <h2 className="text-4xl font-bold text-white mb-6 drop-shadow-lg font-marineBold">
          ¿Cuánto sabes de Infectología?
        </h2>
        {/* Botón grande con animación */}
        <motion.div
          className="mt-8 bg-azul-intenso/60 backdrop-blur-xl rounded-xl p-8 text-white text-center border-2 border-white/30 shadow-xl btn-glow"
          whileHover={{
            scale: 1.03,
            boxShadow: "0 0 40px 10px #5accc1cc"
          }}
        >
          <p className="text-3xl font-bold font-marineBold tracking-wide animate-pulse">
            TOCA LA PANTALLA<br />PARA JUGAR
          </p>
        </motion.div>
      </div>

      {/* Ícono animado abajo */}
      <motion.div
        className="relative mb-4 z-10"
        initial={{ scale: 1 }}
        animate={{
          scale: [1, 1.13, 1],
          y: [0, -10, 0],
          transition: { repeat: Infinity, duration: 1.7, ease: "easeInOut" }
        }}
      >
        <div className="w-20 h-20 rounded-full border-2 border-dashed border-amarillo-ds flex items-center justify-center bg-black/5">
          <span className="text-amarillo-ds text-3xl animate-bounce">👆</span>
        </div>
      </motion.div>
    </motion.div>
  );
}
