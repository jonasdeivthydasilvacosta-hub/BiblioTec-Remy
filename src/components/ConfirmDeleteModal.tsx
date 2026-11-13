import { AlertTriangle, Trash2, X } from 'lucide-react';
import type { Book } from '../types/library';

interface ConfirmDeleteModalProps {
  book: Book | null;
  hasActiveLoan: boolean;
  onCancel: () => void;
  onConfirm: (bookId: string) => void;
}

export function ConfirmDeleteModal({
  book,
  hasActiveLoan,
  onCancel,
  onConfirm,
}: ConfirmDeleteModalProps) {
  if (!book) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0E1D33]/65 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-delete-title"
    >
      <div className="relative w-full max-w-md rounded-lg border border-[#DED4C3] bg-[#FBF8F1] p-6 shadow-2xl">
        <button
          type="button"
          onClick={onCancel}
          aria-label="Cancelar exclusão"
          className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-md text-[#4A596E] hover:bg-[#EAE0CE] hover:text-[#12233B] transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-3 pr-8">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#F3ECE0] text-[#8C3B2B]">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-[#8C3B2B]">
              Ação Administrativa
            </p>
            <h2
              id="confirm-delete-title"
              className="mt-1 font-serif text-xl font-semibold text-[#12233B]"
            >
              Excluir livro do acervo?
            </h2>
          </div>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-[#4A596E]">
          Você está prestes a retirar permanentemente{' '}
          <strong className="text-[#12233B]">“{book.title}”</strong> ({book.author}) do catálogo da
          BiblioTec — Escola Remy Soares.
        </p>

        {hasActiveLoan && (
          <p className="mt-3 rounded-md border border-[#8C3B2B]/25 bg-[#F3ECE0] px-3.5 py-2.5 text-xs text-[#8C3B2B]">
            Atenção: este exemplar possui um empréstimo ativo, que também será encerrado ao confirmar
            a retirada do catálogo.
          </p>
        )}

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-[#DED4C3] bg-white px-4 py-2 text-sm font-medium text-[#12233B] hover:bg-[#F3ECE0] transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onConfirm(book.id)}
            className="inline-flex items-center gap-2 rounded-md bg-[#8C3B2B] px-4 py-2 text-sm font-medium text-[#FBF8F1] hover:bg-[#702D20] transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            <span>Confirmar Exclusão</span>
          </button>
        </div>
      </div>
    </div>
  );
}
