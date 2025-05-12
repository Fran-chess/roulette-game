'use client';
import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion'; // Necesitas motion aquí

interface VideoBackgroundProps {
  videoSrc: string;
  isActive: boolean; 
}

export default function VideoBackground({ videoSrc, isActive }: VideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [retryCount, setRetryCount] = useState(0); // Para la lógica de reintento

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const handleCanPlay = () => {
      if (!isVideoLoaded) { // Solo setear una vez
          console.log("Video can play now, video is loaded.");
          setIsVideoLoaded(true);
      }
      // Intentar reproducir si está activo y cargado
      if (isActive) {
        videoElement.play().catch(error => console.error("Video play failed on canplay/isActive:", error));
      }
    };

    const handleError = (e: Event) => {
      console.error("Error loading video in VideoBackground:", e);
      if (retryCount < 3) {
        console.log(`Retrying video load (attempt ${retryCount + 1})`);
        setRetryCount(prev => prev + 1);
        setTimeout(() => videoElement.load(), 1000);
      }
    };

    videoElement.addEventListener('canplaythrough', handleCanPlay);
    videoElement.addEventListener('error', handleError);
    
    // Carga inicial
    if (!isVideoLoaded) { // Evitar llamar a load() innecesariamente si ya se cargó
        videoElement.load();
    }

    return () => {
      videoElement.removeEventListener('canplaythrough', handleCanPlay);
      videoElement.removeEventListener('error', handleError);
    };
  }, [videoSrc, retryCount, isActive, isVideoLoaded]); // isVideoLoaded en dependencias para re-evaluar play si cambia


  // Controlar play/pause basado en isActive, solo si el video ya está cargado
  useEffect(() => {
    const videoElement = videoRef.current;
    if (videoElement && isVideoLoaded) {
      if (isActive) {
        videoElement.play().catch(error => console.error("Video play failed on isActive change:", error));
      } else {
        videoElement.pause();
      }
    }
  }, [isActive, isVideoLoaded]);


  const backgroundVariants = {
    active: { 
      opacity: 1, 
      filter: 'blur(0px) brightness(1)',
      scale: 1,
      transition: { duration: 0.7, ease: "easeInOut" } 
    },
    inactive: { // Cuando el video debe estar "oculto" u "al fondo atenuado"
      opacity: 0, // Completamente transparente
      // filter: 'blur(8px) brightness(0.3)', // Opcional si quieres un efecto de blur al desvanecer
      // scale: 1.05, // Opcional
      transition: { duration: 0.7, ease: "easeInOut" }
    }
  };

  return (
    <motion.div
      className="fixed inset-0 w-full h-full z-0" // Siempre al fondo
      variants={backgroundVariants}
      initial={false} // Evitar animación al montar, isActive la controla
      animate={isActive ? "active" : "inactive"}
    >
      {/* Placeholder visual mientras el video carga, si es necesario */}
      {!isVideoLoaded && <div className="absolute inset-0 bg-black"></div>}
      
      <video
        ref={videoRef}
        src={videoSrc}
        className={`w-full h-full object-cover transition-opacity duration-300 ${isVideoLoaded ? 'opacity-100' : 'opacity-0'}`}
        loop
        muted
        playsInline
        preload="auto"
        // autoPlay se maneja mejor con el useEffect y la prop isActive
      />
    </motion.div>
  );
}