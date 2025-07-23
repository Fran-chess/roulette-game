import React from 'react';
import { motion } from 'framer-motion';

interface LoadingSkeletonProps {
  className?: string;
  variant?: 'text' | 'card' | 'table' | 'avatar' | 'button';
  rows?: number;
  animated?: boolean;
}

export default function LoadingSkeleton({ 
  className = '', 
  variant = 'text', 
  rows = 1,
  animated = true 
}: LoadingSkeletonProps) {
  const baseClasses = `bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded ${className}`;
  
  const animationProps = animated ? {
    animate: {
      backgroundPosition: ['200% 0', '-200% 0'],
    },
    transition: {
      duration: 1.5,
      ease: 'linear' as const,
      repeat: Infinity,
    },
    style: {
      backgroundSize: '200% 100%',
    }
  } : {};

  const getVariantClasses = () => {
    switch (variant) {
      case 'text':
        return 'h-4 w-full rounded';
      case 'card':
        return 'h-32 w-full rounded-lg';
      case 'table':
        return 'h-12 w-full rounded-md';
      case 'avatar':
        return 'h-10 w-10 rounded-full';
      case 'button':
        return 'h-10 w-24 rounded-md';
      default:
        return 'h-4 w-full rounded';
    }
  };

  if (rows > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, index) => (
          <motion.div
            key={index}
            className={`${baseClasses} ${getVariantClasses()}`}
            {...animationProps}
          />
        ))}
      </div>
    );
  }

  return (
    <motion.div
      className={`${baseClasses} ${getVariantClasses()}`}
      {...animationProps}
    />
  );
}

// Componente específico para listas de sesiones
export function SessionListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          className="bg-white/10 border border-white/20 rounded-lg p-4 shadow-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between">
            <div className="flex-1 space-y-3">
              <div className="flex items-center">
                <LoadingSkeleton 
                  variant="button" 
                  className="w-20 h-8 bg-gradient-to-r from-slate-600 via-slate-500 to-slate-600 rounded-full" 
                />
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-gradient-to-r from-slate-600 via-slate-500 to-slate-600 rounded"></div>
                <LoadingSkeleton 
                  variant="text" 
                  className="w-32 h-4 bg-gradient-to-r from-slate-600 via-slate-500 to-slate-600" 
                />
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-gradient-to-r from-slate-600 via-slate-500 to-slate-600 rounded"></div>
                <LoadingSkeleton 
                  variant="text" 
                  className="w-40 h-4 bg-gradient-to-r from-slate-600 via-slate-500 to-slate-600" 
                />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3 sm:mt-0">
              <LoadingSkeleton 
                variant="button" 
                className="w-20 h-10 bg-gradient-to-r from-blue-700 via-blue-600 to-blue-700 rounded-lg" 
              />
              <LoadingSkeleton 
                variant="button" 
                className="w-20 h-10 bg-gradient-to-r from-red-700 via-red-600 to-red-700 rounded-lg" 
              />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// Componente específico para estadísticas
export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
          <LoadingSkeleton variant="text" className="w-1/2 mb-2" />
          <LoadingSkeleton variant="text" className="w-3/4 h-8" />
        </div>
      ))}
    </div>
  );
}