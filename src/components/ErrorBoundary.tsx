import { Component, type ErrorInfo, type ReactNode } from 'react';
import { RotateCcw, ShieldAlert } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(_error: Error, _errorInfo: ErrorInfo): void {
    // Erro capturado com segurança para evitar falha na interface
  }

  private handleReload = () => {
    this.setState({ hasError: false });
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  private handleResetCorruptedData = () => {
    try {
      if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
        const keysToReset = [
          'minerva_users_v1',
          'minerva_current_user_id_v1',
          'minerva_books_v1',
          'minerva_loans_v1',
          'minerva_support_tickets_v1',
        ];
        for (const key of keysToReset) {
          window.localStorage.removeItem(key);
        }
      }
    } catch {
      // Ignorar falha ao limpar armazenamento local
    }
    this.handleReload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#FBF8F1] px-4 py-10 text-[#12233B]">
          <div className="w-full max-w-md rounded-lg border border-[#DED4C3] bg-white p-6 sm:p-8 shadow-lg text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#FDF3F1] text-[#8C3B2B]">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <p className="mt-4 text-xs font-medium uppercase tracking-widest text-[#8C6820]">
              BiblioTec · Escola Remy Soares
            </p>
            <h1 className="mt-1 font-serif text-2xl font-semibold text-[#12233B]">
              Recuperação Segura da Biblioteca
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-[#4A596E]">
              Ocorreu uma instabilidade inesperada ao exibir esta tela. Você pode recarregar o
              aplicativo ou restaurar os dados locais padrão.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={this.handleReload}
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-md bg-[#162B49] px-4 py-2.5 text-sm font-medium text-[#FBF8F1] hover:bg-[#0E1D33] transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Recarregar Página</span>
              </button>
              <button
                type="button"
                onClick={this.handleResetCorruptedData}
                className="inline-flex w-full sm:w-auto items-center justify-center rounded-md border border-[#DED4C3] bg-[#FBF8F1] px-4 py-2.5 text-sm font-medium text-[#8C3B2B] hover:border-[#8C3B2B] transition-colors"
              >
                Restaurar Dados Locais
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
