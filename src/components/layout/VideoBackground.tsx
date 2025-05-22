'use client';

import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function VideoBackground() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const videoSrc = '/videos/intro-loop.mp4';

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
      className="fixed inset-0 w-full h-full min-h-[100vh] min-w-[100vw] z-0 pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{
        opacity: isVideoLoaded ? 0.7 : 0,
        transition: { duration: 0.8, ease: "easeInOut" }
      }}
    >
      <video
        ref={videoRef}
        src={videoSrc}
        className="w-full h-full min-h-[100vh] min-w-[100vw] object-cover md:object-contain fixed inset-0"
        loop
        muted
        playsInline
        autoPlay
        preload="auto"
      />
    </motion.div>
  );
}
