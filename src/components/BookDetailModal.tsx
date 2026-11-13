import {
  Calendar,
  CheckCircle2,
  Clock,
  Lock,
  MapPin,
  Pencil,
  RotateCw,
  BookOpen,
  BookText,
  Trash2,
  X,
} from 'lucide-react';
import {
  COLLECTION_META,
  LOAN_DAYS_BY_ROLE,
  MAX_RENEWALS,
  type Book,
  type LoanRecord,
  type UserProfile,
} from '../types/library';
import { formatShortDate, getDaysRemaining } from '../utils/storage';
import { BookCover } from './BookCover';

interface BookDetailModalProps {
  book: Book | null;
  activeLoan: LoanRecord | null;
  currentUser: UserProfile | null;
  isAdmin: boolean;
  onClose: () => void;
  onBorrow: (bookId: string) => void;
  onReturn: (loanId: string) => void;
  onRenew: (loanId: string) => void;
  onReadBook: (book: Book) => void;
  onEditBook: (book: Book) => void;
  onRequestDeleteBook: (book: Book) => void;
  onRequireAuth: () => void;
}

export function BookDetailModal({
  book,
  activeLoan,
  currentUser,
  isAdmin,
  onClose,
  onBorrow,
  onReturn,
  onRenew,
  onReadBook,
  onEditBook,
  onRequestDeleteBook,
  onRequireAuth,
}: BookDetailModalProps) {
  if (!book) return null;

  const collection = COLLECTION_META.find((c) => c.id === book.collection);
  const subjects = Array.isArray(book.subjects) ? book.subjects : [];
  const isAvailable = !activeLoan;
  const isBorrowedByMe = Boolean(activeLoan && currentUser && activeLoan.userId === currentUser.id);
  const daysLeft = activeLoan ? getDaysRemaining(activeLoan.dueAt) : null;
  const canRenew = Boolean(
    isBorrowedByMe && activeLoan && (activeLoan.renewCount ?? 0) < MAX_RENEWALS,
  );
  const loanDays = currentUser ? LOAN_DAYS_BY_ROLE[currentUser.role] ?? 14 : 14;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0E1D33]/65 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="book-detail-title"
    >
      <div className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-lg border border-[#DED4C3] bg-[#FBF8F1] shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar ficha do livro"
          className="absolute right-4 top-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-md bg-[#FBF8F1]/90 text-[#4A596E] hover:bg-[#EAE0CE] hover:text-[#12233B] transition-colors focus-visible:outline-2 focus-visible:outline-[#162B49]"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 p-6 sm:p-8">
          <div className="md:col-span-4 flex flex-col items-center md:items-start">
            <div className="w-48 sm:w-56 md:w-full">
              <BookCover book={book} size="lg" />
            </div>

            <div className="mt-4 w-full border-t border-[#DED4C3] pt-3 space-y-2 text-xs text-[#4A596E]">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-[#8C6820] shrink-0 mt-0.5" />
                <div>
                  <span className="block font-medium text-[#12233B]">Localização na Estante</span>
                  <span className="font-mono text-[11px]">{book.location}</span>
                </div>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span>Publicação</span>
                <span className="font-mono tabular-nums text-[#12233B]">{book.year}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Extensão</span>
                <span className="font-mono tabular-nums text-[#12233B]">{book.pages} páginas</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span>Editora</span>
                <span className="text-right text-[#12233B] truncate">{book.publisher}</span>
              </div>
            </div>
          </div>

          <div className="md:col-span-8 flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#4A596E] pr-8">
                <span className="font-medium text-[#8C6820]">{collection?.name}</span>
                <span aria-hidden="true">·</span>
                {isAvailable ? (
                  <span className="inline-flex items-center gap-1.5 font-medium text-[#155E42]">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Disponível para retirada
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 font-medium text-[#8C3B2B]">
                    <Clock className="h-3.5 w-3.5" />
                    Emprestado
                  </span>
                )}
              </div>

              <h2
                id="book-detail-title"
                className="mt-2 font-serif text-2xl sm:text-3xl font-semibold text-[#12233B]"
              >
                {book.title}
              </h2>
              <p className="mt-1 text-base font-medium text-[#4A596E]">por {book.author}</p>

              <div className="mt-5 border-t border-[#DED4C3] pt-5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#4A596E]">
                  Sinopse Editorial
                </h3>
                <p className="mt-2 text-[15px] leading-relaxed text-[#12233B] max-w-prose">
                  {book.synopsis}
                </p>
              </div>

              {subjects.length > 0 && (
                <div className="mt-5">
                  <span className="text-xs font-medium text-[#4A596E]">Assuntos: </span>
                  <span className="text-xs text-[#12233B]">{subjects.join(' · ')}</span>
                </div>
              )}

              {isAdmin && (
                <div className="mt-5 flex flex-wrap items-center gap-2.5 border-t border-[#DED4C3] pt-4">
                  <button
                    type="button"
                    onClick={() => onEditBook(book)}
                    className="inline-flex items-center gap-1.5 rounded-md border border-[#162B49] bg-white px-3.5 py-2 text-xs font-medium text-[#162B49] hover:bg-[#F3ECE0] transition-colors whitespace-nowrap"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    <span>Editar Livro</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onRequestDeleteBook(book)}
                    className="inline-flex items-center gap-1.5 rounded-md border border-[#8C3B2B]/40 bg-white px-3.5 py-2 text-xs font-medium text-[#8C3B2B] hover:bg-[#F3ECE0] transition-colors whitespace-nowrap"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Excluir / Retirar</span>
                  </button>
                </div>
              )}
            </div>

            <div className="mt-8 border-t border-[#DED4C3] pt-5">
              {isAvailable ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 rounded-md border border-[#DED4C3] bg-[#F3ECE0]/80 px-3.5 py-2.5 text-xs text-[#4A596E]">
                    <Lock className="h-3.5 w-3.5 text-[#8C6820] shrink-0" />
                    <span>Alugue este livro gratuitamente para liberar a leitura completa.</span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="text-xs text-[#4A596E]">
                      {currentUser ? (
                        <>
                          <span className="block font-medium text-[#12233B]">
                            Empréstimo gratuito ({currentUser.role === 'professor' ? 'Professor' : 'Aluno'})
                          </span>
                          <span>
                            Prazo de devolução automático: <strong className="font-mono tabular-nums">{loanDays} dias</strong>
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="block font-medium text-[#12233B]">Retirada gratuita</span>
                          <span>Entre ou crie sua carteirinha em 10 segundos para alugar.</span>
                        </>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (!currentUser) {
                          onRequireAuth();
                          return;
                        }
                        onBorrow(book.id);
                      }}
                      className="inline-flex items-center justify-center gap-2 rounded-md bg-[#162B49] px-5 py-3 text-sm font-medium text-[#FBF8F1] hover:bg-[#0E1D33] transition-colors whitespace-nowrap shrink-0"
                    >
                      <BookOpen className="h-4 w-4" />
                      <span>Pegar Emprestado</span>
                    </button>
                  </div>
                </div>
              ) : isBorrowedByMe && activeLoan ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-[#F3ECE0] px-4 py-3 text-xs text-[#12233B]">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-[#8C6820]" />
                      <span>
                        Devolução prevista para{' '}
                        <strong className="font-mono tabular-nums">
                          {formatShortDate(activeLoan.dueAt)}
                        </strong>
                      </span>
                    </div>
                    <span className="font-mono tabular-nums text-[#4A596E]">
                      {daysLeft !== null && daysLeft >= 0
                        ? `${daysLeft} dias restantes`
                        : `${Math.abs(daysLeft ?? 0)} dias em atraso`}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => onReadBook(book)}
                      className="inline-flex items-center gap-2 rounded-md bg-[#162B49] px-5 py-2.5 text-sm font-medium text-[#FBF8F1] hover:bg-[#0E1D33] transition-colors whitespace-nowrap shrink-0"
                    >
                      <BookText className="h-4 w-4 text-[#E4C57D]" />
                      <span>Ler Livro Completo</span>
                    </button>

                    <div className="flex flex-wrap items-center gap-2.5">
                      {canRenew && (
                        <button
                          type="button"
                          onClick={() => onRenew(activeLoan.id)}
                          className="inline-flex items-center gap-2 rounded-md border border-[#162B49] bg-white px-4 py-2.5 text-sm font-medium text-[#162B49] hover:bg-[#F3ECE0] transition-colors whitespace-nowrap shrink-0"
                        >
                          <RotateCw className="h-4 w-4" />
                          <span>Renovar Prazo</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onReturn(activeLoan.id)}
                        className="inline-flex items-center gap-2 rounded-md border border-[#DED4C3] bg-white px-4 py-2.5 text-sm font-medium text-[#8C3B2B] hover:bg-[#F3ECE0] transition-colors whitespace-nowrap shrink-0"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Devolver</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : activeLoan ? (
                <div className="space-y-2 rounded-md bg-[#F3ECE0] px-4 py-3 text-sm text-[#4A596E]">
                  <p className="font-medium text-[#12233B]">
                    Exemplar atualmente emprestado
                  </p>
                  <p className="text-xs">
                    {isAdmin ? `Em posse de ${activeLoan.userName} · ` : ''}Devolução prevista em{' '}
                    <span className="font-mono tabular-nums text-[#12233B]">
                      {formatShortDate(activeLoan.dueAt)}
                    </span>
                  </p>
                  <p className="inline-flex items-center gap-1.5 text-xs text-[#4A596E] pt-0.5">
                    <Lock className="h-3.5 w-3.5 text-[#8C6820]" />
                    <span>Leitura bloqueada até a devolução e novo empréstimo na sua conta.</span>
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
