'use client';

import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

/** Utility breakpoint used across components */
const MOBILE_MAX_WIDTH = 767;

export default function VideoBackground() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // Single video file used across breakpoints. The same path is reused so
  // different versions can be swapped in the future without touching the code.
  const videoSrc = '/videos/intro-loop.mp4';

  // Detect device size to adjust styles if needed
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width <= MOBILE_MAX_WIDTH);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const handleCanPlay = () => {
      if (!isVideoLoaded) setIsVideoLoaded(true);
      videoElement.play().catch(() => {});
    };

    const handleError = () => {
      if (retryCount < 3) {
        setRetryCount(prev => prev + 1);
        setTimeout(() => videoElement.load(), 1000);
      }
    };

    videoElement.addEventListener('canplaythrough', handleCanPlay);
    videoElement.addEventListener('error', handleError);

    if (!isVideoLoaded) videoElement.load();
    else videoElement.play().catch(() => {});

    return () => {
      videoElement.removeEventListener('canplaythrough', handleCanPlay);
      videoElement.removeEventListener('error', handleError);
    };
  }, [retryCount, isVideoLoaded]);

  return (
    <motion.div
      className={`fixed inset-0 w-full h-full z-0 pointer-events-none ${
        isMobile ? 'min-h-[100dvh] min-w-[100vw]' : 'min-h-[100vh] min-w-[100vw]'
      }`}
      initial={{ opacity: 0 }}
      animate={{
        opacity: isVideoLoaded ? 0.7 : 0,
        transition: { duration: 0.8, ease: "easeInOut" }
      }}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-cover fixed inset-0"
        loop
        muted
        playsInline
        autoPlay
        preload="auto"
      >
        {/* Same video for all sources for now, but structured for future improvements */}
        <source src={videoSrc} media="(min-width: 1281px)" />
        <source src={videoSrc} media="(min-width: 768px) and (max-width: 1280px)" />
        <source src={videoSrc} media="(max-width: 767px)" />
      </video>
    </motion.div>
  );
}
