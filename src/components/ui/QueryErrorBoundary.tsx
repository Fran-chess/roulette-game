import React from 'react';
import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';
import Button from './Button';

interface QueryErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

function QueryErrorFallback({ error, resetErrorBoundary }: QueryErrorFallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center p-6 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
      <div className="text-red-600 dark:text-red-400 mb-4">
        <svg
          className="w-12 h-12 mx-auto mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      
      <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
        Error al cargar los datos
      </h3>
      
      <p className="text-red-600 dark:text-red-300 mb-4 text-center text-sm">
        {error.message || 'Ha ocurrido un error inesperado'}
      </p>
      
      <Button
        onClick={resetErrorBoundary}
        variant="custom"
        className="border-red-300 text-red-600 dark:border-red-600 dark:text-red-400 text-sm px-4 py-2"
      >
        Intentar nuevamente
      </Button>
    </div>
  );
}

interface QueryErrorBoundaryProps {
  children: React.ReactNode;
}

export default function QueryErrorBoundary({ children }: QueryErrorBoundaryProps) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          FallbackComponent={QueryErrorFallback}
          onReset={reset}
          onError={(error) => {
            console.error('🚨 React Query Error Boundary:', error);
          }}
        >
          {children}
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}