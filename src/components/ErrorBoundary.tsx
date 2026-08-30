import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Erro não tratado capturado pelo ErrorBoundary:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] dark:bg-gray-950 p-6">
          <div className="max-w-md w-full bg-white dark:bg-gray-900 border border-[#E8EAED] dark:border-gray-800 rounded-3xl shadow-sm p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-[#EA4335]/10 text-[#EA4335] flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h1 className="text-lg font-bold text-[#202124] dark:text-gray-100">
              Algo deu errado
            </h1>
            <p className="text-sm text-[#5F6368] dark:text-gray-400 leading-relaxed">
              Ocorreu um erro inesperado nesta tela. Seus certificados, prompts e posts continuam salvos localmente. Tente recarregar a página.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1A73E8] hover:bg-[#1557B0] text-white text-sm font-bold shadow-xs transition-all active:scale-95"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Recarregar Página</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
