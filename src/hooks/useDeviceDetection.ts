"use client";

import { useState, useEffect } from "react";

export type DeviceType = 'mobile' | 'tablet' | 'tv' | 'desktop';

export interface DeviceInfo {
  type: DeviceType;
  isLandscape: boolean;
  isTabletPortrait: boolean;
  isTV65: boolean;
  dimensions: {
    width: number;
    height: number;
  };
}

export function useDeviceDetection(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    type: 'desktop',
    isLandscape: false,
    isTabletPortrait: false,
    isTV65: false,
    dimensions: { width: 0, height: 0 }
  });

  useEffect(() => {
    const detectDevice = () => {
      if (typeof window === 'undefined') return;
      
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isLandscape = width > height;
      
      // TV 65" detection
      const isTV65 = (width >= 2160 && height >= 3840) || (width >= 3840 && height >= 2160);
      
      // Device type detection
      let type: DeviceType = 'desktop';
      let isTabletPortrait = false;
      
      if (isTV65) {
        type = 'tv';
      } else if (width >= 768 && width <= 1200 && height > width && height >= 1000) {
        type = 'tablet';
        isTabletPortrait = true;
      } else if (width >= 600 && width <= 1279 && !isTV65) {
        type = 'tablet';
      } else if (width < 600) {
        type = 'mobile';
      }
      
      setDeviceInfo({
        type,
        isLandscape,
        isTabletPortrait,
        isTV65,
        dimensions: { width, height }
      });
    };
    
    detectDevice();
    window.addEventListener('resize', detectDevice);
    return () => window.removeEventListener('resize', detectDevice);
  }, []);

  return deviceInfo;
}