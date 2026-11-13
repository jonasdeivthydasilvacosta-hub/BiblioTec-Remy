import { useMemo, useState } from 'react';
import {
  Ban,
  BookOpen,
  CheckCircle2,
  RotateCcw,
  Search,
  ShieldAlert,
  UserCheck,
  Users,
} from 'lucide-react';
import type { Book, LoanRecord, UserProfile } from '../types/library';
import { formatShortDate } from '../utils/storage';

interface AdminUsersViewProps {
  users: UserProfile[];
  books: Book[];
  loans: LoanRecord[];
  onForceReturnLoan: (loanId: string) => void;
  onBanUser: (userId: string) => void;
  onReactivateUser: (userId: string) => void;
}

type AccountFilter = 'todos' | 'ativo' | 'banido';

export function AdminUsersView({
  users,
  books,
  loans,
  onForceReturnLoan,
  onBanUser,
  onReactivateUser,
}: AdminUsersViewProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<AccountFilter>('todos');
  const [userPendingBan, setUserPendingBan] = useState<UserProfile | null>(null);

  const readerAccounts = useMemo(
    () => (Array.isArray(users) ? users : []).filter((u) => u && u.role !== 'admin'),
    [users],
  );

  const activeLoans = useMemo(
    () => (Array.isArray(loans) ? loans : []).filter((l) => l && !l.returnedAt),
    [loans],
  );

  const bookById = useMemo(
    () => new Map((Array.isArray(books) ? books : []).map((b) => [b.id, b])),
    [books],
  );

  const activeCount = useMemo(
    () => readerAccounts.filter((u) => (u.status ?? 'ativo') === 'ativo').length,
    [readerAccounts],
  );
  const bannedCount = useMemo(
    () => readerAccounts.filter((u) => u.status === 'banido').length,
    [readerAccounts],
  );

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return readerAccounts.filter((user) => {
      const accountStatus = user.status ?? 'ativo';
      if (statusFilter !== 'todos' && accountStatus !== statusFilter) {
        return false;
      }
      if (!q) return true;
      return (
        (user.name ?? '').toLowerCase().includes(q) ||
        (user.departmentOrClass ?? '').toLowerCase().includes(q) ||
        (user.registrationCode ?? '').toLowerCase().includes(q)
      );
    });
  }, [readerAccounts, search, statusFilter]);

  return (
    <section className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#DED4C3] pb-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-[#8C6820]">
            BiblioTec · Moderação e Controle Administrativo
          </p>
          <h2 className="mt-1 font-serif text-3xl sm:text-4xl font-semibold text-[#12233B]">
            Gerenciar Usuários / Contas
          </h2>
          <p className="mt-1.5 text-sm text-[#4A596E]">
            Área exclusiva do Administrador. Consulte contas cadastradas, recolha livros
            emprestados ou suspenda acessos quando necessário.
          </p>
        </div>

        <div className="flex items-center gap-6 text-sm shrink-0">
          <div>
            <span className="block text-xs text-[#4A596E]">Contas Ativas</span>
            <span className="font-mono text-2xl font-semibold tabular-nums text-[#155E42]">
              {activeCount}
            </span>
          </div>
          <div className="h-8 w-px bg-[#DED4C3]" />
          <div>
            <span className="block text-xs text-[#4A596E]">Contas Banidas</span>
            <span className="font-mono text-2xl font-semibold tabular-nums text-[#8C3B2B]">
              {bannedCount}
            </span>
          </div>
          <div className="h-8 w-px bg-[#DED4C3]" />
          <div>
            <span className="block text-xs text-[#4A596E]">Livros Alugados</span>
            <span className="font-mono text-2xl font-semibold tabular-nums text-[#12233B]">
              {activeLoans.length}
            </span>
          </div>
        </div>
      </div>

      {/* Search & Status Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-xl">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#4A596E]"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome real, turma/disciplina ou matrícula..."
            aria-label="Buscar contas cadastradas"
            className="w-full rounded-md border border-[#DED4C3] bg-white pl-10 pr-4 py-2.5 text-sm text-[#12233B] placeholder:text-[#7D8A9C] focus:border-[#162B49] focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              { id: 'todos', label: `Todas (${readerAccounts.length})` },
              { id: 'ativo', label: `Ativas (${activeCount})` },
              { id: 'banido', label: `Banidas (${bannedCount})` },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`rounded-md px-3.5 py-2 text-xs font-medium border transition-colors whitespace-nowrap shrink-0 ${
                statusFilter === tab.id
                  ? 'border-[#162B49] bg-[#162B49] text-[#FBF8F1]'
                  : 'border-[#DED4C3] bg-white text-[#4A596E] hover:border-[#B68930] hover:text-[#12233B]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Accounts List */}
      {filteredUsers.length === 0 ? (
        <div className="rounded-lg border border-[#DED4C3] bg-white p-12 text-center">
          <Users className="mx-auto h-8 w-8 text-[#8C6820]" />
          <h3 className="mt-3 font-serif text-2xl font-semibold text-[#12233B]">
            Nenhuma conta encontrada
          </h3>
          <p className="mt-2 text-sm text-[#4A596E]">
            Ajuste os filtros de busca ou status para visualizar os alunos e professores
            cadastrados.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredUsers.map((user) => {
            const isBanned = user.status === 'banido';
            const userLoans = activeLoans.filter((l) => l.userId === user.id);

            return (
              <article
                key={user.id}
                className={`rounded-lg border p-5 sm:p-6 transition-colors ${
                  isBanned
                    ? 'border-[#8C3B2B]/40 bg-[#FDF8F7]'
                    : 'border-[#DED4C3] bg-white'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-semibold text-[#8C6820]">
                        {user.role === 'professor' ? 'Professor' : 'Aluno'}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums text-[#4A596E]">
                        {user.registrationCode}
                      </span>
                      <span aria-hidden="true">·</span>
                      {isBanned ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-[#8C3B2B]">
                          <Ban className="h-3.5 w-3.5" />
                          <span>Conta Suspensa / Banida</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-semibold text-[#155E42]">
                          <UserCheck className="h-3.5 w-3.5" />
                          <span>Conta Ativa</span>
                        </span>
                      )}
                    </div>

                    <h3 className="font-serif text-xl sm:text-2xl font-semibold text-[#12233B]">
                      {user.name}
                    </h3>
                    <p className="text-xs text-[#4A596E]">
                      {user.departmentOrClass} · Cadastrado em {formatShortDate(user.createdAt)}
                    </p>
                  </div>

                  <div className="shrink-0">
                    {isBanned ? (
                      <button
                        type="button"
                        onClick={() => onReactivateUser(user.id)}
                        className="inline-flex items-center gap-1.5 rounded-md border border-[#155E42] bg-[#EFF7F3] px-3.5 py-2 text-xs font-semibold text-[#155E42] hover:bg-[#DFEFE7] transition-colors whitespace-nowrap"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Reativar Conta</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setUserPendingBan(user)}
                        className="inline-flex items-center gap-1.5 rounded-md border border-[#8C3B2B]/50 bg-white px-3.5 py-2 text-xs font-semibold text-[#8C3B2B] hover:bg-[#FDF3F1] transition-colors whitespace-nowrap"
                      >
                        <Ban className="h-4 w-4" />
                        <span>Banir Conta</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* User's Active Borrowed Books */}
                <div className="mt-5 border-t border-[#DED4C3] pt-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#4A596E]">
                    Livros Alugados ({userLoans.length})
                  </p>

                  {userLoans.length === 0 ? (
                    <p className="mt-2 text-xs text-[#4A596E]">
                      Nenhum livro alugado por este usuário no momento.
                    </p>
                  ) : (
                    <div className="mt-3 divide-y divide-[#DED4C3] rounded-md border border-[#DED4C3] bg-[#FBF8F1]/60">
                      {userLoans.map((loan) => {
                        const book = bookById.get(loan.bookId);
                        if (!book) return null;

                        return (
                          <div
                            key={loan.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 text-sm font-medium text-[#12233B]">
                                <BookOpen className="h-4 w-4 text-[#8C6820] shrink-0" />
                                <span className="truncate">{book.title}</span>
                              </div>
                              <p className="mt-0.5 text-xs text-[#4A596E]">
                                {book.author} · Devolução prevista:{' '}
                                <span className="font-mono tabular-nums text-[#12233B]">
                                  {formatShortDate(loan.dueAt)}
                                </span>
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => onForceReturnLoan(loan.id)}
                              className="inline-flex items-center gap-1.5 rounded-md border border-[#162B49] bg-white px-3 py-1.5 text-xs font-medium text-[#162B49] hover:bg-[#EAE0CE] transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                              <span>Remover Empréstimo / Recolher Livro</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Confirmation Dialog for Banning Account */}
      {userPendingBan && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0E1D33]/65 p-4 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-ban-title"
        >
          <div className="w-full max-w-md rounded-lg border border-[#DED4C3] bg-[#FBF8F1] p-6 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="rounded-md bg-[#8C3B2B]/10 p-2 text-[#8C3B2B] shrink-0">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-[#8C3B2B]">
                  Confirmação de Moderação
                </p>
                <h3
                  id="confirm-ban-title"
                  className="mt-1 font-serif text-xl font-semibold text-[#12233B]"
                >
                  Banir conta de {userPendingBan.name}?
                </h3>
                <p className="mt-2 text-sm text-[#4A596E] leading-relaxed">
                  Ao confirmar, esta conta será desconectada imediatamente e impedida de fazer
                  login novamente até que você decida reativá-la.
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setUserPendingBan(null)}
                className="rounded-md border border-[#DED4C3] bg-white px-4 py-2 text-sm font-medium text-[#12233B] hover:bg-[#EAE0CE] transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onBanUser(userPendingBan.id);
                  setUserPendingBan(null);
                }}
                className="rounded-md bg-[#8C3B2B] px-4 py-2 text-sm font-medium text-white hover:bg-[#702D20] transition-colors"
              >
                Confirmar Banimento
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
