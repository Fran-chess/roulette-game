// [modificación] Error Boundary especializado para problemas de DOM y SSR
import React, { Component, ReactNode } from 'react';
import { tvProdLogger } from '@/utils/tvLogger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // [modificación] Actualizar el estado para mostrar la UI de error
    tvProdLogger.error('ErrorBoundary: Error capturado:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // [modificación] Log del error para debugging
    tvProdLogger.error('ErrorBoundary: Error completo:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    });

    // [modificación] Callback personalizado si se proporciona
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // [modificación] Detectar errores específicos de DOM/Framer Motion
    if (
      error.message.includes('Node cannot be found') ||
      error.message.includes('Target node not found') ||
      error.message.includes('Cannot read properties of null') ||
      error.stack?.includes('framer-motion')
    ) {
      tvProdLogger.warn('ErrorBoundary: Error relacionado con DOM/Framer Motion detectado, intentando recuperación automática');
      
      // [modificación] Intentar recuperación automática después de un delay
      setTimeout(() => {
        this.setState({ hasError: false, error: undefined });
      }, 1000);
    }
  }

  render() {
    if (this.state.hasError) {
      // [modificación] UI de fallback personalizada o por defecto
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 max-w-md text-center border border-white/20">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-white mb-4">
              Error Temporal
            </h2>
            <p className="text-white/80 mb-6">
              Estamos resolviendo un problema técnico. La aplicación se recuperará automáticamente.
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: undefined })}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl transition-colors"
            >
              Reintentar
            </button>
            
            {/* [modificación] Información de debug en desarrollo */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mt-6 p-4 bg-red-900/20 rounded-lg border border-red-500/30 text-left">
                <h4 className="text-red-300 font-bold mb-2">Debug Info:</h4>
                <p className="text-red-200 text-sm font-mono">{this.state.error.message}</p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 