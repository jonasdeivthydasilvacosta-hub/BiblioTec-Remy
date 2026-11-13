import { Calendar, CheckCircle2, Clock, RotateCw, BookOpen, BookText } from 'lucide-react';
import {
  LOAN_DAYS_BY_ROLE,
  MAX_RENEWALS,
  RENEW_DAYS_BY_ROLE,
  type Book,
  type LoanRecord,
  type UserProfile,
} from '../types/library';
import { formatShortDate, getDaysRemaining } from '../utils/storage';
import { BookCover } from './BookCover';

interface MyLoansViewProps {
  currentUser: UserProfile | null;
  books: Book[];
  loans: LoanRecord[];
  onOpenAuth: () => void;
  onSelectBook: (book: Book) => void;
  onReadBook: (book: Book) => void;
  onReturn: (loanId: string) => void;
  onRenew: (loanId: string) => void;
  onGoToCatalog: () => void;
}

export function MyLoansView({
  currentUser,
  books,
  loans,
  onOpenAuth,
  onSelectBook,
  onReadBook,
  onReturn,
  onRenew,
  onGoToCatalog,
}: MyLoansViewProps) {
  if (!currentUser) {
    return (
      <section className="mx-auto max-w-3xl py-16 text-center">
        <p className="text-xs font-medium uppercase tracking-widest text-[#8C6820]">
          Meus Alugados
        </p>
        <h2 className="mt-2 font-serif text-3xl font-semibold text-[#12233B]">
          Acesse sua conta para acompanhar seus empréstimos
        </h2>
        <p className="mt-3 text-base text-[#4A596E]">
          Crie uma carteirinha gratuita de aluno ou professor para retirar livros sem custos e
          acompanhar as datas de devolução.
        </p>
        <div className="mt-6">
          <button
            type="button"
            onClick={onOpenAuth}
            className="rounded-md bg-[#162B49] px-6 py-3 text-sm font-medium text-[#FBF8F1] hover:bg-[#0E1D33] transition-colors"
          >
            Entrar ou Criar Conta
          </button>
        </div>
      </section>
    );
  }

  const safeLoans = Array.isArray(loans) ? loans : [];
  const safeBooks = Array.isArray(books) ? books : [];

  const userActiveLoans = safeLoans.filter((l) => l.userId === currentUser.id && !l.returnedAt);
  const userReturnedLoans = safeLoans
    .filter((l) => l.userId === currentUser.id && Boolean(l.returnedAt))
    .slice(0, 6);

  const bookById = new Map(safeBooks.map((b) => [b.id, b]));
  const baseDays = LOAN_DAYS_BY_ROLE[currentUser.role] ?? 14;
  const renewDays = RENEW_DAYS_BY_ROLE[currentUser.role] ?? 7;

  return (
    <section className="space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#DED4C3] pb-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-[#8C6820]">
            Painel de Empréstimos Gratuitos
          </p>
          <h2 className="mt-1 font-serif text-3xl sm:text-4xl font-semibold text-[#12233B]">
            Meus Alugados
          </h2>
          <p className="mt-1.5 text-sm text-[#4A596E]">
            Perfil{' '}
            {currentUser.role === 'admin'
              ? 'Dono / Administrador'
              : currentUser.role === 'professor'
                ? 'Professor'
                : 'Aluno'}{' '}
            · Prazo padrão de{' '}
            <span className="font-mono tabular-nums text-[#12233B]">{baseDays} dias</span> e renovação de{' '}
            <span className="font-mono tabular-nums text-[#12233B]">+{renewDays} dias</span>
          </p>
        </div>
        <button
          type="button"
          onClick={onGoToCatalog}
          className="inline-flex items-center gap-2 rounded-md border border-[#162B49] bg-white px-4 py-2.5 text-sm font-medium text-[#162B49] hover:bg-[#F3ECE0] transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto"
        >
          <BookOpen className="h-4 w-4" />
          <span>Explorar Acervo</span>
        </button>
      </div>

      {userActiveLoans.length === 0 ? (
        <div className="rounded-lg border border-[#DED4C3] bg-white p-10 text-center">
          <h3 className="font-serif text-2xl font-semibold text-[#12233B]">
            Nenhum livro emprestado no momento
          </h3>
          <p className="mt-2 text-sm text-[#4A596E] max-w-md mx-auto">
            Escolha qualquer título disponível no acervo escolar e faça a retirada gratuita com 1
            clique.
          </p>
          <button
            type="button"
            onClick={onGoToCatalog}
            className="mt-6 rounded-md bg-[#162B49] px-5 py-2.5 text-sm font-medium text-[#FBF8F1] hover:bg-[#0E1D33] transition-colors"
          >
            Escolher um livro
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {userActiveLoans.map((loan) => {
            const book = bookById.get(loan.bookId);
            if (!book) return null;
            const daysLeft = getDaysRemaining(loan.dueAt);
            const isOverdue = daysLeft < 0;
            const isDueSoon = daysLeft >= 0 && daysLeft <= 3;
            const renewCount = Number.isFinite(loan.renewCount) ? loan.renewCount : 0;
            const canRenew = renewCount < MAX_RENEWALS;

            return (
              <article
                key={loan.id}
                className="flex flex-col md:flex-row md:items-center justify-between gap-6 rounded-lg border border-[#DED4C3] bg-white p-5 sm:p-6 transition-colors hover:border-[#B68930]/60"
              >
                <div className="flex items-start gap-5 min-w-0">
                  <button
                    type="button"
                    onClick={() => onSelectBook(book)}
                    className="w-20 sm:w-24 shrink-0 text-left focus-visible:outline-2 focus-visible:outline-[#162B49] rounded"
                  >
                    <BookCover book={book} size="sm" />
                  </button>

                  <div className="min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#4A596E]">
                      <span className="font-mono text-[11px]">{book.location}</span>
                      <span aria-hidden="true">·</span>
                      <span>
                        Renovações:{' '}
                        <span className="font-mono tabular-nums text-[#12233B]">
                          {renewCount}/{MAX_RENEWALS}
                        </span>
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onSelectBook(book)}
                      className="text-left block"
                    >
                      <h3 className="font-serif text-xl font-semibold text-[#12233B] hover:text-[#8C6820] transition-colors">
                        {book.title}
                      </h3>
                    </button>
                    <p className="text-sm text-[#4A596E]">{book.author}</p>

                    <div className="pt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                      <span className="inline-flex items-center gap-1.5 text-[#4A596E]">
                        <Calendar className="h-3.5 w-3.5 text-[#8C6820]" />
                        Retirada:{' '}
                        <span className="font-mono tabular-nums text-[#12233B]">
                          {formatShortDate(loan.borrowedAt)}
                        </span>
                      </span>

                      <span
                        className={`inline-flex items-center gap-1.5 font-medium ${
                          isOverdue
                            ? 'text-[#8C3B2B]'
                            : isDueSoon
                              ? 'text-[#8C6820]'
                              : 'text-[#155E42]'
                        }`}
                      >
                        <Clock className="h-3.5 w-3.5" />
                        Devolver até{' '}
                        <span className="font-mono tabular-nums">
                          {formatShortDate(loan.dueAt)}
                        </span>{' '}
                        ({isOverdue
                          ? `${Math.abs(daysLeft)} dias em atraso`
                          : daysLeft === 0
                            ? 'vence hoje'
                            : `${daysLeft} dias restantes`})
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 md:shrink-0 border-t md:border-t-0 border-[#DED4C3] pt-4 md:pt-0">
                  <button
                    type="button"
                    onClick={() => onReadBook(book)}
                    className="inline-flex items-center gap-2 rounded-md bg-[#162B49] px-4 py-2.5 text-sm font-medium text-[#FBF8F1] hover:bg-[#0E1D33] transition-colors whitespace-nowrap shrink-0"
                  >
                    <BookText className="h-4 w-4 text-[#E4C57D]" />
                    <span>Ler Livro Completo</span>
                  </button>

                  <button
                    type="button"
                    disabled={!canRenew}
                    onClick={() => onRenew(loan.id)}
                    className={`inline-flex items-center gap-2 rounded-md border px-3.5 py-2.5 text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                      canRenew
                        ? 'border-[#162B49] bg-[#FBF8F1] text-[#162B49] hover:bg-[#EAE0CE]'
                        : 'border-[#DED4C3] bg-[#F3ECE0] text-[#7D8A9C] cursor-not-allowed'
                    }`}
                  >
                    <RotateCw className="h-4 w-4" />
                    <span>{canRenew ? `Renovar (+${renewDays}d)` : 'Limite atingido'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onReturn(loan.id)}
                    className="inline-flex items-center gap-2 rounded-md border border-[#DED4C3] bg-white px-3.5 py-2.5 text-sm font-medium text-[#8C3B2B] hover:bg-[#F3ECE0] transition-colors whitespace-nowrap shrink-0"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Devolver</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {userReturnedLoans.length > 0 && (
        <div className="pt-4 border-t border-[#DED4C3]">
          <h3 className="font-serif text-xl font-semibold text-[#12233B]">
            Devoluções Recentes
          </h3>
          <div className="mt-4 divide-y divide-[#DED4C3] rounded-lg border border-[#DED4C3] bg-white">
            {userReturnedLoans.map((loan) => {
              const book = bookById.get(loan.bookId);
              if (!book) return null;
              return (
                <div
                  key={loan.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 text-sm"
                >
                  <div>
                    <button
                      type="button"
                      onClick={() => onSelectBook(book)}
                      className="font-medium text-[#12233B] hover:text-[#8C6820] text-left"
                    >
                      {book.title}
                    </button>
                    <span className="text-[#4A596E]"> · {book.author}</span>
                  </div>
                  <span className="font-mono text-xs tabular-nums text-[#4A596E]">
                    Devolvido em {loan.returnedAt ? formatShortDate(loan.returnedAt) : ''}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
